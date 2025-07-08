# E2E Tests for TBB Ultimate Plugin

This directory contains end-to-end tests for the TBB Ultimate plugin for ElizaOS.

## Overview

E2E tests run in a real ElizaOS runtime environment, allowing you to test your plugin's behavior as it would work in production.

## Test Structure

- **TbbUltimatePluginTestSuite** - Main test suite containing all e2e tests
  - `basic_plugin_verification` - Verifies plugin is loaded correctly
  - `should_have_key_trading_actions` - Checks registration of key actions (SWAP, BUY, SELL, etc.)
  - `swap_action_test` - Tests the SWAP action functionality
  - `scam_check_action_test` - Tests the SCAM_CHECK action functionality
  - `technical_analysis_action_test` - Tests the TECHNICAL_ANALYSIS action functionality
  - `tbb_ultimate_service_test` - Tests service lifecycle
  - `provider_registration_test` - Verifies provider registration

## Running Tests

```bash
# Run all tests (component + e2e)
npm test

# Run only e2e tests
npm run test:e2e

# Run only component tests
npm run test:component
```

## Implementation Details

1. **Test Export**: Tests are exported through `src/tests.ts` to be included in the plugin build
2. **Plugin Integration**: The test suite is added to the plugin's `tests` array
3. **Runtime Access**: Each test receives a real runtime instance with full access to:
   - Plugin actions, providers, and services
   - Agent character configuration
   - Database and model access

## Known Issues

- The test runner may look for tests on other plugins (e.g., @elizaos/plugin-sql) instead of the current plugin
- TypeScript validation in the test runner may flag type issues that don't affect actual functionality

## Writing New Tests

See the comprehensive documentation at the top of `plugin-tbb-ultimate.ts` for detailed instructions on adding new tests.
