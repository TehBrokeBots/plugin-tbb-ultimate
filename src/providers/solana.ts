// Solana RPC Utility Functions for Wallet Balances and Token Info
// Uses public Solana RPC endpoint

import fetch from 'node-fetch';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

export async function getSolBalance(walletAddress: string) {
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [walletAddress]
    })
  });
  const data = await res.json();
  if (!data.result) throw new Error('Failed to fetch SOL balance');
  return data.result.value; // in lamports
}

export async function getSplTokenAccounts(walletAddress: string) {
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenAccountsByOwner',
      params: [walletAddress, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }]
    })
  });
  const data = await res.json();
  if (!data.result) throw new Error('Failed to fetch SPL token accounts');
  return data.result.value; // array of token accounts
}

export async function getMintInfo(mintAddress) {
  // Returns mint authority and supply
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAccountInfo',
      params: [mintAddress, { encoding: 'jsonParsed' }]
    })
  });
  const data = await res.json();
  if (!data.result) throw new Error('Failed to fetch mint info');
  const info = data.result.value?.data?.parsed?.info;
  return info;
}

export async function getTokenHolders(mintAddress) {
  // Returns all token accounts for a mint (holders)
  const res = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenLargestAccounts',
      params: [mintAddress]
    })
  });
  const data = await res.json();
  if (!data.result) throw Error('Failed to fetch token holders');
  return data.result.value; // array of { address, amount }
}
