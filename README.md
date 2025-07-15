# <p align="center"><b>Teh Broke Bots Ultimate Solana DeFi Plugin for ElizaOS Agents</b></p>

<p align="center">
  <img src="./images/teh-broke-bots-logo.jpg" alt="Teh Broke Bot" width="600" />
</p>

---

## <b>🔮 Features</b>

- **Real-time Solana token data**: Price, volume, liquidity from DexScreener and CoinMarketCap as an optional fallback.
- **Technical indicators**: RSI, MACD, moving averages, Bollinger Bands, and trend detection.
- **Scam/rug checks**: On-chain and social risk analysis (liquidity, holders, mint authority, Twitter sentiment, liquidity lock).
- **Portfolio tracker**: SOL and SPL token balances, USD value, and wallet analytics.
- **Twitter/X sentiment**: Direct, authentic sentiment analysis and scam detection via @elizaos/plugin-twitter
- **Jupiter swaps & strategies**: Automated trading, arbitrage, meme/degen trades, and DAO investment using Jupiter Aggregator.
- **Predictive AI trading**: AI-powered predictions Bullish/Bearish/Neutral. buy/sell, stop loss/take profit, and auto-trading for any token.
- **Agent-ready commands**: Fully async, callable actions for all features (see below).
- **No paid APIs required**: Uses free APIs (DexScreener, Orca, Raydium, Jupiter, Pump.fun) with optional CoinMarketCap(still doesnt require the paid API) fallback.

---

## 🚀 <b>Full Action & Usage Guide</b>

### 🔄 **Trading & Portfolio Actions**
- **Swap**: `/swap` — Instantly swap any two Solana tokens using Jupiter. Params: `inputMint`, `outputMint`, `amount`, `slippageBps?`
- **Buy/Sell**: `/buy` or `/sell` — Buy or sell tokens. Params: `tokenMint`, `amount`
- **Portfolio Tracker**: `/portfolio_tracker` — Get wallet balances and USD value. Params: `walletAddress`
- **Check Wallet Balance**: `/check_wallet_balance` — Quick SOL/token balance check. Params: `walletAddress`

### 🛡️ **Risk & Scam Detection**
- **Scam Check**: `/scam_check` — Analyze token for rug/scam risk using on-chain and Twitter data. Params: `chain`, `address`, `symbol?`
- **Liquidity & Holder Analysis**: Built into scam check and portfolio tools.

### 📈 **Analysis Tools**
- **Sentiment Analysis**: `/sentiment_analysis` — Twitter/X sentiment for any symbol. Params: `symbol`
- **Technical Analysis**: `/technical_analysis` — RSI, MACD, Bollinger Bands. Params: `prices[]`
- **Market Trends**: `/market_trends` — 7-day price change, volume spikes, trend. Params: `chain`, `address`

### 🤖 **Automated & Strategy Trading**
- **Safe Strategy**: `/safe_strategy` — Trade SOL/USDC with stop loss/take profit. Params: `tokenMint`, `amount`, `stopLossPercent`, `takeProfitPercent`, `confirm`, `exitTo?`, `monitorIntervalSec?`
- **Degen Strategy**: `/degen_strategy` — YOLO trade on new Pump.fun tokens. Params: `amount`, `stopLossPercent`, `takeProfitPercent`, `confirm`, `exitTo?`, `monitorIntervalSec?`
- **Arbitrage Strategy**: `/arbitrage_strategy` — Arbitrage between Jupiter, Orca, Raydium. Params: `tokenMintA`, `tokenMintB`, `tradeAmountLamports?`, `stopLossPercent?`, `takeProfitPercent?`, `confirm`, `exitTo?`, `monitorIntervalSec?`
- **DAO Strategy**: `/dao_strategy` — Invest Teh Broke Bot DAO. Params: `amount`, `confirm`, `exitTo?`, `monitorIntervalSec?`
- **Predictive Strategy**: `/predictive_strategy` — AI-powered Bullish/Bearish/Neutral Predictions. buy/sell any token based on Ai prediction with stop loss/take profit, auto-trading, and user confirmation for initial trade. Params: `tokenMint`, `symbol`, `amount`, `stopLossPercent`, `takeProfitPercent`, `confirm`, `autoTrade?`, `exitTo?`, `monitorIntervalSec?`
- **Auto Buy/Sell**: `/start_auto_buy_sell` and `/stop_auto_buy_sell` — Start/stop recurring automated trades. Params: `tokenMint`, `action`, `amount`

