// Orca API Utility Functions
// Docs: https://docs.orca.so/builder-documentation/orca-for-builders/integrations

import fetch from 'node-fetch';

const ORCA_API = 'https://api.orca.so/v1/quote';

export async function getOrcaQuote({
  inputMint,
  outputMint,
  amount,
  slippage = 0.5 // percent
}) {
  // amount: in smallest units
  const url = `${ORCA_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippage=${slippage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch Orca quote');
  return res.json();
}
