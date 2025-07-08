import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { getPumpFunData } from '../utils/getPumpFunData';
import { ActionContext } from '../types';
export const getPumpFunDataAction: Action = {
  name: 'GET_PUMPFUN_DATA',
  description: 'Fetches real-time data for a Pump.fun token.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await getPumpFunData(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
