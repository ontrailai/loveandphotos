/**
 * React Testing Library Setup
 * Configuration for frontend component testing
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from '@jest/globals'

// Mock modules that don't work well in test environment
jest.mock('@21st-extension/react', () => ({
  ReactPlugin: {}
}))

jest.mock('@21st-extension/toolbar-react', () => ({
  TwentyFirstToolbar: ({ children }) => children || null
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ className, ...props }) => (
    <div data-testid="mock-icon" className={className} {...props} />
  )

  return {
    Camera: MockIcon,
    Eye: MockIcon,
    EyeOff: MockIcon,
    Check: MockIcon,
    X: MockIcon,
    UserIcon: MockIcon,
    MailIcon: MockIcon,
    PhoneIcon: MockIcon,
    LockIcon: MockIcon,
    SparklesIcon: MockIcon,
    // Add other icons as needed
    __esModule: true,
  }
})

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: ({ children }) => children || null,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
}))

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  BrowserRouter: ({ children }) => children,
  MemoryRouter: ({ children }) => children,
}))

// Mock Supabase client
jest.mock('@lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  db: {
    users: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    },
    photographers: {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    },
  },
}))

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock scrollTo for navigation tests
window.scrollTo = jest.fn()

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
}

// Cleanup after each test
afterEach(() => {
  cleanup()
  jest.clearAllMocks()
})

// Global test setup
beforeAll(() => {
  // Silence console.warn and console.error in tests unless needed
  const originalWarn = console.warn
  const originalError = console.error

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
       args[0].includes('validateDOMNesting') ||
       args[0].includes('React does not recognize'))
    ) {
      return
    }
    originalWarn.apply(console, args)
  }

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning:')
    ) {
      return
    }
    originalError.apply(console, args)
  }
})

// Global test teardown
afterAll(() => {
  // Restore console methods
  delete console.warn
  delete console.error
})

// Make testing library helpers globally available
global.screen = require('@testing-library/react').screen
global.render = require('@testing-library/react').render
global.fireEvent = require('@testing-library/react').fireEvent
global.waitFor = require('@testing-library/react').waitFor
global.within = require('@testing-library/react').within
global.userEvent = require('@testing-library/user-event').default