import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { portfolioTracker } from '../utils/portfolioTracker';

/**
 * Portfolio Tracker Action for Solana
 * Requires { walletAddress } in Memory.content (object or JSON string)
 */
export const portfolioTrackerAction: Action = {
  name: 'PORTFOLIO_TRACKER',
  description: 'Tracks a Solana wallet’s SOL and SPL token balances and their total value in USD using on-chain data and DexScreener.',
  validate: async () => true,
  handler: async (_runtime, memory: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    try {
      // Accept both JSON string and object for user convenience
      const ctx = typeof memory.content === 'string'
        ? JSON.parse(memory.content)
        : memory.content;

      const result = await portfolioTracker(ctx);

      if (typeof result === 'string') {
        if (callback) await callback({ text: result });
        return { error: result };
      }

      // Format summary for user
      const msg = [
        `SOL: ${result.sol.amount} × $${result.sol.price.toFixed(2)} = $${result.sol.valueUsd.toFixed(2)}`,
        ...result.tokens.map(
          t => `${t.mint}: ${t.amount}${t.price ? ` × $${t.price.toFixed(2)} = $${t.valueUsd.toFixed(2)}` : ''}`
        ),
        `Total value (USD): $${result.totalValueUsd.toFixed(2)}`
      ].join('\n');

      if (callback) await callback({ text: msg });
      return result;
    } catch (e: any) {
      const errorMsg = `Portfolio error: ${e.message || e}`;
      if (callback) await callback({ text: errorMsg });
      return { error: errorMsg };
    }
  },
}
