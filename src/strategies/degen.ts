// src/strategies/degen.ts

import { getPumpFunRealTimeTokens, pumpFunTrade } from "../providers/pumpfun";
export interface DegenParams {
  stopLossPercent: number;
  takeProfitPercent: number;
  amount: number;
  confirm: (message: string) => Promise<boolean>;
}

/**
 * Degen trading strategy:
 * Automatically ape into newly created tokens from Pump.fun real-time feed.
 * Requires stop loss and take profit percents.
 *
 * @param params {stopLossPercent, takeProfitPercent, amount, confirm}
 */
export async function degenStrategy(params: DegenParams) {
  if (
    typeof params.stopLossPercent !== "number" ||
    typeof params.takeProfitPercent !== "number" ||
    typeof params.amount !== "number" ||
    typeof params.confirm !== "function"
  ) {
    throw new Error(
      "Degen strategy requires stopLossPercent, takeProfitPercent, amount, and confirm function.",
    );
  }

  const tokens = await getPumpFunRealTimeTokens();

  if (!tokens || tokens.length === 0) {
    return "No new tokens to ape into at this time.";
  }

  const tokenToBuy = tokens[0]; // Ape into the newest token
  const tokenMint = tokenToBuy.tokenMint;

  // Prompt user for trade confirmation
  const confirmation = await params.confirm(
    `Ready to buy token ${tokenMint} with amount ${params.amount}. Stop loss: ${params.stopLossPercent}%, Take profit: ${params.takeProfitPercent}%. Proceed?`,
  );
  if (!confirmation) return "User cancelled the trade.";

  // Execute buy trade
  const sig = await pumpFunTrade({
    tokenMint,
    action: "buy",
    amount: params.amount,
  });

  // You can implement monitoring for stop loss/take profit here or externally
  return `Degen trade executed. Tx signature: ${sig}`;
}
