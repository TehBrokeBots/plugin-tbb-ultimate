import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { safeStrategy } from '../utils/safeStrategy';
import { ActionContext } from '../types';

export const safeStrategyAction: Action = {
  name: 'SAFE_STRATEGY',
  description: 'Executes a safe trading strategy (SOL/USDC only).',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await safeStrategy(message.content as ActionContext);
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