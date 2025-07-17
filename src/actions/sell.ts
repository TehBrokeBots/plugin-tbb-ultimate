import { PluginAction } from "../types";
import { swapAction } from "./swap";

interface SellParams {
  tokenMint: string;
  amount: number;
}

/**
 * Sells a token for SOL.
 */
export const sellAction: PluginAction<SellParams, { signature: string }> = {
  name: "SELL",
  description: "Sells a token for SOL.",
  validate: async (params: SellParams) => {
    if (!params.tokenMint) throw new Error("Token mint is required.");
    if (typeof params.amount !== "number" || params.amount <= 0) throw new Error("Amount must be a positive number.");
    return true;
  },
  handler: async (runtime: any, params: SellParams) => {
    const outputMint = "So11111111111111111111111111111111111111112"; // SOL
    return swapAction.handler(runtime, {
      inputMint: params.tokenMint,
      outputMint,
      amount: params.amount,
    });
  },
  examples: [
    {
      input: { tokenMint: "TokenMint...", amount: 1 },
      output: { signature: "..." },
    },
  ],
};

export default sellAction; 