import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import StripePaymentForm from './StripePaymentForm'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import toast from 'react-hot-toast'

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

/**
 * Payment Element Wrapper Component
 * Handles fetching the clientSecret and wrapping the payment form in Stripe Elements
 */
const PaymentElementWrapper = ({ onSuccess, paymentPlan = 'full' }) => {
  const { bookingFlow } = useBookingFlow()
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch clientSecret when component mounts
    const fetchClientSecret = async () => {
      if (!bookingFlow.bookingId) {
        console.error('No booking ID available')
        setError('Booking information is missing. Please restart the booking process.')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching payment intent for booking:', bookingFlow.bookingId)

        const response = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingFlow.bookingId,
            plan: paymentPlan,
            userEmail: bookingFlow.accountDetails?.email,
            userId: bookingFlow.accountDetails?.userId
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to initialize payment')
        }

        const data = await response.json()

        console.log('💳 Payment Intent Response:', {
          hasClientSecret: !!data.clientSecret,
          amount: data.amount,
          amountDollars: data.amount ? `$${(data.amount / 100).toFixed(2)}` : 'N/A',
          breakdown: data.breakdown,
          plan: paymentPlan
        })

        // Validate amount before proceeding
        if (data.amount === 0 || data.amount === null || data.amount === undefined || !Number.isFinite(data.amount)) {
          console.error('❌ Invalid payment amount received:', data.amount)
          throw new Error(
            `Invalid payment amount calculated: ${data.amount ? `$${(data.amount / 100).toFixed(2)}` : '$0.00'}. ` +
            'Please return to the package selection step and ensure pricing is set, or contact support.'
          )
        }

        if (!data.clientSecret) {
          console.error('❌ No client secret in response')
          throw new Error('Failed to get payment information from server. Please try again.')
        }

        console.log('✅ Payment intent created successfully')
        setClientSecret(data.clientSecret)
      } catch (err) {
        console.error('Error fetching payment intent:', err)
        setError(err.message || 'Failed to initialize payment. Please try again.')
        toast.error('Failed to initialize payment. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchClientSecret()
  }, [bookingFlow.bookingId, paymentPlan, bookingFlow.accountDetails?.email, bookingFlow.accountDetails?.userId])

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-dusty-600 mt-4">Initializing secure payment...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Payment Initialization Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    )
  }

  // No client secret
  if (!clientSecret) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700">Unable to initialize payment. Please try again.</p>
      </div>
    )
  }

  // Stripe Elements appearance customization
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#e85d75',
      colorBackground: '#ffffff',
      colorText: '#424242',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
      spacingUnit: '6px'
    },
    rules: {
      '.Input': {
        border: '1px solid #e5e7eb',
        fontSize: '16px',
        padding: '12px'
      },
      '.Input:focus': {
        border: '1px solid #e85d75',
        boxShadow: '0 0 0 3px rgba(232, 93, 117, 0.1)'
      },
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '8px',
        color: '#424242'
      },
      '.Error': {
        color: '#df1b41',
        fontSize: '13px',
        marginTop: '6px'
      },
      '.Tab': {
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500'
      },
      '.Tab--selected': {
        backgroundColor: '#e85d75',
        color: '#ffffff',
        border: '1px solid #e85d75'
      }
    }
  }

  const options = {
    clientSecret,
    appearance,
    loader: 'auto'
  }

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={options}>
      <StripePaymentForm onSuccess={onSuccess} paymentPlan={paymentPlan} />
    </Elements>
  )
}

export default PaymentElementWrapper