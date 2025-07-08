import { getSolBalance, getSplTokenAccounts } from '../providers/solana';
import { ActionContext } from '../types';
/**
 * Fetches SOL and SPL token balances for a given wallet address.
 * @param ctx - { walletAddress: string }
 * @returns {Promise<{message: string, solBalance: number, splTokens: any[]}|string>}
 */
export const checkWalletBalance = async (ctx: ActionContext): Promise<{message: string, solBalance: number, splTokens: any[]}|string> => {
  const { walletAddress } = ctx;
  if (!walletAddress) {
    return 'Missing walletAddress.';
  }
  try {
    const solBalance = await getSolBalance(walletAddress);
    const splTokens = await getSplTokenAccounts(walletAddress);
    return {
      message: 'Wallet balances fetched successfully.',
      solBalance, // in lamports
      splTokens // array of token accounts
    };
  } catch (e) {
    return `Failed to fetch wallet balances: ${e.message}`;
  }
};
