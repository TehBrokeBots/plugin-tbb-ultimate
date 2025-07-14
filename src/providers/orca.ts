// src/providers/orca.ts

import axios from "axios";

const ORCA_POOLS_API = "https://api.orca.so/pools";

export interface PoolData {
  tokenA: { mint: string; reserve: string };
  tokenB: { mint: string; reserve: string };
}

export async function getPools(): Promise<PoolData[]> {
  const resp = await axios.get(ORCA_POOLS_API);
  return resp.data.pools as PoolData[];
}

export async function getPrice(
  inputMint: string,
  outputMint: string,
): Promise<number | null> {
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
  } catch {
    return null;
  }
}
