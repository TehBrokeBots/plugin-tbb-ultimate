import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { scamCheck } from '../utils/scamCheck';
import { ActionContext } from '../types';

export const scamCheckAction: Action = {
  name: 'SCAM_CHECK',
  description: 'Checks a token for scam indicators.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await scamCheck(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
