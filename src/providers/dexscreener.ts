// src/providers/dexscreener.ts
import axios from "axios";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

async function getCoinMarketCapPrice(symbol: string): Promise<number | null> {
  if (!COINMARKETCAP_API_KEY) return null;
  try {
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`;
    const resp = await axios.get(url, {
      params: { symbol },
      headers: { "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY },
    });
    const data = resp.data.data?.[symbol];
    if (data && data.quote && data.quote.USD && data.quote.USD.price) {
      return data.quote.USD.price;
    }
    return null;
  } catch {
    return null;
  }
}

export const dexscreener = {
  getTokenInfo,
  getPairInfo,
  searchToken,
};
const BASE_URL = "https://api.dexscreener.io/latest/dex";

export async function getPairInfo(pairAddress: string) {
  if (!pairAddress) throw new Error("Pair address is required for Dexscreener info.");
  try {
    const { data } = await axios.get(`${BASE_URL}/pairs/${pairAddress}`);
    return data;
  } catch (e) {
    throw new Error(`Failed to get pair info from Dexscreener: ${(e as Error).message}`);
  }
}

export async function searchToken(tokenSymbol: string) {
  if (!tokenSymbol) throw new Error("Token symbol is required for Dexscreener search.");
  try {
    const { data } = await axios.get(`${BASE_URL}/search`, {
      params: { q: tokenSymbol },
    });
    return data;
  } catch (e) {
    throw new Error(`Failed to search for token on Dexscreener: ${(e as Error).message}`);
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
  if (!tokenMint) throw new Error("Token mint address is required for Dexscreener token info.");

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
export async function getDexscreenerData(params: { tokenMint: string; symbol?: string }) {
  const { tokenMint, symbol } = params;
  const info = await getTokenInfo("solana", tokenMint);
  if ("error" in info) {
    // Fallback to CoinMarketCap for any token if symbol is provided
    if (symbol) {
      const price = await getCoinMarketCapPrice(symbol);
      if (price) return { priceUsd: price, fallback: "coinmarketcap" };
    }
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
