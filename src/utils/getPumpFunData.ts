import { getPumpFunRealTimeData } from '../providers/pumpfun';
import { ActionContext } from '../types';

/**
 * Fetches real-time data for a Pump.fun token.
 * @param ctx - { token: string }
 * @returns {Promise<{message: string, data: any}|string>}
 */
export const getPumpFunData = async (ctx: ActionContext): Promise<{message: string, data: any}|string> => {
  const { token } = ctx;
  if (!token) {
    return 'Missing token.';
  }
  try {
    const data = await import('../providers/pumpfun').then(m => m.getPumpFunRealTimeData(token));
    return {
      message: 'Pump.fun real-time data fetched successfully.',
      data
    };
  } catch (e) {
    return `Failed to fetch Pump.fun real-time data: ${e.message}`;
  }
};
