import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { sell } from '../utils/sell';
import { ActionContext } from '../types';

export const sellAction: Action = {
  name: 'SELL',
  description: 'Performs a sell using Jupiter.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await sell(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
