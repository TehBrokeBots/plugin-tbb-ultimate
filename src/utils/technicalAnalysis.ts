// Technical Analysis Utility Functions
// RSI, Moving Averages, Bollinger Bands, DexScreener fetcher

export async function fetchPriceHistory(pairNetwork: string, pairAddress: string): Promise<number[]> {
  const url = `https://api.dexscreener.com/latest/dex/pairs/${pairNetwork}/${pairAddress}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch price data: ${resp.status}`);
  const data = await resp.json();
  if (!data.pair || !Array.isArray(data.pair.priceChart)) throw new Error(`Pair data invalid or missing priceChart`);
  // Get close prices from priceChart (most recent last)
  return data.pair.priceChart.map((candle: any) => parseFloat(candle.priceUsd));
}

export function simpleMovingAverage(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i <= prices.length - period; i++) {
    const sum = prices.slice(i, i + period).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function exponentialMovingAverage(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  let prevEma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(prevEma);
  for (let i = period; i < prices.length; i++) {
    const price = prices[i];
    prevEma = price * k + prevEma * (1 - k);
    ema.push(prevEma);
  }
  return ema;
}

export function rsi(prices: number[], period: number): number[] {
  const rsis: number[] = [];
  for (let i = period; i < prices.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = prices[j] - prices[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsis.push(100 - 100 / (1 + rs));
  }
  return rsis;
}

export function bollingerBands(prices: number[], period: number, numStdDev = 2) {
  const sma = simpleMovingAverage(prices, period);
  const bands = [];
  for (let i = 0; i < sma.length; i++) {
    const window = prices.slice(i, i + period);
    const mean = sma[i];
    const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    bands.push({
      middle: mean,
      upper: mean + numStdDev * stdDev,
      lower: mean - numStdDev * stdDev
    });
  }
  return bands;
}