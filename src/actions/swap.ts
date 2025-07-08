import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { swap } from '../utils/swap';
import { ActionContext } from '../types';

export const swapAction: Action = {
  name: 'SWAP',
  description: 'Performs a token swap using Jupiter.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await swap(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
