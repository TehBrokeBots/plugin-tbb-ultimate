// src/providers/orca.ts

import axios from "axios";

const ORCA_POOLS_API = "https://api.orca.so/pools";

export interface PoolData {
  tokenA: { mint: string; reserve: string };
  tokenB: { mint: string; reserve: string };
}

/**
 * Fetches all pools from Orca API.
 * @returns Array of pool data
 */
export async function getPools(): Promise<PoolData[]> {
  if (!ORCA_POOLS_API) throw new Error("ORCA_POOLS_API is not defined.");
  try {
    const resp = await axios.get(ORCA_POOLS_API);
    return resp.data.pools as PoolData[];
  } catch (e) {
    throw new Error(`Failed to fetch pools from Orca: ${(e as Error).message}`);
  }
}

/**
 * Calculates the price for a token pair using Orca pools.
 * @param inputMint The input token mint address
 * @param outputMint The output token mint address
 * @returns The calculated price, or null if no pool is found
 */
export async function getPrice(
  inputMint: string,
  outputMint: string,
): Promise<number | null> {
  if (!inputMint || !outputMint) throw new Error("Input and output mints are required for price calculation.");
  try {
    const pools = await getPools();
    const pool = pools.find(
      (p) =>
        (p.tokenA.mint === inputMint && p.tokenB.mint === outputMint) ||
        (p.tokenA.mint === outputMint && p.tokenB.mint === inputMint),
    );

    if (!pool) return null;

    const tokenAReserve = parseFloat(pool.tokenA.reserve);
    const tokenBReserve = parseFloat(pool.tokenB.reserve);

    if (pool.tokenA.mint === inputMint) {
      return tokenBReserve / tokenAReserve;
    } else {
      return tokenAReserve / tokenBReserve;
    }
  } catch (e) {
    throw new Error(`Failed to calculate price from Orca: ${(e as Error).message}`);
  }
}

export default {
  getPools,
  getPrice,
};
