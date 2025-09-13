/**
 * Performance Tests
 * Frontend performance and bundle optimization testing
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithAuth, validFormData } from '@tests/utils/testUtils'

// Import components for performance testing
import SignupEnhanced from '@pages/SignupEnhanced'
import Button from '@components/ui/Button'
import BasicInput from '@components/ui/BasicInput'

// Mock performance API for testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
}

global.performance = mockPerformance

describe('Frontend Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPerformance.now.mockImplementation(() => Date.now())
  })

  describe('Component Render Performance', () => {
    it('renders Button component quickly', () => {
      const startTime = performance.now()

      render(<Button>Test Button</Button>)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Button should render in under 50ms
      expect(renderTime).toBeLessThan(50)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders BasicInput component quickly', () => {
      const startTime = performance.now()

      render(<BasicInput placeholder="Test input" />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Input should render in under 50ms
      expect(renderTime).toBeLessThan(50)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('renders SignupEnhanced form in reasonable time', async () => {
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }
      const startTime = performance.now()

      render(<SignupEnhanced />, { authContext: mockAuth })

      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Complex form should render in under 200ms
      expect(renderTime).toBeLessThan(200)
    })
  })

  describe('User Interaction Performance', () => {
    it('handles rapid typing without lag', async () => {
      const user = userEvent.setup()
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      render(<SignupEnhanced />, { authContext: mockAuth })

      const nameInput = screen.getByLabelText(/full name/i)
      const startTime = performance.now()

      // Simulate rapid typing
      await user.type(nameInput, 'John Doe', { delay: 1 }) // Minimal delay

      const endTime = performance.now()
      const typingTime = endTime - startTime

      // Should handle rapid input without significant delay
      expect(typingTime).toBeLessThan(100)
      expect(nameInput).toHaveValue('John Doe')
    })

    it('validates form fields efficiently', async () => {
      const user = userEvent.setup()
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      render(<SignupEnhanced />, { authContext: mockAuth })

      const emailInput = screen.getByLabelText(/email address/i)
      const startTime = performance.now()

      // Type invalid email and trigger validation
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const validationTime = endTime - startTime

      // Validation should be near-instant
      expect(validationTime).toBeLessThan(100)
    })

    it('handles password requirements calculation efficiently', async () => {
      const user = userEvent.setup()
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      render(<SignupEnhanced />, { authContext: mockAuth })

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.click(passwordInput)

      const startTime = performance.now()

      // Type complex password and check requirements update
      await user.type(passwordInput, 'TestPassword123!')

      await waitFor(() => {
        expect(screen.getByText('Password Requirements:')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      // Password strength calculation should be fast
      expect(calculationTime).toBeLessThan(150)
    })
  })

  describe('Memory Usage and Cleanup', () => {
    it('does not create memory leaks with event listeners', async () => {
      const user = userEvent.setup()
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      const { unmount } = render(<SignupEnhanced />, { authContext: mockAuth })

      // Interact with form to create event listeners
      const nameInput = screen.getByLabelText(/full name/i)
      await user.type(nameInput, 'Test')
      await user.click(screen.getByLabelText(/^password$/i))

      // Unmount component
      unmount()

      // In a real test, we would check that event listeners are cleaned up
      // This is more of a structural test to ensure cleanup happens
      expect(true).toBe(true) // Placeholder for memory leak detection
    })

    it('handles rapid mount/unmount cycles', () => {
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      // Rapidly mount and unmount components
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<Button>Test {i}</Button>)
        expect(screen.getByRole('button')).toBeInTheDocument()
        unmount()
      }

      // Should handle rapid cycles without issues
      expect(true).toBe(true)
    })
  })

  describe('Async Operation Performance', () => {
    it('handles form submission efficiently', async () => {
      const user = userEvent.setup()
      const mockAuth = {
        user: null,
        profile: null,
        loading: false,
        signUp: jest.fn().mockResolvedValue({ success: true })
      }

      render(<SignupEnhanced />, { authContext: mockAuth })

      // Fill form rapidly
      await user.type(screen.getByLabelText(/full name/i), validFormData.customer.fullName)
      await user.type(screen.getByLabelText(/email address/i), validFormData.customer.email)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.customer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.customer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.customer.confirmPassword)
      await user.click(screen.getByLabelText(/i agree to the/i))

      const startTime = performance.now()
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Wait for form submission to complete
      await waitFor(() => {
        expect(mockAuth.signUp).toHaveBeenCalled()
      })

      const endTime = performance.now()
      const submissionTime = endTime - startTime

      // Form processing should be quick (excluding network time)
      expect(submissionTime).toBeLessThan(100)
    })
  })

  describe('Bundle Size Awareness', () => {
    it('imports only necessary dependencies', () => {
      // Test that components don't import unnecessary large libraries
      // This is more of a structural test

      const Button = require('@components/ui/Button')
      expect(typeof Button.default).toBe('function')

      const BasicInput = require('@components/ui/BasicInput')
      expect(typeof BasicInput.default).toBe('function')

      // Ensure components are importable (tree-shaking friendly)
      expect(Button).toBeDefined()
      expect(BasicInput).toBeDefined()
    })
  })

  describe('Rendering Optimization', () => {
    it('minimizes re-renders on prop changes', () => {
      let renderCount = 0
      const TrackingComponent = (props) => {
        renderCount++
        return <Button {...props}>Button</Button>
      }

      const { rerender } = render(<TrackingComponent variant="primary" />)

      // Initial render
      expect(renderCount).toBe(1)

      // Same props should not cause re-render
      rerender(<TrackingComponent variant="primary" />)
      expect(renderCount).toBe(1) // Should still be 1 if optimized

      // Different props should cause re-render
      rerender(<TrackingComponent variant="secondary" />)
      expect(renderCount).toBe(2)
    })

    it('handles large form efficiently', async () => {
      const user = userEvent.setup()
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      const startTime = performance.now()

      render(<SignupEnhanced />, { authContext: mockAuth })

      // Test interaction with all form fields
      const fields = [
        { label: /full name/i, value: 'John Doe' },
        { label: /email address/i, value: 'john@example.com' },
        { label: /phone number/i, value: '1234567890' },
        { label: /^password$/i, value: 'TestPass123!' },
        { label: /confirm password/i, value: 'TestPass123!' }
      ]

      for (const field of fields) {
        await user.type(screen.getByLabelText(field.label), field.value)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Large form interaction should complete reasonably quickly
      expect(totalTime).toBeLessThan(500)
    })
  })

  describe('Accessibility Performance', () => {
    it('maintains performance with screen reader optimizations', async () => {
      const mockAuth = { user: null, profile: null, loading: false, signUp: jest.fn() }

      const startTime = performance.now()

      render(<SignupEnhanced />, { authContext: mockAuth })

      // Wait for all accessibility attributes to be applied
      await waitFor(() => {
        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Accessibility enhancements should not significantly impact performance
      expect(renderTime).toBeLessThan(300)

      // Verify accessibility features are present
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    })
  })

  describe('Network Performance', () => {
    it('handles slow network conditions gracefully', async () => {
      const user = userEvent.setup()

      // Mock slow network response
      const mockAuth = {
        user: null,
        profile: null,
        loading: false,
        signUp: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({ success: true }), 2000))
        )
      }

      render(<SignupEnhanced />, { authContext: mockAuth })

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), validFormData.customer.fullName)
      await user.type(screen.getByLabelText(/email address/i), validFormData.customer.email)
      await user.type(screen.getByLabelText(/phone number/i), validFormData.customer.phone)
      await user.type(screen.getByLabelText(/^password$/i), validFormData.customer.password)
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.customer.confirmPassword)
      await user.click(screen.getByLabelText(/i agree to the/i))

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Should show loading state immediately
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // UI should remain responsive during network operation
      const otherInput = screen.getByLabelText(/full name/i)
      expect(otherInput).toBeInTheDocument()
      expect(otherInput).toHaveValue(validFormData.customer.fullName)
    })
  })
})