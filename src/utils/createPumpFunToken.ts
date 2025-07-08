import { tradeOnPumpFun, createPumpFunToken as createPumpFunTokenUtil } from '../providers/pumpfun';
import { ActionContext } from '../types';

/**
 * Creates a new token on Pump.fun.
 * @param ctx - { name: string, symbol: string, supply: number, wallet: string }
 * @returns {Promise<{message: string, result: any}|string>}
 */
export const createPumpFunToken = async (ctx: ActionContext): Promise<{message: string, result: any}|string> => {
  const { name, symbol, supply, wallet } = ctx;
  if (!name || !symbol || !supply || !wallet) {
    return 'Missing name, symbol, supply, or wallet.';
  }
  try {
    const result = await createPumpFunTokenUtil({ name, symbol, supply, wallet });
    return {
      message: 'Pump.fun token creation executed (or simulated).',
      result
    };
  } catch (e) {
    return `Failed to create Pump.fun token: ${e.message}`;
  }
};
