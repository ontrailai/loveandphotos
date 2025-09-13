export default {
  // Test environment for React components
  testEnvironment: 'jsdom',

  // Module handling for ES modules
  preset: null,

  // Module paths and transformations
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    // Handle CSS modules and other assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js'
  },

  // Test file patterns - focus on frontend tests
  testMatch: [
    '**/tests/frontend/**/*.test.js',
    '**/tests/frontend/**/*.test.jsx',
    '**/tests/components/**/*.test.js',
    '**/tests/components/**/*.test.jsx',
    '**/src/**/__tests__/**/*.{js,jsx}',
    '**/src/**/*.{test,spec}.{js,jsx}'
  ],

  // Ignore backend test files
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/api/',
    '<rootDir>/tests/integration/',
    '<rootDir>/tests/unit/(?!.*frontend)'
  ],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.config.js'
  ],

  coverageDirectory: 'coverage/frontend',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // Coverage thresholds for frontend
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific thresholds for critical components
    'src/components/ui/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/contexts/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.js'],

  // Timeout for tests
  testTimeout: 15000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Transform configuration for React and ES modules
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'auto'
        }],
        ['@babel/preset-react', {
          runtime: 'automatic'
        }]
      ]
    }]
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@21st-extension|clsx|tailwind-merge))'
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Test environment options for jsdom
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  }
};