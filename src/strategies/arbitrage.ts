// src/strategies/arbitrage.ts
import { getQuote } from "../providers/jupiter";
import { getPrice as getOrcaPrice } from "../providers/orca";
import { getPrice as getRaydiumPrice } from "../providers/raydium";
import { swap } from "../actions";
import { getDexscreenerData } from "../providers/dexscreener";

const ARBITRAGE_SPREAD_THRESHOLD = parseFloat(
  process.env.ARBITRAGE_SPREAD_THRESHOLD || "0.01",
);
const AUTO_TRADE_ENABLED = process.env.AUTO_TRADE_ENABLED === "true";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";

export interface ArbitrageParams {
  tokenMintA: string;
  tokenMintB: string;
  tradeAmountLamports?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  confirm: (message: string) => Promise<boolean>;
  exitTo?: "USDC" | "SOL";
  monitorIntervalSec?: number;
}

/**
 * Multi-DEX arbitrage strategy with automated execution and risk management.
 * 
 * This strategy implements a sophisticated arbitrage approach that:
 * - Compares prices across multiple DEXs (Jupiter, Orca, Raydium)
 * - Identifies arbitrage opportunities based on configurable spread threshold
 * - Executes automated buy/sell trades when profitable opportunities are found
 * - Implements stop loss and take profit monitoring for risk management
 * - Requires user confirmation before execution
 * - Supports both manual and automated trading modes
 * 
 * @param params ArbitrageParams object containing strategy configuration
 * @param params.tokenMintA The first token mint address for the arbitrage pair
 * @param params.tokenMintB The second token mint address for the arbitrage pair
 * @param params.tradeAmountLamports The amount to trade in lamports (defaults to 1,000,000)
 * @param params.stopLossPercent Percentage loss at which to exit the position (defaults to 0)
 * @param params.takeProfitPercent Percentage gain at which to exit the position (defaults to 0)
 * @param params.confirm Callback function for user confirmation
 * @param params.exitTo Target token for exit (USDC or SOL, defaults to USDC)
 * @param params.monitorIntervalSec Interval in seconds for price monitoring (defaults to 10)
 * @returns Promise<object> Result containing arbitrage opportunity details and trade status
 * @throws Error if validation fails or strategy execution fails
 * 
 * @example
 * ```typescript
 * const result = await arbitrageStrategy({
 *   tokenMintA: "So11111111111111111111111111111111111111112", // SOL
 *   tokenMintB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
 *   tradeAmountLamports: 1000000,
 *   stopLossPercent: 5,
 *   takeProfitPercent: 10,
 *   confirm: async (msg) => await userConfirm(msg),
 *   exitTo: "USDC"
 * });
 * ```
 */
export async function arbitrageStrategy(params: ArbitrageParams) {
  const {
    tokenMintA,
    tokenMintB,
    tradeAmountLamports = 1_000_000,
    stopLossPercent = 0,
    takeProfitPercent = 0,
    confirm,
    exitTo = "USDC",
    monitorIntervalSec = 10,
  } = params;

  // Input validation
  if (!tokenMintA || !tokenMintB) throw new Error("Both token mints are required for arbitrage strategy.");
  if (typeof tradeAmountLamports !== 'number' || tradeAmountLamports <= 0) throw new Error("Amount must be a positive number.");

  try {
    // Step 1: Gather price data from multiple DEXs
    const jupiterQuote = await getQuote(
      tokenMintA,
      tokenMintB,
      tradeAmountLamports,
    );
    const jupiterPrice = parseFloat(jupiterQuote.price || "0");

    const orcaPrice = await getOrcaPrice(tokenMintA, tokenMintB);
    const raydiumPrice = await getRaydiumPrice(tokenMintA, tokenMintB);

    // Step 2: Compile price comparison data
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

    // Step 3: Calculate arbitrage opportunity
    const minPriceObj = prices.reduce(
      (min, p) => (p.price < min.price ? p : min),
      prices[0],
    );
    const maxPriceObj = prices.reduce(
      (max, p) => (p.price > max.price ? p : max),
      prices[0],
    );
    const spread = (maxPriceObj.price - minPriceObj.price) / minPriceObj.price;

    // Step 4: Check if spread meets threshold for arbitrage
    if (spread > ARBITRAGE_SPREAD_THRESHOLD) {
      const message = `Arbitrage opportunity! Buy on ${minPriceObj.name} at ${minPriceObj.price.toFixed(
        6,
      )}, sell on ${maxPriceObj.name} at ${maxPriceObj.price.toFixed(6)} with spread ${(spread * 100).toFixed(2)}%. Proceed with automated trades?`;

      const userConfirmed = await confirm(message);
      if (!userConfirmed) return "User cancelled arbitrage trades.";

      // Step 5: Execute arbitrage trades if auto-trading is enabled
      if (AUTO_TRADE_ENABLED) {
        try {
          // Execute buy trade on lower-priced DEX
          const buySig = await swap({
            inputMint: tokenMintA,
            outputMint: tokenMintB,
            amount: tradeAmountLamports,
          });
          
          // Execute sell trade on higher-priced DEX
          const sellSig = await swap({
            inputMint: tokenMintB,
            outputMint: tokenMintA,
            amount: tradeAmountLamports,
          });

          // Step 6: Set up monitoring for stop loss/take profit
          let entryPrice = 0;
          const priceData = await getDexscreenerData({ tokenMint: tokenMintA });
          if (typeof priceData === "object" && "priceUsd" in priceData) {
            entryPrice = priceData.priceUsd;
          }
          
          let monitoring = true;
          const pollInterval = (monitorIntervalSec || 10) * 1000;
          
          // Start background price monitoring
          (async function monitorPrice() {
            while (monitoring) {
              await new Promise((r) => setTimeout(r, pollInterval));
              
              const data = await getDexscreenerData({ tokenMint: tokenMintA });
              if (!data || typeof data !== "object" || !("priceUsd" in data)) continue;
              
              const currentPrice = data.priceUsd;
              if (!entryPrice || !currentPrice) continue;
              
              let change = ((currentPrice - entryPrice) / entryPrice) * 100;
              
              // Check stop loss condition
              if (change <= -Math.abs(stopLossPercent)) {
                monitoring = false;
                // Stop loss hit, exit trade
                await swap({ inputMint: tokenMintB, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount: tradeAmountLamports });
                console.log(`Stop loss triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
                return;
              }
              
              // Check take profit condition
              if (change >= Math.abs(takeProfitPercent)) {
                monitoring = false;
                // Take profit hit, exit trade
                await swap({ inputMint: tokenMintB, outputMint: exitTo === "USDC" ? USDC_MINT : SOL_MINT, amount: tradeAmountLamports });
                console.log(`Take profit triggered at ${currentPrice} (${change.toFixed(2)}%), exited to ${exitTo}`);
                return;
              }
            }
          })();

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
        // Auto-trading disabled, return opportunity details only
        return {
          arbitrageOpportunity: true,
          spread,
          buyOn: minPriceObj.name,
          sellOn: maxPriceObj.name,
          autoTrade: { status: "disabled" },
        };
      }
    } else {
      // No arbitrage opportunity found
      return { arbitrageOpportunity: false, spread };
    }
  } catch (e) {
    throw new Error(`Failed to execute arbitrage strategy: ${(e as Error).message}`);
  }
}
