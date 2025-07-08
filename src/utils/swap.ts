import { getSwapQuote, buildSwapTransaction } from '../providers/jupiter';
import { ActionContext } from '../types';

/**
 * Fetches a swap quote and builds a transaction using Jupiter API.
 * @param ctx - { inputMint: string, outputMint: string, amount: number, userPublicKey: string }
 * @returns {Promise<{message: string, quote: any, serializedTransaction: string}|string>}
 */
export const swap = async (ctx: ActionContext): Promise<{message: string, quote: any, serializedTransaction: string}|string> => {
  const { inputMint, outputMint, amount, userPublicKey } = ctx;
  if (!inputMint || !outputMint || !amount || !userPublicKey) {
    return 'Missing inputMint, outputMint, amount, or userPublicKey.';
  }
  try {
    const quote = await getSwapQuote({ inputMint, outputMint, amount });
    const tx = await buildSwapTransaction({ quoteResponse: quote, userPublicKey });
    return {
      message: 'Swap transaction built. Please confirm to sign and send.',
      quote,
      serializedTransaction: tx.serializedTransaction // base64
    };
  } catch (e: any) {
    return `Failed to build swap transaction: ${e.message}`;
  }
};
