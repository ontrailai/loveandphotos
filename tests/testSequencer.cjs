/**
 * Custom test sequencer for optimal test execution order
 * Runs unit tests first, then integration, then API tests
 */

const { TestSequencer } = require('@jest/test-sequencer');

class CustomSequencer extends TestSequencer {
  sort(tests) {
    // Define test execution priority
    const testOrder = {
      unit: 1,
      integration: 2,
      api: 3,
      e2e: 4
    };

    return tests.sort((testA, testB) => {
      // Determine test type based on path
      const getTestType = (testPath) => {
        if (testPath.includes('/unit/')) return 'unit';
        if (testPath.includes('/integration/')) return 'integration';
        if (testPath.includes('/api/')) return 'api';
        if (testPath.includes('/e2e/')) return 'e2e';
        return 'unit'; // default
      };

      const typeA = getTestType(testA.path);
      const typeB = getTestType(testB.path);

      // Sort by test type priority
      if (testOrder[typeA] !== testOrder[typeB]) {
        return testOrder[typeA] - testOrder[typeB];
      }

      // If same type, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CustomSequencer;