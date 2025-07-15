# Plugin TBB Ultimate Tests

This directory contains comprehensive tests for the Teh Broke Bots Ultimate plugin using Jest, following ElizaOS plugin standards.

## Test Structure

- `strategies.test.ts` - Tests for all trading strategies (arbitrage, dao, predictive, degen, safe)
- `actions.test.ts` - Tests for core trading actions (swap, buy, sell, wallet balance, scam check)

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/__tests__/strategies.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Features

- **Jest-compatible**: Uses Jest test runner following ElizaOS plugin standards
- **Comprehensive mocking**: All external dependencies are mocked using Jest mocks
- **Strategy testing**: Tests all 5 trading strategies with new parameters
- **Error handling**: Tests both success and failure scenarios
- **Parameter validation**: Tests default and custom parameters
- **ElizaOS compliance**: Follows plugin testing guidelines and standards

## Mock Strategy

All tests use comprehensive Jest mocks for:
- Solana connection and transactions
- Jupiter API for swaps
- DexScreener for price data
- Orca and Raydium for arbitrage
- PumpFun for degen trading
- AI prediction service

## Test Coverage

- ✅ Arbitrage strategy with spread detection
- ✅ DAO token purchases
- ✅ Predictive AI trading (LONG/SHORT/HOLD)
- ✅ Degen strategy with PumpFun integration
- ✅ Safe strategy with SOL/USDC validation
- ✅ Core trading actions (swap, buy, sell)
- ✅ Wallet balance checking
- ✅ Scam detection and risk assessment
- ✅ User confirmation flows
- ✅ Error handling and edge cases

## ElizaOS Plugin Standards

These tests follow ElizaOS plugin development standards:
- Uses Jest as the testing framework
- Comprehensive mocking of external dependencies
- Tests all exported actions and strategies
- Validates error handling and edge cases
- Follows the plugin's agentConfig structure 