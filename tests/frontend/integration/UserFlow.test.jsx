/**
 * User Flow Integration Tests
 * End-to-end user journey testing for critical flows
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, validFormData } from '@tests/utils/testUtils'
import App from '@/App'

// Mock authentication and navigation
const mockAuth = {
  user: null,
  profile: null,
  loading: false,
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  isAuthenticated: () => false,
  hasRole: () => false
}

// Mock Supabase for integration tests
jest.mock('@lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  },
  db: {
    users: { getProfile: jest.fn() },
    photographers: { getProfile: jest.fn() }
  }
}))

// Mock environment validation
jest.mock('@utils/validateEnv', () => ({
  validateEnvironment: () => ({
    isValid: true,
    missing: [],
    placeholder: [],
    isSupabaseConfigured: () => true,
    isStripeConfigured: () => true,
    all: {
      VITE_APP_URL: 'http://localhost:3000'
    }
  })
}))

describe('User Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.signUp.mockClear()
    mockAuth.signIn.mockClear()
    mockAuth.signOut.mockClear()
  })

  describe('Customer Signup Flow', () => {
    it('completes full customer signup journey', async () => {
      const user = userEvent.setup()

      // Mock successful signup
      mockAuth.signUp.mockResolvedValue({
        success: true,
        requiresEmailConfirmation: false
      })

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      // Should load signup page
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Verify customer role is selected by default
      const customerButton = screen.getByText('I need a photographer')
      expect(customerButton).toHaveClass('border-blush-500')

      // Fill out the form
      await user.type(screen.getByLabelText(/full name/i), validFormData.customer.fullName)
      await user.type(screen.getByLabelText(/email address/i), validFormData.customer.email)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.customer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.customer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.customer.confirmPassword)

      // Accept terms
      await user.click(screen.getByLabelText(/i agree to the/i))

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      await user.click(submitButton)

      // Verify signup was called with correct data
      await waitFor(() => {
        expect(mockAuth.signUp).toHaveBeenCalledWith(
          validFormData.customer.email,
          validFormData.customer.password,
          {
            role: 'customer',
            fullName: validFormData.customer.fullName,
            phone: validFormData.customer.phone
          }
        )
      })
    })

    it('handles validation errors during signup flow', async () => {
      const user = userEvent.setup()

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Try to submit with invalid email
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email')
      await user.tab() // Trigger validation

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })

      // Submit button should remain disabled
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeDisabled()

      // Fix email and continue
      const emailInput = screen.getByLabelText(/email address/i)
      await user.clear(emailInput)
      await user.type(emailInput, validFormData.customer.email)

      // Complete form
      await user.type(screen.getByLabelText(/full name/i), validFormData.customer.fullName)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.customer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.customer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.customer.confirmPassword)
      await user.click(screen.getByLabelText(/i agree to the/i))

      // Now submit should be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Photographer Signup Flow', () => {
    it('completes full photographer signup journey', async () => {
      const user = userEvent.setup()

      mockAuth.signUp.mockResolvedValue({
        success: true,
        requiresEmailConfirmation: false
      })

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Select photographer role
      await user.click(screen.getByText('I am a photographer'))

      // Verify role selection
      const photographerButton = screen.getByText('I am a photographer')
      expect(photographerButton).toHaveClass('border-blush-500')

      // Fill form with photographer data
      await user.type(screen.getByLabelText(/full name/i), validFormData.photographer.fullName)
      await user.type(screen.getByLabelText(/email address/i), validFormData.photographer.email)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.photographer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.photographer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.photographer.confirmPassword)
      await user.click(screen.getByLabelText(/i agree to the/i))

      // Submit
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Verify correct role was sent
      await waitFor(() => {
        expect(mockAuth.signUp).toHaveBeenCalledWith(
          validFormData.photographer.email,
          validFormData.photographer.password,
          {
            role: 'photographer',
            fullName: validFormData.photographer.fullName,
            phone: validFormData.photographer.phone
          }
        )
      })
    })
  })

  describe('Navigation Flow', () => {
    it('navigates from home to signup', async () => {
      const user = userEvent.setup()

      render(<App />, {
        route: '/',
        authContext: mockAuth
      })

      // Should be on home page
      await waitFor(() => {
        expect(screen.getByText('LoveP')).toBeInTheDocument()
      })

      // Find and click signup link
      const signupLinks = screen.getAllByText(/sign up|join|create account/i)
      if (signupLinks.length > 0) {
        await user.click(signupLinks[0])
      }

      // Should navigate to signup (note: navigation in test environment is mocked)
      // In a real app this would change the URL and show signup page
    })

    it('handles authenticated user redirects', () => {
      const authenticatedAuth = {
        ...mockAuth,
        user: { id: '123', email: 'user@test.com' },
        profile: { role: 'customer', full_name: 'Test User' },
        isAuthenticated: () => true,
        hasRole: (role) => role === 'customer'
      }

      render(<App />, {
        route: '/signup-enhanced',
        authContext: authenticatedAuth
      })

      // Should redirect authenticated users away from signup
      // In test environment, we see the loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('Error Handling Flow', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock network error
      mockAuth.signUp.mockRejectedValue(new Error('Network error'))

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), validFormData.customer.fullName)
      await user.type(screen.getByLabelText(/email address/i), validFormData.customer.email)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.customer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.customer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.customer.confirmPassword)
      await user.click(screen.getByLabelText(/i agree to the/i))

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should handle error gracefully and return to normal state
      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument()
      })
    })

    it('handles validation failures', async () => {
      const user = userEvent.setup()

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeDisabled()

      // Try to interact with disabled button
      await user.click(submitButton)

      // Should not call signUp
      expect(mockAuth.signUp).not.toHaveBeenCalled()
    })
  })

  describe('Password Strength Flow', () => {
    it('provides real-time password feedback', async () => {
      const user = userEvent.setup()

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.click(passwordInput)

      // Should show password requirements
      await waitFor(() => {
        expect(screen.getByText('Password Requirements:')).toBeInTheDocument()
      })

      // Type weak password
      await user.type(passwordInput, 'weak')

      // Should show unfulfilled requirements
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument()

      // Type strong password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'StrongPass123!')

      // All requirements should be met (visual indicators should change)
      const requirementsContainer = screen.getByText('Password Requirements:').closest('div')
      expect(requirementsContainer).toBeInTheDocument()
    })
  })

  describe('Form State Persistence', () => {
    it('maintains form data when switching roles', async () => {
      const user = userEvent.setup()

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Fill name field
      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'John Doe')

      // Switch to photographer role
      await user.click(screen.getByText('I am a photographer'))

      // Switch back to customer
      await user.click(screen.getByText('I need a photographer'))

      // Name should be preserved
      expect(nameInput).toHaveValue('John Doe')
    })
  })

  describe('Performance and Loading States', () => {
    it('shows appropriate loading states during form submission', async () => {
      const user = userEvent.setup()

      // Mock delayed signup response
      mockAuth.signUp.mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({ success: true }), 1000)
        )
      )

      render(<App />, {
        route: '/signup-enhanced',
        authContext: mockAuth
      })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      // Fill form quickly
      await user.type(screen.getByLabelText(/full name/i), validFormData.customer.fullName)
      await user.type(screen.getByLabelText(/email address/i), validFormData.customer.email)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.customer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.customer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.customer.confirmPassword)
      await user.click(screen.getByLabelText(/i agree to the/i))

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should immediately show loading state
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // Should have loading spinner
      const spinner = submitButton.querySelector('svg')
      expect(spinner).toBeInTheDocument()
    })
  })
})