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
const StripePaymentForm = ({ onSuccess, paymentPlan = 'full' }) => {
  const stripe = useStripe()
  const elements = useElements()
  const { bookingFlow } = useBookingFlow()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Calculate payment amount for display based on selected payment plan
  // This logic MUST match PaymentStep.jsx and backend compute.js exactly
  const calculatePaymentAmount = () => {
    const { packageDetails, addonsDetails, scheduleDetails } = bookingFlow
    const packagePrice = packageDetails?.packagePrice || 0
    const addonsPrice = addonsDetails?.totalAddonsPrice || 0
    const baseTotal = packagePrice + addonsPrice

    // Calculate days until event and 60-day cutoff
    const eventDate = new Date(scheduleDetails?.date)
    const daysUntilEvent = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24))

    // Calculate 60-day cutoff date
    const cutoffDate = new Date(eventDate)
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    const daysUntilCutoff = Math.ceil((cutoffDate - new Date()) / (1000 * 60 * 60 * 24))
    const monthsUntilCutoff = Math.max(1, Math.floor(daysUntilCutoff / 30))

    // Log for debugging
    console.log('💳 StripePaymentForm - Payment Calculation:', {
      paymentPlan,
      packagePrice,
      addonsPrice,
      baseTotal,
      daysUntilEvent,
      daysUntilCutoff,
      monthsUntilCutoff
    })

    // Apply pricing rules matching backend compute.js
    if (daysUntilEvent <= 60) {
      // Within 60 days: $450 late fee applies, only full payment allowed
      const lateFee = 450
      const total = baseTotal + lateFee
      console.log('💳 Late booking (within 60 days): $' + total + ' (includes $450 late fee)')
      return total
    } else if (daysUntilEvent < 90) {
      // 61-89 days: Limited plans (full payment or $500 deposit only)
      if (paymentPlan === 'deposit500') {
        console.log('💳 Deposit plan (61-89 days): $500')
        return 500 // $500 deposit
      } else {
        console.log('💳 Full payment (61-89 days): $' + baseTotal)
        return baseTotal // Full payment
      }
    } else {
      // 90+ days: All payment plans available
      if (paymentPlan === 'deposit500') {
        console.log('💳 Deposit plan (90+ days): $500')
        return 500 // $500 deposit
      } else if (paymentPlan === 'monthly199') {
        // Monthly plan: Fixed $199/month + $150 processing fee (first payment)
        const processingFee = 150
        const monthlyPayment = 199
        const firstPayment = monthlyPayment + processingFee
        console.log('💳 Monthly plan first payment: $' + firstPayment + ' ($199 + $150 processing fee)')
        return firstPayment // $349 first payment
      } else if (paymentPlan === 'deposit+3') {
        // Legacy: map to deposit500
        console.log('💳 Legacy deposit+3 plan: $500')
        return 500
      } else if (paymentPlan === 'installments') {
        // Legacy: map to monthly199
        const processingFee = 150
        const monthlyPayment = Math.floor(baseTotal / monthsUntilCutoff)
        const firstPayment = monthlyPayment + processingFee
        console.log('💳 Legacy installments plan: $' + firstPayment)
        return firstPayment
      } else {
        // Full payment
        console.log('💳 Full payment (90+ days): $' + baseTotal)
        return baseTotal
      }
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
        // Handle error from Stripe with detailed logging
        console.error('❌ Payment confirmation error:', {
          message: confirmError.message,
          type: confirmError.type,
          code: confirmError.code,
          decline_code: confirmError.decline_code,
          param: confirmError.param,
          full_error: confirmError
        })

        // Construct user-friendly error message
        let userMessage = confirmError.message || 'Payment failed. Please try again.'

        // Add specific guidance based on error type
        if (confirmError.type === 'card_error') {
          if (confirmError.decline_code === 'insufficient_funds') {
            userMessage = 'Your card has insufficient funds. Please use a different payment method.'
          } else if (confirmError.decline_code === 'expired_card') {
            userMessage = 'Your card has expired. Please use a different card.'
          } else {
            userMessage = confirmError.message + ' Please check your card details and try again.'
          }
        } else if (confirmError.type === 'validation_error') {
          userMessage = confirmError.message + ' Please verify all required fields are filled correctly.'
        } else if (confirmError.code === 'payment_intent_unexpected_state') {
          userMessage = 'This payment may have already been processed. Please refresh the page or contact support.'
        } else if (confirmError.type === 'api_error') {
          userMessage = 'A payment processing error occurred. Please try again or contact support if the issue persists.'
        }

        setError(userMessage)
        toast.error(userMessage, { duration: 6000 })
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