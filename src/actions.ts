// actions.ts: imports at top
import {
  getTokenHolders as solanaGetTokenHolders,
  keypair,
  sendTransaction,
  connection,
  getMintInfo,
  getParsedTokenAccounts,
  getBalance,
} from "./providers/solana";
import { getQuote, buildSwapTransaction } from "./providers/jupiter";
import { getTokenInfo } from "./providers/dexscreener";
import axios from "axios";
import * as dotenv from "dotenv";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  calculateBollingerBands,
  calculateMACD,
  calculateRSI,
} from "./providers/technicalindicators";
dotenv.config();

dotenv.config();

export type ActionContext = { [key: string]: any };

const AUTO_TRADE_ENABLED = process.env.AUTO_TRADE_ENABLED === "true";
const AUTO_BUY_SELL_INTERVAL_MS = parseInt(
  process.env.AUTO_BUY_SELL_INTERVAL_MS || "60000",
  10,
);

let monitorInterval: ReturnType<typeof setTimeout> | null = null;
let priceHistory: number[] = [];
let autoBuySellInterval: ReturnType<typeof setTimeout> | null = null;

interface DexscreenerData {
  pairs: Array<any>;
  [key: string]: any;
}

function isDexscreenerData(data: any): data is DexscreenerData {
  return data && Array.isArray(data.pairs);
}

export async function swap(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}) {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;

  const quote = await getQuote(inputMint, outputMint, amount, slippageBps);
  const swapTransactionBase64 = await buildSwapTransaction(
    quote,
    keypair.publicKey.toBase58(),
  );

  const txnBuffer = Buffer.from(swapTransactionBase64, "base64");
  const txn = Transaction.from(txnBuffer);

  txn.partialSign(keypair);

  const signature = await sendTransaction(txn);
  return signature;
}

export async function buy(params: { tokenMint: string; amount: number }) {
  const inputMint = "So11111111111111111111111111111111111111112"; // SOL
  return swap({
    inputMint,
    outputMint: params.tokenMint,
    amount: params.amount,
  });
}

export async function sell(params: { tokenMint: string; amount: number }) {
  const outputMint = "So11111111111111111111111111111111111111112"; // SOL
  return swap({
    inputMint: params.tokenMint,
    outputMint,
    amount: params.amount,
  });
}

export async function checkWalletBalance(params: { walletAddress: string }) {
  const owner = new PublicKey(params.walletAddress);
  const solBalanceLamports = await getBalance(owner);
  const solBalance = solBalanceLamports / 1e9;

  const tokenAccounts = await getParsedTokenAccounts(owner);

  const balances = tokenAccounts.map(({ pubkey, account }) => {
    const parsed = account.data.parsed.info;
    return {
      mint: parsed.mint,
      amount: parsed.tokenAmount.uiAmount,
      decimals: parsed.tokenAmount.decimals,
      pubkey: pubkey.toBase58(),
    };
  });

  return {
    sol: solBalance,
    tokens: balances,
  };
}

