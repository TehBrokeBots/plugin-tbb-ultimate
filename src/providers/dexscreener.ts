// Dexscreener API Utility Functions
// Docs: https://docs.dexscreener.com/api/reference

import fetch from 'node-fetch';

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

export async function getTokenInfo(chain: string, address: string) {
  // Fetch token info for a given chain and address
  const url = `${DEXSCREENER_API}/tokens/${chain}/${address}`;
  const res = await fetch(url);
  if (!res.ok) throw Error('Failed to fetch Dexscreener token info');
  return res.json();
}

export async function getPairInfo(chain: string, pairAddress: string) {
  // Fetch pair info for a given chain and pair address
  const url = `${DEXSCREENER_API}/pairs/${chain}/${pairAddress}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch Dexscreener pair info');
  return res.json();
}

export async function searchToken(query: string) {
  // Search for tokens by symbol or name
  const url = `https://api.dexscreener.com/latest/dex/search/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to search Dexscreener');
  return res.json();
}
