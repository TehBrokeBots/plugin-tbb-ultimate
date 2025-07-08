import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import { ActionContext } from '../types';

/**
 * Analyzes 7-day price change, volume spikes, and trend for a token using Dexscreener data.
 * @param ctx - { chain: string, address: string }
 * @returns {Promise<{message: string, priceChange7d: number, volumeSpike: boolean, trend: string}|string>}
 */
export const marketTrends = async (ctx: ActionContext): Promise<{message: string, priceChange7d: number, volumeSpike: boolean, trend: string}|string> => {
  const { chain, address } = ctx;
  if (!chain || !address) return 'Missing chain or address.';
  try {
    const { getTokenInfo } = await import('../providers/dexscreener');
    const data = await getTokenInfo(chain, address);
    const priceChart = data?.pairs?.[0]?.priceChart ?? [];
    if (priceChart.length < 8) return 'Not enough price history for trend analysis.';
    // 7-day price change
    const priceNow = Number(priceChart[priceChart.length - 1].price);
    const price7dAgo = Number(priceChart[priceChart.length - 8].price);
    const priceChange7d = ((priceNow - price7dAgo) / price7dAgo) * 100;
    // Volume spikes (compare last 2 days to previous 5)
    const volumes = priceChart.map((p: any) => Number(p.volume));
    const avgPrev5 = volumes.slice(-7, -2).reduce((a, b) => a + b, 0) / 5;
    const last2 = volumes.slice(-2);
    const volumeSpike = last2.some(v => v > avgPrev5 * 2);
    // Trend summary
    let trend = 'sideways';
    if (priceChange7d > 10) trend = 'uptrend';
    else if (priceChange7d < -10) trend = 'downtrend';
    return {
      message: 'Market trends analyzed.',
      priceChange7d,
      volumeSpike,
      trend
    };
  } catch (e) {
    return `Failed to analyze market trends: ${e.message}`;
  }
};
