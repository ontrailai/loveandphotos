/**
 * PaymentSuccess Page
 * Confirmation page after successful Stripe payment
 * Verifies payment and displays booking confirmation
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { useAuth } from '@contexts/AuthContext'
import Button from '@components/ui/Button'
import ErrorBoundary from '@components/ui/ErrorBoundary'
import { CheckCircle, CreditCard, Calendar, MapPin, Camera, AlertCircle, ArrowRight, Download } from 'lucide-react'
import { clsx } from 'clsx'

const PaymentSuccess = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const { bookingFlow, markPaymentComplete } = useBookingFlow()
  const { user } = useAuth()

  const [isVerifying, setIsVerifying] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [verificationError, setVerificationError] = useState(null)

  // Verify payment session on mount
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerificationError('No payment session found. Invalid access.')
        setIsVerifying(false)
        return
      }

      try {
        // Verify payment session with our API
        const response = await fetch(`/api/payments/session/${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment')
        }

        if (data.payment_status !== 'paid') {
          throw new Error('Payment not completed')
        }

        setPaymentDetails({
          sessionId: data.id,
          paymentStatus: data.payment_status,
          amountTotal: data.amount_total,
          currency: data.currency,
          customerEmail: data.customer_email,
          metadata: data.metadata
        })

        // Mark payment as complete in booking flow
        markPaymentComplete(data.id)

      } catch (error) {
        console.error('Payment verification failed:', error)
        setVerificationError(error.message)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [sessionId, markPaymentComplete])

  // Redirect to account creation if not authenticated
  useEffect(() => {
    if (!isVerifying && paymentDetails && !verificationError) {
      // If user is not authenticated, redirect to account creation
      if (!user) {
        const photographerId = bookingFlow?.photographerId
        if (photographerId) {
          // Give user 2 seconds to see success message, then redirect
          const timer = setTimeout(() => {
            navigate(`/booking/${photographerId}/account`)
          }, 2000)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [isVerifying, paymentDetails, verificationError, user, bookingFlow, navigate])

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (verificationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6" role="alert">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-4">
            {verificationError}
          </p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/browse')}>
              Back to Browse
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      title="Payment Success Error"
      message="Unable to load the payment confirmation page."
      onRetry={() => window.location.reload()}
      onGoBack={() => navigate('/browse')}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Success Header */}
        <div className="bg-green-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-xl text-green-100">
              Your photography session is confirmed
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6">
          {/* Payment Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Details
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{paymentDetails?.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">
                    ${paymentDetails ? (paymentDetails.amountTotal / 100).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>Credit Card</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">✓ Paid</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-mono text-sm">{bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{paymentDetails?.customerEmail || bookingFlow?.customerDetails?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Plan:</span>
                  <span className="capitalize">
                    {paymentDetails?.metadata?.plan || 'Full Payment'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Booking Summary
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Event Date</h3>
                    <p className="text-gray-600">
                      {bookingFlow?.scheduleDetails?.selectedDate
                        ? new Date(bookingFlow.scheduleDetails.selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'To be scheduled'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-gray-600">
                      {bookingFlow?.locationDetails?.city && bookingFlow?.locationDetails?.state
                        ? `${bookingFlow.locationDetails.city}, ${bookingFlow.locationDetails.state}`
                        : 'TBD'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Package</h3>
                  <p className="text-gray-600">
                    {bookingFlow?.packageDetails?.packageTitle || 'Custom Package'}
                  </p>
                </div>
                {bookingFlow?.addonsDetails?.selectedAddons?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Add-ons</h3>
                    <ul className="text-gray-600 space-y-1">
                      {bookingFlow.addonsDetails.selectedAddons.map((addon, index) => (
                        <li key={index} className="text-sm">• {addon.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">What's Next?</h2>
            <div className="space-y-3 text-blue-800">
              {!user && (
                <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 -mx-2 mb-4">
                  <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                    →
                  </div>
                  <div>
                    <h3 className="font-medium text-yellow-900">Create Your Account</h3>
                    <p className="text-sm text-yellow-800">
                      You'll be redirected to create your account in a few seconds...
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Confirmation Email</h3>
                  <p className="text-sm text-blue-700">
                    You'll receive a confirmation email with your booking details within a few minutes.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Photographer Contact</h3>
                  <p className="text-sm text-blue-700">
                    Your photographer will reach out within 24 hours to finalize details.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Session Planning</h3>
                  <p className="text-sm text-blue-700">
                    Work together to plan the perfect photography session for your special day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Print Confirmation
            </Button>
            <Button
              onClick={() => navigate('/browse')}
              className="flex items-center"
            >
              Back to Browse
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Additional Information */}
          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>
              Need help? Contact us at{' '}
              <a href="mailto:support@loveandphotos.com" className="text-primary-600 hover:underline">
                support@loveandphotos.com
              </a>
            </p>
            <p className="mt-2">
              Booking Reference: {bookingId}
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default PaymentSuccess