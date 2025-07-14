// src/providers/raydium.ts

import axios from "axios";

const RAYDIUM_QUOTE_API = "https://api.raydium.io/v2/sdk/quote";

export async function getPrice(
  inputMint: string,
  outputMint: string,
): Promise<number | null> {
  try {
    const resp = await axios.get(RAYDIUM_QUOTE_API, {
      params: { inputMint, outputMint },
    });
    if (!resp.data || !resp.data.data || !resp.data.data.price) return null;
    return resp.data.data.price as number;
  } catch {
    return null;
  }
}
