import type { Plugin, IAgentRuntime, Action, Memory, HandlerCallback, Content } from "@elizaos/core";
import * as coreActions from "./actions";
import * as arbitrageStrategy from "./strategies/arbitrage";
import * as daoStrategy from "./strategies/dao";
import * as predictEvaluator from "./evaluators/predict";
import * as degenStrategy from "./strategies/degen";
import * as safeStrategy from "./strategies/safe";
import * as predictiveStrategy from "./strategies/predictive";
import { dexscreenerProvider, pumpfunProvider, solanaProvider } from "./providers";
import { logger } from "@elizaos/core";

// Export types
export type { ArbitrageParams } from "./strategies/arbitrage";
export type { DaoStrategyParams } from "./strategies/dao";
export type { DegenParams } from "./strategies/degen";
export type { SafeParams } from "./strategies/safe";

// Create Action objects from existing functions
const swapAction: Action = {
  name: "SWAP",
  description: "Swap tokens using Jupiter API (wallet required for signing)",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as any;
    return content && content.inputMint && content.outputMint && content.amount;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any
  ) => {
    try {
      const content = message.content as any;
      const result = await coreActions.swap({
        inputMint: content.inputMint,
        outputMint: content.outputMint,
        amount: content.amount,
        slippageBps: content.slippageBps || 50
      });
      
      return {
        success: true,
        text: `Swap executed successfully! Transaction signature: ${result}`,
        data: { signature: result },
        actions: ["SWAP"]
      };
    } catch (error) {
      return {
        success: false,
        text: `Swap failed: ${(error as Error).message}`,
        actions: ["SWAP"]
      };
    }
  },
  
  examples: [
    [
      { name: "user", content: { text: "I want to swap 1 SOL for USDC" } },
      { name: "assistant", content: { text: "Swap executed successfully! Transaction signature: ...", actions: ["SWAP"] } }
    ]
  ]
};

const buyAction: Action = {
  name: "BUY",
  description: "Buy tokens using Jupiter API (wallet required for signing)",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as any;
    return content && content.tokenMint && content.amount;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any
  ) => {
    try {
      const content = message.content as any;
      const result = await coreActions.buy({
        tokenMint: content.tokenMint,
        amount: content.amount
      });
      
      return {
        success: true,
        text: `Buy order executed successfully! Transaction signature: ${result}`,
        data: { signature: result },
        actions: ["BUY"]
      };
    } catch (error) {
      return {
        success: false,
        text: `Buy order failed: ${(error as Error).message}`,
        actions: ["BUY"]
      };
    }
  },
  
  examples: [
    [
      { name: "user", content: { text: "I want to buy 1000 tokens" } },
      { name: "assistant", content: { text: "Buy order executed successfully! Transaction signature: ...", actions: ["BUY"] } }
    ]
  ]
};

const sellAction: Action = {
  name: "SELL",
  description: "Sell tokens using Jupiter API (wallet required for signing)",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as any;
    return content && content.tokenMint && content.amount;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any
  ) => {
    try {
      const content = message.content as any;
      const result = await coreActions.sell({
        tokenMint: content.tokenMint,
        amount: content.amount
      });
      
      return {
        success: true,
        text: `Sell order executed successfully! Transaction signature: ${result}`,
        data: { signature: result },
        actions: ["SELL"]
      };
    } catch (error) {
      return {
        success: false,
        text: `Sell order failed: ${(error as Error).message}`,
        actions: ["SELL"]
      };
    }
  },
  
  examples: [
    [
      { name: "user", content: { text: "I want to sell 500 tokens" } },
      { name: "assistant", content: { text: "Sell order executed successfully! Transaction signature: ...", actions: ["SELL"] } }
    ]
  ]
};

const checkWalletBalanceAction: Action = {
  name: "CHECK_WALLET_BALANCE",
  description: "Check SOL and SPL token balances for a wallet",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as any;
    return content && content.walletAddress;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any
  ) => {
    try {
      const content = message.content as any;
      const result = await coreActions.checkWalletBalance({
        walletAddress: content.walletAddress
      });
      
      return {
        success: true,
        text: `Wallet balance: ${result.sol} SOL and ${result.tokens.length} token types`,
        data: result,
        actions: ["CHECK_WALLET_BALANCE"]
      };
    } catch (error) {
      return {
        success: false,
        text: `Failed to check wallet balance: ${(error as Error).message}`,
        actions: ["CHECK_WALLET_BALANCE"]
      };
    }
  },
  
  examples: [
    [
      { name: "user", content: { text: "Check my wallet balance" } },
      { name: "assistant", content: { text: "Wallet balance: 1.5 SOL and 3 token types", actions: ["CHECK_WALLET_BALANCE"] } }
    ]
  ]
};

