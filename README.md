# <p align="center"><b>Teh Broke Bots Ultimate Solana DeFi Plugin for ElizaOS Agents</b></p>

<p align="center">
  <img src="./images/teh-broke-bots-logo.png" alt="Teh Broke Bot" width="600" />
</p>


---

##<b>🔮 Features</b>

- **Real-time Solana token data**: Price, volume, liquidity from DexScreener and Solscan (CoinMarketCap fallback optional).  
- **Technical indicators**: RSI, moving averages, Bollinger Bands.  
- **Scam/rug checks**: Alerts for low liquidity or centralized holders.  
- **Portfolio tracker**: SPL token balances and USD value for Solana wallets.  
- **Twitter/X sentiment**: Direct, authentic sentiment analysis via Twitter API plugin.  
- **Jupiter swaps & strategies**: Automated trading, staking, arbitrage, meme/degen trades, and DAO investments using Jupiter Aggregator.  
- **Agent-ready commands**: Fully async, callable actions (see below).  
- **No paid APIs required**: Uses free APIs (DexScreener, Solscan, Jupiter) with optional CoinMarketCap fallback.  

-------

##📦 Installation
Manual Setup (Local Plugin Use via Git)

1. Clone the plugin repository
git clone https://github.com/tehbrokebots/tehbrokebotultimate.git

2.

cp -r tehbrokebotultimate <your-elizaos-project>/plugins/

3.

Navigate to the plugin directory:

cd <your-elizaos-project>/plugins/tehbrokebotultimate

npm install

4.
npm run build

5.

In your ElizaOS character or global configuration file, add the plugin package:

import tehbrokebotUltimatePlugin from '@elizaos/plugin-tehbrokebotultimate';

export const plugins = [tehbrokebotUltimatePlugin];

6.

Create a .env file in your ElizaOS project root based on .env.example and fill in required keys.

## Install via Plugin Registry (Install by adding to character file)
If the plugin is published to the ElizaOS Plugin Registry, install it by adding the plugin name to your agent character configuration:

{
  "name": "MyAgent",
  
  "plugins": ["@elizaos/plugin-tehbrokebotultimate"],  
  "settings": {
  
    "tehbrokebotultimate": {
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
For local manual installs, remember to restart your ElizaOS agent after adding the plugin and building.
Keep dependencies up to date with npm update inside the plugin folder as needed.
Use npm run test to verify tests before deployment.

--------

##🔐<b>Environment Variables</b>

Create a .env file with the following variables (refer to .env.example for format):

##PRIVATE_KEY=your_private_key

##SOLANA_RPC=https://api.mainnet-beta.solana.com (or whichever RPC provider you choose)

##COINMARKETCAP_API_KEY=Optional only used as a fall back (The free API will work)

##AUTO_TRADE_ENABLED=true/false

##AUTO_BUY_SELL_INTERVAL_MS=Interval for auto trading in milliseconds

##ARBITRAGE_SPREAD_THRESHOLD=Min price spread ratio for arbitrage trigger

##TWITTER_API_KEY=your_twitter_api_key

##TWITTER_API_SECRET=your_twitter_api_secret

##TWITTER_ACCESS_TOKEN=your_access_token

##TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

##TELEGRAM_BOT_TOKEN=your_bot_token

##TELEGRAM_CHAT_ID=your_chat_id

---------

##🚀 <b>Available Actions</b>

Invoke via your agent’s API using action names:

<b>/predict_token</b> — Run AI fusion of RSI, sentiment, volume, and trends.

<b>/jupiter_swap</b> — Execute a token swap via Jupiter Aggregator.

<b>/check_token</b> — Check rug/scam risks including liquidity and holder concentration.

<b>/strategy_safe</b> — Safe trade: e.g., SOL→USDC with optional profit/loss limits.

<b>/strategy_degen</b> — Degen YOLO trade on Pump.fun newly created tokens.

<b>/strategy_arb</b> — Arbitrage trading across Solana token pairs.

<b>/strategy_dao</b> — Hedge mode: Invest in Solana DAOs.

<b>/portfolio_tracker</b> — Get wallet portfolio balances and USD value.
Note: Most trading actions require stop loss and take profit parameters plus user confirmation before on-chain transactions.

-----------------

##🧠<b> AI Prediction System Description Combines:</b>

RSI analysis (30% weight)

Twitter sentiment (30% weight)

Volume spikes (20% weight)

Market trends (20% weight)

Produces LONG/SHORT/HOLD signals with confidence scores.

##<b> 🧬 License</b>

MIT — Use, fork, and upgrade. Tag @TehBrokeBots with your memes.

------

##📁 Project Structure

tehbrokebotultimate/

├── images/

│   ├── logo.png               # 400x400px square logo

│   ├── banner.png             # 1280x640px banner image

│   └── screenshots/           # Optional feature screenshots

├── src/

│   ├── actions.ts             # Core plugin actions (swaps, portfolio, sentiment, etc.)

│   ├── evaluators/

│   │   └── predict.ts         # Prediction logic combining indicators and sentiment

│   ├── providers/

│   │   ├── dexscreener.ts     # DexScreener API integration

│   │   ├── jupiter.ts         # Jupiter Aggregator API integration

│   │   ├── orca.ts            # Orca DEX data fetching

│   │   ├── pumpfun.ts         # Pump.fun platform API integration

│   │   ├── raydium.ts         # Raydium API data access

│   │   └── solana.ts          # Solana wallet/transaction utilities

│   ├── strategies/

│   │   ├── arbitrage.ts       # Arbitrage strategy implementation

│   │   ├── dao.ts             # DAO investment strategy

│   │   ├── degen.ts           # Degen trading strategy based on Pump.fun tokens

│   │   └── safe.ts            # Safe trading strategy for SOL/USDC

│   ├── utils.ts               # Utility functions (technical indicators etc.)

│   └── index.ts               # Plugin entry point exporting all actions

├── __tests__/                 # Jest test suites and utilities

│   ├── actions.test.ts

│   ├── evaluators.test.ts

│   ├── providers.test.ts

│   ├── strategies.test.ts

│   ├── e2e.test.ts

│   └── test-utils.ts

├── .env.example               # Sample environment variables template

├── plugin.json                # Plugin metadata and manifest

├── package.json               # NPM dependencies, scripts

├── README.md                  # Plugin documentation and branding

├── tsconfig.json              # TypeScript compiler configuration


-------

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
