import { predict } from "../evaluators/predict";
import { buy, sell, swap } from "../actions";
import { getDexscreenerData } from "../providers/dexscreener";

export interface PredictiveStrategyParams {
  tokenMint: string;
  symbol: string;
  amount: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  confirm: (message: string) => Promise<boolean>;
  autoTrade?: boolean;
  exitTo?: "USDC" | "SOL";
  monitorIntervalSec?: number;
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Predictive trading strategy:
 * Uses AI prediction to decide buy/sell, supports stop loss/take profit.
 * User confirmation required for initial trade, not for stop loss/take profit exits.
 */
export async function predictiveStrategy(params: PredictiveStrategyParams) {
  const { tokenMint, symbol, amount, stopLossPercent, takeProfitPercent, confirm, autoTrade, exitTo = "USDC", monitorIntervalSec = 10 } = params;

  // 1. Get prediction
  const predictionResult = await predict({ tokenMint, symbol });
  const { prediction, confidence } = predictionResult;

  if (prediction === "HOLD") {
    return { message: `Prediction is HOLD. No trade executed.`, predictionResult };
  }

  // 2. Prompt user for confirmation (unless autoTrade is true)
  let actionMsg =
    prediction === "LONG"
      ? `AI predicts LONG (${confidence * 100}%). Buy ${amount} of ${symbol}? Stop loss: ${stopLossPercent}%, Take profit: ${takeProfitPercent}%, Exit to: ${exitTo}`
      : `AI predicts SHORT (${confidence * 100}%). Sell ${amount} of ${symbol}? Stop loss: ${stopLossPercent}%, Take profit: ${takeProfitPercent}%, Exit to: ${exitTo}`;

  let userConfirmed = autoTrade ? true : await confirm(actionMsg);
  if (!userConfirmed) return { message: "User cancelled the trade.", predictionResult };

  // 3. Execute trade
  let tradeSig;
  let entryPrice = 0;
  let entryType = prediction;
  let exitType = prediction === "LONG" ? "SHORT" : "LONG";
  if (prediction === "LONG") {
    tradeSig = await buy({ tokenMint, amount });
  } else if (prediction === "SHORT") {
    tradeSig = await sell({ tokenMint, amount });
  }

  // 4. Fetch entry price
  const priceData = await getDexscreenerData({ tokenMint });
  if (typeof priceData === "object" && "priceUsd" in priceData) {
    entryPrice = priceData.priceUsd;
  }

  // 5. Monitor for stop loss/take profit
  let monitoring = true;
  const pollInterval = (monitorIntervalSec || 10) * 1000;
  (async function monitorPrice() {
    while (monitoring) {
      await new Promise((r) => setTimeout(r, pollInterval));
      const data = await getDexscreenerData({ tokenMint });
      if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
      const currentPrice = data.priceUsd;
      if (!entryPrice || !currentPrice) continue;
      let change = ((currentPrice - entryPrice) / entryPrice) * 100;
      if (entryType === "SHORT") change = -change; // Invert for shorts
      if (change <= -Math.abs(stopLossPercent)) {
        monitoring = false;
        // Stop loss hit, exit trade
        await swap({ inputMint: tokenMint, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount });
        console.log(`Stop loss triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
        return;
      }
      if (change >= Math.abs(takeProfitPercent)) {
        monitoring = false;
        // Take profit hit, exit trade
        await swap({ inputMint: tokenMint, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount });
        console.log(`Take profit triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
        return;
      }
    }
  })();

  return {
    message: `Trade executed: ${prediction}. Tx signature: ${tradeSig}`,
    predictionResult,
    tradeSig,
  };
} 