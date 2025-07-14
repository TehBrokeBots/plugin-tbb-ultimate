// src/providers/jupiter.ts

import axios from "axios";

const API_BASE = "https://quote-api.jup.ag/v6";

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps = 50,
) {
  const url = `${API_BASE}/quote`;
  const resp = await axios.get(url, {
    params: { inputMint, outputMint, amount, slippageBps },
  });
  if (!resp.data?.data?.length)
    throw new Error("No quote available from Jupiter");
  return resp.data.data[0];
}

export async function buildSwapTransaction(route: any, userPublicKey: string) {
  const url = `${API_BASE}/swap`;
  const resp = await axios.post(url, {
    route,
    userPublicKey,
    wrapUnwrapSOL: true,
  });
  if (!resp.data?.swapTransaction)
    throw new Error("Failed to build swap transaction");
  return resp.data.swapTransaction;
}
