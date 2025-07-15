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
 * Safe trading strategy limiting to major tokens (SOL, USDC).
 * Requires stop loss, take profit percents, and user confirmation.
 */
export async function safeStrategy(params: SafeParams) {
  const { tokenMint, amount, stopLossPercent, takeProfitPercent, confirm, exitTo = "USDC", monitorIntervalSec = 10 } =
    params;

  if (!tokenMint || !amount)
    throw new Error("Token mint and amount are required.");

  const allowedTokens = [
    "So11111111111111111111111111111111111111112", // SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet mint
  ];

  if (!allowedTokens.includes(tokenMint)) {
    throw new Error("Safe strategy supports SOL and USDC tokens only.");
  }

  const confirmation = await confirm(
    `Ready to execute safe trade for ${amount} units of ${tokenMint} with stop loss ${stopLossPercent}% and take profit ${takeProfitPercent}%, Exit to: ${exitTo}. Proceed?`,
  );
  if (!confirmation) return "User cancelled the trade.";

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
  (async function monitorPrice() {
    while (monitoring) {
      await new Promise((r) => setTimeout(r, pollInterval));
      const data = await getDexscreenerData({ tokenMint });
      if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
      const currentPrice = data.priceUsd;
      if (!entryPrice || !currentPrice) continue;
      let change = ((currentPrice - entryPrice) / entryPrice) * 100;
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

  return `Safe trade completed. Tx signature: ${sig}`;
}
