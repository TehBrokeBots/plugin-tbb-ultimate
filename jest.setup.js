// Jest setup file for Bun compatibility

// Disable automatic mocking
jest.autoMockOff();

// Mock problematic global objects
global.ReadableStreamBYOBReader = class MockReadableStreamBYOBReader {
  get closed() { return Promise.resolve(); }
};

global.ReadableStreamDefaultReader = class MockReadableStreamDefaultReader {
  get closed() { return Promise.resolve(); }
};

global.WritableStreamDefaultWriter = class MockWritableStreamDefaultWriter {
  get closed() { return Promise.resolve(); }
  get ready() { return Promise.resolve(); }
};

// Suppress specific warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('PRIVATE_KEY environment variable not set')) {
    return; // Suppress our own warning
  }
  originalWarn(...args);
};