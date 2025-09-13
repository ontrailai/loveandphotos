/**
 * Global test setup configuration
 * Runs before all test suites
 */

import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test timeout
jest.setTimeout(10000);

// Global test variables
globalThis.TEST_PORT = 3002;
globalThis.TEST_BASE_URL = `http://localhost:${globalThis.TEST_PORT}`;

// Mock console methods in tests to reduce noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Store original methods for restoration
globalThis.restoreConsole = () => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
};

// Mock console by default (can be restored in individual tests)
if (process.env.NODE_ENV === 'test' && !process.env.VERBOSE_TESTS) {
  console.log = jest.fn();
  console.warn = jest.fn();
  // Keep error logging for debugging
  console.error = originalConsoleError;
}

// Global test utilities
globalThis.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test data
  generateTestUser: (overrides = {}) => ({
    id: `test-user-${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  generateTestPhotographer: (overrides = {}) => ({
    id: `test-photographer-${Date.now()}`,
    user_id: `test-user-${Date.now()}`,
    business_name: 'Test Photography',
    location: 'Test City, TS',
    price_range: '$500-$1000',
    rating: 4.8,
    review_count: 25,
    bio: 'Test photographer bio',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  generateTestPackage: (overrides = {}) => ({
    id: `test-package-${Date.now()}`,
    photographer_id: `test-photographer-${Date.now()}`,
    name: 'Test Package',
    price: 799,
    tier_id: 'silver',
    duration: '2 hours',
    deliverables: 'Digital gallery, 25 edited photos',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  generateTestBooking: (overrides = {}) => ({
    id: `test-booking-${Date.now()}`,
    user_id: `test-user-${Date.now()}`,
    photographer_id: `test-photographer-${Date.now()}`,
    package_id: `test-package-${Date.now()}`,
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'pending',
    total_amount: 799,
    created_at: new Date().toISOString(),
    ...overrides
  })
};

// Global cleanup function
globalThis.cleanup = async () => {
  // Cleanup test data, close connections, etc.
  // This will be called after test suites
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log
});

// Clean exit handling
process.on('SIGTERM', async () => {
  await globalThis.cleanup();
  process.exit(0);
});

console.log('🧪 Test environment initialized');