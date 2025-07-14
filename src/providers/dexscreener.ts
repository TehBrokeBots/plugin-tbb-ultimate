// src/providers/dexscreener.ts
import axios from "axios";
export const dexscreener = {
  getTokenInfo,
  getPairInfo,
  searchToken,
};
const BASE_URL = "https://api.dexscreener.io/latest/dex";

export async function getPairInfo(pairAddress: string) {
  try {
    const { data } = await axios.get(`${BASE_URL}/pairs/${pairAddress}`);
    return data;
  } catch (err: any) {
    return { error: err.message ?? "Error fetching pair info" };
  }
}

export async function searchToken(tokenSymbol: string) {
  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: { q: tokenSymbol },
    });
    return data;
  } catch (err: any) {
    return { error: err.message ?? "Error searching for token" };
  }
}

type DexscreenerPair = {
  priceUsd: string;
  liquidity?: { usd: number };
  volume?: { h24: number };
  dexId: string;
  pairAddress: string;
  priceChart?: Array<{ price: string; volume: string; time: number }>;
  verified?: boolean;
  txns?: { h24: number };
  ageDays?: number;
};

type DexscreenerData = {
  pairs: DexscreenerPair[];
};

/**
 * Fetch Dexscreener token info for a given chain and token address.
 * @param chain string Currently used only to future-proof - expects 'solana'
 * @param tokenMint token mint address string
 * @returns Detailed token info including pairs array and priceChart for analysis
 */
export async function getTokenInfo(
  chain: string,
  tokenMint: string,
): Promise<DexscreenerData | { error: string }> {
  if (chain.toLowerCase() !== "solana") {
    return { error: `Unsupported chain: ${chain}` };
  }

  try {
    const url = `https://api.dexscreener.io/latest/dex/tokens/${tokenMint}`;
    const { data } = await axios.get(url);

    if (!data?.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      return { error: "No pairs found on DexScreener" };
    }

    // Optionally filter pairs or return as is
    return data as DexscreenerData;
  } catch (err: any) {
    return { error: err.message ?? "Error fetching DexScreener data" };
  }
}

/**
 * Simple method to retrieve primary token data, taking first pair from DexScreener response.
 * Basically a convenience wrapper around getTokenInfo.
 */
export async function getDexscreenerData(params: { tokenMint: string }) {
  const { tokenMint } = params;
  const info = await getTokenInfo("solana", tokenMint);
  if ("error" in info) {
    return info;
  }
  const pair = info.pairs[0];

  return {
    priceUsd: parseFloat(pair.priceUsd),
    liquidityUsd: pair.liquidity?.usd ?? null,
    volume24h: pair.volume?.h24 ?? null,
    dexId: pair.dexId,
    pairAddress: pair.pairAddress,
    priceChart: pair.priceChart ?? [],
    verified: pair.verified,
    txnsH24: pair.txns?.h24,
    ageDays: pair.ageDays,
    raw: info,
  };
}
