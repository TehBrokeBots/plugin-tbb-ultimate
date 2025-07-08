import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { checkWalletBalance } from '../utils/checkWalletBalance';
import { ActionContext } from '../types';

export const checkWalletBalanceAction: Action = {
  name: 'CHECK_WALLET_BALANCE',
  description: 'Checks SOL and SPL token balances for a wallet.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    const result = await checkWalletBalance(message.content as ActionContext);
    if (callback) await callback({ text: typeof result === 'string' ? result : result.message });
    return result;
  },
  examples: [],
};
