import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { marketTrends } from '../utils/marketTrends.ts';
import { ActionContext } from '../types.ts';
export const marketTrendsAction: Action = {
  name: 'MARKET_TRENDS',
  description: 'Analyzes 7-day price change, volume spikes, and trend.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await marketTrends(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
