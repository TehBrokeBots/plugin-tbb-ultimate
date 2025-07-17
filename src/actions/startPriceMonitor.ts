import { PluginAction } from "../types";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "../providers/technicalindicators";
import { getTokenInfo } from "../providers/dexscreener";

interface StartPriceMonitorParams {
  tokenMint: string;
  intervalSec: number;
  onTick?: (data: any) => void;
}

interface StartPriceMonitorResult {
  started: boolean;
  message: string;
}

let monitorInterval: ReturnType<typeof setTimeout> | null = null;
let priceHistory: number[] = [];

/**
 * Starts monitoring the price of a token at a given interval using real Dexscreener data.
 */
export const startPriceMonitorAction: PluginAction<StartPriceMonitorParams, StartPriceMonitorResult> = {
  name: "START_PRICE_MONITOR",
  description: "Starts monitoring the price of a token at a given interval using real Dexscreener data.",
  validate: async (params: StartPriceMonitorParams) => {
    if (!params.tokenMint) throw new Error("Token mint is required for price monitoring.");
    if (typeof params.intervalSec !== 'number' || params.intervalSec <= 0) throw new Error("Interval must be a positive number.");
    return true;
  },
  handler: async (runtime: any, params: StartPriceMonitorParams) => {
    if (monitorInterval) clearInterval(monitorInterval);
    priceHistory = [];
    const fetchAndTick = async () => {
      try {
        const info = await getTokenInfo("solana", params.tokenMint);
        if ("error" in info) throw new Error(info.error);
        const pair = info.pairs[0];
        const priceChart = pair.priceChart || [];
        // Use the last 100 prices from priceChart if available
        priceHistory = priceChart.map((p: any) => Number(p.price)).slice(-100);
        const price = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : parseFloat(pair.priceUsd);
        if (!isFinite(price)) throw new Error("Invalid price data");
        const rsi = calculateRSI(priceHistory);
        const macd = calculateMACD(priceHistory);
        const bb = calculateBollingerBands(priceHistory);
        const quickSignal =
          rsi !== null ? (rsi < 30 ? "BUY" : rsi > 70 ? "SELL" : "HOLD") : "HOLD";
        if (params.onTick) params.onTick({ price, rsi, macd, bb, quickSignal });
      } catch (e) {
        // Optionally log error
      }
    };
    await fetchAndTick();
    monitorInterval = setInterval(fetchAndTick, params.intervalSec * 1000);
    return { started: true, message: "Price monitor started." };
  },
  examples: [
    {
      input: { tokenMint: "TokenMint...", intervalSec: 60 },
      output: { started: true, message: "Price monitor started." },
    },
  ],
};

export default startPriceMonitorAction; 