export async function scamCheck(ctx: {
  chain: string;
  address: string;
  symbol?: string;
  plugins?: Record<string, any>;
}) {
  const { chain, address, symbol, plugins } = ctx;
  if (!chain || !address) return "Missing chain or address.";

  try {
    const data = await getTokenInfo(chain, address);
    if (!isDexscreenerData(data)) {
      return `Failed to get token info: ${data.error ?? "unknown error"}`;
    }

    const pair = data.pairs[0];
    let risk = "unknown";
    const reasons: string[] = [];

    if (pair) {
      if (pair.verified === false) {
        risk = "high";
        reasons.push("Token is not verified on Dexscreener.");
      }
      if ((pair.liquidity?.usd ?? 0) < 1000) {
        risk = "high";
        reasons.push("Low liquidity.");
      }
      if ((pair.txns?.h24 ?? 0) < 10) {
        risk = risk === "high" ? risk : "medium";
        reasons.push("Low trading activity.");
      }
      if ((pair.ageDays ?? 9999) < 3) {
        risk = risk === "high" ? risk : "medium";
        reasons.push("Token is very new.");
      }
    }

    let mintInfo, holders;
    try {
      mintInfo = await getMintInfo(address);
      if (
        mintInfo.mintAuthority &&
        mintInfo.mintAuthority !== null &&
        mintInfo.mintAuthority !== "" &&
        mintInfo.mintAuthority !== "11111111111111111111111111111111"
      ) {
        risk = "high";
        reasons.push("Mint authority is not renounced.");
      }

      holders = await solanaGetTokenHolders(address);
      if (holders.length && mintInfo.supply) {
        const supply = Number(mintInfo.supply) / 10 ** (mintInfo.decimals ?? 0);
        const largest = holders[0];
        const largestPct = (Number(largest.amount) / supply) * 100;
        if (largestPct > 30) {
          risk = "high";
          reasons.push("Single wallet holds more than 30% of supply.");
        } else if (largestPct > 10) {
          risk = risk === "high" ? risk : "medium";
          reasons.push("Single wallet holds more than 10% of supply.");
        }
      }
    } catch {
      // silent fail
    }

    let scamMentions = 0;
    if (symbol && plugins && plugins["elizaos/plugin-twitter"]) {
      const tweets = await plugins["elizaos/plugin-twitter"].searchTweets({
        q: `${symbol} scam`,
        count: 20,
      });
      scamMentions = tweets.filter((t: any) =>
        /scam|rug|fraud|hack/i.test(t.text),
      ).length;
      if (scamMentions > 2) {
        risk = "high";
        reasons.push("Multiple scam-related Twitter mentions.");
      }
    }

    const lockers = [
      "11111111111111111111111111111111",
      "4ckmDgGz5qQh6vny1tRQAMf6Tx5Rk8QeYv1GZ6tMCp7y",
    ];
    if (holders && holders.length > 0) {
      const largest = holders[0];
      if (lockers.includes(largest.address)) {
        reasons.push("Liquidity appears to be locked.");
      } else {
        reasons.push("Liquidity may not be locked.");
      }
    }

    if (risk === "unknown") risk = "low";

    return {
      message: "Scam check completed.",
      risk,
      reasons,
      scamMentions,
    };
  } catch (e) {
    return `Failed scam check: ${(e as Error).message}`;
  }
}

export async function sentimentAnalysis(params: { symbol: string }) {
  try {
    const resp = await axios.get(
      `http://localhost:3000/plugin-twitter/sentiment?symbol=${params.symbol}`,
    );
    return resp.data;
  } catch {
    return { bullish: 50, bearish: 25, neutral: 25 };
  }
}

export async function portfolioTracker(ctx: ActionContext) {
  const { walletAddress } = ctx;
  if (!walletAddress) return "Missing walletAddress.";

  try {
    const solBalanceLamports = await getBalance(new PublicKey(walletAddress));
    const solBalance = solBalanceLamports / 1e9;

    const splTokens = await getParsedTokenAccounts(
      new PublicKey(walletAddress),
    );
    const solInfo = await getTokenInfo(
      "solana",
      "So11111111111111111111111111111111111111112",
    );

    if (!isDexscreenerData(solInfo)) return "Failed to get SOL token info.";

    const solPrice = Number(solInfo.pairs[0]?.priceUsd ?? 0);

    const tokens = await Promise.all(
      splTokens.map(async (acct: any) => {
        const mint = acct.account.data.parsed.info.mint;
        const amount = Number(
          acct.account.data.parsed.info.tokenAmount.uiAmount,
        );
        let price = 0;
        try {
          const info = await getTokenInfo("solana", mint);
          price = isDexscreenerData(info)
            ? Number(info.pairs[0]?.priceUsd ?? 0)
            : 0;
        } catch {}
        return { mint, amount, price, valueUsd: amount * price };
      }),
    );

    const solValue = solBalance * solPrice;
    const totalValueUsd =
      solValue + tokens.reduce((sum, t) => sum + t.valueUsd, 0);

    return {
      message: "Portfolio tracked successfully.",
      sol: { amount: solBalance, price: solPrice, valueUsd: solValue },
      tokens,
      totalValueUsd,
    };
  } catch (e) {
    return `Failed to track portfolio: ${(e as Error).message}`;
  }
}

