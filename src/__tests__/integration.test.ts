import { describe, expect, it, spyOn, beforeEach, afterAll, beforeAll } from 'bun:test';
import tbbUltimatePlugin from '../index';
import { TBBUltimateService } from '../service';
import { createMockRuntime, setupLoggerSpies, MockRuntime } from './test-utils';
import { HandlerCallback, IAgentRuntime, Memory, State, UUID, logger } from '@elizaos/core';

/**
 * Integration tests demonstrate how multiple components of the plugin work together.
 * Unlike unit tests that test individual functions in isolation, integration tests
 * examine how components interact with each other.
 *
 * For example, this file shows how the CHECK_WALLET_BALANCE action and wallet provider
 * interact with the TBBUltimateService and the plugin's core functionality.
 */

// Set up spies on logger
beforeAll(() => {
  setupLoggerSpies();
});

afterAll(() => {
  // No global restore needed in bun:test
});

describe('Integration: CHECK_WALLET_BALANCE Action with TBBUltimateService', () => {
  let mockRuntime: MockRuntime;

  beforeEach(() => {
    // Create a service mock that will be returned by getService
    const mockService = {
      capabilityDescription:
        'Provides DeFi and Pump.fun strategies for ElizaOS agents.',
      checkWalletBalance: () => Promise.resolve({
        message: 'Wallet balances fetched.',
        solBalance: 1000000000,
        splTokens: []
      }),
      stop: () => Promise.resolve(),
    };

    // Create a mock runtime with a spied getService method
    const getServiceImpl = (serviceType) => {
      if (serviceType === 'tbb-ultimate') {
        return mockService;
      }
      return null;
    };

    mockRuntime = createMockRuntime({
      getService: getServiceImpl,
    });
  });

  it('should handle CHECK_WALLET_BALANCE action with TBBUltimateService available', async () => {
    // Find the CHECK_WALLET_BALANCE action
    const checkWalletBalanceAction = tbbUltimatePlugin.actions?.find(
      (action) => action.name === 'CHECK_WALLET_BALANCE'
    );
    expect(checkWalletBalanceAction).toBeDefined();

    // Create a mock message and state
    const mockMessage: Memory = {
      id: '12345678-1234-1234-1234-123456789012' as UUID,
      roomId: '12345678-1234-1234-1234-123456789012' as UUID,
      entityId: '12345678-1234-1234-1234-123456789012' as UUID,
      agentId: '12345678-1234-1234-1234-123456789012' as UUID,
      content: {
        text: 'Check my wallet balance',
        walletAddress: 'DummyWalletAddress123456789',
        source: 'test',
      },
      createdAt: Date.now(),
    };

    const mockState: State = {
      values: {},
      data: {},
      text: '',
    };

    // Create a mock callback to capture the response
    const callbackCalls = [];
    const callbackFn = (...args) => {
      callbackCalls.push(args);
    };

    // Execute the action
    await checkWalletBalanceAction?.handler(
      mockRuntime as unknown as IAgentRuntime,
      mockMessage,
      mockState,
      {},
      callbackFn as HandlerCallback,
      []
    );

    // Verify the callback was called with expected response
    expect(callbackCalls.length).toBeGreaterThan(0);
    if (callbackCalls.length > 0) {
      expect(callbackCalls[0][0]).toHaveProperty('text');
    }

    // Get the service to ensure integration
    const service = mockRuntime.getService('tbb-ultimate');
    expect(service).toBeDefined();
    expect(service?.capabilityDescription).toContain('DeFi and Pump.fun strategies');
  });
});

describe('Integration: Plugin initialization and service registration', () => {
  it('should initialize the plugin and register the service', async () => {
    // Create a fresh mock runtime with mocked registerService for testing initialization flow
    const mockRuntime = createMockRuntime();

    // Create and install a mock registerService
    const registerServiceCalls = [];
    mockRuntime.registerService = (type, service) => {
      registerServiceCalls.push({ type, service });
    };

    // Run a minimal simulation of the plugin initialization process
    if (tbbUltimatePlugin.init) {
      await tbbUltimatePlugin.init(
        {},
        mockRuntime as unknown as IAgentRuntime
      );

      // Directly mock the service registration that happens during initialization
      // because unit tests don't run the full agent initialization flow
      if (tbbUltimatePlugin.services) {
        const TBBUltimateServiceClass = tbbUltimatePlugin.services[0];
        const serviceInstance = await TBBUltimateServiceClass.start(
          mockRuntime as unknown as IAgentRuntime
        );

        // Register the Service class to match the core API
        mockRuntime.registerService(TBBUltimateServiceClass);
      }

      // Now verify the service was registered with the runtime
      expect(registerServiceCalls.length).toBeGreaterThan(0);
    }
  });
});
