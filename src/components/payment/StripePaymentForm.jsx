import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

/**
 * Stripe Payment Form Component
 * Uses Stripe Payment Element for secure card collection
 * Handles payment confirmation with Stripe
 */
const StripePaymentForm = ({ onSuccess }) => {
  const stripe = useStripe()
  const elements = useElements()
  const { bookingFlow } = useBookingFlow()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Calculate payment amount for display
  const calculatePaymentAmount = () => {
    const { packageDetails, addonsDetails } = bookingFlow

    if (packageDetails?.packageType === 'monthly') {
      // Monthly payment: (package price + addons) / 6
      const packagePrice = packageDetails?.packagePrice || 0
      const addonsPrice = addonsDetails?.totalAddonsPrice || 0
      return Math.round((packagePrice + addonsPrice) / 6)
    } else if (packageDetails?.packageType === 'deposit') {
      // Deposit payment: flat $500
      return 500
    } else {
      // Full payment: package price + addons
      const packagePrice = packageDetails?.packagePrice || 0
      const addonsPrice = addonsDetails?.totalAddonsPrice || 0
      const baseAmount = packagePrice + addonsPrice

      // Add late fee if within 30 days
      const eventDate = new Date(bookingFlow.scheduleDetails?.date)
      const daysUntilEvent = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24))

      if (daysUntilEvent <= 30) {
        return baseAmount + 450 // Add $450 late fee
      }

      return baseAmount
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      console.error('Stripe not loaded')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Get user email from booking flow
      const userEmail = bookingFlow.accountDetails?.email || ''

      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: userEmail,
          return_url: `${window.location.origin}/booking/${bookingFlow.bookingId}/payment/success`,
        },
        redirect: 'if_required', // Handle in-page for better UX
      })

      if (confirmError) {
        // Handle error from Stripe
        console.error('Payment confirmation error:', confirmError)
        setError(confirmError.message)
        toast.error(confirmError.message)
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          // Payment succeeded without redirect
          console.log('Payment successful!')

          // Call backend to update booking status
          try {
            const response = await fetch('/api/payments/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                bookingId: bookingFlow.bookingId
              })
            })

            if (response.ok) {
              toast.success('Payment successful!')
              if (onSuccess) {
                // Call onSuccess with paymentIntent and requiresRedirect = false
                onSuccess(paymentIntent, false)
              }
            }
          } catch (err) {
            console.error('Error confirming payment on backend:', err)
            // Payment succeeded on Stripe but failed to update backend
            // Still treat as success for user
            toast.success('Payment processed successfully!')
            if (onSuccess) {
              onSuccess(paymentIntent, false)
            }
          }
        } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'processing') {
          // Payment requires additional action (3DS redirect)
          // Stripe will handle the redirect automatically
          console.log('Payment requires additional authentication')
          // The user will be redirected by Stripe, no need to call onSuccess here
        }
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'An unexpected error occurred')
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const paymentAmount = calculatePaymentAmount()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount Display */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-dusty-700 font-medium">Amount Due Today:</span>
          <span className="text-2xl font-bold text-dusty-900">
            ${paymentAmount.toFixed(2)}
          </span>
        </div>
        {bookingFlow.packageDetails?.packageType === 'monthly' && (
          <p className="text-sm text-dusty-600 mt-2">
            Monthly payment plan: 6 monthly payments
          </p>
        )}
        {bookingFlow.packageDetails?.packageType === 'deposit' && (
          <p className="text-sm text-dusty-600 mt-2">
            Deposit payment: Remaining balance due before event
          </p>
        )}
      </div>

      {/* Stripe Payment Element */}
      <div className="border border-dusty-200 rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card'],
            fields: {
              billingDetails: {
                email: 'auto',
                name: 'auto',
                address: {
                  postalCode: 'auto',
                  country: 'auto'  // Changed from 'never' to 'auto' to collect country field
                }
              }
            }
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-start space-x-2 text-xs text-dusty-500">
        <svg className="w-4 h-4 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        <span>Your payment information is secure and encrypted. Powered by Stripe.</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
        loading={isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay $${paymentAmount.toFixed(2)}`}
      </Button>

      {/* Test Mode Notice (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
          <p className="text-yellow-700">
            <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future expiry date and CVC.
          </p>
        </div>
      )}
    </form>
  )
}

export default StripePaymentForm