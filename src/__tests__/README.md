# TBB Ultimate Plugin Tests

This directory contains tests for the TBB Ultimate plugin. The tests are organized into several categories to ensure comprehensive coverage of the plugin's functionality.

## Test Structure

The tests are organized as follows:

```
__tests__/
├── README.md                 # This file
├── *.test.ts                 # Unit tests for specific components
├── integration.test.ts       # Integration tests for multiple components
├── cypress/                  # Cypress component tests
│   ├── component/            # Component tests
│   │   ├── *.cy.tsx          # Individual component tests
│   └── support/              # Cypress support files
└── e2e/                      # End-to-end tests
    ├── plugin-tbb-ultimate.ts # Main e2e test suite
    └── additional-actions.ts  # Additional action tests
```

## Types of Tests

### Unit Tests

Unit tests focus on testing individual components in isolation. These tests are named with the pattern `*.test.ts` and are located in the root of the `__tests__` directory. Examples include:

- `dexscreener.test.ts` - Tests for the Dexscreener provider
- `service.test.ts` - Tests for the TBBUltimateService
- `plugin.test.ts` - Tests for the plugin configuration

### Integration Tests

Integration tests examine how multiple components interact with each other. These tests are in `integration.test.ts` and demonstrate how actions, services, and providers work together.

### Cypress Component Tests

Cypress component tests verify that React components render correctly and behave as expected. These tests are located in the `cypress/component/` directory and are named with the pattern `*.cy.tsx`. Examples include:

- `ExampleRoute.cy.tsx` - Tests for the ExampleRoute component
- `PanelComponent.cy.tsx` - Tests for the PanelComponent
- `TimeDisplay.cy.tsx` - Tests for the TimeDisplay component
- `Utils.cy.tsx` - Tests for utility functions

### End-to-End Tests

End-to-end tests validate the entire plugin behavior in a production-like environment. These tests are located in the `e2e/` directory and are structured to run within the ElizaOS runtime. Examples include:

- `plugin-tbb-ultimate.ts` - Main e2e test suite
- `additional-actions.ts` - Tests for additional actions

## Running Tests

### Unit and Integration Tests

To run unit and integration tests:

```bash
cd plugin-tbb-ultimate
bun test
```

### Cypress Component Tests

To run Cypress component tests:

```bash
cd plugin-tbb-ultimate
bun run cypress:component
```

### End-to-End Tests

End-to-end tests are run by the ElizaOS test runner:

```bash
cd plugin-tbb-ultimate
elizaos test e2e
```

## Adding New Tests

### Adding Unit Tests

1. Create a new file in the `__tests__` directory with the name pattern `*.test.ts`
2. Import the component to test
3. Write tests using the Bun test framework (`describe`, `it`, `expect`)

Example:

```typescript
import { describe, expect, it } from 'bun:test';
import { myFunction } from '../src/myModule';

describe('My Module', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

### Adding Cypress Component Tests

1. Create a new file in the `__tests__/cypress/component/` directory with the name pattern `*.cy.tsx`
2. Import the component to test
3. Write tests using the Cypress testing API

Example:

```typescript
import React from 'react';
import { MyComponent } from '../../../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    cy.mount(<MyComponent />);
    cy.get('[data-testid="my-component"]').should('exist');
  });
});
```

### Adding End-to-End Tests

1. Create a new test object in one of the existing e2e test files or create a new file in the `__tests__/e2e/` directory
2. Export the test suite and update `src/tests.ts` to include it

Example:

```typescript
export const MyTestSuite = {
  name: 'my_test_suite',
  description: 'Tests for my feature',
  tests: [
    {
      name: 'my_test',
      fn: async (runtime) => {
        // Test logic here
        if (condition !== expected) {
          throw new Error('Test failed');
        }
      }
    }
  ]
};
```

Then update `src/tests.ts`:

```typescript
import { MyTestSuite } from './__tests__/e2e/my-test-suite';

// Add to the default export
export default [...existingTestSuites, MyTestSuite];
```

## Best Practices

1. **Test in isolation**: Unit tests should test components in isolation, mocking dependencies as needed
2. **Test real scenarios**: E2E tests should test real user scenarios, not implementation details
3. **Use descriptive names**: Test names should clearly describe what's being tested
4. **Test both success and failure paths**: Ensure both happy paths and error cases are covered
5. **Keep tests independent**: Tests should not depend on the state from other tests
6. **Clean up resources**: Clean up any resources created during tests