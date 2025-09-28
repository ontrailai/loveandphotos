/**
 * Contract Flow Integration Tests
 * Tests integration between ContractStep and BookingFlowContext with realistic scenarios
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { jest } from '@jest/globals'

import ContractStep from '@pages/customer/booking/ContractStep'
import { BookingFlowProvider } from '@contexts/BookingFlowContext'
import * as contractHelpers from '@utils/contractHelpers'
import {
  createValidBookingFlow,
  createIncompleteBookingFlow,
  createMockContractData,
  createMockSignatureData,
  ConsoleMonitor,
  NetworkMonitor,
  createMockFetch,
  setupContractTestEnvironment,
  VALIDATION_ERRORS,
  TIMEOUTS
} from '@helpers/contractTestHelpers'

// Mock dependencies
jest.mock('@utils/contractHelpers')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ photographerId: 'test-photographer' }),
  useNavigate: () => mockNavigate
}))

const mockNavigate = jest.fn()
let consoleMonitor
let networkMonitor

describe('Contract Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()

    // Setup test environment
    setupContractTestEnvironment()

    // Initialize monitors
    consoleMonitor = new ConsoleMonitor()
    networkMonitor = new NetworkMonitor()
    consoleMonitor.startMonitoring()

    // Setup default contract helper mocks
    contractHelpers.validateBookingDataForContract.mockReturnValue({ isValid: true, missing: [] })
    contractHelpers.generateContractForBooking.mockResolvedValue(createMockContractData())
    contractHelpers.validateSignatureData.mockReturnValue({ isValid: true, errors: [] })
    contractHelpers.prepareContractSignaturePayload.mockResolvedValue({
      bookingId: 'test-booking-123',
      contractVersion: 'LNP-Contract-v1.0',
      signaturePngBase64: createMockSignatureData().signaturePngBase64
    })

    // Setup default fetch mock
    global.fetch = createMockFetch({
      'POST /api/contracts/sign': {
        status: 200,
        body: { success: true, contractSignatureId: 'signature-123' }
      }
    })
  })

  afterEach(() => {
    consoleMonitor.stopMonitoring()
    consoleMonitor.assertNoReactWarnings()
    consoleMonitor.assertNoUnexpectedErrors()
  })

  const renderContractWithProvider = (bookingFlow = createValidBookingFlow()) => {
    const mockUpdateContractDetails = jest.fn()
    const mockCanAccessStep = jest.fn((step) => {
      if (step === 'contract') return true
      return bookingFlow.completedSteps.includes(step)
    })

    const providerValue = {
      bookingFlow,
      canAccessStep: mockCanAccessStep,
      goToStep: jest.fn(),
      getStepsForStepper: jest.fn(() => [
        { id: 'schedule', label: 'Schedule', status: 'completed' },
        { id: 'package', label: 'Package', status: 'completed' },
        { id: 'location', label: 'Location', status: 'completed' },
        { id: 'addons', label: 'Add-Ons', status: 'completed' },
        { id: 'contract', label: 'Contract', status: 'current' }
      ]),
      updateContractDetails: mockUpdateContractDetails
    }

    return {
      ...render(
        <MemoryRouter initialEntries={['/booking/test-photographer/contract']}>
          <BookingFlowProvider value={providerValue}>
            <ContractStep />
          </BookingFlowProvider>
        </MemoryRouter>
      ),
      mockUpdateContractDetails,
      mockCanAccessStep
    }
  }

  describe('Booking Flow Integration', () => {
    test('should integrate properly with complete booking flow', async () => {
      const bookingFlow = createValidBookingFlow()
      const { mockUpdateContractDetails } = renderContractWithProvider(bookingFlow)

      // Wait for contract to load
      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Verify contract helpers called with correct booking flow
      expect(contractHelpers.validateBookingDataForContract).toHaveBeenCalledWith(bookingFlow)
      expect(contractHelpers.generateContractForBooking).toHaveBeenCalledWith(bookingFlow)

      // Complete signature flow
      const user = userEvent.setup()

      // Mock signature drawing (in real test, this would be canvas interaction)
      const submitButton = screen.getByRole('button', { name: /sign & continue/i })

      // Accept consent
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      // Enable submit button (simulate signature presence)
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      // Verify contract details updated in context
      await waitFor(() => {
        expect(mockUpdateContractDetails).toHaveBeenCalledWith({
          contractSigned: true,
          contractSignatureId: 'signature-123',
          signedAt: expect.any(String),
          contractVersion: 'LNP-Contract-v1.0'
        })
      })

      // Verify navigation to payment
      expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/payment')
    })

    test('should redirect when booking flow is incomplete', async () => {
      const incompleteFlow = createIncompleteBookingFlow(['schedule', 'package'])

      contractHelpers.validateBookingDataForContract.mockReturnValue({
        isValid: false,
        missing: ['Event Date', 'Package']
      })

      renderContractWithProvider(incompleteFlow)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/schedule', { replace: true })
      })

      expect(consoleMonitor.getErrors()).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Booking data incomplete:')
        })
      )
    })

    test('should handle step access validation correctly', async () => {
      const partialFlow = createValidBookingFlow()
      partialFlow.completedSteps = ['schedule', 'package'] // Missing location and addons

      const { mockCanAccessStep } = renderContractWithProvider(partialFlow)

      await waitFor(() => {
        expect(mockCanAccessStep).toHaveBeenCalledWith('contract')
      })

      // Should redirect to first incomplete step
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  describe('Error Handling Integration', () => {
    test('should handle contract generation failure gracefully', async () => {
      contractHelpers.generateContractForBooking.mockRejectedValue(new Error('Contract service unavailable'))

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to load contract/i)).toBeInTheDocument()
      })

      // Verify error logged
      expect(consoleMonitor.getErrors()).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Failed to generate contract:')
        })
      )
    })

    test('should handle API submission failures with proper error messages', async () => {
      global.fetch = createMockFetch({
        'POST /api/contracts/sign': {
          status: 500,
          statusText: 'Internal Server Error'
        }
      })

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Complete signature flow
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

    test('should handle network timeout scenarios', async () => {
      global.fetch = jest.fn(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      )

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to submit signature/i)).toBeInTheDocument()
      }, { timeout: TIMEOUTS.NETWORK_ERROR })
    })
  })

  describe('Signature Validation Integration', () => {
    test('should integrate signature validation with form submission', async () => {
      contractHelpers.validateSignatureData
        .mockReturnValueOnce({ isValid: false, errors: [VALIDATION_ERRORS.SIGNATURE_REQUIRED] })
        .mockReturnValueOnce({ isValid: false, errors: [VALIDATION_ERRORS.CONSENT_REQUIRED] })
        .mockReturnValueOnce({ isValid: true, errors: [] })

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const submitButton = screen.getByRole('button', { name: /sign & continue/i })

      // First attempt - no signature, no consent
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(VALIDATION_ERRORS.SIGNATURE_REQUIRED)).toBeInTheDocument()
      })

      // Second attempt - signature but no consent
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(VALIDATION_ERRORS.CONSENT_REQUIRED)).toBeInTheDocument()
      })

      // Third attempt - both signature and consent
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)
      await user.click(submitButton)

      // Should proceed with submission
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/payment')
      })
    })

    test('should handle oversized signature validation', async () => {
      contractHelpers.validateSignatureData.mockReturnValue({
        isValid: false,
        errors: [VALIDATION_ERRORS.SIGNATURE_TOO_LARGE]
      })

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(VALIDATION_ERRORS.SIGNATURE_TOO_LARGE)).toBeInTheDocument()
      })

      // Should remain on contract page
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Loading State Integration', () => {
    test('should handle loading states with proper timeouts', async () => {
      // Simulate slow contract generation
      contractHelpers.generateContractForBooking.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createMockContractData()), 2000))
      )

      renderContractWithProvider()

      // Should show loading state
      expect(screen.getByText('Loading contract...')).toBeInTheDocument()
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading contract...')).not.toBeInTheDocument()
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('should prevent infinite loading loops', async () => {
      let callCount = 0
      contractHelpers.generateContractForBooking.mockImplementation(() => {
        callCount++
        if (callCount > 2) {
          return Promise.reject(new Error('Max retries exceeded'))
        }
        return Promise.reject(new Error('Temporary failure'))
      })

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Should not retry indefinitely
      expect(callCount).toBeLessThanOrEqual(3)
    })
  })

  describe('Navigation Integration', () => {
    test('should handle back navigation correctly', async () => {
      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const backButton = screen.getByRole('button', { name: /back to add-ons/i })
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/addons')
    })

    test('should handle stepper navigation', async () => {
      const { mockCanAccessStep } = renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Verify stepper checks access correctly
      expect(mockCanAccessStep).toHaveBeenCalledWith('contract')
    })
  })

  describe('Real-time Updates Integration', () => {
    test('should update contract details in real-time during signature process', async () => {
      const { mockUpdateContractDetails } = renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      // Simulate signature data changes
      const user = userEvent.setup()

      // Add consent
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      await user.click(consentCheckbox)

      // Simulate signature completion and form submission
      const submitButton = screen.getByRole('button', { name: /sign & continue/i })
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      // Verify context updated with contract details
      await waitFor(() => {
        expect(mockUpdateContractDetails).toHaveBeenCalledWith(
          expect.objectContaining({
            contractSigned: true,
            contractSignatureId: expect.any(String),
            contractVersion: expect.any(String)
          })
        )
      })
    })

    test('should maintain form state during validation errors', async () => {
      contractHelpers.validateSignatureData
        .mockReturnValueOnce({ isValid: false, errors: [VALIDATION_ERRORS.CONSENT_REQUIRED] })
        .mockReturnValueOnce({ isValid: true, errors: [] })

      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })
      const submitButton = screen.getByRole('button', { name: /sign & continue/i })

      // First submission without consent
      fireEvent.change(submitButton, { target: { disabled: false } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(VALIDATION_ERRORS.CONSENT_REQUIRED)).toBeInTheDocument()
      })

      // Add consent and retry
      await user.click(consentCheckbox)
      await user.click(submitButton)

      // Should succeed this time
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer/payment')
      })
    })
  })

  describe('Performance Integration', () => {
    test('should handle large contract content efficiently', async () => {
      const largeContractData = createMockContractData({
        contractText: 'A'.repeat(10000) // Large contract text
      })

      contractHelpers.generateContractForBooking.mockResolvedValue(largeContractData)

      const startTime = Date.now()
      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const loadTime = Date.now() - startTime

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(2000)
    })

    test('should handle rapid user interactions without errors', async () => {
      renderContractWithProvider()

      await waitFor(() => {
        expect(screen.getByText('Contract Review & Signature')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      const consentCheckbox = screen.getByRole('checkbox', { name: /agree to the terms/i })

      // Rapid clicking
      for (let i = 0; i < 10; i++) {
        await user.click(consentCheckbox)
      }

      // Should not cause errors
      expect(consoleMonitor.getErrors()).toHaveLength(0)
    })
  })
})