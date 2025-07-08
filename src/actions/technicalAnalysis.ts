import { Action, HandlerCallback, Memory, State } from '@elizaos/core';
import {
  fetchPriceHistory,
  simpleMovingAverage,
  exponentialMovingAverage,
  rsi,
  bollingerBands
} from '../utils/technicalAnalysis';

// The input Memory.content should be an object like:
// { pairNetwork: "ethereum", pairAddress: "0x...", rsiPeriod: 14, maPeriod: 20, bbPeriod: 20 }
// Only pairNetwork and pairAddress are required, others have defaults.

export const technicalAnalysisAction: Action = {
  name: 'TECHNICAL_ANALYSIS',
  description: 'Performs technical analysis (RSI, Bollinger Bands, MA) on a specified crypto chart from a contract address using DexScreener data.',
  validate: async () => true,
  handler: async (_runtime, message: Memory, _state: State, _options: any, callback?: HandlerCallback) => {
    try {
      const {
        pairNetwork,
        pairAddress,
        rsiPeriod = 14,
        maPeriod = 20,
        emaPeriod = 20,
        bbPeriod = 20,
        bbStdDev = 2
      } = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;

      if (!pairNetwork || !pairAddress) throw new Error('pairNetwork and pairAddress are required.');

      // 1. Fetch historical prices from DexScreener
      const prices = await fetchPriceHistory(pairNetwork, pairAddress);
      if (prices.length < Math.max(rsiPeriod, maPeriod, emaPeriod, bbPeriod)) {
        throw new Error('Not enough data to compute requested indicators.');
      }

      // 2. Calculate indicators (get most recent values)
      const rsis = rsi(prices, rsiPeriod);
      const smas = simpleMovingAverage(prices, maPeriod);
      const emas = exponentialMovingAverage(prices, emaPeriod);
      const bbs = bollingerBands(prices, bbPeriod, bbStdDev);

      const result = {
        rsi: rsis[rsis.length - 1],
        sma: smas[smas.length - 1],
        ema: emas[emas.length - 1],
        bollinger: bbs[bbs.length - 1]
      };

      if (callback) await callback({ text: JSON.stringify(result, null, 2) });
      return result;
    } catch (err: any) {
      const errorMsg = `Technical analysis error: ${err.message || err}`;
      if (callback) await callback({ text: errorMsg });
      return { error: errorMsg };
    }
  }
};
