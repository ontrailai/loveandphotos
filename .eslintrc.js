module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@eslint/js/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist', 'coverage', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: '18.2'
    }
  },
  plugins: [
    'react-refresh',
    'react',
    'react-hooks'
  ],
  rules: {
    // React and general rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    'react/prop-types': 'off', // Using TypeScript/JSDoc for prop validation
    'no-unused-vars': ['error', {
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_'
    }],
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],

    // Custom rule for Supabase query safety
    'no-large-supabase-queries/no-large-supabase-queries': ['error', {
      maxArraySize: 50,        // Arrays larger than 50 items should use batching
      maxVariableThreshold: 100 // Variables that might contain large arrays
    }]
  },

  // Custom rules configuration
  overrides: [
    {
      files: ['src/**/*.js', 'src/**/*.jsx'],
      rules: {
        // Enforce batching utility usage in source files
        'no-large-supabase-queries/no-large-supabase-queries': 'error'
      }
    },
    {
      files: ['tests/**/*.js', 'tests/**/*.jsx'],
      rules: {
        // Relax rules in test files
        'no-large-supabase-queries/no-large-supabase-queries': 'warn',
        'no-console': 'off'
      }
    },
    {
      files: ['api/**/*.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        // Backend-specific rules
        'no-large-supabase-queries/no-large-supabase-queries': 'error'
      }
    }
  ]
}

// Load custom rules
const path = require('path')

// Register custom rule
const customRulesPath = path.join(__dirname, 'scripts', 'eslint-rules')
const noLargeSupabaseQueries = require(path.join(customRulesPath, 'no-large-supabase-queries.js'))

// Add custom rule to ESLint
if (typeof module !== 'undefined' && module.exports) {
  // Register the custom rule
  const originalExports = module.exports

  module.exports = {
    ...originalExports,
    plugins: [
      ...(originalExports.plugins || []),
      {
        // Custom plugin definition
        rules: {
          'no-large-supabase-queries': noLargeSupabaseQueries
        }
      }
    ]
  }
}