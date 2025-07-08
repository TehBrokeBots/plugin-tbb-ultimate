import { Action, composeActionExamples, HandlerCallback, Memory, State } from '@elizaos/core';
import { arbitrageStrategy } from '../utils/arbitrageStrategy';
import { ActionContext } from '../types';

export const arbitrageStrategyAction: Action = {
  name: 'ARBITRAGE_STRATEGY',
  description: 'Executes an arbitrage strategy using Jupiter and Orca.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await arbitrageStrategy(message.content as ActionContext);
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