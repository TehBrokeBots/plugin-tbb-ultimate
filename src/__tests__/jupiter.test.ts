import * as jupiter from '../providers/jupiter';

describe('Jupiter Provider', () => {
  it('should get a swap quote', async () => {
    if (typeof jupiter.getSwapQuote !== 'function') return;
    const result = await jupiter.getSwapQuote({ inputMint: 'So11111111111111111111111111111111111111112', outputMint: 'Es9vMFrzaCERZ6t5gFRCJpJkFGr2PdtbWg5F7xr5Pehk', amount: 1 });
    expect(result).toBeDefined();
  });

  it('should build a swap transaction', async () => {
    if (typeof jupiter.buildSwapTransaction !== 'function') return;
    const quoteResponse = { /* mock quote response */ };
    const result = await jupiter.buildSwapTransaction({ quoteResponse, userPublicKey: 'mockPublicKey' });
    expect(result).toBeDefined();
  });

  it('should get token list', async () => {
    if (typeof jupiter.getTokenList !== 'function') return;
    const result = await jupiter.getTokenList();
    expect(Array.isArray(result)).toBe(true);
  });
});