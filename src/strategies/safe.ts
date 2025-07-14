// src/strategies/safe.ts
// safe.ts imports
import { swap } from "../actions";

export interface SafeParams {
  stopLossPercent: number;
  takeProfitPercent: number;
  tokenMint: string;
  amount: number;
  confirm: (message: string) => Promise<boolean>;
}

/**
 * Safe trading strategy limiting to major tokens (SOL, USDC).
 * Requires stop loss, take profit percents, and user confirmation.
 */
export async function safeStrategy(params: SafeParams) {
  const { tokenMint, amount, stopLossPercent, takeProfitPercent, confirm } =
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
    `Ready to execute safe trade for ${amount} units of ${tokenMint} with stop loss ${stopLossPercent}% and take profit ${takeProfitPercent}%. Proceed?`,
  );
  if (!confirmation) return "User cancelled the trade.";

  const sig = await swap({
    inputMint: "So11111111111111111111111111111111111111112", // Assume input SOL
    outputMint: tokenMint,
    amount,
  });

  // Monitoring stop loss and take profit outside scope here
  return `Safe trade completed. Tx signature: ${sig}`;
}
