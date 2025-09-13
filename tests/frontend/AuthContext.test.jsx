/**
 * AuthContext Tests
 * Tests for the authentication context provider and hooks
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth, ProtectedRoute } from '@contexts/AuthContext'
import { render, screen } from '@tests/utils/testUtils'
import toast from 'react-hot-toast'

// Mock Supabase
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    }))
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  }))
}

const mockDb = {
  users: {
    getProfile: jest.fn(),
    updateProfile: jest.fn()
  },
  photographers: {
    getProfile: jest.fn(),
    updateProfile: jest.fn()
  }
}

jest.mock('@lib/supabase', () => ({
  supabase: mockSupabase,
  db: mockDb
}))

// Test wrapper component
const TestWrapper = ({ children, initialRoute = '/' }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MemoryRouter>
)

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    // Reset default mocks
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('useAuth Hook', () => {
    it('throws error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuth()
        return null
      }

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within AuthProvider')

      consoleSpy.mockRestore()
    })

    it('provides auth context when used within AuthProvider', () => {
      const TestComponent = () => {
        const auth = useAuth()
        return <div>{auth ? 'Auth available' : 'No auth'}</div>
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      )

      expect(screen.getByText('Auth available')).toBeInTheDocument()
    })
  })

  describe('Initial State', () => {
    it('initializes with correct default state', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.photographerProfile).toBeNull()
      expect(typeof result.current.signUp).toBe('function')
      expect(typeof result.current.signIn).toBe('function')
      expect(typeof result.current.signOut).toBe('function')

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('checks for existing session on mount', async () => {
      const mockSession = {
        user: { id: '123', email: 'user@test.com' },
        access_token: 'fake-token'
      }

      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } })
      mockDb.users.getProfile.mockResolvedValue({
        id: '123',
        role: 'customer',
        full_name: 'Test User'
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockSession.user)
    })
  })

  describe('signUp Function', () => {
    it('creates customer account successfully', async () => {
      const mockSignUpData = {
        user: { id: '123', email: 'customer@test.com', identities: [{}] },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({ data: mockSignUpData, error: null })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSignUpData.user, session: { access_token: 'token' } },
        error: null
      })
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signUpResult
      await act(async () => {
        signUpResult = await result.current.signUp('customer@test.com', 'password123', {
          role: 'customer',
          fullName: 'Test Customer',
          phone: '1234567890'
        })
      })

      expect(signUpResult.success).toBe(true)
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'customer@test.com',
        password: 'password123'
      })
    })

    it('creates photographer account successfully', async () => {
      const mockSignUpData = {
        user: { id: '456', email: 'photographer@test.com', identities: [{}] },
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({ data: mockSignUpData, error: null })
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSignUpData.user, session: { access_token: 'token' } },
        error: null
      })

      const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null })
      mockSupabase.from.mockReturnValue({ upsert: mockUpsert })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signUp('photographer@test.com', 'password123', {
          role: 'photographer',
          fullName: 'Test Photographer',
          phone: '0987654321'
        })
      })

      // Should create both user and photographer records
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.from).toHaveBeenCalledWith('photographers')
    })

    it('handles signup errors gracefully', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signUpResult
      await act(async () => {
        signUpResult = await result.current.signUp('existing@test.com', 'password123')
      })

      expect(signUpResult.success).toBe(false)
      expect(signUpResult.error).toBe('Email already registered')
      expect(toast.error).toHaveBeenCalledWith('Email already registered')
    })

    it('handles email confirmation flow', async () => {
      const mockSignUpData = {
        user: { id: '123', email: 'user@test.com', identities: [] }, // Empty identities = needs confirmation
        session: null
      }

      mockSupabase.auth.signUp.mockResolvedValue({ data: mockSignUpData, error: null })
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signUpResult
      await act(async () => {
        signUpResult = await result.current.signUp('user@test.com', 'password123')
      })

      expect(signUpResult.success).toBe(true)
      expect(toast.success).toHaveBeenCalledWith('Please check your email to confirm your account')
    })
  })

  describe('signIn Function', () => {
    it('signs in user successfully', async () => {
      const mockSignInData = {
        user: { id: '123', email: 'user@test.com' },
        session: { access_token: 'token' }
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockSignInData,
        error: null
      })
      mockDb.users.getProfile.mockResolvedValue({
        id: '123',
        role: 'customer',
        full_name: 'Test User'
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signInResult
      await act(async () => {
        signInResult = await result.current.signIn('user@test.com', 'password123')
      })

      expect(signInResult.success).toBe(true)
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123'
      })
    })

    it('handles signin errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let signInResult
      await act(async () => {
        signInResult = await result.current.signIn('wrong@test.com', 'wrongpassword')
      })

      expect(signInResult.success).toBe(false)
      expect(signInResult.error).toBe('Invalid credentials')
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  describe('signOut Function', () => {
    it('signs out user successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.photographerProfile).toBeNull()
      expect(toast.success).toHaveBeenCalledWith('Signed out successfully')
    })

    it('clears localStorage on signout', async () => {
      localStorage.setItem('lovep-auth', 'test-data')
      localStorage.setItem('sb-ldxscjxoakqrmkgqwwhr-auth-token', 'test-token')

      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(localStorage.getItem('lovep-auth')).toBeNull()
      expect(localStorage.getItem('sb-ldxscjxoakqrmkgqwwhr-auth-token')).toBeNull()
    })
  })

  describe('Helper Functions', () => {
    it('hasRole function works correctly', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      // Set up authenticated user with customer role
      await act(async () => {
        result.current.profile = { role: 'customer' }
      })

      expect(result.current.hasRole('customer')).toBe(true)
      expect(result.current.hasRole('photographer')).toBe(false)
      expect(result.current.hasRole('admin')).toBe(false)
    })

    it('isAuthenticated function works correctly', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      expect(result.current.isAuthenticated()).toBe(false)

      await act(async () => {
        result.current.user = { id: '123' }
        result.current.profile = { role: 'customer' }
      })

      expect(result.current.isAuthenticated()).toBe(true)
    })

    it('checkOnboardingStatus function works correctly', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper
      })

      // Customer (no onboarding needed)
      await act(async () => {
        result.current.profile = { role: 'customer' }
      })
      expect(result.current.checkOnboardingStatus()).toBe(true)

      // Photographer without onboarding
      await act(async () => {
        result.current.profile = { role: 'photographer' }
        result.current.photographerProfile = { onboarding_completed: false }
      })
      expect(result.current.checkOnboardingStatus()).toBe(false)

      // Photographer with onboarding
      await act(async () => {
        result.current.photographerProfile = { onboarding_completed: true }
      })
      expect(result.current.checkOnboardingStatus()).toBe(true)
    })
  })

  describe('ProtectedRoute Component', () => {
    const MockPage = () => <div>Protected Content</div>

    it('renders children when authenticated', async () => {
      const authenticatedAuth = {
        user: { id: '123' },
        profile: { role: 'customer' },
        loading: false,
        hasRole: () => true,
        checkOnboardingStatus: () => true
      }

      render(
        <MemoryRouter>
          <AuthProvider value={authenticatedAuth}>
            <ProtectedRoute>
              <MockPage />
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('redirects to login when not authenticated', async () => {
      const unauthenticatedAuth = {
        user: null,
        profile: null,
        loading: false,
        hasRole: () => false,
        checkOnboardingStatus: () => false
      }

      const mockNavigate = jest.fn()
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }))

      render(
        <MemoryRouter>
          <AuthProvider value={unauthenticatedAuth}>
            <ProtectedRoute>
              <MockPage />
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      // Should not render protected content
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('checks role requirements', () => {
      const customerAuth = {
        user: { id: '123' },
        profile: { role: 'customer' },
        loading: false,
        hasRole: (role) => role === 'customer',
        checkOnboardingStatus: () => true
      }

      render(
        <MemoryRouter>
          <AuthProvider value={customerAuth}>
            <ProtectedRoute requireRole="photographer">
              <MockPage />
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      // Should not render for wrong role
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })
})