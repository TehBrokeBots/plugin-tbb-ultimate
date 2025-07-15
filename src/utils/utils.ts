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

export function assertNonEmptyString(value: string, fieldName: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

export function createMockRuntime(): IAgentRuntime {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    getMemory: jest.fn(),
    setMemory: jest.fn(),
  } as unknown as IAgentRuntime;
}

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
