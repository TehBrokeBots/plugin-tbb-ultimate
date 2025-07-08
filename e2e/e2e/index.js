// Entry point for e2e tests
// This file is used by the ElizaOS test runner to find the e2e tests

// Import the test suites
import { TbbUltimatePluginTestSuite } from '../../src/__tests__/e2e/plugin-tbb-ultimate.js';
import { AdditionalActionTests } from '../../src/__tests__/e2e/additional-actions.js';

// Export the test suites
export default [TbbUltimatePluginTestSuite, AdditionalActionTests];
export { TbbUltimatePluginTestSuite, AdditionalActionTests };