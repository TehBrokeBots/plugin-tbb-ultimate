/**
 * Core interface for ElizaOS plugin actions.
 * 
 * This interface defines the structure for all plugin actions in the Teh Broke Bots Ultimate plugin.
 * Each action must implement validation, handling, and optionally provide usage examples.
 * 
 * @template P The parameter type for the action (defaults to any)
 * @template O The output/return type for the action (defaults to any)
 * 
 * @example
 * ```typescript
 * const swapAction: PluginAction<SwapParams, string> = {
 *   name: "swap",
 *   description: "Swap tokens using Jupiter aggregator",
 *   validate: async (params) => {
 *     return params.inputMint && params.outputMint && params.amount > 0;
 *   },
 *   handler: async (runtime, params) => {
 *     return await swap(params);
 *   },
 *   examples: [{
 *     input: { inputMint: "SOL", outputMint: "USDC", amount: 1.0 },
 *     output: "transaction_signature_here"
 *   }]
 * };
 * ```
 */
export interface PluginAction<P = any, O = any> {
  /** The unique name of the action */
  name: string;
  /** Human-readable description of what the action does */
  description: string;
  /** Async function to validate action parameters before execution */
  validate: (params: P) => Promise<boolean>;
  /** Async function to execute the action with runtime context and parameters */
  handler: (runtime: any, params: P) => Promise<O>;
  /** Optional array of input/output examples for documentation and testing */
  examples?: Array<{ input: P; output: O }>;
} 