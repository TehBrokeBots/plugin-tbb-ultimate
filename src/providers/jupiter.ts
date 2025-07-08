// Jupiter API Utility Functions
// Docs: https://dev.jup.ag/docs/ultra-api/

import fetch from 'node-fetch';

const JUPITER_API = 'https://quote-api.jup.ag/v6';

export async function getSwapQuote({ inputMint, outputMint, amount }) {
  // inputMint/outputMint: token mint addresses
  // amount: in smallest units (e.g., lamports for SOL)
  const url = `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch Jupiter quote');
  return res.json();
}

export async function getTokenList() {
  const url = `${JUPITER_API}/tokens`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch Jupiter token list');
  return res.json();
}

export async function getWalletBalances(walletAddress: string) {
  // Jupiter does not provide wallet balances directly; use Solana RPC or a public API
  // Placeholder for integration
  return {};
}

export async function buildSwapTransaction({
  quoteResponse,
  userPublicKey,
  slippageBps = 50 // default 0.5% slippage
}) {
  // quoteResponse: result from getSwapQuote
  // userPublicKey: base58 string
  // slippageBps: slippage in basis points
  const url = `${JUPITER_API}/swap`; // POST
  const body = {
    quoteResponse,
    userPublicKey,
    slippageBps
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw Error('Failed to build Jupiter swap transaction');
  return res.json(); // Contains serializedTransaction (base64)
}
