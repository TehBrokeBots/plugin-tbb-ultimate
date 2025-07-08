import { simpleMovingAverage, exponentialMovingAverage, rsi, bollingerBands } from './ta';

describe('Technical Analysis Utilities', () => {
  const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('calculates simple moving average', () => {
    const sma = simpleMovingAverage(prices, 3);
    expect(Array.isArray(sma)).toBe(true);
  });

  it('calculates exponential moving average', () => {
    const ema = exponentialMovingAverage(prices, 3);
    expect(Array.isArray(ema)).toBe(true);
  });

  it('calculates RSI', () => {
    const result = rsi(prices, 3);
    expect(Array.isArray(result)).toBe(true);
  });

  it('calculates Bollinger Bands', () => {
    const result = bollingerBands(prices, 3);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('upper');
    expect(result[0]).toHaveProperty('middle');
    expect(result[0]).toHaveProperty('lower');
  });
});
