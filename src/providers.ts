import {
  type IAgentRuntime,
  type Memory,
  type Provider,
  type ProviderResult,
  type State,
} from "@elizaos/core";
import { dexscreener } from "./providers/dexscreener";
import { pumpfun } from "./providers/pumpfun";
import { solana } from "./providers/solana";
import { PublicKey } from "@solana/web3.js";

/**
 * Dexscreener Provider
 * Provides access to Dexscreener API for token and pair information
 */
export const dexscreenerProvider: Provider = {
  name: "DEXSCREENER_PROVIDER",
  description:
    "Provides access to Dexscreener API for token and pair information",

  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
  ): Promise<ProviderResult> => {
    try {
      const { chain, address, query, type } = message.content as any;

      let data: any = {};

      if (type === "token" && chain && address) {
        data = await dexscreener.getTokenInfo(chain, address);
      } else if (type === "pair" && address) {
        data = await dexscreener.getPairInfo(address);
      } else if (type === "search" && query) {
        data = await dexscreener.searchToken(query);
      }

      return {
        text: "Dexscreener data retrieved",
        values: {},
        data,
      };
    } catch (error: any) {
      return {
        text: `Error retrieving Dexscreener data: ${error.message}`,
        values: {},
        data: {},
      };
    }
  },
};

/**
 * Pump.fun Provider
 * Provides access to Pump.fun API for token creation and trading
 */
export const pumpfunProvider: Provider = {
  name: "PUMPFUN_PROVIDER",
  description: "Provides access to Pump.fun API for token creation and trading",

  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
  ): Promise<ProviderResult> => {
    try {
      const { token, action, amount, name, symbol, supply } =
        message.content as any;

      let data: any = {};

      if (token && !action) {
        // Get token data
        data = await pumpfun.getPumpFunRealTimeTokens();
      } else if (token && action && amount) {
        // Trade
        data = await pumpfun.pumpFunTrade({ tokenMint: token, action, amount });
      } else if (name && symbol && supply) {
        // Create token
        data = await pumpfun.createPumpFunToken({
          name,
          symbol,
          initialSupply: supply,
        });
      }

      return {
        text: "Pump.fun data retrieved",
        values: {},
        data,
      };
    } catch (error: any) {
      return {
        text: `Error retrieving Pump.fun data: ${error.message}`,
        values: {},
        data: {},
      };
    }
  },
};

/**
 * Solana Provider
 * Provides access to Solana RPC API for wallet balances and token information
 */
export const solanaProvider: Provider = {
  name: "SOLANA_PROVIDER",
  description:
    "Provides access to Solana RPC API for wallet balances and token information",

  get: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
  ): Promise<ProviderResult> => {
    try {
      const { walletAddress, mintAddress } = message.content as any;

      let data: any = {};

      if (walletAddress) {
        // Get wallet balances
        const solBalance = await solana.getBalance(
          new PublicKey(walletAddress),
        );
        const splTokens = await solana.getParsedTokenAccounts(
          new PublicKey(walletAddress),
        );

        data = {
          solBalance,
          splTokens,
        };
      } else if (mintAddress) {
        // Get token info
        const mintInfo = await solana.getMintInfo(mintAddress);
        const holders = await solana.getTokenHolders(mintAddress);

        data = {
          mintInfo,
          holders,
        };
      }

      return {
        text: "Solana data retrieved",
        values: {},
        data,
      };
    } catch (error: any) {
      return {
        text: `Error retrieving Solana data: ${error.message}`,
        values: {},
        data: {},
      };
    }
  },
};
