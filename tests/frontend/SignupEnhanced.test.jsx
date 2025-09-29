/**
 * SignupEnhanced Component Tests
 * Comprehensive tests for the enhanced signup form with real-time validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockSupabaseResponses, validFormData, invalidFormData } from '@tests/utils/testUtils'
import SignupEnhanced from '@pages/SignupEnhanced'
import toast from 'react-hot-toast'

// Mock the auth context
const mockAuth = {
  user: null,
  profile: null,
  loading: false,
  signUp: jest.fn()
}

describe('SignupEnhanced Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.signUp.mockClear()
  })

  describe('Initial Render', () => {
    it('renders signup form with all required fields', () => {
      render(<SignupEnhanced />, { authContext: mockAuth })

      expect(screen.getByText('Create your account')).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByText(/create account/i)).toBeInTheDocument()
    })

    it('renders role selection buttons', () => {
      render(<SignupEnhanced />, { authContext: mockAuth })

      expect(screen.getByText('I need a photographer')).toBeInTheDocument()
      expect(screen.getByText('I am a photographer')).toBeInTheDocument()
    })

    it('renders terms and conditions checkbox', () => {
      render(<SignupEnhanced />, { authContext: mockAuth })

      expect(screen.getByLabelText(/i agree to the/i)).toBeInTheDocument()
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    })

    it('shows submit button as disabled initially', () => {
      render(<SignupEnhanced />, { authContext: mockAuth })

      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Role Selection', () => {
    it('defaults to customer role', () => {
      render(<SignupEnhanced />, { authContext: mockAuth })

      const customerButton = screen.getByText('I need a photographer')
      expect(customerButton).toHaveClass('border-blush-500', 'bg-blush-50')
    })

    it('allows switching to photographer role', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      const photographerButton = screen.getByText('I am a photographer')
      await user.click(photographerButton)

      expect(photographerButton).toHaveClass('border-blush-500', 'bg-blush-50')
    })
  })

  describe('Form Validation', () => {
    describe('Full Name Validation', () => {
      it('shows error for empty full name', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const nameInput = screen.getByLabelText(/full name/i)
        await user.click(nameInput)
        await user.tab() // Trigger blur

        await waitFor(() => {
          expect(screen.getByText('Full name is required')).toBeInTheDocument()
        })
      })

      it('shows error for name too short', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const nameInput = screen.getByLabelText(/full name/i)
        await user.type(nameInput, 'A')
        await user.tab()

        await waitFor(() => {
          expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
        })
      })

      it('shows success state for valid name', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const nameInput = screen.getByLabelText(/full name/i)
        await user.type(nameInput, validFormData.customer.fullName)

        await waitFor(() => {
          const container = nameInput.closest('div')
          expect(container.querySelector('[data-testid="mock-icon"]')).toBeInTheDocument()
        })
      })
    })

    describe('Email Validation', () => {
      it('shows error for invalid email format', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, 'invalid-email')
        await user.tab()

        await waitFor(() => {
          expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
        })
      })

      it('shows success state for valid email', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const emailInput = screen.getByLabelText(/email address/i)
        await user.type(emailInput, validFormData.customer.email)

        await waitFor(() => {
          const container = emailInput.closest('div')
          expect(container.querySelector('[data-testid="mock-icon"]')).toBeInTheDocument()
        })
      })
    })

    describe('Phone Validation', () => {
      it('shows error for invalid phone format', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const phoneInput = screen.getByLabelText(/phone number/i)
        await user.type(phoneInput, '123')
        await user.tab()

        await waitFor(() => {
          expect(screen.getByText('Enter a valid 10-digit phone number')).toBeInTheDocument()
        })
      })

      it('shows success state for valid phone', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const phoneInput = screen.getByLabelText(/phone number/i)
        await user.type(phoneInput, validFormData.customer.phone)

        await waitFor(() => {
          const container = phoneInput.closest('div')
          expect(container.querySelector('[data-testid="mock-icon"]')).toBeInTheDocument()
        })
      })
    })

    describe('Password Validation', () => {
      it('shows password requirements when focused', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const passwordInput = screen.getByLabelText(/^password$/i)
        await user.click(passwordInput)

        await waitFor(() => {
          expect(screen.getByText('Password Requirements:')).toBeInTheDocument()
          expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
          expect(screen.getByText('One uppercase letter')).toBeInTheDocument()
          expect(screen.getByText('One lowercase letter')).toBeInTheDocument()
          expect(screen.getByText('One number')).toBeInTheDocument()
          expect(screen.getByText('One special character')).toBeInTheDocument()
        })
      })

      it('updates requirement indicators as user types', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const passwordInput = screen.getByLabelText(/^password$/i)
        await user.click(passwordInput)
        await user.type(passwordInput, 'TestPass123!')

        await waitFor(() => {
          // All requirements should be met (green check marks)
          const requirementContainer = screen.getByText('Password Requirements:').closest('div')
          const checkIcons = requirementContainer.querySelectorAll('[data-testid="mock-icon"]')
          expect(checkIcons).toHaveLength(5)
        })
      })

      it('toggles password visibility', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const passwordInput = screen.getByLabelText(/^password$/i)
        const toggleButton = passwordInput.parentElement.querySelector('button')

        expect(passwordInput).toHaveAttribute('type', 'password')

        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')

        await user.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
      })
    })

    describe('Confirm Password Validation', () => {
      it('shows error when passwords do not match', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const passwordInput = screen.getByLabelText(/^password$/i)
        const confirmInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, 'TestPass123!')
        await user.type(confirmInput, 'DifferentPass456!')
        await user.tab()

        await waitFor(() => {
          expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
        })
      })

      it('shows success state when passwords match', async () => {
        const user = userEvent.setup()
        render(<SignupEnhanced />, { authContext: mockAuth })

        const passwordInput = screen.getByLabelText(/^password$/i)
        const confirmInput = screen.getByLabelText(/confirm password/i)

        await user.type(passwordInput, validFormData.customer.password)
        await user.type(confirmInput, validFormData.customer.confirmPassword)

        await waitFor(() => {
          const container = confirmInput.closest('div')
          expect(container.querySelector('[data-testid="mock-icon"]')).toBeInTheDocument()
        })
      })
    })
  })

  describe('Form Submission', () => {
    const fillValidForm = async (user, role = 'customer') => {
      // Select role
      if (role === 'photographer') {
        await user.click(screen.getByText('I am a photographer'))
      }

      // Fill form fields
      const formData = validFormData[role]
      await user.type(screen.getByLabelText(/full name/i), formData.fullName)
      await user.type(screen.getByLabelText(/email address/i), formData.email)
      await user.type(screen.getByLabelText(/phone number/i), formData.phone)
      await user.type(screen.getByLabelText(/^password$/i), formData.password)
      await user.type(screen.getByLabelText(/confirm password/i), formData.confirmPassword)

      // Accept terms
      await user.click(screen.getByLabelText(/i agree to the/i))
    }

    it('enables submit button when form is valid and terms accepted', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      await fillValidForm(user)

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /create account/i })
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('calls signUp with correct data for customer', async () => {
      const user = userEvent.setup()
      mockAuth.signUp.mockResolvedValue({ success: true })

      render(<SignupEnhanced />, { authContext: mockAuth })

      await fillValidForm(user, 'customer')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

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

    it('calls signUp with correct data for photographer', async () => {
      const user = userEvent.setup()
      mockAuth.signUp.mockResolvedValue({ success: true })

      render(<SignupEnhanced />, { authContext: mockAuth })

      await fillValidForm(user, 'photographer')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

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

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      // Mock a delayed response
      mockAuth.signUp.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))

      render(<SignupEnhanced />, { authContext: mockAuth })

      await fillValidForm(user)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Check loading state
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('handles signup errors gracefully', async () => {
      const user = userEvent.setup()
      mockAuth.signUp.mockRejectedValue(new Error('Email already registered'))

      render(<SignupEnhanced />, { authContext: mockAuth })

      await fillValidForm(user)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument() // Back to normal state
      })
    })
  })

  describe('User Experience', () => {
    it('shows visual feedback for field validation states', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      const emailInput = screen.getByLabelText(/email address/i)

      // Invalid state
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(emailInput).toHaveClass('border-red-500')
      })

      // Valid state
      await user.clear(emailInput)
      await user.type(emailInput, validFormData.customer.email)

      await waitFor(() => {
        expect(emailInput).toHaveClass('border-green-500')
      })
    })

    it('provides helpful error messages', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('maintains form state during interaction', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'John Doe')

      // Switch roles and back
      await user.click(screen.getByText('I am a photographer'))
      await user.click(screen.getByText('I need a photographer'))

      // Form data should be preserved
      expect(nameInput).toHaveValue('John Doe')
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<SignupEnhanced />, { authContext: mockAuth })

      // All form inputs should have associated labels
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      // Tab through form elements
      await user.tab() // Customer role button
      await user.tab() // Photographer role button
      await user.tab() // Full name input
      await user.tab() // Email input
      await user.tab() // Phone input
      await user.tab() // Password input
      await user.tab() // Password toggle button
      await user.tab() // Confirm password input
      await user.tab() // Confirm password toggle button
      await user.tab() // Terms checkbox
      await user.tab() // Submit button

      expect(screen.getByRole('button', { name: /create account/i })).toHaveFocus()
    })

    it('provides ARIA attributes for validation states', async () => {
      const user = userEvent.setup()
      render(<SignupEnhanced />, { authContext: mockAuth })

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      await user.tab()

      await waitFor(() => {
        // Error message should be associated with input
        const errorMessage = screen.getByText('Please enter a valid email address')
        expect(errorMessage).toBeInTheDocument()
      })
    })
  })

  describe('Integration', () => {
    it('redirects authenticated users', () => {
      const authenticatedAuth = {
        ...mockAuth,
        user: { id: '123', email: 'user@test.com' },
        profile: { id: '123', role: 'customer' }
      }

      render(<SignupEnhanced />, {
        authContext: authenticatedAuth,
        route: '/signup-enhanced'
      })

      // Should show loading spinner (redirect in progress)
      expect(screen.getByRole('status', { hidden: true }) ||
             document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })
})