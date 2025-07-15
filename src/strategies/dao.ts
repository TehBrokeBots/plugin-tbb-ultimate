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
 * Buys Teh Broke Bots DAO token through Jupiter swap.
 * Requires user confirmation before executing.
 */
export async function daoStrategy(params: DaoStrategyParams) {
  const { exitTo = "USDC", monitorIntervalSec = 10 } = params;
  const daoTokenMint = "AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos";
  const solMint = "So11111111111111111111111111111111111111112";
  const amountLamports = params.amount;

  const confirmationMessage = `Ready to buy ${amountLamports} lamports worth of DAO token ${daoTokenMint} using SOL. Exit to: ${exitTo}. Proceed?`;
  const confirmed = await params.confirm(confirmationMessage);
  if (!confirmed) {
    return "User cancelled DAO token purchase.";
  }

  const signature = await swap({
    inputMint: solMint,
    outputMint: daoTokenMint,
    amount: amountLamports,
  });

  // Monitor for stop loss/take profit (for future extensibility)
  let entryPrice = 0;
  // Fetch entry price
  const priceData = await getDexscreenerData({ tokenMint: daoTokenMint });
  if (typeof priceData === "object" && "priceUsd" in priceData) {
    entryPrice = priceData.priceUsd;
  }
  let monitoring = true;
  const pollInterval = (monitorIntervalSec || 10) * 1000;
  (async function monitorPrice() {
    while (monitoring) {
      await new Promise((r) => setTimeout(r, pollInterval));
      const data = await getDexscreenerData({ tokenMint: daoTokenMint });
      if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
      const currentPrice = data.priceUsd;
      if (!entryPrice || !currentPrice) continue;
      // For future: add stop loss/take profit logic here
    }
  })();

  return `DAO token purchase executed. Tx signature: ${signature}`;
}
