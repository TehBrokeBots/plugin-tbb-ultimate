// src/providers/raydium.ts

import axios from "axios";

const RAYDIUM_QUOTE_API = "https://api.raydium.io/v2/sdk/quote";

/**
 * Gets the price for a token pair from Raydium API.
 * @param inputMint The input token mint address
 * @param outputMint The output token mint address
 * @returns The price as a number, or null if not available
 */
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

export default {
  getPrice,
};
