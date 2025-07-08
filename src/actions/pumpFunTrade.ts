import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { pumpFunTrade } from '../utils/pumpFunTrade';
import { ActionContext } from '../types';

export const pumpFunTradeAction: Action = {
  name: 'PUMPFUN_TRADE',
  description: 'Executes a buy or sell trade on Pump.fun.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await pumpFunTrade(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
