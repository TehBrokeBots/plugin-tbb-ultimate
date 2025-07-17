import { PluginAction } from "../types";
import { buyAction } from "./buy";
import { sellAction } from "./sell";

interface StartAutoBuySellParams {
  tokenMint: string;
  action: "buy" | "sell";
  amount: number;
}

interface StartAutoBuySellResult {
  started: boolean;
  message: string;
}

const AUTO_TRADE_ENABLED = process.env.AUTO_TRADE_ENABLED === "true";
const AUTO_BUY_SELL_INTERVAL_MS = parseInt(process.env.AUTO_BUY_SELL_INTERVAL_MS || "60000", 10);
let autoBuySellInterval: ReturnType<typeof setTimeout> | null = null;

/**
 * Starts automated buy/sell for a token at a fixed interval.
 */
export const startAutoBuySellAction: PluginAction<StartAutoBuySellParams, StartAutoBuySellResult> = {
  name: "START_AUTO_BUY_SELL",
  description: "Starts automated buy/sell for a token at a fixed interval.",
  validate: async (params: StartAutoBuySellParams) => {
    if (!params.tokenMint) throw new Error("Token mint is required.");
    if (!["buy", "sell"].includes(params.action)) throw new Error("Action must be 'buy' or 'sell'.");
    if (typeof params.amount !== "number" || params.amount <= 0) throw new Error("Amount must be a positive number.");
    return true;
  },
  handler: async (runtime: any, params: StartAutoBuySellParams) => {
    if (!AUTO_TRADE_ENABLED) return { started: false, message: "Automated trading disabled" };
    if (autoBuySellInterval) clearInterval(autoBuySellInterval);
    const tradeFn = async () => {
      try {
        if (params.action === "buy") {
          await buyAction.handler(runtime, { tokenMint: params.tokenMint, amount: params.amount });
        } else {
          await sellAction.handler(runtime, { tokenMint: params.tokenMint, amount: params.amount });
        }
      } catch (e) {
        // log error
      }
    };
    tradeFn();
    autoBuySellInterval = setInterval(tradeFn, AUTO_BUY_SELL_INTERVAL_MS);
    return { started: true, message: "Automated buy/sell started" };
  },
  examples: [
    {
      input: { tokenMint: "TokenMint...", action: "buy", amount: 1 },
      output: { started: true, message: "Automated buy/sell started" },
    },
  ],
};

export default startAutoBuySellAction; 