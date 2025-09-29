import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Info } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import PaymentElementWrapper from '@components/payment/PaymentElementWrapper'
import PaymentSuccessModal from '@components/payment/PaymentSuccessModal'
import toast from 'react-hot-toast'

const PaymentStep = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    bookingFlow,
    canAccessStep,
    getStepsForStepper,
    markPaymentComplete
  } = useBookingFlow()

  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [paymentIntentData, setPaymentIntentData] = useState(null)

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

  // Check access to this step
  useEffect(() => {
    if (!canAccessStep('payment')) {
      console.error('Cannot access payment step - missing required information')
      // Redirect to the first incomplete step
      if (!bookingFlow.scheduleDetails?.date) {
        navigate(`/booking/${photographerId}/schedule`)
      } else if (!bookingFlow.packageDetails?.packageId) {
        navigate(`/booking/${photographerId}/package`)
      } else if (!bookingFlow.locationDetails?.locationTitle) {
        navigate(`/booking/${photographerId}/location`)
      } else if (!bookingFlow.contractDetails?.contractSigned) {
        navigate(`/booking/${photographerId}/contract`)
      }
    }
  }, [canAccessStep, navigate, photographerId, bookingFlow])

  // Get steps for the booking stepper
  const steps = getStepsForStepper()

  const handleBack = () => {
    navigate(`/booking/${photographerId}/contract`)
  }

  const handlePaymentSuccess = async (paymentIntent, requiresRedirect = false) => {
    console.log('Payment successful:', paymentIntent)

    // Mark payment as complete in booking flow
    if (markPaymentComplete) {
      markPaymentComplete(paymentIntent.id, paymentIntent?.receipt_url || null)
    }

    // Store payment intent data for modal
    setPaymentIntentData(paymentIntent)

    if (requiresRedirect) {
      // For 3DS or redirect-based payments, navigate to checkout/complete
      // The redirect URL is handled by Stripe
      console.log('Redirect-based payment completed')
    } else {
      // For non-redirect payments, show success modal
      setShowSuccessModal(true)
    }
  }

  const handleModalClose = () => {
    setShowSuccessModal(false)
    // Navigate to success page after closing modal
    navigate(`/booking/${bookingFlow.bookingId}/payment/success`)
  }

  const paymentAmount = calculatePaymentAmount()

  // Payment plan details
  const getPaymentPlanDetails = () => {
    const { packageDetails } = bookingFlow

    if (packageDetails?.packageType === 'monthly') {
      return {
        title: 'Monthly Payment Plan',
        description: '6 equal monthly payments',
        terms: [
          'First payment due today',
          'Automatic monthly billing',
          'Cancel anytime with 30 days notice'
        ]
      }
    } else if (packageDetails?.packageType === 'deposit') {
      return {
        title: 'Deposit Payment',
        description: '$500 deposit to secure your booking',
        terms: [
          'Remaining balance due 30 days before event',
          'Deposit is non-refundable',
          'Date changes allowed with 60 days notice'
        ]
      }
    } else {
      return {
        title: 'Full Payment',
        description: 'Complete payment for your photography package',
        terms: [
          'Full payment secures your date',
          'Includes all package features',
          'Service agreement begins upon payment'
        ]
      }
    }
  }

  const planDetails = getPaymentPlanDetails()

  return (
    <div className="min-h-screen bg-dusty-50">
      <BookingStepper
        steps={steps}
        currentStepIndex={6}
      />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dusty-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-dusty-600">
            Secure your photography session with a safe and encrypted payment
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Summary */}
          <div className="md:col-span-1">
            <Card className="p-6 mb-4">
              <h3 className="text-lg font-semibold text-dusty-900 mb-4">
                Booking Summary
              </h3>

              {/* Package */}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-dusty-600">Package</p>
                  <p className="font-medium text-dusty-900">
                    {bookingFlow.packageDetails?.packageTitle || 'Photography Package'}
                  </p>
                </div>

                {/* Event Date */}
                <div>
                  <p className="text-dusty-600">Event Date</p>
                  <p className="font-medium text-dusty-900">
                    {new Date(bookingFlow.scheduleDetails?.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <p className="text-dusty-600">Location</p>
                  <p className="font-medium text-dusty-900">
                    {bookingFlow.locationDetails?.locationTitle}
                  </p>
                </div>

                {/* Add-ons */}
                {bookingFlow.addonsDetails?.selectedAddons?.length > 0 && (
                  <div>
                    <p className="text-dusty-600">Add-ons</p>
                    {bookingFlow.addonsDetails.selectedAddons.map((addon, index) => (
                      <p key={index} className="font-medium text-dusty-900">
                        {addon.name} - ${addon.price}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-dusty-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-dusty-700 font-medium">Due Today</span>
                  <span className="text-xl font-bold text-primary-600">
                    ${paymentAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Payment Plan Details */}
            <Card className="p-6">
              <h4 className="font-medium text-dusty-900 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-primary-600" />
                {planDetails.title}
              </h4>
              <p className="text-sm text-dusty-600 mb-3">
                {planDetails.description}
              </p>
              <ul className="space-y-1">
                {planDetails.terms.map((term, index) => (
                  <li key={index} className="text-xs text-dusty-500 flex items-start">
                    <Check className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                    {term}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-semibold text-dusty-900">
                  Payment Information
                </h2>
              </div>

              {/* Stripe Payment Element */}
              <PaymentElementWrapper onSuccess={handlePaymentSuccess} />
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Contract
          </Button>
        </div>
      </div>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        paymentIntent={paymentIntentData}
      />
    </div>
  )
}

export default PaymentStep