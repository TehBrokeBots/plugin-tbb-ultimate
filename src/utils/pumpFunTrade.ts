import { tradeOnPumpFun } from '../providers/pumpfun';
import { ActionContext } from '../types';
/**
 * Executes a buy or sell trade on Pump.fun.
 * @param ctx - { token: string, action: 'buy'|'sell', amount: number, wallet: string }
 * @returns {Promise<{message: string, result: any}|string>}
 */
export const pumpFunTrade = async (ctx: ActionContext): Promise<{message: string, result: any}|string> => {
  const { token, action, amount, wallet } = ctx;
  if (!token || !action || !amount || !wallet) {
    return 'Missing token, action, amount, or wallet.';
  }
  try {
    const result = await tradeOnPumpFun({ token, action, amount, wallet });
    return {
      message: 'Pump.fun trade executed (or simulated).',
      result
    };
  } catch (e) {
    return `Failed to execute Pump.fun trade: ${e.message}`;
  }
};
