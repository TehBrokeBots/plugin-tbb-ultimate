// src/strategies/dao.ts

import { swap } from "../actions";
import { getDexscreenerData } from "../providers/dexscreener";

export interface DaoStrategyParams {
  amount: number; // amount in lamports or smallest unit to buy
  confirm: (message: string) => Promise<boolean>;
  exitTo?: "USDC" | "SOL";
  monitorIntervalSec?: number;
}

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * DAO token purchase strategy with monitoring framework for Teh Broke Bots governance token.
 * 
 * This strategy implements a DAO token acquisition approach that:
 * - Purchases Teh Broke Bots DAO governance tokens using SOL
 * - Requires user confirmation before execution
 * - Sets up price monitoring framework for future stop loss/take profit implementation
 * - Uses Jupiter aggregator for optimal swap execution
 * - Provides transaction tracking and status reporting
 * 
 * @param params DaoStrategyParams object containing strategy configuration
 * @param params.amount The amount in lamports to spend on DAO tokens
 * @param params.confirm Callback function for user confirmation
 * @param params.exitTo Target token for future exit strategies (USDC or SOL, defaults to USDC)
 * @param params.monitorIntervalSec Interval in seconds for price monitoring (defaults to 10)
 * @returns Promise<string> Transaction signature or status message
 * @throws Error if validation fails or strategy execution fails
 * 
 * @example
 * ```typescript
 * const result = await daoStrategy({
 *   amount: 1000000000, // 1 SOL in lamports
 *   confirm: async (msg) => await userConfirm(msg),
 *   exitTo: "USDC"
 * });
 * ```
 * 
 * @note The monitoring framework is set up for future extensibility with stop loss/take profit logic.
 */
export async function daoStrategy(params: DaoStrategyParams) {
  const { amount, confirm, exitTo = "USDC", monitorIntervalSec = 10 } = params;
  
  // Input validation
  if (typeof amount !== 'number' || amount <= 0) throw new Error("Amount must be a positive number.");
  if (typeof confirm !== 'function') throw new Error("Confirm callback is required.");
  
  try {
    // Define token mints
    const daoTokenMint = "AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos";
    const solMint = "So11111111111111111111111111111111111111112";
    const amountLamports = amount;
    
    // Step 1: Get user confirmation
    const confirmationMessage = `Ready to buy ${amountLamports} lamports worth of DAO token ${daoTokenMint} using SOL. Exit to: ${exitTo}. Proceed?`;
    const confirmed = await confirm(confirmationMessage);
    
    if (!confirmed) {
      return "User cancelled DAO token purchase.";
    }
    
    // Step 2: Execute DAO token purchase via Jupiter swap
    const signature = await swap({
      inputMint: solMint,
      outputMint: daoTokenMint,
      amount: amountLamports,
    });
    
    // Step 3: Set up price monitoring framework for future extensibility
    let entryPrice = 0;
    
    // Fetch entry price from Dexscreener
    const priceData = await getDexscreenerData({ tokenMint: daoTokenMint });
    if (typeof priceData === "object" && "priceUsd" in priceData) {
      entryPrice = priceData.priceUsd;
    }
    
    let monitoring = true;
    const pollInterval = (monitorIntervalSec || 10) * 1000;
    
    // Start background price monitoring (framework for future stop loss/take profit)
    (async function monitorPrice() {
      while (monitoring) {
        await new Promise((r) => setTimeout(r, pollInterval));
        
        const data = await getDexscreenerData({ tokenMint: daoTokenMint });
        if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
        
        const currentPrice = data.priceUsd;
        if (!entryPrice || !currentPrice) continue;
        
        // TODO: Add stop loss/take profit logic here for future implementation
        // For now, this provides the monitoring framework
      }
    })();
    
    return `DAO token purchase executed. Tx signature: ${signature}`;
  } catch (e) {
    throw new Error(`Failed to execute DAO strategy: ${(e as Error).message}`);
  }
}
