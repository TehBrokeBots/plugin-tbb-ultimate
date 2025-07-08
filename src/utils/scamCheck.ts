import { getMintInfo, getTokenHolders } from '../providers/solana';
import { ActionContext } from '../types'
/**
 * Checks a token for scam indicators using Dexscreener, on-chain data, and Twitter sentiment.
 * @param ctx - { chain: string, address: string, symbol: string }
 * @returns {Promise<{message: string, risk: string, reasons: string[], scamMentions: number}|string>}
 */
export const scamCheck = async (ctx: ActionContext): Promise<{message: string, risk: string, reasons: string[], scamMentions: number}|string> => {
  const { chain, address, symbol } = ctx;
  if (!chain || !address) return 'Missing chain or address.';
  try {
    // Dexscreener check
    const { getTokenInfo } = await import('../providers/dexscreener');
    const data = await getTokenInfo(chain, address);
    const pair = data?.pairs?.[0];
    let risk = 'unknown';
    let reasons: string[] = [];
    if (pair) {
      if (pair.verified === false) {
        risk = 'high';
        reasons.push('Token is not verified on Dexscreener.');
      }
      if (pair.liquidity?.usd < 1000) {
        risk = 'high';
        reasons.push('Low liquidity.');
      }
      if (pair.txns?.h24 < 10) {
        risk = 'medium';
        reasons.push('Low trading activity.');
      }
      if (pair.ageDays && pair.ageDays < 3) {
        risk = 'medium';
        reasons.push('Token is very new.');
      }
    }
    // Mint authority check
    let mintInfo, holders;
    try {
      mintInfo = await getMintInfo(address);
      if (mintInfo.mintAuthority && mintInfo.mintAuthority !== null && mintInfo.mintAuthority !== '' && mintInfo.mintAuthority !== '11111111111111111111111111111111') {
        risk = 'high';
        reasons.push('Mint authority is not renounced (hidden mint authority risk).');
      }
      holders = await getTokenHolders(address);
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
    if (symbol && ctx.plugins && ctx.plugins["elizaos/plugin-twitter"]) {
      const tweets = await ctx.plugins["elizaos/plugin-twitter"].searchTweets({ q: symbol + ' scam', count: 20 });
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
      // Add more known locker addresses here
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
  } catch (e) {
    return `Failed to perform scam check: ${e.message}`;
  }
};
