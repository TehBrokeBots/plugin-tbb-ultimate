import { type Plugin } from '@elizaos/core';
import { TBBUltimateService } from './service';
import { dexscreenerProvider, pumpfunProvider, solanaProvider } from './providers';
import { swapAction } from './actions/swap';
import { buyAction } from './actions/buy';
import { sellAction } from './actions/sell';
import { checkWalletBalanceAction } from './actions/checkWalletBalance';
import { pumpFunTradeAction } from './actions/pumpFunTrade';
import { createPumpFunTokenAction } from './actions/createPumpFunToken';
import { getPumpFunDataAction } from './actions/getPumpFunData';
import { getDexscreenerDataAction } from './actions/getDexscreenerData';
import { technicalAnalysisAction } from './actions/technicalAnalysis';
import { portfolioTrackerAction } from './actions/portfolioTracker';
import { marketTrendsAction } from './actions/marketTrends';
import { sentimentAnalysisAction } from './actions/sentimentAnalysis';
import { degenStrategyAction } from './actions/degenStrategy';
import { arbitrageStrategyAction } from './actions/arbitrageStrategy';
import { safeStrategyAction } from './actions/safeStrategy';
import { daoStrategyAction } from './actions/daoStrategy';
import { scamCheckAction } from './actions/scamCheck';
import { predictAction } from './actions/predict';
import testSuites from './tests';

const tbbUltimatePlugin: Plugin = {
  name: 'tbb-ultimate',
  description: 'DeFi, trading, and analytics plugin for ElizaOS',
  services: [TBBUltimateService],
  actions: [
    swapAction,
    buyAction,
    sellAction,
    checkWalletBalanceAction,
    pumpFunTradeAction,
    createPumpFunTokenAction,
    getPumpFunDataAction,
    getDexscreenerDataAction,
    technicalAnalysisAction,
    portfolioTrackerAction,
    marketTrendsAction,
    sentimentAnalysisAction,
    degenStrategyAction,
    arbitrageStrategyAction,
    safeStrategyAction,
    daoStrategyAction,
    scamCheckAction,
    predictAction,
  ],
  tests: testSuites,
  providers: [dexscreenerProvider, pumpfunProvider, solanaProvider],
};

export default tbbUltimatePlugin;
