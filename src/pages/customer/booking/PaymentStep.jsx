/**
 * PaymentStep Page
 * Payment processing step in the booking flow
 * Requires contract to be signed before access
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import Button from '@components/ui/Button'
import ErrorBoundary from '@components/ui/ErrorBoundary'
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

const PaymentStep = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const {
    bookingFlow,
    goToStep,
    getStepsForStepper,
    canAccessStep
  } = useBookingFlow()

  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  // Check access on mount - requires contract to be signed
  useEffect(() => {
    // Check if user can access this step
    if (!canAccessStep('payment')) {
      // Redirect to contract step if contract not signed
      if (!bookingFlow.contractDetails.contractSigned) {
        navigate(`/booking/${photographerId}/contract`, { replace: true })
        return
      }
      // Redirect to first incomplete step
      navigate(`/booking/${photographerId}/addons`, { replace: true })
      return
    }

    // Mark payment step as current
    goToStep('payment')
  }, [photographerId, canAccessStep, goToStep, navigate, bookingFlow.contractDetails.contractSigned])

  // Enhanced payment method with proper guards
  const handlePayment = async () => {
    // Verify contract is signed before allowing payment
    if (!bookingFlow.contractDetails.contractSigned) {
      setPaymentError('Contract must be signed before payment. Redirecting...')
      setTimeout(() => navigate(`/booking/${photographerId}/contract`), 2000)
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // TODO: Integrate with Stripe or payment processor
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Navigate to booking confirmation
      navigate(`/booking/${photographerId}/confirm`)

    } catch (error) {
      console.error('Payment failed:', error)
      setPaymentError('Payment processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    navigate(`/booking/${photographerId}/contract`)
  }

  // Ensure contract is signed before rendering payment UI
  if (!bookingFlow.contractDetails.contractSigned) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6" role="alert">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Required</h2>
          <p className="text-gray-600 mb-4">
            You must sign the contract before proceeding to payment.
          </p>
          <Button onClick={() => navigate(`/booking/${photographerId}/contract`)}>
            Go to Contract
          </Button>
        </div>
      </div>
    )
  }

  const steps = getStepsForStepper()

  return (
    <ErrorBoundary
      title="Payment Loading Error"
      message="Unable to load the payment page. Please try again or go back to contract."
      onRetry={() => window.location.reload()}
      onGoBack={() => navigate(`/booking/${photographerId}/contract`)}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Progress Stepper */}
        <BookingStepper
          steps={steps}
          currentStepIndex={5} // Payment is step 6 (0-indexed: 5)
          onStepClick={(stepIndex, step) => {
            if (step.status === 'completed') {
              const stepId = steps[stepIndex].id
              if (stepId === 'contract') {
                navigate(`/booking/${photographerId}/contract`)
              } else if (stepId === 'addons') {
                navigate(`/booking/${photographerId}/addons`)
              } else if (stepId === 'location') {
                navigate(`/booking/${photographerId}/location`)
              } else if (stepId === 'package') {
                navigate(`/booking/${photographerId}/package`)
              } else if (stepId === 'schedule') {
                navigate(`/booking/${photographerId}/schedule`)
              }
            }
          }}
        />

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-8 lg:px-6">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <CreditCard className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Payment
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Complete your booking payment to confirm your photography session.
            </p>
          </div>

          {/* Contract Signed Confirmation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Contract Signed
                </h3>
                <p className="text-sm text-green-700">
                  Your contract was signed on {new Date(bookingFlow.contractDetails.signedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Package: {bookingFlow.packageDetails.packageTitle}</span>
                <span className="font-medium">${bookingFlow.packageDetails.packagePrice}</span>
              </div>
              {bookingFlow.addonsDetails.totalAddonsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons</span>
                  <span className="font-medium">${bookingFlow.addonsDetails.totalAddonsPrice}</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${(bookingFlow.packageDetails.packagePrice || 0) + (bookingFlow.addonsDetails.totalAddonsPrice || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <p className="text-gray-600 mb-4">
              Payment processing will be integrated with Stripe. For now, this is a placeholder.
            </p>
            <div className="space-y-3">
              <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">Credit/Debit Card</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                  <p className="mt-1 text-sm text-red-700">{paymentError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isProcessing}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contract
            </Button>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className={clsx(
                'flex items-center min-w-32',
                isProcessing && 'opacity-75'
              )}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default PaymentStep