### 🧩 **Providers & Integrations**
- **Solana**: On-chain data, wallet, and transaction utilities.
- **Dexscreener**: Real-time price, liquidity, and volume for any token.
- **Pump.fun**: New token discovery, trading, and creation.
- **Twitter**: Sentiment, scam detection, and social signals.
- **Jupiter**: Best price routing for swaps and trades.
- **Knowledge**: PDF and file-based knowledge for advanced queries.

### 🧠 **How to Use**
- **All actions are available via the ElizaOS agent API, Telegram, or Twitter (if enabled).**
- **Most trading actions require wallet signing and user confirmation for the initial trade.**
- **Stop loss/take profit, exit token, and monitoring intervals are supported for all strategies.**
- **Scam check, sentiment, and technical analysis can be run on any token or symbol.**
- **Automated trading and predictive strategies can be enabled/disabled via environment variables.**

---

##📦 Installation

Manual Setup (Local Plugin Use via Git)

1. Clone the plugin repository
   git clone https://github.com/tehbrokebots/tehbrokebotultimate.git
2. cp -r tehbrokebotultimate <your-elizaos-project>/plugins/
3. cd <your-elizaos-project>/plugins/tehbrokebotultimate
   npm install
4. npm run build
5. In your ElizaOS character or global configuration file, add the plugin package:
   import tehbrokebotUltimatePlugin from '@elizaos/plugin-tehbrokebotultimate';
   export const plugins = [tbbUltimatePlugin];
6. Create a .env file in your ElizaOS project root based on .env.example and fill in required keys.

## Install via Plugin Registry (Install by adding to character file)
If the plugin is published to the ElizaOS Plugin Registry, install it by adding the plugin name to your agent character configuration:

{
  "name": "MyAgent",
  "plugins": ["@elizaos/plugin-tbb-ultimate"],
  "settings": {
    "tbb-ultimate": {
      // plugin-specific settings go here
    },
    "secrets": {
      "PRIVATE_KEY": "[your wallet secret]",
      "SOLANA_RPC": "https://api.mainnet-beta.solana.com",
      "COINMARKETCAP_API_KEY": "your-api-key-if-used",
      "AUTO_TRADE_ENABLED": "true"
      // other environment variables as needed
    }
  }
}

ElizaOS will auto-install and configure the plugin on agent startup.
Be sure to configure required secrets in the "secrets" section.

## <b>Notes</b>
- For local manual installs, remember to restart your ElizaOS agent after adding the plugin and building.
- Keep dependencies up to date with npm update inside the plugin folder as needed.
- Use npm run test to verify tests before deployment.

---

##🔐<b>Environment Variables</b>

Create a .env file with the following variables (refer to .env.example for format):

- PRIVATE_KEY=your_private_key
- SOLANA_RPC=https://api.mainnet-beta.solana.com (or whichever RPC provider you choose)
- COINMARKETCAP_API_KEY=Optional only used as a fall back (The free API will work)
- AUTO_TRADE_ENABLED=true/false
- AUTO_BUY_SELL_INTERVAL_MS=Interval for auto trading in milliseconds
- ARBITRAGE_SPREAD_THRESHOLD=Min price spread ratio for arbitrage trigger
- TWITTER_API_KEY=your_twitter_api_key
- TWITTER_API_SECRET=your_twitter_api_secret
- TWITTER_ACCESS_TOKEN=your_access_token
- TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
- TELEGRAM_BOT_TOKEN=your_bot_token
- TELEGRAM_CHAT_ID=your_chat_id

---

##💬 <b>Community</b>

 X: @TehBrokeBots https://x.com/TehBrokeBots
 Telegram: @TehBrokeBotCoin
 Discord: https://discord.gg/zeV236kW
 And dont forget to join our DAO us on daos.fun https://daos.fun/AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos and let your voice be heard! 

---------------------------

<p align="center"><b>      Built with 💚 </b></p>
<p align="center"><b>   For Teh Broke Bot Fam </b></p>
  <p align="center"><b>          +        </b></p>                             
<p align="center"><b>All Teh Broke Bots like me</b></p>

##<b> 🧬 License</b>

MIT — Use, fork, and upgrade. Tag @TehBrokeBots with your memes.