const scamCheckAction: Action = {
  name: "SCAM_CHECK",
  description: "Analyze token risk using on-chain and social signals",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as any;
    return content && content.chain && content.address;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any
  ) => {
    try {
      const content = message.content as any;
      const result = await coreActions.scamCheck({
        chain: content.chain,
        address: content.address,
        symbol: content.symbol,
        plugins: options?.plugins
      });
      
      return {
        success: true,
        text: typeof result === 'string' ? result : result.message,
        data: typeof result === 'object' ? result : undefined,
        actions: ["SCAM_CHECK"]
      };
    } catch (error) {
      return {
        success: false,
        text: `Scam check failed: ${(error as Error).message}`,
        actions: ["SCAM_CHECK"]
      };
    }
  },
  
  examples: [
    [
      { name: "user", content: { text: "Check if this token is a scam" } },
      { name: "assistant", content: { text: "Scam check completed. Risk: low", actions: ["SCAM_CHECK"] } }
    ]
  ]
};

const sentimentAnalysisAction: Action = {
  name: "SENTIMENT_ANALYSIS",
  description: "Analyze sentiment using Twitter plugin",
  
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content as any;
    return content && content.symbol;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: any
  ) => {
    try {
      const content = message.content as any;
      const result = await coreActions.sentimentAnalysis({
        symbol: content.symbol
      });
      
      return {
        success: true,
        text: `Sentiment analysis for ${content.symbol}: ${result.bullish}% bullish, ${result.bearish}% bearish, ${result.neutral}% neutral`,
        data: result,
        actions: ["SENTIMENT_ANALYSIS"]
      };
    } catch (error) {
      return {
        success: false,
        text: `Sentiment analysis failed: ${(error as Error).message}`,
        actions: ["SENTIMENT_ANALYSIS"]
      };
    }
  },
  
  examples: [
    [
      { name: "user", content: { text: "Analyze sentiment for SOL" } },
      { name: "assistant", content: { text: "Sentiment analysis for SOL: 60% bullish, 20% bearish, 20% neutral", actions: ["SENTIMENT_ANALYSIS"] } }
    ]
  ]
};

const arbitrageStrategyAction: Action = {
  name: "ARBITRAGE_STRATEGY",
  description: "Arbitrage strategy across Jupiter, Orca and Raydium",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const c = message.content as any;
    return c && c.tokenMintA && c.tokenMintB && c.confirm;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: any, options: any) => {
    const c = message.content as any;
    const result = await arbitrageStrategy.arbitrageStrategy({
      tokenMintA: c.tokenMintA,
      tokenMintB: c.tokenMintB,
      tradeAmountLamports: c.tradeAmountLamports,
      stopLossPercent: c.stopLossPercent,
      takeProfitPercent: c.takeProfitPercent,
      confirm: c.confirm,
      exitTo: c.exitTo,
      monitorIntervalSec: c.monitorIntervalSec,
    });
    return { 
      success: true,
      text: JSON.stringify(result), 
      data: typeof result === 'string' ? { result } : result, 
      actions: ["ARBITRAGE_STRATEGY"] 
    };
  },
  examples: [
    [
      { name: "user", content: { text: "Arbitrage between SOL and USDC" } },
      { name: "assistant", content: { text: "{\"arbitrageOpportunity\":true,...}", actions: ["ARBITRAGE_STRATEGY"] } }
    ]
  ]
};

