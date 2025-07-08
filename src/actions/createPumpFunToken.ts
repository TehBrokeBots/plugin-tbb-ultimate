import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { createPumpFunToken } from '../utils/createPumpFunToken';
import { ActionContext } from '../types';

export const createPumpFunTokenAction: Action = {
  name: 'CREATE_PUMPFUN_TOKEN',
  description: 'Creates a new token on Pump.fun.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await createPumpFunToken(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
