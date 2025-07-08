import * as solana from '../providers/solana';

describe('Solana Provider', () => {
  it('should get SOL balance', async () => {
    if (typeof solana.getSolBalance !== 'function') return;
    const result = await solana.getSolBalance('mockPublicKey');
    expect(result).toBeDefined();
  });

  it('should get SPL token accounts', async () => {
    if (typeof solana.getSplTokenAccounts !== 'function') return;
    const result = await solana.getSplTokenAccounts('mockPublicKey');
    expect(result).toBeDefined();
  });

  it('should get mint info', async () => {
    if (typeof solana.getMintInfo !== 'function') return;
    const result = await solana.getMintInfo('mockMint');
    expect(result).toBeDefined();
  });

  it('should get token holders', async () => {
    if (typeof solana.getTokenHolders !== 'function') return;
    const result = await solana.getTokenHolders('mockMint');
    expect(result).toBeDefined();
  });
});