const daoStrategyAction: Action = {
  name: "DAO_STRATEGY",
  description: "Buy Pinecone DAO token with confirmation",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const c = message.content as any;
    return c && c.amount && c.confirm;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: any, options: any) => {
    const c = message.content as any;
    const result = await daoStrategy.daoStrategy({
      amount: c.amount,
      confirm: c.confirm,
      exitTo: c.exitTo,
      monitorIntervalSec: c.monitorIntervalSec,
    });
    return { 
      success: true,
      text: JSON.stringify(result), 
      data: typeof result === 'string' ? { result } : result, 
      actions: ["DAO_STRATEGY"] 
    };
  },
  examples: [
    [
      { name: "user", content: { text: "Buy DAO token" } },
      { name: "assistant", content: { text: "\"DAO token purchase executed. Tx signature: ...\"", actions: ["DAO_STRATEGY"] } }
    ]
  ]
};

const degenStrategyAction: Action = {
  name: "DEGEN_STRATEGY",
  description: "Degen trading strategy using Pump.fun",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const c = message.content as any;
    return c && c.amount && c.stopLossPercent && c.takeProfitPercent && c.confirm;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: any, options: any) => {
    const c = message.content as any;
    const result = await degenStrategy.degenStrategy({
      amount: c.amount,
      stopLossPercent: c.stopLossPercent,
      takeProfitPercent: c.takeProfitPercent,
      confirm: c.confirm,
      exitTo: c.exitTo,
      monitorIntervalSec: c.monitorIntervalSec,
    });
    return { 
      success: true,
      text: JSON.stringify(result), 
      data: typeof result === 'string' ? { result } : result, 
      actions: ["DEGEN_STRATEGY"] 
    };
  },
  examples: [
    [
      { name: "user", content: { text: "Degen trade" } },
      { name: "assistant", content: { text: "\"Degen trade executed. Tx signature: ...\"", actions: ["DEGEN_STRATEGY"] } }
    ]
  ]
};

const safeStrategyAction: Action = {
  name: "SAFE_STRATEGY",
  description: "Safe trading strategy for SOL and USDC tokens",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const c = message.content as any;
    return c && c.tokenMint && c.amount && c.stopLossPercent && c.takeProfitPercent && c.confirm;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: any, options: any) => {
    const c = message.content as any;
    const result = await safeStrategy.safeStrategy({
      tokenMint: c.tokenMint,
      amount: c.amount,
      stopLossPercent: c.stopLossPercent,
      takeProfitPercent: c.takeProfitPercent,
      confirm: c.confirm,
      exitTo: c.exitTo,
      monitorIntervalSec: c.monitorIntervalSec,
    });
    return { 
      success: true,
      text: JSON.stringify(result), 
      data: typeof result === 'string' ? { result } : result, 
      actions: ["SAFE_STRATEGY"] 
    };
  },
  examples: [
    [
      { name: "user", content: { text: "Safe trade" } },
      { name: "assistant", content: { text: "\"Safe trade completed. Tx signature: ...\"", actions: ["SAFE_STRATEGY"] } }
    ]
  ]
};

const predictiveStrategyAction: Action = {
  name: "PREDICTIVE_STRATEGY",
  description: "Predictive trading strategy using AI to buy or sell any token via Jupiter, with stop loss/take profit and automated trading option.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const c = message.content as any;
    return c && c.tokenMint && c.symbol && c.amount && c.stopLossPercent && c.takeProfitPercent && c.confirm;
  },
  handler: async (runtime: IAgentRuntime, message: Memory, state: any, options: any) => {
    const c = message.content as any;
    const result = await predictiveStrategy.predictiveStrategy({
      tokenMint: c.tokenMint,
      symbol: c.symbol,
      amount: c.amount,
      stopLossPercent: c.stopLossPercent,
      takeProfitPercent: c.takeProfitPercent,
      confirm: c.confirm,
      autoTrade: c.autoTrade,
      exitTo: c.exitTo,
      monitorIntervalSec: c.monitorIntervalSec,
    });
    return {
      success: true,
      text: typeof result === 'string' ? result : JSON.stringify(result),
      data: result,
      actions: ["PREDICTIVE_STRATEGY"]
    };
  },
  examples: [
    [
      { name: "user", content: { text: "Predictive trade for token XYZ" } },
      { name: "assistant", content: { text: '{"message": "Trade executed: LONG. Tx signature: ..."}', actions: ["PREDICTIVE_STRATEGY"] } }
    ]
  ]
};

// Ensure all actions have similes and examples arrays
function ensureActionFields(action: Action): Action {
  if (!('similes' in action)) (action as any).similes = [];
  if (!('examples' in action)) (action as any).examples = [];
  return action;
}

