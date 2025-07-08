import { ActionContext } from '../types'
/**
 * Executes a safe trading strategy (SOL/USDC only) using Jupiter with stop loss/take profit and user confirmation.
 * @param ctx - { inputMint: string, outputMint: string, amount: number, userPublicKey: string, stopLossPct?: number, takeProfitPct?: number, confirmed?: boolean }
 * @returns {Promise<{message: string, quote: any, serializedTransaction: string, stopLossPct?: number, takeProfitPct?: number}|string|object>}
 */
export const safeStrategy = async (ctx: ActionContext): Promise<{message: string, quote: any, serializedTransaction: string, stopLossPct?: number, takeProfitPct?: number}|string|object> => {
  const { inputMint, outputMint, amount, userPublicKey, stopLossPct, takeProfitPct } = ctx;
  if (!inputMint || !outputMint || !amount || !userPublicKey) return 'Missing inputMint, outputMint, amount, or userPublicKey.';
  // Only allow SOL/USDC
  const allowed = [
    'So11111111111111111111111111111111111111112', // SOL
    'Es9vMFrzaCERZ6t5gFRCJpJkFGr2PdtbWg5F7xr5Pehk' // USDC
  ];
  if (!allowed.includes(inputMint) || !allowed.includes(outputMint)) return 'Safe strategy only allows SOL/USDC.';
  if (!ctx.confirmed) return { message: 'Confirm safe trade?', params: { inputMint, outputMint, amount, stopLossPct, takeProfitPct } };
  try {
    const { getSwapQuote, buildSwapTransaction } = await import('../providers/jupiter');
    const quote = await getSwapQuote({ inputMint, outputMint, amount });
    const tx = await buildSwapTransaction({ quoteResponse: quote, userPublicKey });
    return {
      message: 'Safe trade built. Please sign and send.',
      quote,
      serializedTransaction: tx.serializedTransaction,
      stopLossPct,
      takeProfitPct
    };
  } catch (e) {
    return `Failed to execute safe strategy: ${e.message}`;
  }
};
