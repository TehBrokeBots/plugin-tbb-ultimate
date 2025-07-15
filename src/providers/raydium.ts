// src/providers/raydium.ts

import axios from "axios";

const RAYDIUM_QUOTE_API = "https://api.raydium.io/v2/sdk/quote";

export async function getPrice(
  inputMint: string,
  outputMint: string,
): Promise<number | null> {
  if (!inputMint || !outputMint) return null;
  try {
    const resp = await axios.get(RAYDIUM_QUOTE_API, {
      params: { inputMint, outputMint },
    });
    if (!resp.data || !resp.data.data || !resp.data.data.price) return null;
    return resp.data.data.price as number;
  } catch (e) {
    return null;
  }
}

// Example for getPoolInfo function:
export async function getPoolInfo(poolAddress: string) {
  if (!poolAddress) throw new Error("Pool address is required for Raydium info.");
  try {
    // ... actual API call logic ...
  } catch (e) {
    throw new Error(`Failed to get pool info from Raydium: ${(e as Error).message}`);
  }
}
