// src/providers/jupiter.ts

import axios from "axios";

const API_BASE = "https://quote-api.jup.ag/v6";

export async function getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number = 50) {
  if (!inputMint || !outputMint) throw new Error("Input and output mints are required for quote.");
  if (typeof amount !== 'number' || amount <= 0) throw new Error("Amount must be a positive number.");
  if (typeof slippageBps !== 'number' || slippageBps < 0) throw new Error("Slippage must be a non-negative number.");
  try {
    const url = `${API_BASE}/quote`;
    const resp = await axios.get(url, {
      params: { inputMint, outputMint, amount, slippageBps },
    });
    if (!resp.data?.data?.length)
      throw new Error("No quote available from Jupiter");
    return resp.data.data[0];
  } catch (e) {
    throw new Error(`Failed to get quote from Jupiter: ${(e as Error).message}`);
  }
}

export async function buildSwapTransaction(route: any, userPublicKey: string) {
  if (!route || !userPublicKey) throw new Error("Route and userPublicKey are required for swap transaction.");
  try {
    const url = `${API_BASE}/swap`;
    const resp = await axios.post(url, {
      route,
      userPublicKey,
      wrapUnwrapSOL: true,
    });
    if (!resp.data?.swapTransaction)
      throw new Error("Failed to build swap transaction");
    return resp.data.swapTransaction;
  } catch (e) {
    throw new Error(`Failed to build swap transaction from Jupiter: ${(e as Error).message}`);
  }
}
