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
 * Degen trading strategy:
 * Automatically ape into newly created tokens from Pump.fun real-time feed.
 * Requires stop loss and take profit percents.
 *
 * @param params {stopLossPercent, takeProfitPercent, amount, confirm, exitTo, monitorIntervalSec}
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

  const { exitTo = "USDC", monitorIntervalSec = 10 } = params;

  const tokens = await getPumpFunRealTimeTokens();

  if (!tokens || tokens.length === 0) {
    return "No new tokens to ape into at this time.";
  }

  const tokenToBuy = tokens[0]; // Ape into the newest token
  const tokenMint = tokenToBuy.tokenMint;

  // Prompt user for trade confirmation
  const confirmation = await params.confirm(
    `Ready to buy token ${tokenMint} with amount ${params.amount}. Stop loss: ${params.stopLossPercent}%, Take profit: ${params.takeProfitPercent}%, Exit to: ${exitTo}. Proceed?`,
  );
  if (!confirmation) return "User cancelled the trade.";

  // Execute buy trade
  const sig = await pumpFunTrade({
    tokenMint,
    action: "buy",
    amount: params.amount,
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
      if (change <= -Math.abs(params.stopLossPercent)) {
        monitoring = false;
        // Stop loss hit, exit trade
        await swap({ inputMint: tokenMint, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount: params.amount });
        console.log(`Stop loss triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
        return;
      }
      if (change >= Math.abs(params.takeProfitPercent)) {
        monitoring = false;
        // Take profit hit, exit trade
        await swap({ inputMint: tokenMint, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount: params.amount });
        console.log(`Take profit triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
        return;
      }
    }
  })();

  return `Degen trade executed. Tx signature: ${sig}`;
}
