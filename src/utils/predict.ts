import { ActionContext } from '../types'

/**
 * Combines technical analysis, market trends, and sentiment to predict a token's outlook.
 * @param ctx - { chain: string, address: string, symbol: string, period?: number }
 * @returns {Promise<{message: string, prediction: string, details: any}|string>}
 */
export const predict = async (ctx: ActionContext): Promise<{message: string, prediction: string, details: any}|string> => {
  const { chain, address, symbol, period = 14 } = ctx;
  if (!chain || !address || !symbol) return 'Missing chain, address, or symbol.';
  try {
    // Fetch all analyses in parallel
    const [ta, trends, sentiment] = await Promise.all([
      ctx.plugins["tbb-ultimate"].technicalAnalysis({ chain, address, period }),
      ctx.plugins["tbb-ultimate"].marketTrends({ chain, address }),
      ctx.plugins["tbb-ultimate"].sentimentAnalysis({ query: symbol })
    ]);
    // Simple prediction logic
    let score = 0;
    // Technicals
    if (ta.rsi && ta.rsi[ta.rsi.length - 1] > 60) score++;
    if (ta.rsi && ta.rsi[ta.rsi.length - 1] < 40) score--;
    if (trends.trend === 'uptrend') score++;
    if (trends.trend === 'downtrend') score--;
    if (sentiment.summary === 'positive') score++;
    if (sentiment.summary === 'negative') score--;
    let prediction = 'neutral';
    if (score > 1) prediction = 'bullish';
    else if (score < -1) prediction = 'bearish';
    return {
      message: 'Prediction complete.',
      prediction,
      details: {
        technicals: ta,
        trends,
        sentiment
      }
    };
  } catch (e) {
    return `Failed to make prediction: ${e.message}`;
  }
};
