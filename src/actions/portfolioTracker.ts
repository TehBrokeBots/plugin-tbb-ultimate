import { PluginAction } from "../types";
import { getBalance, getParsedTokenAccounts } from "../providers/solana";
import { getTokenInfo } from "../providers/dexscreener";
import { PublicKey } from "@solana/web3.js";

interface PortfolioTrackerParams {
  walletAddress: string;
}

interface PortfolioToken {
  mint: string;
  amount: number;
  price: number;
  valueUsd: number;
}

interface PortfolioTrackerResult {
  message: string;
  sol: { amount: number; price: number; valueUsd: number };
  tokens: PortfolioToken[];
  totalValueUsd: number;
}

function isDexscreenerData(data: any): data is { pairs: Array<any> } {
  return data && Array.isArray(data.pairs);
}

/**
 * Tracks the portfolio value for a given wallet address.
 */
export const portfolioTrackerAction: PluginAction<PortfolioTrackerParams, PortfolioTrackerResult> = {
  name: "PORTFOLIO_TRACKER",
  description: "Tracks the portfolio value for a given wallet address.",
  validate: async (params: PortfolioTrackerParams) => {
    if (!params.walletAddress) throw new Error("Missing walletAddress.");
    return true;
  },
  handler: async (runtime: any, ctx: PortfolioTrackerParams) => {
    const solBalanceLamports = await getBalance(new PublicKey(ctx.walletAddress));
    const solBalance = solBalanceLamports / 1e9;
    const splTokens = await getParsedTokenAccounts(new PublicKey(ctx.walletAddress));
    const solInfo = await getTokenInfo("solana", "So11111111111111111111111111111111111111112");
    if (!isDexscreenerData(solInfo)) throw new Error("Failed to get SOL token info.");
    const solPrice = Number(solInfo.pairs[0]?.priceUsd ?? 0);
    const tokens = await Promise.all(
      splTokens.map(async (acct: any) => {
        const mint = acct.account.data.parsed.info.mint;
        const amount = Number(acct.account.data.parsed.info.tokenAmount.uiAmount);
        let price = 0;
        try {
          const info = await getTokenInfo("solana", mint);
          price = isDexscreenerData(info)
            ? Number(info.pairs[0]?.priceUsd ?? 0)
            : 0;
        } catch (e) {
          // log error, but continue
        }
        return { mint, amount, price, valueUsd: amount * price };
      }),
    );
    const solValue = solBalance * solPrice;
    const totalValueUsd = solValue + tokens.reduce((sum, t) => sum + t.valueUsd, 0);
    return {
      message: "Portfolio tracked successfully.",
      sol: { amount: solBalance, price: solPrice, valueUsd: solValue },
      tokens,
      totalValueUsd,
    };
  },
  examples: [
    {
      input: { walletAddress: "WalletAddress..." },
      output: { message: "Portfolio tracked successfully.", sol: { amount: 1, price: 100, valueUsd: 100 }, tokens: [], totalValueUsd: 100 },
    },
  ],
};

export default portfolioTrackerAction; 