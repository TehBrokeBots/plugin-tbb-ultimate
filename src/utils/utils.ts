// src/utils/utils.ts
import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { IAgentRuntime } from "@elizaos/core";
import { EventEmitter } from "events";
import axios from "axios";
import { Transaction, PublicKey } from "@solana/web3.js";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Asserts that a value is a non-empty string.
 * @param value The value to validate
 * @param fieldName The name of the field for error reporting
 * @throws Error if the value is not a non-empty string
 */
export function assertNonEmptyString(value: string, fieldName: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

/**
 * Creates a mock IAgentRuntime for testing purposes.
 * @returns A mock runtime with jest functions
 */
export function createMockRuntime(): IAgentRuntime {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    getMemory: jest.fn(),
    setMemory: jest.fn(),
  } as unknown as IAgentRuntime;
}

/**
 * Creates a mock memory object for testing.
 * @param data Initial data for the mock memory
 * @returns A mock memory object with get, set, and clear methods
 */
export function createMockMemory(data: Record<string, any> = {}) {
  let memoryData = data;
  return {
    get: jest.fn((key: string) => memoryData[key]),
    set: jest.fn((key: string, value: any) => {
      memoryData[key] = value;
      return true;
    }),
    clear: jest.fn(() => {
      memoryData = {};
    }),
  };
}

/**
 * Creates a mock state object for testing.
 * @param initialState Initial state data
 * @returns A mock state object with getState, setState, and clearState methods
 */
export function createMockState(initialState: Record<string, any> = {}) {
  let stateData = initialState;
  return {
    getState: jest.fn(() => stateData),
    setState: jest.fn((newState: Record<string, any>) => {
      stateData = { ...stateData, ...newState };
      return stateData;
    }),
    clearState: jest.fn(() => {
      stateData = {};
    }),
  };
}

/**
 * Creates a mock service object for testing.
 * @returns A mock service with start, stop, status, and event methods
 */
export function createMockService() {
  return {
    start: jest.fn(),
    stop: jest.fn(),
    status: jest.fn(() => "stopped"),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };
}

/**
 * Sets up a complete test environment with runtime, memory, state, service, and event bus.
 * @returns An object containing all mock components and a resetAllMocks function
 */
export function setupActionTest() {
  const runtime = createMockRuntime();
  const memory = createMockMemory();
  const state = createMockState();
  const service = createMockService();
  const eventBus = new EventEmitter();

  return {
    runtime,
    memory,
    state,
    service,
    eventBus,
    resetAllMocks() {
      jest.clearAllMocks();
    },
  };
}

/**
 * Creates a valid mock Solana transaction for testing.
 * @returns A Transaction object with required fields and a mock sign method
 */
export function createValidMockTransaction(): Transaction {
  const tx = new Transaction();
  tx.recentBlockhash = "EETB7n4XcQJ3NXTfsq3T3u1EWhLbVjmwZCnfsKv2uvCD";
  tx.feePayer = new PublicKey("7sS9M8nYwUvBhBDZqUoZ6ZD4C3tX9D5ZJk2LJxD51L1d");

  tx.add({
    keys: [],
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    data: Buffer.alloc(0),
  });

  tx.sign = () => tx;

  return tx;
}
