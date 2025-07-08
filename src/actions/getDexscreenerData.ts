import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { getDexscreenerData } from '../utils/getDexscreenerData';
import { ActionContext } from '../types';

export const getDexscreenerDataAction: Action = {
  name: 'GET_DEXSCREENER_DATA',
  description: 'Fetches token or pair data from Dexscreener.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await getDexscreenerData(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
