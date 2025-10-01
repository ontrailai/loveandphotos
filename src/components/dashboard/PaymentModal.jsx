import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

const PaymentForm = ({ bookingId, amount, onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/customer/dashboard`,
        },
        redirect: 'if_required'
      })

      if (error) {
        toast.error(error.message)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('💳 Payment succeeded:', paymentIntent.id)

        // Call our backend to update the database
        const token = (await supabase.auth.getSession()).data.session?.access_token

        const confirmResponse = await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            bookingId: bookingId
          })
        })

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm payment in database')
        }

        console.log('✅ Payment confirmed in database')
        toast.success('Payment successful!')
        onSuccess()
      }
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

const PaymentModal = ({ bookingId, amount, paymentPlan, isOpen, onClose, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const fetchClientSecret = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token

        const response = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId,
            plan: paymentPlan,
            amount: amount,
            paymentType: 'installment'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create payment intent')
        }

        const { clientSecret } = await response.json()
        setClientSecret(clientSecret)
      } catch (error) {
        console.error('Error fetching payment intent:', error)
        toast.error('Failed to initialize payment')
        onClose()
      } finally {
        setLoading(false)
      }
    }

    fetchClientSecret()
  }, [isOpen, bookingId, amount, paymentPlan])

  if (!isOpen) return null

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#e85d75',
      colorBackground: '#ffffff',
      colorText: '#424242',
      borderRadius: '8px',
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Complete Payment
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount due:</span>
            <span className="font-semibold text-gray-900">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <PaymentForm
              bookingId={bookingId}
              amount={amount}
              onSuccess={() => {
                onSuccess()
                onClose()
              }}
              onCancel={onClose}
            />
          </Elements>
        ) : (
          <div className="text-center text-red-600 py-4">
            Failed to initialize payment
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentModal
