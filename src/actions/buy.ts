import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { buy } from '../utils/buy';
import { ActionContext } from '../types';

export const buyAction: Action = {
  name: 'BUY',
  description: 'Performs a buy using Jupiter.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await buy(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