const actions: Action[] = [
  ensureActionFields(swapAction),
  ensureActionFields(buyAction),
  ensureActionFields(sellAction),
  ensureActionFields(checkWalletBalanceAction),
  ensureActionFields(scamCheckAction),
  ensureActionFields(sentimentAnalysisAction),
  ensureActionFields(arbitrageStrategyAction),
  ensureActionFields(daoStrategyAction),
  ensureActionFields(degenStrategyAction),
  ensureActionFields(safeStrategyAction),
  ensureActionFields(predictiveStrategyAction),
];

const providers = [
  solanaProvider,
  pumpfunProvider,
  dexscreenerProvider,
];

// Ensure SCAM_CHECK_PROVIDER is present
if (!providers.find((p) => p.name === "SCAM_CHECK_PROVIDER")) {
  const scamCheckProvider = require("./providers/scam-check").scamCheckProvider;
  providers.push(scamCheckProvider);
}

// Remove duplicate scamCheckAction declaration and patch only once
const scamCheckActionIdx = actions.findIndex((a) => a.name === "SCAM_CHECK");
if (scamCheckActionIdx !== -1) {
  actions[scamCheckActionIdx].similes = ["TOKEN_RISK_ANALYSIS", "CHECK_TOKEN_HEALTH"];
  actions[scamCheckActionIdx].examples = [
    [
      { name: "User", content: { text: "Is this token safe?" } },
      { name: "Teh Broke Bot", content: { text: "I'll check if this token is safe using my scam checker.", actions: ["SCAM_CHECK"] } },
    ],
  ];
}

const models = {
  TEXT_SMALL: async () => "ULTIMATE-SOLANA: TEXT_SMALL stub",
  TEXT_LARGE: async () => "ULTIMATE-SOLANA: TEXT_LARGE stub",
};

const routes = [
  {
    name: "healthcheck",
    path: "/ultimate-solana/health",
    type: "GET" as const,
    handler: async (_req: any, res: any) => {
      res.json({ message: "Ultimate Solana Plugin is healthy." });
    },
  },
];

const events = {
  MESSAGE_RECEIVED: [async (params: Record<string, any>) => console.info("MESSAGE_RECEIVED", Object.keys(params))],
  VOICE_MESSAGE_RECEIVED: [async (params: Record<string, any>) => console.info("VOICE_MESSAGE_RECEIVED", Object.keys(params))],
  WORLD_CONNECTED: [async (params: Record<string, any>) => console.info("WORLD_CONNECTED", Object.keys(params))],
  WORLD_JOINED: [async (params: Record<string, any>) => console.info("WORLD_JOINED", Object.keys(params))],
};

// Patch event handlers to call logger.info with event name and params as separate arguments
const eventNames = ["MESSAGE_RECEIVED", "VOICE_MESSAGE_RECEIVED", "WORLD_CONNECTED", "WORLD_JOINED"] as const;
eventNames.forEach((eventName) => {
  type EventKey = keyof typeof events;
  const key = eventName as EventKey;
  if (Array.isArray(events[key])) {
    events[key] = (events[key] as ((params: Record<string, any>) => Promise<void>)[]).map((handler) => async (params: Record<string, any>) => {
      logger.info(eventName, params);
      return await handler(params);
    });
  }
});

// Patch action handlers for error logging using logger from '@elizaos/core'
for (const action of actions) {
  const origHandler = action.handler;
  if (typeof origHandler === "function") {
    action.handler = async function (...args: [IAgentRuntime, Memory, any?, any?, HandlerCallback?, Memory[]?]) {
      try {
        return await origHandler.apply(this, args);
      } catch (err) {
        logger.error(err);
        throw err;
      }
    };
  }
}

export const ultimateSolanaPlugin: Plugin = {
  name: "ultimate-solana",
  description: "Ultimate Solana token analysis, trading, and risk evaluation plugin.",
  config: {},
  actions,
  providers,
  models,
  routes,
  events,
  async init(config: Record<string, string>, runtime: IAgentRuntime) {
    console.log("Ultimate Solana Plugin initialized!");
    // Initialize any required services or connections
  },
};

export default ultimateSolanaPlugin;
