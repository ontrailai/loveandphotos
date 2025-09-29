/**
 * Unit Tests for Login Component
 * Tests React hooks order stability to prevent "Rendered fewer hooks than expected" error
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@contexts/AuthContext'
import Login from '@pages/Login'
import '@testing-library/jest-dom'

// Mock the auth context to control loading states
const mockAuthContext = {
  signIn: jest.fn(),
  user: null,
  profile: null,
  loading: false
}

// Mock useAuth hook
jest.mock('@contexts/AuthContext', () => ({
  ...jest.requireActual('@contexts/AuthContext'),
  useAuth: () => mockAuthContext
}))

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => (e) => {
      e?.preventDefault?.()
      return fn()
    }),
    formState: { errors: {} }
  })
}))

describe('Login Component - Hooks Order Stability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock auth context
    mockAuthContext.signIn = jest.fn()
    mockAuthContext.user = null
    mockAuthContext.profile = null
    mockAuthContext.loading = false
  })

  test('should render without hooks order error when auth is loading with user', () => {
    // This is the critical test case that was causing the error
    // When authLoading && user is true, it was returning early BEFORE useForm() was called
    mockAuthContext.loading = true
    mockAuthContext.user = { id: 'test-user-id', email: 'test@example.com' }

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Should show loading spinner without crashing
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('animate-spin')

    // Change state and rerender to ensure hooks order remains consistent
    mockAuthContext.loading = false
    mockAuthContext.user = null

    // This should NOT throw "Rendered fewer hooks than expected"
    expect(() => {
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      )
    }).not.toThrow()

    // Should now show the login form
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  test('should maintain consistent hooks order across different auth states', () => {
    const states = [
      { loading: false, user: null, profile: null, expectForm: true },
      { loading: true, user: { id: '1' }, profile: null, expectForm: false },
      { loading: false, user: { id: '1' }, profile: { role: 'customer' }, expectForm: true },
      { loading: true, user: null, profile: null, expectForm: true }
    ]

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    states.forEach((state, index) => {
      // Update mock context
      mockAuthContext.loading = state.loading
      mockAuthContext.user = state.user
      mockAuthContext.profile = state.profile

      // Rerender should never throw hooks order error
      expect(() => {
        rerender(
          <BrowserRouter>
            <AuthProvider>
              <Login />
            </AuthProvider>
          </BrowserRouter>
        )
      }).not.toThrow()

      // Verify expected UI state
      if (state.expectForm) {
        expect(screen.queryByText('Welcome back')).toBeInTheDocument()
      } else {
        expect(screen.queryByRole('status', { hidden: true })).toBeInTheDocument()
      }
    })
  })

  test('should call all hooks before any conditional returns', () => {
    // This test verifies the fix by ensuring hooks are called even when loading
    const hookCalls = []

    // Mock hooks to track their calls
    const originalUseState = React.useState
    React.useState = jest.fn((initial) => {
      hookCalls.push('useState')
      return originalUseState(initial)
    })

    const originalUseEffect = React.useEffect
    React.useEffect = jest.fn((effect, deps) => {
      hookCalls.push('useEffect')
      return originalUseEffect(effect, deps)
    })

    // Render with loading state that triggers early return
    mockAuthContext.loading = true
    mockAuthContext.user = { id: 'test-user' }

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Verify hooks were called even though component returns early
    expect(hookCalls.filter(h => h === 'useState').length).toBeGreaterThan(0)
    expect(hookCalls.filter(h => h === 'useEffect').length).toBeGreaterThan(0)

    // Restore original hooks
    React.useState = originalUseState
    React.useEffect = originalUseEffect
  })

  test('should handle navigation after successful login', async () => {
    const mockNavigate = jest.fn()

    // Mock useNavigate
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

    mockAuthContext.signIn.mockResolvedValue({
      success: true,
      user: { id: 'user-1', email: 'test@example.com' }
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Login form should be visible
    expect(screen.getByText('Welcome back')).toBeInTheDocument()

    // After auth state changes, navigation should be triggered
    mockAuthContext.user = { id: 'user-1' }
    mockAuthContext.profile = { role: 'customer' }

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('should redirect photographers to correct dashboard', async () => {
    const mockNavigate = jest.fn()

    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate)

    // Set photographer profile
    mockAuthContext.user = { id: 'photographer-1' }
    mockAuthContext.profile = { role: 'photographer' }

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/photographer')
    })
  })
})

/**
 * Regression Test Suite
 * Ensures the specific bug conditions don't reoccur
 */
describe('Login Component - Regression Tests', () => {
  test('REGRESSION: should not throw "Rendered fewer hooks" when toggling auth loading', () => {
    // This specifically tests the bug condition
    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Start with normal state
    mockAuthContext.loading = false
    mockAuthContext.user = null

    rerender(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    // Switch to loading with user (the bug condition)
    mockAuthContext.loading = true
    mockAuthContext.user = { id: 'user-1' }

    // This was throwing "Rendered fewer hooks than expected"
    expect(() => {
      rerender(
        <BrowserRouter>
          <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
      )
    }).not.toThrow()

    // Switch back
    mockAuthContext.loading = false
    mockAuthContext.user = null

    expect(() => {
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      )
    }).not.toThrow()
  })
})