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
 * @param data The response data to validate
 * @returns True if the data contains valid price information
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

/**
 * AI-powered trading prediction evaluator combining technical indicators and sentiment analysis.
 * 
 * This evaluator implements a comprehensive prediction system that:
 * - Collects historical price data from Dexscreener over 30 data points
 * - Calculates technical indicators (RSI, MACD, Bollinger Bands)
 * - Analyzes social sentiment using Twitter data
 * - Combines technical and sentiment signals for prediction
 * - Returns trading recommendations (LONG, SHORT, HOLD) with confidence scores
 * - Provides detailed indicator and sentiment breakdowns
 * 
 * @param params Object containing prediction parameters
 * @param params.tokenMint The token mint address for analysis
 * @param params.symbol The token symbol for sentiment analysis
 * @returns Promise<object> Prediction result with recommendation, confidence, and analysis data
 * @throws Error if validation fails or prediction execution fails
 * 
 * @example
 * ```typescript
 * const prediction = await predict({
 *   tokenMint: "So11111111111111111111111111111111111111112",
 *   symbol: "SOL"
 * });
 * 
 * console.log(`Prediction: ${prediction.prediction}`);
 * console.log(`Confidence: ${prediction.confidence}`);
 * console.log(`RSI: ${prediction.indicators.rsi}`);
 * ```
 * 
 * @note The prediction algorithm requires at least 15 price data points for reliable analysis.
 */
export async function predict(params: { tokenMint: string; symbol: string }) {
  const { tokenMint, symbol } = params;
  
  // Input validation
  if (!tokenMint) throw new Error("Token mint is required for prediction.");
  if (!symbol) throw new Error("Symbol is required for prediction.");
  
  try {
    // Step 1: Collect historical price data
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
        // Ignore individual data point errors and continue
      }
      
      // Rate limiting to avoid API throttling
      await new Promise((r) => setTimeout(r, 300));
    }

    // Step 2: Check if we have sufficient data for analysis
    if (prices.length < 15) {
      return {
        prediction: "HOLD",
        confidence: 0,
        indicators: {},
        sentiment: {},
        reason: "Insufficient price data",
      };
    }

    // Step 3: Calculate technical indicators
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bb = calculateBollingerBands(prices);

    // Step 4: Analyze social sentiment
    const sentiment = await sentimentAnalysis({ symbol });

    // Step 5: Calculate sentiment ratios
    const totalSentiment =
      (sentiment.bullish ?? 50) +
      (sentiment.bearish ?? 50) +
      (sentiment.neutral ?? 1);
    const bullishRatio = (sentiment.bullish ?? 50) / totalSentiment;
    const bearishRatio = (sentiment.bearish ?? 25) / totalSentiment;

    // Step 6: Generate prediction based on technical and sentiment signals
    let prediction: "LONG" | "SHORT" | "HOLD" = "HOLD";
    let confidence = 0;

    if (rsi !== null) {
      // RSI oversold condition with bullish sentiment
      if (rsi < 30 && bullishRatio > 0.5) {
        prediction = "LONG";
        confidence = ((30 - rsi) / 30) * bullishRatio;
      } 
      // RSI overbought condition with bearish sentiment
      else if (rsi > 70 && bearishRatio > 0.5) {
        prediction = "SHORT";
        confidence = ((rsi - 70) / 30) * bearishRatio;
      }
    }

    // Set minimum confidence if no strong signals detected
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
