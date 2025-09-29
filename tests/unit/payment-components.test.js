/**
 * Unit Tests for Payment Components
 * Tests individual payment component behavior and integration
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import '@testing-library/jest-dom'

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
        update: jest.fn()
      }))
    })),
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn()
  }))
}))

// Mock components
import PaymentElementWrapper from '../../src/components/payment/PaymentElementWrapper'
import StripePaymentForm from '../../src/components/payment/StripePaymentForm'

// Mock BookingFlowContext
jest.mock('@contexts/BookingFlowContext', () => ({
  useBookingFlow: () => ({
    bookingFlow: {
      bookingId: 'test-booking-123',
      packageDetails: {
        packageId: 'pkg-1',
        packageTitle: 'Premium Package',
        packagePrice: 50000,
        packageType: 'full'
      },
      addonsDetails: {
        totalAddonsPrice: 0,
        selectedAddons: []
      },
      scheduleDetails: {
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      },
      accountDetails: {
        email: 'test@example.com',
        userId: 'user-123'
      }
    }
  })
}))

describe('PaymentElementWrapper', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock fetch for payment intent creation
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should fetch client secret on mount', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        clientSecret: 'pi_test_secret_123',
        amount: 50000,
        paymentIntentId: 'pi_test_123',
        breakdown: {
          base: '$500.00',
          lateFee: null,
          total: '$500.00',
          plan: 'full'
        }
      })
    })

    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <PaymentElementWrapper onSuccess={onSuccess} />
      </BrowserRouter>
    )

    // Should show loading initially
    expect(screen.getByText(/Initializing secure payment/i)).toBeInTheDocument()

    // Wait for client secret to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payments/create-payment-intent',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: 'test-booking-123',
            plan: 'full',
            userEmail: 'test@example.com',
            userId: 'user-123'
          })
        })
      )
    })
  })

  test('should handle payment intent creation error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Failed to initialize payment'
      })
    })

    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <PaymentElementWrapper onSuccess={onSuccess} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Payment Initialization Error/i)).toBeInTheDocument()
      expect(screen.getByText(/Failed to initialize payment/i)).toBeInTheDocument()
    })

    // Should show reload button
    const reloadButton = screen.getByRole('button', { name: /Reload Page/i })
    expect(reloadButton).toBeInTheDocument()
  })

  test('should handle missing booking ID', async () => {
    // Mock context with no booking ID
    jest.spyOn(require('@contexts/BookingFlowContext'), 'useBookingFlow').mockReturnValue({
      bookingFlow: {
        bookingId: null
      }
    })

    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <PaymentElementWrapper onSuccess={onSuccess} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Booking information is missing/i)).toBeInTheDocument()
    })

    // Should not call fetch
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('should render Stripe Elements when client secret is obtained', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        clientSecret: 'pi_test_secret_123',
        amount: 50000,
        paymentIntentId: 'pi_test_123'
      })
    })

    const onSuccess = jest.fn()

    const { container } = render(
      <BrowserRouter>
        <PaymentElementWrapper onSuccess={onSuccess} />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Should render Elements provider
      expect(container.querySelector('[data-stripe-elements]')).toBeTruthy()
    })
  })
})

describe('StripePaymentForm', () => {
  const mockStripe = {
    confirmPayment: jest.fn(),
    elements: jest.fn(() => ({
      create: jest.fn(),
      getElement: jest.fn()
    }))
  }

  const mockElements = {
    getElement: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should display correct payment amount', () => {
    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    // Should display amount
    expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/Amount Due Today/i)).toBeInTheDocument()
  })

  test('should display monthly payment plan details', () => {
    // Mock monthly plan
    jest.spyOn(require('@contexts/BookingFlowContext'), 'useBookingFlow').mockReturnValue({
      bookingFlow: {
        bookingId: 'test-booking-123',
        packageDetails: {
          packageType: 'monthly',
          packagePrice: 50000
        },
        addonsDetails: {
          totalAddonsPrice: 0
        },
        scheduleDetails: {
          date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        accountDetails: {
          email: 'test@example.com'
        }
      }
    })

    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    // Should show monthly payment info
    expect(screen.getByText(/Monthly payment plan: 6 monthly payments/i)).toBeInTheDocument()
    expect(screen.getByText(/\$83\.33/)).toBeInTheDocument() // 500/6
  })

  test('should display deposit payment details', () => {
    // Mock deposit plan
    jest.spyOn(require('@contexts/BookingFlowContext'), 'useBookingFlow').mockReturnValue({
      bookingFlow: {
        bookingId: 'test-booking-123',
        packageDetails: {
          packageType: 'deposit',
          packagePrice: 50000
        },
        addonsDetails: {
          totalAddonsPrice: 0
        },
        scheduleDetails: {
          date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        accountDetails: {
          email: 'test@example.com'
        }
      }
    })

    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    // Should show deposit info
    expect(screen.getByText(/Deposit payment: Remaining balance due before event/i)).toBeInTheDocument()
    expect(screen.getByText(/\$500\.00/)).toBeInTheDocument() // Flat $500 deposit
  })

  test('should handle payment submission', async () => {
    mockStripe.confirmPayment.mockResolvedValueOnce({
      paymentIntent: {
        id: 'pi_test_123',
        status: 'succeeded'
      }
    })

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true
      })
    })

    const onSuccess = jest.fn()

    // Mock useStripe and useElements hooks
    jest.spyOn(require('@stripe/react-stripe-js'), 'useStripe').mockReturnValue(mockStripe)
    jest.spyOn(require('@stripe/react-stripe-js'), 'useElements').mockReturnValue(mockElements)

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    const payButton = screen.getByRole('button', { name: /Pay \$500\.00/i })
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(mockStripe.confirmPayment).toHaveBeenCalledWith({
        elements: mockElements,
        confirmParams: expect.objectContaining({
          receipt_email: 'test@example.com'
        }),
        redirect: 'if_required'
      })
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pi_test_123',
          status: 'succeeded'
        })
      )
    })
  })

  test('should handle payment error', async () => {
    const errorMessage = 'Your card was declined'
    mockStripe.confirmPayment.mockResolvedValueOnce({
      error: {
        message: errorMessage
      }
    })

    const onSuccess = jest.fn()

    jest.spyOn(require('@stripe/react-stripe-js'), 'useStripe').mockReturnValue(mockStripe)
    jest.spyOn(require('@stripe/react-stripe-js'), 'useElements').mockReturnValue(mockElements)

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    const payButton = screen.getByRole('button', { name: /Pay \$500\.00/i })
    fireEvent.click(payButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Should not call onSuccess
    expect(onSuccess).not.toHaveBeenCalled()

    // Button should be re-enabled for retry
    expect(payButton).not.toBeDisabled()
  })

  test('should display late fee when event is within 30 days', () => {
    // Mock booking with event in 20 days
    jest.spyOn(require('@contexts/BookingFlowContext'), 'useBookingFlow').mockReturnValue({
      bookingFlow: {
        bookingId: 'test-booking-123',
        packageDetails: {
          packageType: 'full',
          packagePrice: 50000
        },
        addonsDetails: {
          totalAddonsPrice: 0
        },
        scheduleDetails: {
          date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days from now
        },
        accountDetails: {
          email: 'test@example.com'
        }
      }
    })

    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    // Should show total with late fee
    expect(screen.getByText(/\$950\.00/)).toBeInTheDocument() // $500 + $450 late fee
  })

  test('should show secure payment indicator', () => {
    const onSuccess = jest.fn()

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    // Should show security message
    expect(screen.getByText(/Your payment information is secure and encrypted/i)).toBeInTheDocument()
    expect(screen.getByText(/Powered by Stripe/i)).toBeInTheDocument()
  })

  test('should disable pay button when Stripe is not loaded', () => {
    const onSuccess = jest.fn()

    // Mock useStripe to return null (not loaded)
    jest.spyOn(require('@stripe/react-stripe-js'), 'useStripe').mockReturnValue(null)
    jest.spyOn(require('@stripe/react-stripe-js'), 'useElements').mockReturnValue(null)

    render(
      <BrowserRouter>
        <Elements stripe={null}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    const payButton = screen.getByRole('button', { name: /Pay/i })
    expect(payButton).toBeDisabled()
  })

  test('should show processing state during payment', async () => {
    // Mock slow payment confirmation
    mockStripe.confirmPayment.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
      }), 1000))
    )

    const onSuccess = jest.fn()

    jest.spyOn(require('@stripe/react-stripe-js'), 'useStripe').mockReturnValue(mockStripe)
    jest.spyOn(require('@stripe/react-stripe-js'), 'useElements').mockReturnValue(mockElements)

    render(
      <BrowserRouter>
        <Elements stripe={mockStripe}>
          <StripePaymentForm onSuccess={onSuccess} />
        </Elements>
      </BrowserRouter>
    )

    const payButton = screen.getByRole('button', { name: /Pay \$500\.00/i })
    fireEvent.click(payButton)

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText(/Processing\.\.\./i)).toBeInTheDocument()
    })

    // Should be disabled during processing
    expect(payButton).toBeDisabled()
  })
})