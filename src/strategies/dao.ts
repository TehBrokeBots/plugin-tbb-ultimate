// src/strategies/dao.ts

import { swap } from "../actions";

export interface DaoStrategyParams {
  amount: number; // amount in lamports or smallest unit to buy
  confirm: (message: string) => Promise<boolean>;
}

/**
 * Buys Teh Broke Bots DAO token through Jupiter swap.
 * Requires user confirmation before executing.
 */
export async function daoStrategy(params: DaoStrategyParams) {
  const daoTokenMint = "AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos";
  const solMint = "So11111111111111111111111111111111111111112";
  const amountLamports = params.amount;

  const confirmationMessage = `Ready to buy ${amountLamports} lamports worth of DAO token ${daoTokenMint} using SOL. Proceed?`;
  const confirmed = await params.confirm(confirmationMessage);
  if (!confirmed) {
    return "User cancelled DAO token purchase.";
  }

  const signature = await swap({
    inputMint: solMint,
    outputMint: daoTokenMint,
    amount: amountLamports,
  });

  return `DAO token purchase executed. Tx signature: ${signature}`;
}
