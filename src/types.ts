// Central type definitions for TBB-Ultimate plugin

import type { Connection, Transaction, PublicKey, Signer } from '@solana/web3.js';

export type TrendType = 'uptrend' | 'downtrend' | 'sideways';

export interface WalletContext {
  walletAdapter: Signer; // or WalletAdapter if using a specific adapter
  connection: Connection;
}

export interface SwapParams extends WalletContext {
  inputMint: string;
  outputMint: string;
  amount: number;
  userPublicKey: string;
}

export interface WalletBalanceParams {
  walletAddress: string;
}

export interface WalletBalanceResult {
  message: string;
  solBalance: number;
  splTokens: any[];
}

export interface TechnicalAnalysisParams {
  chain: string;
  address: string;
  period?: number;
}

export interface TechnicalAnalysisResult {
  message: string;
  sma: number[];
  ema: number[];
  rsi: number[];
  bollinger: any;
}

export interface PumpFunTradeParams extends WalletContext {
  token: string;
  action: 'buy' | 'sell';
  amount: number;
  wallet: string;
  serializedTransaction: string;
}

export interface CreatePumpFunTokenParams extends WalletContext {
  name: string;
  symbol: string;
  supply: number;
  wallet: string;
}

export interface SentimentAnalysisParams {
  query: string;
  plugins: any;
}

export interface SentimentAnalysisResult {
  message: string;
  avgScore: number;
  summary: string;
  sampleTweets: string[];
}

export interface MarketTrendsParams {
  chain: string;
  address: string;
}

export interface MarketTrendsResult {
  message: string;
  priceChange7d: number;
  volumeSpike: boolean;
  trend: TrendType;
}

export interface StrategyParams extends WalletContext {
  token?: string;
  action?: 'buy' | 'sell';
  amount: number;
  wallet?: string;
  inputMint?: string;
  outputMint?: string;
  userPublicKey?: string;
  stopLossPct?: number;
  takeProfitPct?: number;
  confirmed?: boolean;
  dao?: string;
  pairs?: [string, string][];
  mint?: string;
  autoStake?: boolean;
}

export interface ArbitrageParams extends WalletContext {
  inputMint: string;
  outputMint: string;
  amount: number;
  userPublicKey: string;
  stopLossPct?: number;
  takeProfitPct?: number;
  confirmed?: boolean;
}

export interface DaoStrategyParams extends WalletContext {
  amount: number;
  userPublicKey: string;
  stopLossPct?: number;
  takeProfitPct?: number;
  confirmed?: boolean;
}

export interface VoteParams {
  token: string;
  vote: 'up' | 'down';
}

export interface SnipeParams extends WalletContext {
  wallet: string;
  mint: string;
  amount: number;
}

export interface PredictParams {
  chain: string;
  address: string;
  symbol: string;
  period?: number;
  plugins: any;
}

export interface PluginContext {
  plugins: Record<string, any>;
  runtime?: any;
}

/**
 * Local ActionContext type for TBB-Ultimate plugin actions.
 * Covers all fields used in plugin-tbb-ultimate/src/index.ts.
 */
export interface ActionContext {
  // Swap, buy, sell, arbitrage, safe, dao strategies
  inputMint?: string;
  outputMint?: string;
  amount?: number;
  userPublicKey?: string;
  stopLossPct?: number;
  takeProfitPct?: number;
  confirmed?: boolean;

  // Wallet balance, portfolio tracker
  walletAddress?: string;

  // Pump.fun trading/creation
  token?: string;
  action?: 'buy' | 'sell';
  wallet?: string;
  name?: string;
  symbol?: string;
  supply?: number;


  // Dexscreener data
  type?: 'token' | 'pair' | 'search';
  chain?: string;
  address?: string;
  query?: string;
  period?: number;

  // Plugins (for Twitter, tbb-ultimate, etc.)
  plugins?: Record<string, any>;
}

export interface SwapQuoteResponse {
  status: string;
  serializedTransaction?: string; // Make this optional
  // Add other properties as needed
}

export interface BuildSwapTransactionResponse {
  status: string;
  serializedTransaction?: string; // Make this optional
  // Add other properties as needed
}

export interface PumpFunTradeResult {
  status: string;
  serializedTransaction?: string;
}