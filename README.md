#<p align="center"><b> TBB-Ultimate Solana Plugin for ElizaOS</b></p>

<p align="center">
  <img src="./teh-broke-bots-logo.png" alt="Teh Broke Bot" width="600" />
</p>

<p align="center">

<p align="center"> <b>“By Teh Rugged, For Teh Rugged" 💚</b> </p>
<p align="center"><b>*****For Teh Broke Bots l</b>ike me*****

---

## 🚀 Features

1. Wallet integration using @solana/kit and @solana/web3.js for all on-chain actions
2. Swaps, buy/sell, and wallet balance checks using Jupiter Ultra API
3. Degen meme trading, token creation, and real-time data with Pump.fun (now with wallet signing/sending if supported)
4. Real-time crypto data and price history from Dexscreener
5. Technical analysis: RSI, moving averages, Bollinger Bands
6. Portfolio tracker with live USD values
7. Market trends: 7-day price change, volume spikes, trend summary
8. Sentiment analysis using X (Twitter) via elizaos/plugin-twitter
9. Four trading strategies: degen, arbitrage, safe, DAO
10. Scam check: liquidity, mint authority, dev wallet %, scam mentions, locked liquidity
11. Predict feature: combines TA, trends, and sentiment for a token outlook
**User confirmation for all on-chain actions**
**Stop loss/take profit for every trade strategy**

---

## 📦 Installation

1. Place this plugin folder in your ElizaOS plugins directory.
2. Run `npm install` or `pnpm install` to install dependencies.
3. Build the plugin: `npm run build` or `pnpm build`
4. Enable the plugin in your ElizaOS agent configuration.

---

## ⚙️ Environment Variables

No environment variables are required for basic usage. If you add API keys or custom endpoints, document them here.

---

## 🛠️ Actions

| Action                | Description                                                                 |
|-----------------------|-----------------------------------------------------------------------------|
| swap                  | Swap tokens using Jupiter API (wallet required for signing)                  |
| buy                   | Buy tokens using Jupiter API (wallet required for signing)                   |
| sell                  | Sell tokens using Jupiter API (wallet required for signing)                  |
| checkWalletBalance    | Check SOL and SPL token balances for a wallet                                |
| pumpFunTrade          | Buy/sell tokens on Pump.fun (wallet signing/sending if transaction returned) |
| createPumpFunToken    | Create a new token on Pump.fun (wallet signing/sending if transaction returned) |
| getPumpFunData        | Fetch real-time data for a Pump.fun token                                    |
| getDexscreenerData    | Fetch token or pair data from Dexscreener                                    |
| technicalAnalysis     | Perform RSI, moving averages, Bollinger Bands analysis                       |
| portfolioTracker      | Track wallet portfolio value in SOL and USD                                  |
| marketTrends          | Analyze 7-day price change, volume spikes, and trend                         |
| sentimentAnalysis     | Analyze sentiment using X (Twitter)                                          |
| degenStrategy         | Degen trading strategy using Pump.fun                                        |
| arbitrageStrategy     | Arbitrage strategy (Jupiter/Orca)                                            |
| safeStrategy          | Safe trading strategy (SOL/USDC only)                                        |
| daoStrategy           | Buy Teh Broke Bots DAO token (wallet required for signing)                   |
| scamCheck             | Check a token for scam indicators                                            |
| predict               | Predict token outlook (TA + trends + sentiment)                              |

---

## 🔑 Wallet Integration

- All on-chain actions (swap, buy, sell, Pump.fun trades, DAO strategy, etc.) require a connected Solana wallet.
- The plugin uses @solana/kit and @solana/web3.js for transaction signing and sending.
- For Pump.fun actions, if a serialized transaction is returned, it will be signed and sent using your wallet.
- Make sure your wallet is connected and has sufficient SOL for transaction fees.

---

## License

MIT License

---

## 💬 Community

- **X:** [@TehBrokeBots](https://x.com/TehBrokeBots)
- **Telegram:** [@TehBrokeBotCoin](https://t.me/TehBrokeBotCoin)
- **Discord:** [https://discord.gg/zeV236kW](https://discord.gg/zeV236kW)

And don't forget to join our DAO on [daos.fun](https://daos.fun/AbD84YXFFGSDiJ8hQtNm8cdKyTBB4o3PGrEjLJ9gdaos) and let your voice be heard!
