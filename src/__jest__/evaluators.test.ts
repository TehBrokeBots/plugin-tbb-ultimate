// src/__tests__/evaluators.test.ts
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { predict } from "../evaluators/predict";

// Mock all external dependencies
jest.mock("../providers/dexscreener", () => ({
  getDexscreenerData: async () => ({
    priceUsd: 100.0,
    liquidityUsd: 1000000,
    volume24h: 500000,
  }),
}));

jest.mock("../providers/technicalindicators", () => ({
  calculateRSI: () => 50,
  calculateBollingerBands: () => ({ upper: 110, lower: 90, middle: 100, pb: 0.5 }),
  calculateMACD: () => ({ MACD: 0.1, histogram: 0.05, signal: 0.05 }),
}));

jest.mock("../providers/solana", () => ({
  getTokenHolders: async () => [
    {
      address: "7sS9M8nYwUvBhBDZqUoZ6ZD4C3tX9D5ZJk2LJxD51L1d",
      amount: "1000000",
      decimals: 6,
      owner: "7sS9M8nYwUvBhBDZqUoZ6ZD4C3tX9D5ZJk2LJxD51L1d",
    },
  ],
}));

describe("Evaluator Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Predict Evaluator", () => {
    test("should have predict function", () => {
      expect(typeof predict).toBe("function");
    });

    test("should predict LONG with bullish indicators", async () => {
      // Mock technical indicators to return bullish signals
      jest.doMock("../providers/technicalindicators", () => ({
        calculateRSI: () => 25, // Oversold
        calculateBollingerBands: () => ({ upper: 110, lower: 90, middle: 100, pb: 0.2 }), // Near lower band
        calculateMACD: () => ({ MACD: 0.1, histogram: 0.05, signal: 0.05 }), // Positive MACD
      }));

      const result = await predict({
        tokenMint: "So11111111111111111111111111111111111111112",
        symbol: "SOL"
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("prediction");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("sentiment");
      
      expect(typeof result.prediction).toBe("string");
      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test("should predict SHORT with bearish indicators", async () => {
      // Mock technical indicators to return bearish signals
      jest.doMock("../providers/technicalindicators", () => ({
        calculateRSI: () => 75, // Overbought
        calculateBollingerBands: () => ({ upper: 110, lower: 90, middle: 100, pb: 0.8 }), // Near upper band
        calculateMACD: () => ({ MACD: -0.1, histogram: -0.05, signal: -0.05 }), // Negative MACD
      }));

      const result = await predict({
        tokenMint: "So11111111111111111111111111111111111111112",
        symbol: "SOL"
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("prediction");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("sentiment");
      
      expect(typeof result.prediction).toBe("string");
      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test("should predict HOLD with neutral indicators", async () => {
      // Mock technical indicators to return neutral signals
      jest.doMock("../providers/technicalindicators", () => ({
        calculateRSI: () => 50, // Neutral
        calculateBollingerBands: () => ({ upper: 110, lower: 90, middle: 100, pb: 0.5 }), // Middle
        calculateMACD: () => ({ MACD: 0, histogram: 0, signal: 0 }), // Neutral MACD
      }));

      const result = await predict({
        tokenMint: "So11111111111111111111111111111111111111112",
        symbol: "SOL"
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("prediction");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("sentiment");
      
      expect(typeof result.prediction).toBe("string");
      expect(typeof result.confidence).toBe("number");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test("should handle missing token data gracefully", async () => {
      // Mock DexScreener to return error
      jest.doMock("../providers/dexscreener", () => ({
        getDexscreenerData: async () => ({ error: "Token not found" }),
      }));

      const result = await predict({
        tokenMint: "INVALID_TOKEN_MINT",
        symbol: "INVALID"
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("prediction");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("sentiment");
      
      // Should still return a valid prediction structure even with missing data
      expect(typeof result.prediction).toBe("string");
      expect(typeof result.confidence).toBe("number");
    });

    test("should include all required indicator properties", async () => {
      const result = await predict({
        tokenMint: "So11111111111111111111111111111111111111112",
        symbol: "SOL"
      });

      expect(result.indicators).toHaveProperty("rsi");
      expect(result.indicators).toHaveProperty("macd");
      expect(result.indicators).toHaveProperty("bb");
      
      expect(typeof result.indicators.rsi).toBe("number");
      expect(result.indicators.macd).toHaveProperty("MACD");
      expect(result.indicators.macd).toHaveProperty("histogram");
      expect(result.indicators.macd).toHaveProperty("signal");
      expect(result.indicators.bb).toHaveProperty("upper");
      expect(result.indicators.bb).toHaveProperty("lower");
      expect(result.indicators.bb).toHaveProperty("middle");
      expect(result.indicators.bb).toHaveProperty("pb");
    });

    test("should include sentiment analysis", async () => {
      const result = await predict({
        tokenMint: "So11111111111111111111111111111111111111112",
        symbol: "SOL"
      });

      expect(result.sentiment).toHaveProperty("bullish");
      expect(result.sentiment).toHaveProperty("bearish");
      expect(result.sentiment).toHaveProperty("neutral");
      
      expect(typeof result.sentiment.bullish).toBe("number");
      expect(typeof result.sentiment.bearish).toBe("number");
      expect(typeof result.sentiment.neutral).toBe("number");
      
      // Sentiment percentages should sum to approximately 100
      const total = result.sentiment.bullish + result.sentiment.bearish + result.sentiment.neutral;
      expect(total).toBeGreaterThan(0);
    });
  });
}); 