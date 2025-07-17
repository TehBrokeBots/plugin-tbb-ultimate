import { PluginAction } from "../types";
import { getTokenInfo } from "../providers/dexscreener";

interface MarketTrendsParams {
  chain: string;
  address: string;
}

interface MarketTrendsResult {
  message: string;
  priceChange7d: number;
  volumeSpike: boolean;
  trend: string;
}

function isDexscreenerData(data: any): data is { pairs: Array<any> } {
  return data && Array.isArray(data.pairs);
}

/**
 * Analyzes market trends for a given token address and chain.
 */
export const marketTrendsAction: PluginAction<MarketTrendsParams, MarketTrendsResult> = {
  name: "MARKET_TRENDS",
  description: "Analyzes market trends for a given token address and chain.",
  validate: async (params: MarketTrendsParams) => {
    if (!params.chain || !params.address) throw new Error("Missing chain or address.");
    return true;
  },
  handler: async (runtime: any, ctx: MarketTrendsParams) => {
    const data = await getTokenInfo(ctx.chain, ctx.address);
    if (!isDexscreenerData(data)) {
      throw new Error(`Failed to get token info: ${data.error ?? "unknown error"}`);
    }
    const priceChart = data.pairs[0]?.priceChart ?? [];
    if (priceChart.length < 8)
      throw new Error("Not enough price history for trend analysis.");
    const priceNow = Number(priceChart[priceChart.length - 1].price);
    const price7dAgo = Number(priceChart[priceChart.length - 8].price);
    const priceChange7d = ((priceNow - price7dAgo) / price7dAgo) * 100;
    const volumes = priceChart.map((p: any) => Number(p.volume));
    const avgPrev5 = volumes.slice(-7, -2).reduce((a, b) => a + b, 0) / 5;
    const last2 = volumes.slice(-2);
    const volumeSpike = last2.some((v) => v > avgPrev5 * 2);
    let trend = "sideways";
    if (priceChange7d > 10) trend = "uptrend";
    else if (priceChange7d < -10) trend = "downtrend";
    return {
      message: "Market trends analyzed.",
      priceChange7d,
      volumeSpike,
      trend,
    };
  },
  examples: [
    {
      input: { chain: "solana", address: "TokenAddress..." },
      output: { message: "Market trends analyzed.", priceChange7d: 12, volumeSpike: false, trend: "uptrend" },
    },
  ],
};

export default marketTrendsAction; 