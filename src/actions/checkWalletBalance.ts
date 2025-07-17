import { PluginAction } from "../types";
import { getBalance, getParsedTokenAccounts } from "../providers/solana";
import { PublicKey } from "@solana/web3.js";

interface CheckWalletBalanceParams {
  walletAddress: string;
}

interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  pubkey: string;
}

interface CheckWalletBalanceResult {
  sol: number;
  tokens: TokenBalance[];
}

/**
 * Checks the SOL and SPL token balances for a given wallet address.
 */
export const checkWalletBalanceAction: PluginAction<CheckWalletBalanceParams, CheckWalletBalanceResult> = {
  name: "CHECK_WALLET_BALANCE",
  description: "Checks the SOL and SPL token balances for a given wallet address.",
  validate: async (params: CheckWalletBalanceParams) => {
    if (!params.walletAddress) throw new Error("Wallet address is required.");
    return true;
  },
  handler: async (runtime: any, params: CheckWalletBalanceParams) => {
    const owner = new PublicKey(params.walletAddress);
    const solBalanceLamports = await getBalance(owner);
    const solBalance = solBalanceLamports / 1e9;
    const tokenAccounts = await getParsedTokenAccounts(owner);
    const balances = tokenAccounts.map(({ pubkey, account }: any) => {
      const parsed = account.data.parsed.info;
      return {
        mint: parsed.mint,
        amount: parsed.tokenAmount.uiAmount,
        decimals: parsed.tokenAmount.decimals,
        pubkey: pubkey.toBase58(),
      };
    });
    return {
      sol: solBalance,
      tokens: balances,
    };
  },
  examples: [
    {
      input: { walletAddress: "WalletAddress..." },
      output: { sol: 1.23, tokens: [{ mint: "TokenMint...", amount: 100, decimals: 6, pubkey: "Pubkey..." }] },
    },
  ],
};

export default checkWalletBalanceAction; 