import { describe, expect, it, spyOn, beforeEach, afterEach, beforeAll, afterAll } from 'bun:test';
import tbbUltimatePlugin from '../index';
import { TBBUltimateService } from '../service';
import { ModelType, logger } from '@elizaos/core';
import dotenv from 'dotenv';

// Setup environment variables
dotenv.config();

// Need to spy on logger for documentation
beforeAll(() => {
  spyOn(logger, 'info');
  spyOn(logger, 'error');
  spyOn(logger, 'warn');
  spyOn(logger, 'debug');
});

afterAll(() => {
  // No global restore needed in bun:test
});

// Create a real runtime for testing
function createRealRuntime() {
  const services = new Map();

  // Create a real service instance if needed
  const createService = (serviceType: string) => {
    if (serviceType === TBBUltimateService.serviceType) {
      return new TBBUltimateService({
        character: {
          name: 'Test Character',
          system: 'You are a helpful assistant for testing.',
        },
      } as any);
    }
    return null;
  };

  return {
    character: {
      name: 'Test Character',
      system: 'You are a helpful assistant for testing.',
      plugins: [],
      settings: {},
    },
    getSetting: (key: string) => null,
    models: tbbUltimatePlugin.models,
    db: {
      get: async (key: string) => null,
      set: async (key: string, value: any) => true,
      delete: async (key: string) => true,
      getKeys: async (pattern: string) => [],
    },
    getService: (serviceType: string) => {
      // Log the service request for debugging
      logger.debug(`Requesting service: ${serviceType}`);

      // Get from cache or create new
      if (!services.has(serviceType)) {
        logger.debug(`Creating new service: ${serviceType}`);
        services.set(serviceType, createService(serviceType));
      }

      return services.get(serviceType);
    },
    registerService: (serviceType: string, service: any) => {
      logger.debug(`Registering service: ${serviceType}`);
      services.set(serviceType, service);
    },
  };
}

describe('Plugin Configuration', () => {
  it('should have correct plugin metadata', () => {
    expect(tbbUltimatePlugin.name).toBe('tbb-ultimate');
    expect(tbbUltimatePlugin.description).toBe('DeFi, trading, and analytics plugin for ElizaOS');
    expect(tbbUltimatePlugin.services).toBeDefined();
  });

  it('should have actions defined', () => {
    expect(tbbUltimatePlugin.actions).toBeDefined();
    expect(Array.isArray(tbbUltimatePlugin.actions)).toBe(true);
    expect(tbbUltimatePlugin.actions.length).toBeGreaterThan(0);
  });

  it('should initialize properly', async () => {
    // Initialize with config - using real runtime
    const runtime = createRealRuntime();

    if (tbbUltimatePlugin.init) {
      await tbbUltimatePlugin.init({}, runtime as any);
      expect(true).toBe(true); // If we got here, init succeeded
    }
  });
});

describe('TBBUltimateService', () => {
  it('should start the service', async () => {
    const runtime = createRealRuntime();
    const startResult = await TBBUltimateService.start(runtime as any);

    expect(startResult).toBeDefined();
    expect(startResult.constructor.name).toBe('TBBUltimateService');

    // Test real functionality - check stop method is available
    expect(typeof startResult.stop).toBe('function');
  });

  it('should stop the service', async () => {
    const runtime = createRealRuntime();

    // Register a real service first
    const service = new TBBUltimateService(runtime as any);
    runtime.registerService(TBBUltimateService.serviceType, service);

    // Spy on the real service's stop method
    const stopSpy = spyOn(service, 'stop');

    // Call the static stop method
    await TBBUltimateService.stop(runtime as any);

    // Verify the service's stop method was called
    expect(stopSpy).toHaveBeenCalled();
  });

  it('should throw an error when stopping a non-existent service', async () => {
    const runtime = createRealRuntime();
    // Don't register a service, so getService will return null

    // We'll patch the getService function to ensure it returns null
    const originalGetService = runtime.getService;
    runtime.getService = () => null;

    await expect(TBBUltimateService.stop(runtime as any)).rejects.toThrow();

    // Restore original getService function
    runtime.getService = originalGetService;
  });
});
