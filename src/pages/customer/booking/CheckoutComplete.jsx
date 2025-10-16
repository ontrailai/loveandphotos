import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { useAuth } from '@contexts/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

/**
 * CheckoutComplete Component
 * Handles redirect-based payment confirmations (3DS, bank redirects)
 * Verifies payment_intent from URL and updates booking status
 */
const CheckoutComplete = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { bookingFlow, updatePaymentDetails } = useBookingFlow()
  const { user } = useAuth()

  const [verificationStatus, setVerificationStatus] = useState('loading') // loading, success, error
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const verifyPayment = async () => {
      // Get payment_intent_client_secret from URL
      const paymentIntent = searchParams.get('payment_intent')
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')
      const redirectStatus = searchParams.get('redirect_status')

      if (!paymentIntent) {
        setVerificationStatus('error')
        setErrorMessage('No payment information found. Please contact support.')
        return
      }

      // Check redirect status first
      if (redirectStatus === 'failed') {
        setVerificationStatus('error')
        setErrorMessage('Payment was not completed. Please try again.')
        return
      }

      try {
        // Verify payment with backend
        const response = await fetch('/api/payments/verify-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent,
            bookingId: bookingFlow?.bookingId,
            userId: user?.id
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Payment verification failed')
        }

        if (data.status === 'succeeded') {
          setPaymentDetails(data.paymentDetails)
          setVerificationStatus('success')

          // Update booking flow context with payment details
          if (updatePaymentDetails) {
            updatePaymentDetails({
              paymentIntentId: paymentIntent,
              status: 'paid',
              receiptUrl: data.receiptUrl,
              amount: data.amount
            })
          }

          toast.success('Payment confirmed successfully!')
        } else if (data.status === 'requires_payment_method') {
          setVerificationStatus('error')
          setErrorMessage('Payment requires additional authentication. Please try again.')
        } else {
          setVerificationStatus('error')
          setErrorMessage('Payment could not be verified. Please contact support.')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setVerificationStatus('error')
        setErrorMessage(error.message || 'An error occurred while verifying your payment.')
      }
    }

    verifyPayment()
  }, [searchParams, bookingFlow, user, updatePaymentDetails])

  const handleDashboardNavigation = () => {
    navigate('/dashboard')
  }

  const handleRetryPayment = () => {
    // Navigate back to payment step with booking context
    if (bookingFlow?.bookingId) {
      navigate(`/booking/${bookingFlow.photographerId}/payment`)
    } else {
      navigate('/dashboard')
    }
  }

  const handleViewBooking = () => {
    if (bookingFlow?.bookingId) {
      navigate(`/booking/${bookingFlow.bookingId}`)
    } else {
      navigate('/my-bookings')
    }
  }

  // Loading State
  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success State
  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>

            <p className="text-gray-600 mb-6">
              Your booking has been confirmed and payment has been processed successfully.
            </p>

            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-gray-900">
                      ${(paymentDetails.amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-medium text-gray-900">
                      {bookingFlow?.bookingId || 'N/A'}
                    </span>
                  </div>
                  {paymentDetails?.receiptUrl && (
                    <div className="pt-2">
                      <a
                        href={paymentDetails.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-700 underline text-sm"
                      >
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleViewBooking}
              >
                View Booking Details
              </Button>

              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleDashboardNavigation}
              >
                Go to Dashboard
              </Button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Verification Failed
          </h2>

          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleRetryPayment}
            >
              Try Payment Again
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleDashboardNavigation}
            >
              Go to Dashboard
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            If you continue to experience issues, please contact support at{' '}
            <a href="mailto:support@loveandphotos.com" className="text-primary hover:underline">
              support@loveandphotos.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CheckoutComplete