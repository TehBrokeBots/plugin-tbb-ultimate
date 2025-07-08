import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { daoStrategy } from '../utils/daoStrategy';
import { ActionContext } from '../types';

export const daoStrategyAction: Action = {
  name: 'DAO_STRATEGY',
  description: 'Executes a DAO strategy to buy Teh Broke Bots DAO token.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    // Ensure message.content is cast to ActionContext
    const content = message.content as ActionContext;
    const result = await daoStrategy(content);

    if (typeof result === 'string') {
      if (callback) await callback({ text: result });
      return result;
    }

    if (typeof result === 'object' && 'message' in result) {
      if (callback) await callback({ text: result.message });
      return result;
    }

    if (callback) await callback({ text: 'Unexpected result type' });
    return result;
  },
  examples: [],
};