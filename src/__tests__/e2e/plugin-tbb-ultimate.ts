import { type Content, type HandlerCallback } from '@elizaos/core';

/**
 * E2E (End-to-End) Test Suite for TBB Ultimate Plugin
 * ===================================================
 *
 * This file contains end-to-end tests that run within a real ElizaOS runtime environment.
 * Unlike unit tests that test individual components in isolation, e2e tests validate
 * the entire plugin behavior in a production-like environment.
 *
 * NOTE: The tests are properly structured and included in the plugin build.
 * If the test runner is not detecting these tests, it may be looking at the wrong
 * plugin name or there may be a test runner configuration issue. The tests are
 * exported correctly through src/tests.ts and included in the plugin's tests array.
 *
 * HOW E2E TESTS WORK:
 * -------------------
 * 1. Tests are executed by the ElizaOS test runner using `elizaos test e2e`
 * 2. Each test receives a real runtime instance with the plugin loaded
 * 3. Tests can interact with the runtime just like in production
 * 4. Tests throw errors to indicate failure (no assertion library needed)
 *
 * WRITING NEW E2E TESTS:
 * ----------------------
 * 1. Add a new test object to the `tests` array below
 * 2. Each test must have:
 *    - `name`: A unique identifier for the test
 *    - `fn`: An async function that receives the runtime and performs the test
 *
 * Example structure:
 * ```typescript
 * {
 *   name: 'my_new_test',
 *   fn: async (runtime) => {
 *     // Your test logic here
 *     if (someCondition !== expected) {
 *       throw new Error('Test failed: reason');
 *     }
 *   }
 * }
 * ```
 *
 * BEST PRACTICES:
 * ---------------
 * - Test real user scenarios, not implementation details
 * - Use descriptive test names that explain what's being tested
 * - Include clear error messages that help diagnose failures
 * - Test both success and failure paths
 * - Clean up any resources created during tests
 *
 * AVAILABLE RUNTIME METHODS:
 * --------------------------
 * - runtime.getService(type): Get a service instance
 * - runtime.character: Access character configuration
 * - runtime.models: Access AI models
 * - runtime.db: Access database methods
 * - runtime.actions: Access registered actions
 * - runtime.providers: Access registered providers
 *
 * For more details, see the ElizaOS documentation.
 */

// Define a minimal TestSuite interface that matches what's needed
interface TestSuite {
  name: string;
  description?: string;
  tests: Array<{
    name: string;
    fn: (runtime: any) => Promise<any>;
  }>;
}

// Define minimal interfaces for the types we need
type UUID = `${string}-${string}-${string}-${string}-${string}`;

interface Memory {
  entityId: UUID;
  roomId: UUID;
  content: {
    text: string;
    source: string;
    actions?: string[];
  };
}

interface State {
  values: Record<string, any>;
  data: Record<string, any>;
  text: string;
}

