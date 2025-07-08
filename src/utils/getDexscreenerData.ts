import { ActionContext } from '../types';
import { getTokenInfo, getPairInfo, searchToken } from '../providers/dexscreener';

/**
 * Fetches token or pair data from Dexscreener.
 * @param ctx - { type: 'token'|'pair'|'search', chain?: string, address?: string, query?: string }
 * @returns {Promise<{message: string, data: any}|string>}
 */
export const getDexscreenerData = async (ctx: ActionContext): Promise<{message: string, data: any}|string> => {
  const { type, chain, address, query } = ctx;
  try {
    if (type === 'token' && chain && address) {
      const data = await getTokenInfo(chain, address);
      return { message: 'Dexscreener token data fetched.', data };
    } else if (type === 'pair' && chain && address) {
      const data = await getPairInfo(chain, address);
      return { message: 'Dexscreener pair data fetched.', data };
    } else if (type === 'search' && query) {
      const data = await searchToken(query);
      return { message: 'Dexscreener search results fetched.', data };
    } else {
      return 'Missing or invalid parameters for Dexscreener data fetch.';
    }
  } catch (e) {
    return `Failed to fetch Dexscreener data: ${e.message}`;
  }
};