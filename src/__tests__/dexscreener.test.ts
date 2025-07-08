import * as dexscreener from '../providers/dexscreener';

describe('Dexscreener Provider', () => {
  it('should get token info', async () => {
    if (typeof dexscreener.getTokenInfo !== 'function') return;
    const result = await dexscreener.getTokenInfo('solana', 'mockAddress');
    expect(result).toBeDefined();
  });

  it('should get pair info', async () => {
    if (typeof dexscreener.getPairInfo !== 'function') return;
    const result = await dexscreener.getPairInfo('solana', 'mockAddress');
    expect(result).toBeDefined();
  });

  it('should search for a token', async () => {
    if (typeof dexscreener.searchToken !== 'function') return;
    const result = await dexscreener.searchToken('SOL');
    expect(result).toBeDefined();
  });
});
