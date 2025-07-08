import { ActionContext } from '../types';

/**
 * Executes a degen trading strategy using Pump.fun with stop loss/take profit and user confirmation.
 * @param ctx - { token: string, action: 'buy'|'sell', amount: number, wallet: string, stopLossPct?: number, takeProfitPct?: number, confirmed?: boolean }
 * @returns {Promise<{message: string, result: any, stopLossPct?: number, takeProfitPct?: number}|string|object>}
 */
export const degenStrategy = async (ctx: ActionContext): Promise<{message: string, result: any, stopLossPct?: number, takeProfitPct?: number}|string|object> => {
  const { token, action, amount, wallet, stopLossPct, takeProfitPct } = ctx;
  if (!token || !action || !amount || !wallet) return 'Missing token, action, amount, or wallet.';
  // Confirm with user
  if (!ctx.confirmed) return { message: 'Confirm degen trade?', params: { token, action, amount, stopLossPct, takeProfitPct } };
  try {
    const result = await ctx.plugins["tbb-ultimate"].pumpFunTrade({ token, action, amount, wallet });
    return {
      message: 'Degen trade executed.',
      result,
      stopLossPct,
      takeProfitPct
    };
  } catch (e) {
    return `Failed to execute degen strategy: ${e.message}`;
  }
};