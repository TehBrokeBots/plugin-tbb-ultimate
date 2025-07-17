// src/strategies/degen.ts

import { getPumpFunRealTimeTokens, pumpFunTrade } from "../providers/pumpfun";
import { swap } from "../actions";
import { getDexscreenerData } from "../providers/dexscreener";

export interface DegenParams {
  stopLossPercent: number;
  takeProfitPercent: number;
  amount: number;
  confirm: (message: string) => Promise<boolean>;
  exitTo?: "USDC" | "SOL";
  monitorIntervalSec?: number;
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * High-risk degen trading strategy for newly created tokens with automated risk management.
 * 
 * This strategy implements a high-risk, high-reward approach that:
 * - Automatically identifies newly created tokens from Pump.fun real-time feed
 * - Apes into the newest token available
 * - Implements stop loss and take profit monitoring
 * - Provides automated position management and exit strategies
 * - Requires user confirmation before execution
 * 
 * ⚠️ WARNING: This is a high-risk strategy intended for experienced traders only.
 * 
 * @param params DegenParams object containing strategy configuration
 * @param params.stopLossPercent Percentage loss at which to exit the position
 * @param params.takeProfitPercent Percentage gain at which to exit the position
 * @param params.amount The amount to trade
 * @param params.confirm Callback function for user confirmation
 * @param params.exitTo Target token for exit (USDC or SOL, defaults to USDC)
 * @param params.monitorIntervalSec Interval in seconds for price monitoring (defaults to 10)
 * @returns Promise<string> Transaction signature or status message
 * @throws Error if validation fails or strategy execution fails
 * 
 * @example
 * ```typescript
 * const result = await degenStrategy({
 *   stopLossPercent: 20,
 *   takeProfitPercent: 50,
 *   amount: 0.1,
 *   confirm: async (msg) => await userConfirm(msg),
 *   exitTo: "USDC"
 * });
 * ```
 */
export async function degenStrategy(params: DegenParams) {
  const { stopLossPercent, takeProfitPercent, amount, confirm, exitTo = "USDC", monitorIntervalSec = 10 } = params;
  
  // Input validation
  if (typeof stopLossPercent !== "number" || stopLossPercent <= 0) throw new Error("Stop loss percent must be a positive number.");
  if (typeof takeProfitPercent !== "number" || takeProfitPercent <= 0) throw new Error("Take profit percent must be a positive number.");
  if (typeof amount !== "number" || amount <= 0) throw new Error("Amount must be a positive number.");
  if (typeof confirm !== 'function') throw new Error("Confirm callback is required.");
  
  try {
    // Step 1: Get real-time tokens from Pump.fun
    const tokens = await getPumpFunRealTimeTokens();
    if (!tokens || tokens.length === 0) {
      return "No new tokens to ape into at this time.";
    }
    
    // Step 2: Select the newest token (first in the list)
    const tokenToBuy = tokens[0]; // Ape into the newest token
    const tokenMint = tokenToBuy.tokenMint;
    
    // Step 3: Get user confirmation
    const confirmation = await confirm(
      `Ready to buy token ${tokenMint} with amount ${amount}. Stop loss: ${stopLossPercent}%, Take profit: ${takeProfitPercent}%, Exit to: ${exitTo}. Proceed?`,
    );
    
    if (!confirmation) return "User cancelled the trade.";
    
    // Step 4: Execute buy trade using Pump.fun
    const sig = await pumpFunTrade({
      tokenMint,
      action: "buy",
      amount,
    });
    
    // Step 5: Monitor for stop loss/take profit conditions
    let entryPrice = 0;
    
    // Fetch entry price from Dexscreener
    const priceData = await getDexscreenerData({ tokenMint });
    if (typeof priceData === "object" && "priceUsd" in priceData) {
      entryPrice = priceData.priceUsd;
    }
    
    let monitoring = true;
    const pollInterval = (monitorIntervalSec || 10) * 1000;
    
    // Start background price monitoring
    (async function monitorPrice() {
      while (monitoring) {
        await new Promise((r) => setTimeout(r, pollInterval));
        
        const data = await getDexscreenerData({ tokenMint });
        if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
        
        const currentPrice = data.priceUsd;
        if (!entryPrice || !currentPrice) continue;
        
        let change = ((currentPrice - entryPrice) / entryPrice) * 100;
        
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
    
    return `Degen trade executed. Tx signature: ${sig}`;
  } catch (e) {
    throw new Error(`Failed to execute degen strategy: ${(e as Error).message}`);
  }
}