export async function marketTrends(ctx: ActionContext) {
  const { chain, address } = ctx;
  if (!chain || !address) return "Missing chain or address.";

  try {
    const data = await getTokenInfo(chain, address);
    if (!isDexscreenerData(data)) {
      return `Failed to get token info: ${data.error ?? "unknown error"}`;
    }

    const priceChart = data.pairs[0]?.priceChart ?? [];
    if (priceChart.length < 8)
      return "Not enough price history for trend analysis.";

    const priceNow = Number(priceChart[priceChart.length - 1].price);
    const price7dAgo = Number(priceChart[priceChart.length - 8].price);
    const priceChange7d = ((priceNow - price7dAgo) / price7dAgo) * 100;

    const volumes = priceChart.map((p: any) => Number(p.volume));
    const avgPrev5 = volumes.slice(-7, -2).reduce((a, b) => a + b, 0) / 5;
    const last2 = volumes.slice(-2);
    const volumeSpike = last2.some((v) => v > avgPrev5 * 2);

    let trend = "sideways";
    if (priceChange7d > 10) trend = "uptrend";
    else if (priceChange7d < -10) trend = "downtrend";

    return {
      message: "Market trends analyzed.",
      priceChange7d,
      volumeSpike,
      trend,
    };
  } catch (e) {
    return `Failed to analyze market trends: ${(e as Error).message}`;
  }
}

export async function startPriceMonitor(params: {
  tokenMint: string;
  intervalSec: number;
  onTick?: (data: any) => void;
}) {
  const { intervalSec, onTick } = params;

  if (monitorInterval) clearInterval(monitorInterval);
  priceHistory = [];

  const tick = async () => {
    try {
      // TODO: replace with real price fetching logic from Dexscreener
      const price = Math.random() * 100;
      priceHistory.push(price);
      if (priceHistory.length > 100) priceHistory.shift();

      const rsi = calculateRSI(priceHistory);
      const macd = calculateMACD(priceHistory);
      const bb = calculateBollingerBands(priceHistory);

      const quickSignal =
        rsi !== null ? (rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : "HOLD") : "HOLD";

      if (onTick) onTick({ price, rsi, macd, bb, quickSignal });
    } catch {
      // ignore silently
    }
  };

  await tick();
  monitorInterval = setInterval(tick, intervalSec * 1000);
}

export async function stopPriceMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

export function startAutoBuySell(params: {
  tokenMint: string;
  action: "buy" | "sell";
  amount: number;
}) {
  if (!AUTO_TRADE_ENABLED) return "Automated trading disabled";
  if (autoBuySellInterval) clearInterval(autoBuySellInterval);

  const tradeFn = async () => {
    try {
      if (params.action === "buy") {
        await buy({ tokenMint: params.tokenMint, amount: params.amount });
      } else {
        await sell({ tokenMint: params.tokenMint, amount: params.amount });
      }
      console.log(
        `Auto ${params.action} executed for ${params.tokenMint} amount: ${params.amount}`,
      );
    } catch (e) {
      console.error(`Auto ${params.action} failed:`, e);
    }
  };

  tradeFn();
  autoBuySellInterval = setInterval(tradeFn, AUTO_BUY_SELL_INTERVAL_MS);
  return "Automated buy/sell started";
}

export function stopAutoBuySell() {
  if (autoBuySellInterval) {
    clearInterval(autoBuySellInterval);
    autoBuySellInterval = null;
    return "Automated buy/sell stopped";
  }
  return "No active automated buy/sell task";
}
