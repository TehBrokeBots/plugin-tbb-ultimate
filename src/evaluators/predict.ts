// src/evaluators/predict.ts

import { getDexscreenerData } from "../providers/dexscreener";
import { sentimentAnalysis } from "../actions";
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from "../providers/technicalindicators";

type DexscreenerResponse =
  | { error: string }
  | {
      priceUsd: number;
      liquidityUsd: number | null;
      volume24h: number | null;
      dexId: string;
      pairAddress: string;
      priceChart: { price: string; volume: string; time: number }[];
      verified?: boolean;
      txnsH24?: number;
      ageDays?: number;
      raw: any;
    };

/**
 * Type guard to check if data is a valid Dexscreener token info response
 */
function isValidDexscreenerData(
  data: DexscreenerResponse,
): data is Exclude<DexscreenerResponse, { error: string }> {
  return (
    typeof data === "object" &&
    "priceUsd" in data &&
    typeof data.priceUsd === "number"
  );
}

export async function predict(params: { tokenMint: string; symbol: string }) {
  const { tokenMint, symbol } = params;
  if (!tokenMint) throw new Error("Token mint is required for prediction.");
  if (!symbol) throw new Error("Symbol is required for prediction.");
  try {
    const prices: number[] = [];
    for (let i = 0; i < 30; i++) {
      try {
        const data = (await getDexscreenerData({
          tokenMint,
        })) as DexscreenerResponse;
        if (isValidDexscreenerData(data)) {
          prices.push(data.priceUsd);
        }
      } catch {
        // ignore errors and skip
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (prices.length < 15) {
      return {
        prediction: "HOLD",
        confidence: 0,
        indicators: {},
        sentiment: {},
        reason: "Insufficient price data",
      };
    }

    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bb = calculateBollingerBands(prices);

    const sentiment = await sentimentAnalysis({ symbol });

    const totalSentiment =
      (sentiment.bullish ?? 50) +
      (sentiment.bearish ?? 50) +
      (sentiment.neutral ?? 1);
    const bullishRatio = (sentiment.bullish ?? 50) / totalSentiment;
    const bearishRatio = (sentiment.bearish ?? 25) / totalSentiment;

    let prediction: "LONG" | "SHORT" | "HOLD" = "HOLD";
    let confidence = 0;

    if (rsi !== null) {
      if (rsi < 30 && bullishRatio > 0.5) {
        prediction = "LONG";
        confidence = ((30 - rsi) / 30) * bullishRatio;
      } else if (rsi > 70 && bearishRatio > 0.5) {
        prediction = "SHORT";
        confidence = ((rsi - 70) / 30) * bearishRatio;
      }
    }

    if (confidence === 0) {
      confidence = 0.3;
    }

    return {
      prediction,
      confidence,
      indicators: { rsi, macd, bb },
      sentiment,
    };
  } catch (e) {
    throw new Error(`Failed to execute prediction: ${(e as Error).message}`);
  }
}
