import { PluginAction } from "../types";
import axios from "axios";

interface SentimentAnalysisParams {
  symbol: string;
}

interface SentimentAnalysisResult {
  bullish: number;
  bearish: number;
  neutral: number;
  error?: string;
}

/**
 * Performs sentiment analysis for a given symbol using the Twitter plugin API.
 */
export const sentimentAnalysisAction: PluginAction<SentimentAnalysisParams, SentimentAnalysisResult> = {
  name: "SENTIMENT_ANALYSIS",
  description: "Performs sentiment analysis for a given symbol using the Twitter plugin API.",
  validate: async (params: SentimentAnalysisParams) => {
    if (!params.symbol) throw new Error("Symbol is required for sentiment analysis.");
    return true;
  },
  handler: async (runtime: any, params: SentimentAnalysisParams) => {
    try {
      const resp = await axios.get(
        `http://localhost:3000/plugin-twitter/sentiment?symbol=${params.symbol}`,
      );
      return resp.data;
    } catch (e) {
      return { bullish: 50, bearish: 25, neutral: 25, error: `Sentiment analysis failed: ${(e as Error).message}` };
    }
  },
  examples: [
    {
      input: { symbol: "SOL" },
      output: { bullish: 60, bearish: 20, neutral: 20 },
    },
  ],
};

export default sentimentAnalysisAction; 