// src/strategies/arbitrage.ts
import { getQuote } from "../providers/jupiter";
import { getPrice as getOrcaPrice } from "../providers/orca";
import { getPrice as getRaydiumPrice } from "../providers/raydium";
import { swap } from "../actions";

const ARBITRAGE_SPREAD_THRESHOLD = parseFloat(
  process.env.ARBITRAGE_SPREAD_THRESHOLD || "0.01",
);
const AUTO_TRADE_ENABLED = process.env.AUTO_TRADE_ENABLED === "true";

export interface ArbitrageParams {
  tokenMintA: string;
  tokenMintB: string;
  tradeAmountLamports?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  confirm: (message: string) => Promise<boolean>;
}

export async function arbitrageStrategy(params: ArbitrageParams) {
  const {
    tokenMintA,
    tokenMintB,
    tradeAmountLamports = 1_000_000,
    stopLossPercent = 0,
    takeProfitPercent = 0,
    confirm,
  } = params;

  const jupiterQuote = await getQuote(
    tokenMintA,
    tokenMintB,
    tradeAmountLamports,
  );
  const jupiterPrice = parseFloat(jupiterQuote.price || "0");

  const orcaPrice = await getOrcaPrice(tokenMintA, tokenMintB);
  const raydiumPrice = await getRaydiumPrice(tokenMintA, tokenMintB);

  const prices = [
    { name: "Jupiter", price: jupiterPrice },
    ...(orcaPrice !== null ? [{ name: "Orca", price: orcaPrice }] : []),
    ...(raydiumPrice !== null
      ? [{ name: "Raydium", price: raydiumPrice }]
      : []),
  ];

  if (prices.length < 2) {
    return { message: "Not enough price data to evaluate arbitrage." };
  }

  const minPriceObj = prices.reduce(
    (min, p) => (p.price < min.price ? p : min),
    prices[0],
  );
  const maxPriceObj = prices.reduce(
    (max, p) => (p.price > max.price ? p : max),
    prices[0],
  );
  const spread = (maxPriceObj.price - minPriceObj.price) / minPriceObj.price;

  if (spread > ARBITRAGE_SPREAD_THRESHOLD) {
    const message = `Arbitrage opportunity! Buy on ${minPriceObj.name} at ${minPriceObj.price.toFixed(
      6,
    )}, sell on ${maxPriceObj.name} at ${maxPriceObj.price.toFixed(6)} with spread ${(spread * 100).toFixed(2)}%. Proceed with automated trades?`;

    const userConfirmed = await confirm(message);
    if (!userConfirmed) return "User cancelled arbitrage trades.";

    if (AUTO_TRADE_ENABLED) {
      try {
        const buySig = await swap({
          inputMint: tokenMintA,
          outputMint: tokenMintB,
          amount: tradeAmountLamports,
        });
        const sellSig = await swap({
          inputMint: tokenMintB,
          outputMint: tokenMintA,
          amount: tradeAmountLamports,
        });
        return {
          arbitrageOpportunity: true,
          spread,
          buyOn: minPriceObj.name,
          sellOn: maxPriceObj.name,
          autoTrade: { buySig, sellSig, status: "success" },
        };
      } catch (e) {
        return {
          error: `Arbitrage auto trade failed: ${(e as Error).message}`,
        };
      }
    } else {
      return {
        arbitrageOpportunity: true,
        spread,
        buyOn: minPriceObj.name,
        sellOn: maxPriceObj.name,
        autoTrade: { status: "disabled" },
      };
    }
  } else {
    return { arbitrageOpportunity: false, spread };
  }
}
