/**
 * Test Utilities
 * Custom render functions and test helpers for React components
 */

import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@contexts/AuthContext'

// Mock AuthContext for testing
export const MockAuthContext = {
  user: null,
  profile: null,
  photographerProfile: null,
  loading: false,
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  updateProfile: jest.fn(),
  fetchUserData: jest.fn(),
  checkOnboardingStatus: jest.fn(() => true),
  hasRole: jest.fn(() => false),
  isAuthenticated: jest.fn(() => false)
}

// Custom render function that includes providers
export function render(ui, options = {}) {
  const {
    route = '/',
    authContext = MockAuthContext,
    ...renderOptions
  } = options

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider value={authContext}>
          {children}
        </AuthProvider>
      </MemoryRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Custom render for components that need authentication
export function renderWithAuth(ui, authState = {}, options = {}) {
  const mockAuth = {
    ...MockAuthContext,
    ...authState
  }

  return render(ui, { authContext: mockAuth, ...options })
}

// Custom render for authenticated user tests
export function renderAsCustomer(ui, options = {}) {
  return renderWithAuth(ui, {
    user: { id: '123', email: 'customer@test.com' },
    profile: { id: '123', role: 'customer', full_name: 'Test Customer' },
    isAuthenticated: () => true,
    hasRole: (role) => role === 'customer'
  }, options)
}

// Custom render for photographer tests
export function renderAsPhotographer(ui, options = {}) {
  return renderWithAuth(ui, {
    user: { id: '456', email: 'photographer@test.com' },
    profile: { id: '456', role: 'photographer', full_name: 'Test Photographer' },
    photographerProfile: { id: '456', onboarding_completed: true },
    isAuthenticated: () => true,
    hasRole: (role) => role === 'photographer',
    checkOnboardingStatus: () => true
  }, options)
}

// Mock form submission helper
export function mockFormSubmission() {
  const mockSubmit = jest.fn((e) => {
    e.preventDefault()
    return Promise.resolve({ success: true })
  })

  return {
    onSubmit: mockSubmit,
    mockSubmit
  }
}

// Wait for async operations to complete
export async function waitForAsyncOperations() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Custom matchers for better testing
export const customMatchers = {
  toHaveValidationError: (received, expectedMessage) => {
    const errorElement = received.querySelector('.text-red-500, [role="alert"]')
    const pass = errorElement && errorElement.textContent.includes(expectedMessage)

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to have validation error "${expectedMessage}"`,
      pass
    }
  },

  toBeAccessible: (received) => {
    // Check for basic accessibility attributes
    const hasRole = received.hasAttribute('role')
    const hasLabel = received.hasAttribute('aria-label') ||
                    received.hasAttribute('aria-labelledby') ||
                    received.closest('label')

    const pass = hasRole || hasLabel || received.tagName.toLowerCase() === 'button'

    return {
      message: () =>
        `expected element ${pass ? 'not ' : ''}to be accessible (have role, label, or be semantic element)`,
      pass
    }
  }
}

// Mock Supabase responses
export const mockSupabaseResponses = {
  signUpSuccess: {
    data: {
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'fake-token' }
    },
    error: null
  },
  signUpError: {
    data: null,
    error: { message: 'Email already registered' }
  },
  signInSuccess: {
    data: {
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'fake-token' }
    },
    error: null
  },
  signInError: {
    data: null,
    error: { message: 'Invalid credentials' }
  }
}

// Form validation test helpers
export const validFormData = {
  customer: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!'
  },
  photographer: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
    password: 'PhotoPass456!',
    confirmPassword: 'PhotoPass456!'
  }
}

export const invalidFormData = {
  emptyFields: {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  },
  invalidEmail: {
    fullName: 'John Doe',
    email: 'invalid-email',
    phone: '1234567890',
    password: 'TestPass123!',
    confirmPassword: 'TestPass123!'
  },
  weakPassword: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: '123',
    confirmPassword: '123'
  },
  mismatchedPasswords: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'TestPass123!',
    confirmPassword: 'DifferentPass456!'
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'