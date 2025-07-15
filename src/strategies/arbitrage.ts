// src/strategies/arbitrage.ts
import { getQuote } from "../providers/jupiter";
import { getPrice as getOrcaPrice } from "../providers/orca";
import { getPrice as getRaydiumPrice } from "../providers/raydium";
import { swap } from "../actions";
import { getDexscreenerData } from "../providers/dexscreener";

const ARBITRAGE_SPREAD_THRESHOLD = parseFloat(
  process.env.ARBITRAGE_SPREAD_THRESHOLD || "0.01",
);
const AUTO_TRADE_ENABLED = process.env.AUTO_TRADE_ENABLED === "true";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export interface ArbitrageParams {
  tokenMintA: string;
  tokenMintB: string;
  tradeAmountLamports?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  confirm: (message: string) => Promise<boolean>;
  exitTo?: "USDC" | "SOL";
  monitorIntervalSec?: number;
}

export async function arbitrageStrategy(params: ArbitrageParams) {
  const {
    tokenMintA,
    tokenMintB,
    tradeAmountLamports = 1_000_000,
    stopLossPercent = 0,
    takeProfitPercent = 0,
    confirm,
    exitTo = "USDC",
    monitorIntervalSec = 10,
  } = params;

  if (!tokenMintA || !tokenMintB) throw new Error("Both token mints are required for arbitrage strategy.");
  if (typeof tradeAmountLamports !== 'number' || tradeAmountLamports <= 0) throw new Error("Amount must be a positive number.");

  try {
    const jupiterQuote = await getQuote(
      tokenMintA,
      tokenMintB,
      tradeAmountLamports,
    );
    const jupiterPrice = parseFloat(jupiterQuote.price || "0");

    const orcaPrice = await getOrcaPrice(tokenMintA, tokenMintB);
    const raydiumPrice = await getRaydiumPrice(tokenMintA, tokenMintB);

    const prices = [
      { name: "Jupiter", price: jupiterPrice },
      ...(orcaPrice !== null ? [{ name: "Orca", price: orcaPrice }] : []),
      ...(raydiumPrice !== null
        ? [{ name: "Raydium", price: raydiumPrice }]
        : []),
    ];

    if (prices.length < 2) {
      return { message: "Not enough price data to evaluate arbitrage." };
    }

    const minPriceObj = prices.reduce(
      (min, p) => (p.price < min.price ? p : min),
      prices[0],
    );
    const maxPriceObj = prices.reduce(
      (max, p) => (p.price > max.price ? p : max),
      prices[0],
    );
    const spread = (maxPriceObj.price - minPriceObj.price) / minPriceObj.price;

    if (spread > ARBITRAGE_SPREAD_THRESHOLD) {
      const message = `Arbitrage opportunity! Buy on ${minPriceObj.name} at ${minPriceObj.price.toFixed(
        6,
      )}, sell on ${maxPriceObj.name} at ${maxPriceObj.price.toFixed(6)} with spread ${(spread * 100).toFixed(2)}%. Proceed with automated trades?`;

      const userConfirmed = await confirm(message);
      if (!userConfirmed) return "User cancelled arbitrage trades.";

      if (AUTO_TRADE_ENABLED) {
        try {
          const buySig = await swap({
            inputMint: tokenMintA,
            outputMint: tokenMintB,
            amount: tradeAmountLamports,
          });
          const sellSig = await swap({
            inputMint: tokenMintB,
            outputMint: tokenMintA,
            amount: tradeAmountLamports,
          });

          // Monitor for stop loss/take profit
          let entryPrice = 0;
          const priceData = await getDexscreenerData({ tokenMint: tokenMintA });
          if (typeof priceData === "object" && "priceUsd" in priceData) {
            entryPrice = priceData.priceUsd;
          }
          let monitoring = true;
          const pollInterval = (monitorIntervalSec || 10) * 1000;
          (async function monitorPrice() {
            while (monitoring) {
              await new Promise((r) => setTimeout(r, pollInterval));
              const data = await getDexscreenerData({ tokenMint: tokenMintA });
              if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
              const currentPrice = data.priceUsd;
              if (!entryPrice || !currentPrice) continue;
              let change = ((currentPrice - entryPrice) / entryPrice) * 100;
              if (change <= -Math.abs(stopLossPercent)) {
                monitoring = false;
                // Stop loss hit, exit trade
                await swap({ inputMint: tokenMintB, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount: tradeAmountLamports });
                console.log(`Stop loss triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
                return;
              }
              if (change >= Math.abs(takeProfitPercent)) {
                monitoring = false;
                // Take profit hit, exit trade
                await swap({ inputMint: tokenMintB, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount: tradeAmountLamports });
                console.log(`Take profit triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
                return;
              }
            }
          })();

          return {
            arbitrageOpportunity: true,
            spread,
            buyOn: minPriceObj.name,
            sellOn: maxPriceObj.name,
            autoTrade: { buySig, sellSig, status: "success" },
          };
        } catch (e) {
          return {
            error: `Arbitrage auto trade failed: ${(e as Error).message}`,
          };
        }
      } else {
        return {
          arbitrageOpportunity: true,
          spread,
          buyOn: minPriceObj.name,
          sellOn: maxPriceObj.name,
          autoTrade: { status: "disabled" },
        };
      }
    } else {
      return { arbitrageOpportunity: false, spread };
    }
  } catch (e) {
    throw new Error(`Failed to execute arbitrage strategy: ${(e as Error).message}`);
  }
}
