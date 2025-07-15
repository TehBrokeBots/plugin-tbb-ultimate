module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    testPathIgnorePatterns: [
      '/jest.component.config.js',
      '/jest.e2e.config.js',
      '/test-utils.ts',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testTimeout: 10000,
    // Disable automatic mocking of native modules
    automock: false,
    resetMocks: false,
    restoreMocks: false,
  };