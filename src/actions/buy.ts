import { PluginAction } from "../types";
import { swapAction } from "./swap";

interface BuyParams {
  tokenMint: string;
  amount: number;
}

/**
 * Buys a token using SOL as input.
 */
export const buyAction: PluginAction<BuyParams, { signature: string }> = {
  name: "BUY",
  description: "Buys a token using SOL as input.",
  validate: async (params: BuyParams) => {
    if (!params.tokenMint) throw new Error("Token mint is required.");
    if (typeof params.amount !== "number" || params.amount <= 0) throw new Error("Amount must be a positive number.");
    return true;
  },
  handler: async (runtime: any, params: BuyParams) => {
    const inputMint = "So11111111111111111111111111111111111111112"; // SOL
    return swapAction.handler(runtime, {
      inputMint,
      outputMint: params.tokenMint,
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

export default buyAction; 