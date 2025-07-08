import { getSwapQuote, buildSwapTransaction } from './providers/jupiter';
import { tradeOnPumpFun, createPumpFunToken as createPumpFunTokenUtil, getPumpFunRealTimeData } from './providers/pumpfun';
import { getTokenInfo, getPairInfo, searchToken } from './providers/dexscreener';
import { getSolBalance, getSplTokenAccounts, getMintInfo, getTokenHolders } from './providers/solana';
import { simpleMovingAverage, exponentialMovingAverage, rsi, bollingerBands } from './utils/technicalAnalysis';
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Service, IAgentRuntime } from '@elizaos/core';
import { DaoStrategyParams, SwapQuoteResponse } from './types';
import { marketTrends } from './utils/marketTrends';
import { sentimentAnalysis } from './utils/sentimentAnalysis';

export class TBBUltimateService extends Service {
  static serviceType = 'tbb-ultimate';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    return new TBBUltimateService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    const service = runtime.getService(TBBUltimateService.serviceType);
    if (service) await service.stop();
  }
get capabilityDescription() {
  return 'Provides DeFi and Pump.fun strategies for ElizaOS agents.';
}

async stop() {
  // Optional cleanup
}
  async swap({ inputMint, outputMint, amount, userPublicKey, walletAdapter, connection }: any) {
    const quote = await getSwapQuote({ inputMint, outputMint, amount });
    const { serializedTransaction } = await buildSwapTransaction({ quoteResponse: quote, userPublicKey });
    const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
    const signature = await sendAndConfirmTransaction(connection, transaction, [walletAdapter]);
    return { message: 'Swap executed and confirmed.', quote, signature };
  }

  async buy(params: any) {
    return this.swap(params);
  }

  async sell(params: any) {
    return this.swap(params);
  }

  async checkWalletBalance({ walletAddress }: any) {
    const solBalance = await getSolBalance(walletAddress);
    const splTokens = await getSplTokenAccounts(walletAddress);
    return { message: 'Wallet balances fetched.', solBalance, splTokens };
  }

  async pumpFunTrade({ token, action, amount, wallet, walletAdapter, connection }: any) {
    const result = await tradeOnPumpFun({ token, action, amount, wallet });
    let signature = null;
    if (result && result.serializedTransaction) {
      const transaction = Transaction.from(Buffer.from(result.serializedTransaction, 'base64'));
      signature = await sendAndConfirmTransaction(connection, transaction, [walletAdapter]);
    }
    return { message: 'Pump.fun trade executed.', result, signature };
  }

  async createPumpFunToken({ name, symbol, supply, wallet, walletAdapter, connection }: any) {
    const result = await createPumpFunTokenUtil({ name, symbol, supply, wallet });
    let signature = null;
    if (result && result.serializedTransaction) {
      const transaction = Transaction.from(Buffer.from(result.serializedTransaction, 'base64'));
      signature = await sendAndConfirmTransaction(connection, transaction, [walletAdapter]);
    }
    return { message: 'Pump.fun token creation executed.', result, signature };
  }

  async getPumpFunData({ token }: any) {
    const data = await getPumpFunRealTimeData(token);
    return { message: 'Pump.fun real-time data fetched.', data };
  }

  async getDexscreenerData({ type, chain, address, query }: any) {
    if (type === 'token' && chain && address) {
      const data = await getTokenInfo(chain, address);
      return { message: 'Dexscreener token data fetched.', data };
    } else if (type === 'pair' && chain && address) {
      const data = await getPairInfo(chain, address);
      return { message: 'Dexscreener pair data fetched.', data };
    } else if (type === 'search' && query) {
      const data = await searchToken(query);
      return { message: 'Dexscreener search results fetched.', data };
    } else {
      return 'Missing or invalid parameters for Dexscreener data fetch.';
    }
  }

  async technicalAnalysis({ chain, address, period = 14 }: any) {
    const data = await getTokenInfo(chain, address);
    const prices = (data?.pairs?.[0]?.priceChart ?? []).map((p: any) => Number(p.price));
    if (!prices.length) return 'No price history available.';
    return {
      message: 'Technical analysis calculated.',
      sma: simpleMovingAverage(prices, period),
      ema: exponentialMovingAverage(prices, period),
      rsi: rsi(prices, period),
      bollinger: bollingerBands(prices, period)
    };
  }

  async portfolioTracker({ walletAddress }: any) {
    const solBalance = await getSolBalance(walletAddress);
    const splTokens = await getSplTokenAccounts(walletAddress);
    const solInfo = await getTokenInfo('solana', 'So11111111111111111111111111111111111111112');
    const solPrice = Number(solInfo?.pairs?.[0]?.priceUsd ?? 0);
    const tokens = await Promise.all(
      splTokens.map(async (acct: any) => {
        const mint = acct.account.data.parsed.info.mint;
        const amount = Number(acct.account.data.parsed.info.tokenAmount.uiAmount);
        let price = 0;
        try {
          const info = await getTokenInfo('solana', mint);
          price = Number(info?.pairs?.[0]?.priceUsd ?? 0);
        } catch {}
        return { mint, amount, price, valueUsd: amount * price };
      })
    );
    const solValue = solBalance / 1e9 * solPrice;
    const totalValue = solValue + tokens.reduce((sum, t) => sum + t.valueUsd, 0);
    return {
      message: 'Portfolio tracked.',
      sol: { amount: solBalance / 1e9, price: solPrice, valueUsd: solValue },
      tokens,
      totalValueUsd: totalValue
    };
  }

  async marketTrends({ chain, address }: any) {
    const data = await getTokenInfo(chain, address);
    const priceChart = data?.pairs?.[0]?.priceChart ?? [];
    if (priceChart.length < 8) return 'Not enough price history for trend analysis.';
    const priceNow = Number(priceChart[priceChart.length - 1].price);
    const price7dAgo = Number(priceChart[priceChart.length - 8].price);
    const priceChange7d = ((priceNow - price7dAgo) / price7dAgo) * 100;
    const volumes = priceChart.map((p: any) => Number(p.volume));
    const avgPrev5 = volumes.slice(-7, -2).reduce((a, b) => a + b, 0) / 5;
    const last2 = volumes.slice(-2);
    const volumeSpike = last2.some(v => v > avgPrev5 * 2);
    let trend = 'sideways';
    if (priceChange7d > 10) trend = 'uptrend';
    else if (priceChange7d < -10) trend = 'downtrend';
    return { message: 'Market trends analyzed.', priceChange7d, volumeSpike, trend };
  }

  async sentimentAnalysis({ query, plugins }: any) {
    const tweets = await plugins["elizaos/plugin-twitter"].searchTweets({ q: query, count: 50 });
    const scoreSentiment = (text: string) => {
      const positive = ["bull", "moon", "pump", "win", "good", "up", "green", "profit", "love", "rocket"];
      const negative = ["bear", "dump", "lose", "bad", "down", "red", "rug", "hate", "scam"];
      let score = 0;
      for (const word of positive) if (text.toLowerCase().includes(word)) score++;
      for (const word of negative) if (text.toLowerCase().includes(word)) score--;
      return score;
    };
    const sentiments = tweets.map((t: any) => scoreSentiment(t.text));
    const avg = sentiments.reduce((a, b) => a + b, 0) / (sentiments.length || 1);
    let summary = 'neutral';
    if (avg > 1) summary = 'positive';
    else if (avg < -1) summary = 'negative';
    return {
      message: 'Sentiment analyzed.',
      avgScore: avg,
      summary,
      sampleTweets: tweets.slice(0, 5).map((t: any) => t.text)
    };
  }

  async degenStrategy(params: any) {
    return this.pumpFunTrade(params);
  }

  async arbitrageStrategy(params: any) {
    return 'arbitrageStrategy not fully implemented in service yet.';
  }

  async safeStrategy(params: any) {
    return this.swap(params);
  }

  async daoStrategy(params: DaoStrategyParams): Promise<{ message: string; quote: SwapQuoteResponse; signature: string }> {
    const daoMint = 'AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos';
    const usdcMint = 'Es9vMFrzaCERZ6t5gFRCJpJkFGr2PdtbWg5F7xr5Pehk';
    const { amount, userPublicKey, walletAdapter, connection } = params;

    const quote: SwapQuoteResponse = await getSwapQuote({ inputMint: usdcMint, outputMint: daoMint, amount });
    if (!quote.serializedTransaction) throw new Error('Failed to get serialized transaction from swap quote.');
    const transaction = Transaction.from(Buffer.from(quote.serializedTransaction, 'base64'));
    const signature = await sendAndConfirmTransaction(connection, transaction, [walletAdapter]);

    return { message: 'DAO buy executed and confirmed.', quote, signature };
  }

  async scamCheck({ chain, address, symbol, plugins }: any) {
    const data = await getTokenInfo(chain, address);
    const pair = data?.pairs?.[0];
    let risk = 'unknown';
    let reasons: string[] = [];
    if (pair) {
      if (pair.verified === false) {
        risk = 'high';
        reasons.push('Token is not verified on Dexscreener.');
      }
      if (pair.liquidity?.usd < 1000) {
        risk = 'high';
        reasons.push('Low liquidity.');
      }
      if (pair.txns?.h24 < 10) {
        risk = 'medium';
        reasons.push('Low trading activity.');
      }
      if (pair.ageDays && pair.ageDays < 3) {
        risk = 'medium';
        reasons.push('Token is very new.');
      }
    }
    try {
      const mintInfo = await getMintInfo(address);
      if (mintInfo.mintAuthority && !['', '11111111111111111111111111111111', null].includes(mintInfo.mintAuthority)) {
        risk = 'high';
        reasons.push('Mint authority is not renounced (hidden mint authority risk).');
      }
      const holders = await getTokenHolders(address);
      if (holders.length > 0 && mintInfo.supply) {
        const supply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals || 0);
        const largest = holders[0];
        const largestPct = (Number(largest.amount) / supply) * 100;
        if (largestPct > 30) {
          risk = 'high';
          reasons.push('A single wallet holds more than 30% of supply (big red flag).');
        } else if (largestPct > 10) {
          risk = 'medium';
          reasons.push('A single wallet holds more than 10% of supply.');
        }
      }
      if (symbol && plugins?.["elizaos/plugin-twitter"]) {
        const tweets = await plugins["elizaos/plugin-twitter"].searchTweets({ q: symbol + ' scam', count: 20 });
        const scamMentions = tweets.filter((t: any) => /scam|rug|fraud|hack/i.test(t.text)).length;
        if (scamMentions > 2) {
          risk = 'high';
          reasons.push('Multiple scam-related mentions on Twitter.');
        }
      }
    } catch {}

    return { message: 'Scam check completed.', risk, reasons };
  }

  async predict({ chain, address, symbol, period = 14, plugins }: any) {
  const [ta, trends, sentiment] = await Promise.all([
    this.technicalAnalysis({ chain, address, period }),
    this.marketTrends({ chain, address }),
    this.sentimentAnalysis({ query: symbol, plugins })
  ]);

  let score = 0;

  // Check if TA result is valid
  if (typeof ta !== 'string' && ta.rsi) {
    if (ta.rsi[ta.rsi.length - 1] > 60) score++;
    if (ta.rsi[ta.rsi.length - 1] < 40) score--;
  }

  // Check if marketTrends result is valid
  if (typeof trends !== 'string') {
    if (trends.trend === 'uptrend') score++;
    if (trends.trend === 'downtrend') score--;
  }

  if (sentiment.summary === 'positive') score++;
  if (sentiment.summary === 'negative') score--;

  let prediction = 'neutral';
  if (score > 1) prediction = 'bullish';
  else if (score < -1) prediction = 'bearish';

  return {
    message: 'Prediction complete.',
    prediction,
    details: { technicals: ta, trends, sentiment }
  };
 }
}