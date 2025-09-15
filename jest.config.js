export default {
  // Test environment
  testEnvironment: 'jsdom',

  // Module handling for ES modules
  preset: null,

  // Module paths and transformations
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/api/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.jsx',
    '**/tests/**/*.spec.js',
    '**/tests/**/*.spec.jsx',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.jsx'
  ],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'api/**/*.js',
    'src/**/*.js',
    'src/**/*.jsx',
    '!src/main.jsx',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.config.js'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout for tests
  testTimeout: 10000,

  // Test sequencing (using default for now)

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Detect handles that prevent Jest from exiting
  detectOpenHandles: true,
  forceExit: true,

  // Transform configuration for ES modules
  transform: {
    '^.+\\.jsx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'auto' }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  }
};