/**
 * Step 4: Payment
 * Stripe payment integration for amendment differential
 */

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

const PaymentForm = ({ booking, preview, onSuccess, onBack, loading }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Confirm payment
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`
        }
      })

      if (submitError) {
        throw new Error(submitError.message)
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, pass paymentIntent ID to parent
        onSuccess(paymentIntent.id)
      } else {
        throw new Error('Payment did not complete successfully')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message)
      toast.error('Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-primary-900">Amount to charge</span>
          <span className="text-2xl font-bold text-primary-900">
            ${preview.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div>
        <PaymentElement />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={processing || loading}
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing || loading}
          loading={processing || loading}
        >
          Pay ${preview.totalAmount.toFixed(2)}
        </Button>
      </div>
    </form>
  )
}

const PaymentStep = ({ booking, preview, onSuccess, onBack, loading }) => {
  const [clientSecret, setClientSecret] = useState(null)
  const [fetchingSecret, setFetchingSecret] = useState(true)

  useEffect(() => {
    // Fetch payment intent client secret from backend
    const fetchClientSecret = async () => {
      try {
        setFetchingSecret(true)

        const { supabase } = await import('@lib/supabase')
        const token = (await supabase.auth.getSession()).data.session?.access_token

        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: preview.totalAmount,
            bookingId: booking.id,
            description: `Booking modification - ${preview.breakdown.hours.quantity}h + add-ons`
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create payment intent')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error('Error fetching payment intent:', error)
        toast.error('Failed to initialize payment')
      } finally {
        setFetchingSecret(false)
      }
    }

    fetchClientSecret()
  }, [booking.id, preview.totalAmount])

  if (fetchingSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to initialize payment</p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#667eea'
      }
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">Payment Details</h3>

      <Elements stripe={stripePromise} options={options}>
        <PaymentForm
          booking={booking}
          preview={preview}
          onSuccess={onSuccess}
          onBack={onBack}
          loading={loading}
        />
      </Elements>
    </div>
  )
}

export default PaymentStep