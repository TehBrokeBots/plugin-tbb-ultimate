import { getMintInfo, getTokenHolders } from '../providers/solana';
import type { Provider, IAgentRuntime, Memory, ProviderResult } from '@elizaos/core';
import { getTokenInfo } from '../providers/dexscreener';
import type { ActionContext } from '../actions';
import { logger } from '@elizaos/core';

// Type guard for DexscreenerData
function isDexscreenerData(data: any): data is { pairs: Array<any> } {
  return data && Array.isArray(data.pairs);
}

/**
 * Checks a token for scam indicators using Dexscreener, on-chain data, and Twitter sentiment.
 */
export async function checkScam(params: { tokenMint: string; symbol?: string; plugins?: Record<string, any> }) {
  const { tokenMint, symbol, plugins } = params;
  if (!tokenMint) throw new Error("Token mint is required for scam check.");
  try {
    // Dexscreener check
    const data = await getTokenInfo('solana', tokenMint);
    if (!isDexscreenerData(data)) {
      return `Failed to get token info: ${data.error ?? "unknown error"}`;
    }
    const pair = data.pairs[0];
    let risk = 'unknown';
    let reasons: string[] = [];
    if (pair) {
      if (pair.verified === false) {
        risk = 'high';
        reasons.push('Token is not verified on Dexscreener.');
      }
      if ((pair.liquidity?.usd ?? 0) < 1000) {
        risk = 'high';
        reasons.push('Low liquidity.');
      }
      if ((pair.txns?.h24 ?? 0) < 10) {
        risk = risk === 'high' ? risk : 'medium';
        reasons.push('Low trading activity.');
      }
      if ((pair.ageDays ?? 9999) < 3) {
        risk = risk === 'high' ? risk : 'medium';
        reasons.push('Token is very new.');
      }
    }
    // Mint authority check
    let mintInfo, holders;
    try {
      mintInfo = await getMintInfo(tokenMint);
      if (mintInfo.mintAuthority && mintInfo.mintAuthority !== null && mintInfo.mintAuthority !== '' && mintInfo.mintAuthority !== '11111111111111111111111111111111') {
        risk = 'high';
        reasons.push('Mint authority is not renounced (hidden mint authority risk).');
      }
      holders = await getTokenHolders(tokenMint);
      if (holders && holders.length > 0 && mintInfo.supply) {
        const supply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals || 0);
        const largest = holders[0];
        const largestPct = (Number(largest.amount) / supply) * 100;
        if (largestPct > 30) {
          risk = 'high';
          reasons.push('A single wallet holds more than 30% of supply (big red flag).');
        } else if (largestPct > 10) {
          risk = 'medium';
          reasons.push('A single wallet holds more than 10% of supply.');
        }
      }
    } catch {}
    // Twitter scam sentiment
    let scamMentions = 0;
    if (symbol && plugins && plugins["elizaos/plugin-twitter"]) {
      const tweets = await plugins["elizaos/plugin-twitter"].searchTweets({ q: symbol + ' scam', count: 20 });
      scamMentions = tweets.filter((t: any) => /scam|rug|fraud|hack/i.test(t.text)).length;
      if (scamMentions > 2) {
        risk = 'high';
        reasons.push('Multiple scam-related mentions on Twitter.');
      }
    }
    // Locked liquidity (very basic: check if largest holder is a known locker or burn address)
    const lockers = [
      '11111111111111111111111111111111', // Burn
      '4ckmDgGz5qQh6vny1tRQAMf6Tx5Rk8QeYv1GZ6tMCp7y', // Solana Locker (example)
    ];
    if (holders && holders.length > 0) {
      const largest = holders[0];
      if (lockers.includes(largest.address)) {
        reasons.push('Liquidity appears to be locked.');
      } else {
        reasons.push('Liquidity may not be locked.');
      }
    }
    if (risk === 'unknown') risk = 'low';
    return {
      message: 'Scam check completed.',
      risk,
      reasons,
      scamMentions
    };
  } catch (e: any) {
    throw new Error(`Failed to perform scam check: ${(e as Error).message}`);
  }
}

export const scamCheckProvider: Provider = {
  name: 'SCAM_CHECK_PROVIDER',
  description: 'Checks Solana tokens for scam/rug risk using on-chain and off-chain data.',
  async get(runtime: IAgentRuntime, message: Memory): Promise<ProviderResult> {
    const content = message.content as any;
    try {
      const result = await checkScam({
        tokenMint: content.tokenMint,
        symbol: content.symbol,
        plugins: runtime.plugins,
      });
      if (typeof result === 'string') {
        return { text: result, values: {}, data: {} };
      }
      return {
        text: result.message,
        values: { risk: result.risk },
        data: result,
      };
    } catch (error) {
      logger.error("Error in scamCheckProvider.get:", error);
      throw error;
    }
  },
}; 