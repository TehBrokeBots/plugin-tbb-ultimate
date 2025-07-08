import { IAgentRuntime, Memory, State, UUID, logger } from '@elizaos/core';
import { spyOn } from 'bun:test';

/**
 * Test utilities for integration and unit tests
 */

export type MockRuntime = {
  getService: (serviceType: string) => any;
  registerService: (type: any, service?: any) => void;
  [key: string]: any;
};

/**
 * Creates a mock runtime for testing
 */
export function createMockRuntime(overrides: Partial<MockRuntime> = {}): MockRuntime {
  return {
    getService: (serviceType: string) => null,
    registerService: (type: any, service?: any) => {},
    ...overrides
  };
}

/**
 * Sets up spies on the logger for testing
 */
export function setupLoggerSpies() {
  // Mock logger methods
  spyOn(logger, 'debug');
  spyOn(logger, 'info');
  spyOn(logger, 'warn');
  spyOn(logger, 'error');
}