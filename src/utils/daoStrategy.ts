import { ActionContext } from "../types";

/**
 * Executes a DAO strategy to buy Teh Broke Bots DAO token using Jupiter with stop loss/take profit and user confirmation.
 * @param ctx - { amount: number, userPublicKey: string, stopLossPct?: number, takeProfitPct?: number, confirmed?: boolean }
 * @returns {Promise<{message: string, quote: any, serializedTransaction: string, stopLossPct?: number, takeProfitPct?: number}|string|object>}
 */
export const daoStrategy = async (ctx: ActionContext): Promise<{message: string, quote: any, serializedTransaction: string, stopLossPct?: number, takeProfitPct?: number}|string|object> => {
  const { amount, userPublicKey, stopLossPct, takeProfitPct } = ctx;
  // Teh Broke Bots DAO mint address
  const daoMint = 'AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos';
  // USDC mint
  const usdcMint = 'Es9vMFrzaCERZ6t5gFRCJpJkFGr2PdtbWg5F7xr5Pehk';
  if (!amount || !userPublicKey) return 'Missing amount or userPublicKey.';
  if (!ctx.confirmed) return { message: 'Confirm DAO buy?', params: { amount, stopLossPct, takeProfitPct } };
  try {
    const { getSwapQuote, buildSwapTransaction } = await import('../providers/jupiter');
    const quote = await getSwapQuote({ inputMint: usdcMint, outputMint: daoMint, amount });
    const tx = await buildSwapTransaction({ quoteResponse: quote, userPublicKey });
    return {
      message: 'DAO buy built. Please sign and send.',
      quote,
      serializedTransaction: tx.serializedTransaction,
      stopLossPct,
      takeProfitPct
    };
  } catch (e) {
    return `Failed to execute DAO strategy: ${e.message}`;
  }
};