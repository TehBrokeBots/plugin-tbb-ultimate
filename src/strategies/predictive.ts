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
 * AI-powered predictive trading strategy with automated decision making and risk management.
 * 
 * This strategy uses AI predictions to make trading decisions and implements:
 * - AI-driven buy/sell decisions based on market analysis
 * - User confirmation (optional with autoTrade mode)
 * - Continuous price monitoring for stop loss and take profit
 * - Automatic position management and exit strategies
 * - Support for both long and short positions
 * 
 * @param params PredictiveStrategyParams object containing strategy configuration
 * @param params.tokenMint The token mint address to trade
 * @param params.symbol The token symbol for AI analysis
 * @param params.amount The amount to trade
 * @param params.stopLossPercent Percentage loss at which to exit the position
 * @param params.takeProfitPercent Percentage gain at which to exit the position
 * @param params.confirm Callback function for user confirmation
 * @param params.autoTrade If true, skips user confirmation (defaults to false)
 * @param params.exitTo Target token for exit (USDC or SOL, defaults to USDC)
 * @param params.monitorIntervalSec Interval in seconds for price monitoring (defaults to 10)
 * @returns Promise<object> Result containing message, prediction data, and transaction signature
 * @throws Error if validation fails or strategy execution fails
 * 
 * @example
 * ```typescript
 * const result = await predictiveStrategy({
 *   tokenMint: "TokenMintAddress...",
 *   symbol: "SOL",
 *   amount: 1.0,
 *   stopLossPercent: 5,
 *   takeProfitPercent: 15,
 *   confirm: async (msg) => await userConfirm(msg),
 *   autoTrade: false,
 *   exitTo: "USDC"
 * });
 * ```
 */
export async function predictiveStrategy(params: PredictiveStrategyParams) {
  const { tokenMint, symbol, amount, stopLossPercent, takeProfitPercent, confirm, autoTrade, exitTo = "USDC", monitorIntervalSec = 10 } = params;

  // Input validation
  if (!tokenMint) throw new Error("Token mint is required for predictive strategy.");
  if (!symbol) throw new Error("Symbol is required for predictive strategy.");
  if (typeof amount !== 'number' || amount <= 0) throw new Error("Amount must be a positive number.");
  if (typeof stopLossPercent !== 'number' || stopLossPercent < 0) throw new Error("Stop loss percent must be a non-negative number.");
  if (typeof takeProfitPercent !== 'number' || takeProfitPercent < 0) throw new Error("Take profit percent must be a non-negative number.");
  if (typeof monitorIntervalSec !== 'number' || monitorIntervalSec <= 0) throw new Error("Monitor interval must be a positive number.");

  try {
    // Step 1: Get AI prediction
    const predictionResult = await predict({ tokenMint, symbol });
    const { prediction, confidence } = predictionResult;

    // Handle HOLD prediction
    if (prediction === "HOLD") {
      return { message: `Prediction is HOLD. No trade executed.`, predictionResult };
    }

    // Step 2: Prompt user for confirmation (unless autoTrade is true)
    let actionMsg =
      prediction === "LONG"
        ? `AI predicts LONG (${confidence * 100}%). Buy ${amount} of ${symbol}? Stop loss: ${stopLossPercent}%, Take profit: ${takeProfitPercent}%, Exit to: ${exitTo}`
        : `AI predicts SHORT (${confidence * 100}%). Sell ${amount} of ${symbol}? Stop loss: ${stopLossPercent}%, Take profit: ${takeProfitPercent}%, Exit to: ${exitTo}`;

    let userConfirmed = autoTrade ? true : await confirm(actionMsg);
    if (!userConfirmed) return { message: "User cancelled the trade.", predictionResult };

    // Step 3: Execute trade based on prediction
    let tradeSig;
    let entryPrice = 0;
    let entryType = prediction;
    let exitType = prediction === "LONG" ? "SHORT" : "LONG";
    
    if (prediction === "LONG") {
      tradeSig = await buy({ tokenMint, amount });
    } else if (prediction === "SHORT") {
      tradeSig = await sell({ tokenMint, amount });
    }

    // Step 4: Fetch entry price for monitoring
    const priceData = await getDexscreenerData({ tokenMint });
    if (typeof priceData === "object" && "priceUsd" in priceData) {
      entryPrice = priceData.priceUsd;
    } else {
      throw new Error("Could not fetch entry price from Dexscreener.");
    }

    // Step 5: Monitor for stop loss/take profit conditions
    let monitoring = true;
    const pollInterval = monitorIntervalSec * 1000;
    
    // Start background monitoring
    (async function monitorPrice() {
      while (monitoring) {
        await new Promise((r) => setTimeout(r, pollInterval));
        
        const data = await getDexscreenerData({ tokenMint });
        if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
        
        const currentPrice = data.priceUsd;
        if (!entryPrice || !currentPrice) continue;
        
        let change = ((currentPrice - entryPrice) / entryPrice) * 100;
        if (entryType === "SHORT") change = -change; // Invert for shorts
        
        // Check stop loss condition
        if (change <= -Math.abs(stopLossPercent)) {
          monitoring = false;
          // Stop loss hit, exit trade
          await swap({ inputMint: tokenMint, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount });
          console.log(`Stop loss triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
          return;
        }
        
        // Check take profit condition
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
  } catch (e) {
    throw new Error(`Failed to execute predictive strategy: ${(e as Error).message}`);
  }
} 