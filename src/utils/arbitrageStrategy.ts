import {ActionContext} from '../types';

/**
 * Executes an arbitrage strategy by comparing Jupiter and Orca quotes, building a transaction for the best route.
 * @param ctx - { inputMint: string, outputMint: string, amount: number, userPublicKey: string, stopLossPct?: number, takeProfitPct?: number, confirmed?: boolean }
 * @returns {Promise<{message: string, quote: any, serializedTransaction: string|null, stopLossPct?: number, takeProfitPct?: number}|string|object>}
 */
export const arbitrageStrategy = async (ctx: ActionContext): Promise<{message: string, quote: any, serializedTransaction: string|null, stopLossPct?: number, takeProfitPct?: number}|string|object> => {
  const { inputMint, outputMint, amount, userPublicKey, stopLossPct, takeProfitPct } = ctx;
  if (!inputMint || !outputMint || !amount || !userPublicKey) return 'Missing inputMint, outputMint, amount, or userPublicKey.';
  // Confirm with user
  if (!ctx.confirmed) return { message: 'Confirm arbitrage trade?', params: { inputMint, outputMint, amount, stopLossPct, takeProfitPct } };
  try {
    const { getSwapQuote, buildSwapTransaction } = await import('../providers/jupiter');
    const { getOrcaQuote } = await import('../providers/orca');
    // Fetch quotes from both Jupiter and Orca
    const [jupQuote, orcaQuote] = await Promise.all([
      getSwapQuote({ inputMint, outputMint, amount }),
      getOrcaQuote({ inputMint, outputMint, amount })
    ]);
    // Compare output amounts
    const jupOut = Number(jupQuote.outAmount || 0);
    const orcaOut = Number(orcaQuote.outAmount || 0);
    let best = 'jupiter';
    if (orcaOut > jupOut) best = 'orca';
    // Build transaction for the best route
    let tx, quote;
    if (best === 'jupiter') {
      tx = await buildSwapTransaction({ quoteResponse: jupQuote, userPublicKey });
      quote = jupQuote;
    } else {
      // For Orca, just return the quote for now (building tx requires wallet integration)
      quote = orcaQuote;
      tx = { serializedTransaction: null };
    }
    return {
      message: `Arbitrage trade built using ${best}. Please sign and send if supported.`,
      quote,
      serializedTransaction: tx.serializedTransaction,
      stopLossPct,
      takeProfitPct
    };
  } catch (e) {
    return `Failed to execute arbitrage strategy: ${e.message}`;
  }
};

