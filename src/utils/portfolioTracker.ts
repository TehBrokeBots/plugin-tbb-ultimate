import { getSolBalance, getSplTokenAccounts } from '../providers/solana';
import { ActionContext } from '../types';

/**
 * Tracks a wallet's portfolio value in SOL and USD using on-chain balances and Dexscreener prices.
 * @param ctx - { walletAddress: string }
 * @returns {Promise<{message: string, sol: any, tokens: any[], totalValueUsd: number}|string>}
 */
export const portfolioTracker = async (ctx: ActionContext): Promise<{message: string, sol: any, tokens: any[], totalValueUsd: number}|string> => {
  const { walletAddress } = ctx;
  if (!walletAddress) return 'Missing walletAddress.';
  try {
    // Get balances
    const solBalance = await getSolBalance(walletAddress);
    const splTokens = await getSplTokenAccounts(walletAddress);
    // Get SOL price in USD
    const { getTokenInfo } = await import('../providers/dexscreener');
    const solInfo = await getTokenInfo('solana', 'So11111111111111111111111111111111111111112');
    const solPrice = Number(solInfo?.pairs?.[0]?.priceUsd ?? 0);
    // For each SPL token, get price and calculate value
    const tokens = await Promise.all(
      splTokens.map(async (acct: any) => {
        const mint = acct.account.data.parsed.info.mint;
        const amount = Number(acct.account.data.parsed.info.tokenAmount.uiAmount);
        let price = 0;
        try {
          const info = await getTokenInfo('solana', mint);
          price = Number(info?.pairs?.[0]?.priceUsd ?? 0);
        } catch {}
        return { mint, amount, price, valueUsd: amount * price };
      })
    );
    const solValue = solBalance / 1e9 * solPrice;
    const totalValue = solValue + tokens.reduce((sum, t) => sum + t.valueUsd, 0);
    return {
      message: 'Portfolio tracked successfully.',
      sol: { amount: solBalance / 1e9, price: solPrice, valueUsd: solValue },
      tokens,
      totalValueUsd: totalValue
    };
  } catch (e) {
    return `Failed to track portfolio: ${e.message}`;
  }
};