export const TbbUltimatePluginTestSuite: TestSuite = {
  name: 'plugin_tbb_ultimate_test_suite',
  description: 'E2E tests for the tbb-ultimate plugin',

  tests: [
    /**
     * Basic Plugin Verification Test
     * ------------------------------
     * This test verifies that the plugin is properly loaded and initialized
     * within the runtime environment.
     */
    {
      name: 'basic_plugin_verification',
      fn: async (runtime) => {
        // Test the character name (optional, can be removed if not relevant)
        if (!runtime.character || !runtime.character.name) {
          throw new Error('Character not found in runtime');
        }
        // Verify the plugin is loaded properly
        const service = runtime.getService('tbb-ultimate');
        if (!service) {
          throw new Error('TBBUltimateService not found');
        }
      },
    },

    /**
     * Action Registration Test
     * ------------------------
     * Verifies that key actions are properly registered with the runtime.
     */
    {
      name: 'should_have_key_trading_actions',
      fn: async (runtime) => {
        // Check for trading actions
        const swapExists = runtime.actions?.some((a) => a.name === 'SWAP');
        const buyExists = runtime.actions?.some((a) => a.name === 'BUY');
        const sellExists = runtime.actions?.some((a) => a.name === 'SELL');
        
        // Check for analysis actions
        const scamCheckExists = runtime.actions?.some((a) => a.name === 'SCAM_CHECK');
        const technicalAnalysisExists = runtime.actions?.some((a) => a.name === 'TECHNICAL_ANALYSIS');
        
        // Check for strategy actions
        const degenStrategyExists = runtime.actions?.some((a) => a.name === 'DEGEN_STRATEGY');
        
        if (!swapExists) {
          throw new Error('SWAP action not found in runtime actions');
        }
        if (!buyExists) {
          throw new Error('BUY action not found in runtime actions');
        }
        if (!sellExists) {
          throw new Error('SELL action not found in runtime actions');
        }
        if (!scamCheckExists) {
          throw new Error('SCAM_CHECK action not found in runtime actions');
        }
        if (!technicalAnalysisExists) {
          throw new Error('TECHNICAL_ANALYSIS action not found in runtime actions');
        }
        if (!degenStrategyExists) {
          throw new Error('DEGEN_STRATEGY action not found in runtime actions');
        }
      },
    },

    /**
     * SWAP Action Response Test
     * -------------------------
     * This test simulates a SWAP action and checks for a valid response structure.
     */
    {
      name: 'swap_action_test',
      fn: async (runtime) => {
        const swapAction = runtime.actions?.find((a) => a.name === 'SWAP');
        if (!swapAction) {
          throw new Error('SWAP action not found in runtime actions');
        }
        const testMessage: Memory = {
          entityId: '12345678-1234-1234-1234-123456789012' as UUID,
          roomId: '12345678-1234-1234-1234-123456789012' as UUID,
          content: {
            text: 'Swap test',
            source: 'test',
            inputMint: 'So11111111111111111111111111111111111111112',
            outputMint: 'Es9vMFrzaCERZ6t5gFRCJpJkFGr2PdtbWg5F7xr5Pehk',
            amount: 1000000,
            userPublicKey: 'TestUserPubKey',
          },
        } as any;
        const testState: State = { values: {}, data: {}, text: '' };
        let response: any = null;
        const callback: HandlerCallback = async (resp: Content) => {
          response = resp;
          return Promise.resolve([]);
        };
        await swapAction.handler(runtime, testMessage, testState, {}, callback);
        if (!response || !response.text) {
          throw new Error('SWAP action did not produce a valid response');
        }
      },
    },

    /**
     * SCAM_CHECK Action Response Test
     * -------------------------------
     * This test simulates a SCAM_CHECK action and checks for a valid response structure.
     */
    {
      name: 'scam_check_action_test',
      fn: async (runtime) => {
        const scamCheckAction = runtime.actions?.find((a) => a.name === 'SCAM_CHECK');
        if (!scamCheckAction) {
          throw new Error('SCAM_CHECK action not found in runtime actions');
        }
        const testMessage: Memory = {
          entityId: '12345678-1234-1234-1234-123456789012' as UUID,
          roomId: '12345678-1234-1234-1234-123456789012' as UUID,
          content: {
            text: 'Check if this token is a scam',
            source: 'test',
            chain: 'solana',
            address: 'So11111111111111111111111111111111111111112', // SOL token address
            symbol: 'SOL',
          },
        } as any;
        const testState: State = { values: {}, data: {}, text: '' };
        let response: any = null;
        const callback: HandlerCallback = async (resp: Content) => {
          response = resp;
          return Promise.resolve([]);
        };
        await scamCheckAction.handler(runtime, testMessage, testState, {}, callback);
        if (!response || !response.text) {
          throw new Error('SCAM_CHECK action did not produce a valid response');
        }
      },
    },

    /**
     * TECHNICAL_ANALYSIS Action Response Test
     * --------------------------------------
     * This test simulates a TECHNICAL_ANALYSIS action and checks for a valid response structure.
     */
    {
      name: 'technical_analysis_action_test',
      fn: async (runtime) => {
        const taAction = runtime.actions?.find((a) => a.name === 'TECHNICAL_ANALYSIS');
        if (!taAction) {
          throw new Error('TECHNICAL_ANALYSIS action not found in runtime actions');
        }
        const testMessage: Memory = {
          entityId: '12345678-1234-1234-1234-123456789012' as UUID,
          roomId: '12345678-1234-1234-1234-123456789012' as UUID,
          content: {
            text: 'Analyze this token',
            source: 'test',
            chain: 'solana',
            address: 'So11111111111111111111111111111111111111112', // SOL token address
            period: 14,
          },
        } as any;
        const testState: State = { values: {}, data: {}, text: '' };
        let response: any = null;
        const callback: HandlerCallback = async (resp: Content) => {
          response = resp;
          return Promise.resolve([]);
        };
        await taAction.handler(runtime, testMessage, testState, {}, callback);
        if (!response || !response.text) {
          throw new Error('TECHNICAL_ANALYSIS action did not produce a valid response');
        }
      },
    },

    /**
     * Service Lifecycle Test
     * ----------------------
     * Verifies that services can be started, accessed, and stopped properly.
     */
    {
      name: 'tbb_ultimate_service_test',
      fn: async (runtime) => {
        const service = runtime.getService('tbb-ultimate');
        if (!service) {
          throw new Error('TBBUltimateService not found');
        }
        if (
          service.capabilityDescription !==
          'Provides DeFi and Pump.fun strategies for ElizaOS agents.'
        ) {
          throw new Error('Incorrect service capability description');
        }
        await service.stop();
      },
    },

    /**
     * Provider Registration Test
     * -------------------------
     * Verifies that providers are properly registered with the runtime.
     */
    {
      name: 'provider_registration_test',
      fn: async (runtime) => {
        // Check for key providers
        const dexscreenerExists = runtime.providers?.some((p) => p.name === 'DEXSCREENER_PROVIDER');
        const pumpfunExists = runtime.providers?.some((p) => p.name === 'PUMPFUN_PROVIDER');
        const solanaExists = runtime.providers?.some((p) => p.name === 'SOLANA_PROVIDER');
        
        if (!dexscreenerExists) {
          throw new Error('DEXSCREENER_PROVIDER not found in runtime providers');
        }
        if (!pumpfunExists) {
          throw new Error('PUMPFUN_PROVIDER not found in runtime providers');
        }
        if (!solanaExists) {
          throw new Error('SOLANA_PROVIDER not found in runtime providers');
        }
      },
    },
  ],
};

export default TbbUltimatePluginTestSuite;
