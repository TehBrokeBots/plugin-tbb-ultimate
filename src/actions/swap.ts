import { getQuote, buildSwapTransaction } from "../providers/jupiter";
import { keypair, sendTransaction } from "../providers/solana";
import { Transaction } from "@solana/web3.js";
import { PluginAction } from "../types";

interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

/**
 * Swaps tokens using Jupiter aggregator on Solana.
 */
export const swapAction: PluginAction<SwapParams, { signature: string }> = {
  name: "SWAP",
  description: "Swaps tokens using Jupiter aggregator on Solana.",
  validate: async (params: SwapParams) => {
    if (!params.inputMint || !params.outputMint) throw new Error("Input and output mints are required.");
    if (typeof params.amount !== "number" || params.amount <= 0) throw new Error("Amount must be a positive number.");
    return true;
  },
  handler: async (runtime: any, params: SwapParams) => {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;
    try {
      const quote = await getQuote(inputMint, outputMint, amount, slippageBps);
      const swapTransactionBase64 = await buildSwapTransaction(
        quote,
        keypair.publicKey.toBase58(),
      );
      const txnBuffer = Buffer.from(swapTransactionBase64, "base64");
      const txn = Transaction.from(txnBuffer);
      txn.partialSign(keypair);
      const signature = await sendTransaction(txn);
      return { signature };
    } catch (e) {
      throw new Error(`Swap failed: ${(e as Error).message}`);
    }
  },
  examples: [
    {
      input: { inputMint: "So111...", outputMint: "TokenMint...", amount: 1 },
      output: { signature: "..." },
    },
  ],
};

export default swapAction; 