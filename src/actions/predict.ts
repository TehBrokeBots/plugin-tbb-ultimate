import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { predict } from '../utils/predict';
import { ActionContext } from '../types';

export const predictAction: Action = {
  name: 'PREDICT',
  description: 'Predicts a token outlook using analytics.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await predict(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
