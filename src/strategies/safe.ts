// src/strategies/safe.ts
// safe.ts imports
import { swap } from "../actions";
import { getDexscreenerData } from "../providers/dexscreener";

export interface SafeParams {
  stopLossPercent: number;
  takeProfitPercent: number;
  tokenMint: string;
  amount: number;
  confirm: (message: string) => Promise<boolean>;
  exitTo?: "USDC" | "SOL";
  monitorIntervalSec?: number;
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Safe trading strategy for major tokens (SOL, USDC) with stop loss and take profit monitoring.
 * 
 * This strategy implements a conservative trading approach that:
 * - Only allows trading of major, established tokens (SOL, USDC)
 * - Requires user confirmation before execution
 * - Monitors price continuously for stop loss and take profit conditions
 * - Automatically exits positions when conditions are met
 * 
 * @param params SafeParams object containing strategy configuration
 * @param params.stopLossPercent Percentage loss at which to exit the position
 * @param params.takeProfitPercent Percentage gain at which to exit the position
 * @param params.tokenMint The token mint address to trade
 * @param params.amount The amount to trade
 * @param params.confirm Callback function for user confirmation
 * @param params.exitTo Target token for exit (USDC or SOL, defaults to USDC)
 * @param params.monitorIntervalSec Interval in seconds for price monitoring (defaults to 10)
 * @returns Promise<string> Transaction signature or status message
 * @throws Error if validation fails or strategy execution fails
 * 
 * @example
 * ```typescript
 * const result = await safeStrategy({
 *   stopLossPercent: 5,
 *   takeProfitPercent: 10,
 *   tokenMint: "So11111111111111111111111111111111111111112",
 *   amount: 1.0,
 *   confirm: async (msg) => await userConfirm(msg),
 *   exitTo: "USDC"
 * });
 * ```
 */
export async function safeStrategy(params: SafeParams) {
  const { tokenMint, amount, stopLossPercent, takeProfitPercent, confirm, exitTo = "USDC", monitorIntervalSec = 10 } = params;
  
  // Input validation
  if (!tokenMint) throw new Error("Token mint is required for safe strategy.");
  if (typeof amount !== 'number' || amount <= 0) throw new Error("Amount must be a positive number.");
  if (typeof stopLossPercent !== 'number' || stopLossPercent <= 0) throw new Error("Stop loss percent must be a positive number.");
  if (typeof takeProfitPercent !== 'number' || takeProfitPercent <= 0) throw new Error("Take profit percent must be a positive number.");
  if (typeof confirm !== 'function') throw new Error("Confirm callback is required.");
  
  try {
    // Validate required parameters
    if (!tokenMint || !amount)
      throw new Error("Token mint and amount are required.");
    
    // Define allowed tokens for safe trading
    const allowedTokens = [
      "So11111111111111111111111111111111111111112", // SOL
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet mint
    ];
    
    if (!allowedTokens.includes(tokenMint)) {
      throw new Error("Safe strategy supports SOL and USDC tokens only.");
    }
    
    // Get user confirmation
    const confirmation = await confirm(
      `Ready to execute safe trade for ${amount} units of ${tokenMint} with stop loss ${stopLossPercent}% and take profit ${takeProfitPercent}%, Exit to: ${exitTo}. Proceed?`,
    );
    
    if (!confirmation) return "User cancelled the trade.";
    
    // Execute initial trade
    const sig = await swap({
      inputMint: "So11111111111111111111111111111111111111112", // Assume input SOL
      outputMint: tokenMint,
      amount,
    });
    
    // Monitor for stop loss/take profit
    let entryPrice = 0;
    
    // Fetch entry price
    const priceData = await getDexscreenerData({ tokenMint });
    if (typeof priceData === "object" && "priceUsd" in priceData) {
      entryPrice = priceData.priceUsd;
    }
    
    let monitoring = true;
    const pollInterval = (monitorIntervalSec || 10) * 1000;
    
    // Start price monitoring in background
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
    
    return `Safe trade completed. Tx signature: ${sig}`;
  } catch (e) {
    throw new Error(`Failed to execute safe strategy: ${(e as Error).message}`);
  }
}
