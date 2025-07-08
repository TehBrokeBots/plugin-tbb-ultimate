import { TbbUltimatePluginTestSuite } from './__tests__/e2e/plugin-tbb-ultimate';
import { AdditionalActionTests } from './__tests__/e2e/additional-actions';

// Export both test suites as an array
export default [TbbUltimatePluginTestSuite, AdditionalActionTests] as any[];

// Also export individual test suites for direct access if needed
export { TbbUltimatePluginTestSuite, AdditionalActionTests };
