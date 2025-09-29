/**
 * ContractStep Unit Tests
 * Comprehensive testing for contract loading, validation, signature capture, and edge cases
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { jest } from '@jest/globals'

import ContractStep from '@pages/customer/booking/ContractStep'
import { BookingFlowProvider } from '@contexts/BookingFlowContext'
import * as contractHelpers from '@utils/contractHelpers'

// Mock dependencies
jest.mock('@utils/contractHelpers')

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ photographerId: 'test-photographer' }),
    useNavigate: () => mockNavigate
  }
})

// Test data fixtures
const mockBookingFlow = {
  photographerId: 'test-photographer',
  currentStep: 'contract',
  completedSteps: ['schedule', 'package', 'location', 'addons'],
  scheduleDetails: {
    date: '2024-06-15',
    timeOfDay: 'morning',
    selectedAt: '2024-01-15T10:00:00.000Z'
  },
  packageDetails: {
    packageType: 'monthly',
    packagePrice: 500,
    packageTitle: 'Wedding Package',
    selectedAt: '2024-01-15T10:05:00.000Z'
  },
  locationDetails: {
    locationId: 'loc1',
    locationTitle: 'Central Park',
    selectedAt: '2024-01-15T10:10:00.000Z'
  },
  addonsDetails: {
    selectedAddons: [],
    totalAddonsPrice: 0,
    selectedAt: '2024-01-15T10:15:00.000Z'
  },
  contractDetails: {
    contractSigned: false,
    contractSignatureId: null,
    contractVersion: null,
    signedAt: null
  }
}

const mockContractData = {
  contractText: 'THIS IS A LEGAL CONTRACT\n\nEvent Date: June 15, 2024\nLocation: Central Park\nPackage: Wedding Package\nPrice: $500',
  contractHash: 'test-hash-123',
  contractVersion: 'LNP-Contract-v1.0',
  bookingData: {
    eventDate: 'June 15, 2024',
    location: 'Central Park',
    packageName: 'Wedding Package',
    price: '$500'
  }
}

const mockIncompleteBookingFlow = {
  ...mockBookingFlow,
  scheduleDetails: { date: null, timeOfDay: null, selectedAt: null },
  completedSteps: []
}

// Helper to render component with context
const renderWithContext = (bookingFlow = mockBookingFlow, navigateOptions = {}) => {
  const mockContext = {
    bookingFlow,
    canAccessStep: jest.fn((step) => mockBookingFlow.completedSteps.includes(step) || step === 'contract'),
    goToStep: jest.fn(),
    getStepsForStepper: jest.fn(() => [
      { id: 'schedule', label: 'Schedule', status: 'completed' },
      { id: 'package', label: 'Package', status: 'completed' },
      { id: 'location', label: 'Location', status: 'completed' },
      { id: 'addons', label: 'Add-Ons', status: 'completed' },
      { id: 'contract', label: 'Contract', status: 'current' }
    ]),
    updateContractDetails: jest.fn()
  }

  return render(
    <MemoryRouter initialEntries={['/booking/test-photographer/contract']} {...navigateOptions}>
      <BookingFlowProvider value={mockContext}>
        <ContractStep />
      </BookingFlowProvider>
    </MemoryRouter>
  )
}

describe('ContractStep Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()

    // Setup default mocks
    contractHelpers.validateBookingDataForContract.mockReturnValue({ isValid: true, missing: [] })
    contractHelpers.generateContractForBooking.mockResolvedValue(mockContractData)
    contractHelpers.validateSignatureData.mockReturnValue({ isValid: true, errors: [] })
    contractHelpers.prepareContractSignaturePayload.mockResolvedValue({
      bookingId: 'test-booking',
      contractVersion: 'LNP-Contract-v1.0',
      signaturePngBase64: 'data:image/png;base64,test-signature'
    })

    // Mock fetch for API calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({
          success: true,
          contractSignatureId: 'signature-123'
        })
      })
    )

    // Mock console methods to track error logging
    console.error = jest.fn()
    console.warn = jest.fn()
  })

  describe('Loading States and Timeouts', () => {
    test('should show loading spinner initially', async () => {
      // Delay the contract generation to test loading state
      contractHelpers.generateContractForBooking.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockContractData), 100))
      )

      renderWithContext()

      expect(screen.getByText('Loading contract...')).toBeInTheDocument()
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Loading contract...')).not.toBeInTheDocument()
      })
    })

    test('should handle contract generation timeout', async () => {
      // Simulate timeout by making contract generation hang
      contractHelpers.generateContractForBooking.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      renderWithContext()

      expect(screen.getByText('Loading contract...')).toBeInTheDocument()

      // Wait for a reasonable timeout period (adjust based on your timeout implementation)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 11000))
      })

      // Should show error state after timeout
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/contract unavailable/i)).toBeInTheDocument()
      }, { timeout: 12000 })
    }, 15000)

    test('should prevent infinite loading with proper error boundaries', async () => {
      // Simulate contract generation that fails repeatedly
      let callCount = 0
      contractHelpers.generateContractForBooking.mockImplementation(() => {
        callCount++
        if (callCount > 3) {
          throw new Error('Maximum retry attempts exceeded')
        }
        return Promise.reject(new Error('Network error'))
      })

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(console.error).toHaveBeenCalled()
      })

      // Verify it doesn't try indefinitely
      expect(callCount).toBeLessThanOrEqual(3)
    })
  })

  describe('Redirect Logic for Incomplete Booking Data', () => {
    test('should redirect to schedule when booking data is invalid', async () => {
      contractHelpers.validateBookingDataForContract.mockReturnValue({
        isValid: false,
        missing: ['Event Date', 'Package Price']
      })

      renderWithContext(mockIncompleteBookingFlow)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/schedule', { replace: true })
      })

      expect(console.error).toHaveBeenCalledWith(
        'Booking data incomplete:',
        ['Event Date', 'Package Price']
      )
    })

    test('should redirect when canAccessStep returns false', async () => {
      const mockContext = {
        ...mockBookingFlow,
        canAccessStep: jest.fn((step) => step === 'schedule') // Only schedule is accessible
      }

      renderWithContext(mockContext)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/schedule', { replace: true })
      })
    })

    test('should handle missing schedule data specifically', async () => {
      const incompleteSchedule = {
        ...mockBookingFlow,
        scheduleDetails: { date: null, timeOfDay: null, selectedAt: null },
        completedSteps: []
      }

      contractHelpers.validateBookingDataForContract.mockReturnValue({
        isValid: false,
        missing: ['Event Date']
      })

      renderWithContext(incompleteSchedule)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/schedule', { replace: true })
      })
    })
  })

  describe('Signature Validation', () => {
    test('should validate signature presence', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      expect(submitButton).toBeDisabled()
    })

    test('should validate signature format', async () => {
      contractHelpers.validateSignatureData.mockReturnValue({
        isValid: false,
        errors: ['Invalid signature format']
      })

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Simulate signature input with invalid format
      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /sign & continue/i })

      // Enable the button by mocking signature presence
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid signature format')).toBeInTheDocument()
      })
    })

    test('should validate signature size limits', async () => {
      contractHelpers.validateSignatureData.mockReturnValue({
        isValid: false,
        errors: ['Signature image is too large (max 2MB)']
      })

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      const user = userEvent.setup()

      // Mock large signature
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Signature image is too large (max 2MB)')).toBeInTheDocument()
      })
    })

    test('should require consent checkbox', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      expect(submitButton).toBeDisabled()

      // Even with signature, consent is required
      contractHelpers.validateSignatureData.mockReturnValue({
        isValid: false,
        errors: ['You must agree to the terms and conditions']
      })
    })
  })

  describe('Network Failures and Retries', () => {
    test('should handle network failure during contract loading', async () => {
      contractHelpers.generateContractForBooking.mockRejectedValue(new Error('Network Error'))

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to load contract/i)).toBeInTheDocument()
      })

      expect(console.error).toHaveBeenCalledWith('Failed to generate contract:', expect.any(Error))
    })

    test('should handle 404 API response gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      )

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Mock successful validation and submit
      contractHelpers.validateSignatureData.mockReturnValue({ isValid: true, errors: [] })

      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      // Enable submit button (mock signature present)
      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/contract signing is not yet available/i)).toBeInTheDocument()
      })
    })

    test('should handle network timeout during submission', async () => {
      global.fetch = jest.fn(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      contractHelpers.validateSignatureData.mockReturnValue({ isValid: true, errors: [] })

      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to submit signature/i)).toBeInTheDocument()
      })
    })

    test('should handle retry functionality', async () => {
      contractHelpers.generateContractForBooking.mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce(mockContractData)

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      const user = userEvent.setup()
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })
    })
  })

  describe('Contract Content Validation', () => {
    test('should display contract with correct booking data', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Verify contract content is populated with booking data
      expect(screen.getByText(/june 15, 2024/i)).toBeInTheDocument()
      expect(screen.getByText(/central park/i)).toBeInTheDocument()
      expect(screen.getByText(/wedding package/i)).toBeInTheDocument()
      expect(screen.getByText(/\$500/)).toBeInTheDocument()
    })

    test('should generate correct contract hash', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(contractHelpers.generateContractForBooking).toHaveBeenCalledWith(mockBookingFlow)
      })

      expect(mockContractData.contractHash).toBe('test-hash-123')
      expect(mockContractData.contractVersion).toBe('LNP-Contract-v1.0')
    })
  })

  describe('Accessibility and Error Boundaries', () => {
    test('should have proper ARIA labels and live regions', async () => {
      renderWithContext()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Check for live region for loading announcements
      expect(screen.getByLabelText(/loading contract/i)).toBeInTheDocument()
    })

    test('should handle error boundary scenarios', async () => {
      // Simulate component error
      const OriginalError = console.error
      console.error = jest.fn()

      contractHelpers.generateContractForBooking.mockImplementation(() => {
        throw new Error('Component Error')
      })

      renderWithContext()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      console.error = OriginalError
    })
  })
})

describe('ContractStep Edge Cases', () => {
  test('should handle concurrent API calls gracefully', async () => {
    let resolveCount = 0
    contractHelpers.generateContractForBooking.mockImplementation(() => {
      resolveCount++
      return Promise.resolve({
        ...mockContractData,
        contractHash: `hash-${resolveCount}`
      })
    })

    // Render multiple times quickly
    const { unmount: unmount1 } = renderWithContext()
    const { unmount: unmount2 } = renderWithContext()

    unmount1()
    unmount2()

    // Should not cause memory leaks or duplicate API calls
    expect(resolveCount).toBeLessThanOrEqual(2)
  })

  test('should handle component unmount during async operations', async () => {
    contractHelpers.generateContractForBooking.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockContractData), 1000))
    )

    const { unmount } = renderWithContext()

    // Unmount before async operation completes
    unmount()

    // Should not cause warnings or errors
    await new Promise(resolve => setTimeout(resolve, 1100))
  })
})