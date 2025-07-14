import * as ti from "technicalindicators";

/** Interface representing a MACD calculation result */
export interface MACDResult {
  MACD: number;
  signal: number;
  histogram: number;
}

/** Calculates RSI indicator */
export function calculateRSI(prices: number[]): number | null {
  if (prices.length < 15) return null;
  const rsi = ti.RSI.calculate({ values: prices, period: 14 });
  return rsi.length ? rsi[rsi.length - 1] : null;
}

/** Calculates MACD indicator */
export function calculateMACD(prices: number[]): MACDResult | null {
  if (prices.length < 26) return null;
  const macdArray = ti.MACD.calculate({
    values: prices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  if (!macdArray.length) return null;

  const last = macdArray[macdArray.length - 1];
  if (
    last.MACD === undefined ||
    last.signal === undefined ||
    last.histogram === undefined
  ) {
    return null;
  }
  return last as MACDResult;
}

/** Calculates Bollinger Bands indicator */
export function calculateBollingerBands(prices: number[]) {
  if (prices.length < 20) return null;
  const bb = ti.BollingerBands.calculate({
    period: 20,
    values: prices,
    stdDev: 2,
  });
  return bb.length ? bb[bb.length - 1] : null;
}
