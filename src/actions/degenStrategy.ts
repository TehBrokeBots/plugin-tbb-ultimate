import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { degenStrategy } from '../utils/degenStrategy';
import { ActionContext } from '../types';

export const degenStrategyAction: Action = {
  name: 'DEGEN_STRATEGY',
  description: 'Executes a degen trading strategy using Pump.fun.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await degenStrategy(message.content as ActionContext);
        const text = typeof result === 'string'
    ? result
    : 'message' in result
      ? result.message
      : JSON.stringify(result); // fallback

  await callback({ text });
 return ({ result })
 },
 examples: []
};
