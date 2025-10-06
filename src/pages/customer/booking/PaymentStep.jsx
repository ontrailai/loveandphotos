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
import PaymentOptions from '@components/payment/PaymentOptions'
import { getBasePhotoPrice, formatPrice } from '@/lib/constants/pricing'
import toast from 'react-hot-toast'

const PaymentStep = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    bookingFlow,
    canAccessStep,
    getStepsForStepper,
    markPaymentComplete,
    updatePaymentPlan
  } = useBookingFlow()

  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [paymentIntentData, setPaymentIntentData] = useState(null)
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState(
    bookingFlow.paymentDetails?.paymentPlan || 'full'
  )

  // Handler for payment plan selection
  const handlePaymentPlanChange = (plan) => {
    setSelectedPaymentPlan(plan)
    updatePaymentPlan(plan)
  }

  // Calculate payment amount for display based on selected payment plan
  // This logic matches backend compute.js to ensure UI and Stripe amounts match exactly
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

    // Apply pricing rules matching backend compute.js
    if (daysUntilEvent <= 30) {
      // Within 30 days: $450 late fee applies, only full payment allowed
      const lateFee = 450
      return baseTotal + lateFee
    } else if (daysUntilEvent < 60) {
      // 31-59 days: Only full payment available (no time for installment plans before 60-day cutoff)
      return baseTotal
    } else {
      // 60+ days: All payment plans available
      if (selectedPaymentPlan === 'deposit500') {
        return 500 // $500 deposit
      } else if (selectedPaymentPlan === 'monthly199') {
        // Monthly plan: Fixed $199/month + $150 processing fee (first payment)
        const processingFee = 150
        const monthlyPayment = 199
        return monthlyPayment + processingFee // $349 first payment
      } else if (selectedPaymentPlan === 'deposit+3') {
        // Legacy: map to deposit500
        return 500
      } else if (selectedPaymentPlan === 'installments') {
        // Legacy: map to monthly199
        const processingFee = 150
        const monthlyPayment = Math.floor(baseTotal / monthsUntilCutoff)
        return monthlyPayment + processingFee
      } else {
        // Full payment
        return baseTotal
      }
    }
  }

  // Check access to this step (only run once on mount)
  useEffect(() => {
    const hasSchedule = !!bookingFlow.scheduleDetails?.date
    const hasSignedContract = !!bookingFlow.contractDetails?.contractSigned
    const hasBookingId = !!bookingFlow.bookingId

    console.log('💳 Payment step mounted:', {
      hasSchedule,
      hasSignedContract,
      hasBookingId,
      bookingId: bookingFlow.bookingId
    })

    if (!hasBookingId || !hasSchedule || !hasSignedContract) {
      console.error('Cannot access payment step - missing required information')
      toast.error('Please complete previous steps before payment')

      // Redirect to the first incomplete step
      if (!hasSchedule) {
        navigate(`/booking/${photographerId}/schedule`)
      } else if (!hasSignedContract) {
        navigate(`/booking/${photographerId}/contract`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount to prevent infinite loops

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

  // Payment plan details - matches backend compute.js logic
  const getPaymentPlanDetails = () => {
    const { packageDetails, addonsDetails, scheduleDetails } = bookingFlow
    const packagePrice = packageDetails?.packagePrice || 0
    const addonsPrice = addonsDetails?.totalAddonsPrice || 0
    const baseTotal = packagePrice + addonsPrice

    // Calculate days until event and 60-day cutoff
    const eventDate = new Date(scheduleDetails?.date)
    const daysUntilEvent = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24))

    // Calculate cutoff date (60 days before event)
    const cutoffDate = new Date(eventDate)
    cutoffDate.setDate(cutoffDate.getDate() - 60)
    const daysUntilCutoff = Math.ceil((cutoffDate - new Date()) / (1000 * 60 * 60 * 24))
    const monthsUntilCutoff = Math.max(1, Math.floor(daysUntilCutoff / 30))

    // Within 30 days: late fee applies, only full payment
    if (daysUntilEvent <= 30) {
      const lateFee = 450
      const totalWithLateFee = baseTotal + lateFee
      return {
        title: 'Full Payment (Late Booking)',
        description: `$${totalWithLateFee.toLocaleString()} total including $${lateFee} late booking fee`,
        terms: [
          `Base total: $${baseTotal.toLocaleString()}`,
          `Late booking fee (within 30 days): $${lateFee}`,
          'Payment plans not available for bookings within 30 days',
          'Full payment required to secure your date'
        ]
      }
    }

    // 31-59 days: only full payment available (no time for installment plans before 60-day cutoff)
    if (daysUntilEvent < 60) {
      return {
        title: 'Full Payment',
        description: `$${baseTotal.toLocaleString()} total`,
        terms: [
          'Full payment secures your date',
          'Payment plans require 60+ days notice',
          'Not enough time for installment plans before 60-day payment cutoff',
          `Your event is ${daysUntilEvent} days away (${daysUntilCutoff} days until cutoff)`
        ]
      }
    }

    // 60+ days: all payment plans available
    if (selectedPaymentPlan === 'deposit500' || selectedPaymentPlan === 'deposit+3') {
      const remainingBalance = baseTotal - 500
      const monthlyPayment = Math.round(remainingBalance / monthsUntilCutoff)
      return {
        title: '$500 Deposit + Monthly Payments',
        description: `$500 deposit today, then ${monthsUntilCutoff} monthly payments of ~$${monthlyPayment.toLocaleString()}`,
        terms: [
          '$500 deposit due today',
          `${monthsUntilCutoff} remaining payments of ~$${monthlyPayment.toLocaleString()} each`,
          'All payments complete 60 days before event',
          'No processing fee for this plan'
        ]
      }
    } else if (selectedPaymentPlan === 'monthly199' || selectedPaymentPlan === 'installments') {
      const processingFee = 150
      const monthlyPayment = 199

      // Calculate how many full months we have until the 60-day cutoff
      const monthsAvailable = Math.max(1, Math.floor(daysUntilCutoff / 30))

      // Calculate first payment ($199 + $150 processing fee)
      const firstPayment = monthlyPayment + processingFee

      // Calculate total paid through monthly payments
      const totalMonthlyPayments = (monthsAvailable * monthlyPayment) + processingFee

      // Calculate final lump sum
      const finalLumpSum = baseTotal - totalMonthlyPayments

      return {
        title: 'Monthly Payment Plan',
        description: `Fixed $${monthlyPayment}/month payments + final balance due 60 days before event`,
        terms: [
          `First payment: $${firstPayment.toLocaleString()} due today ($${monthlyPayment} + $${processingFee} processing fee)`,
          `${monthsAvailable - 1} monthly payments of $${monthlyPayment} each`,
          `Final balance: $${finalLumpSum.toLocaleString()} due 60 days before event`,
          `Total payments: ${monthsAvailable + 1}`,
          'Remaining balance paid as lump sum at 60-day cutoff'
        ]
      }
    } else {
      return {
        title: 'Full Payment',
        description: `Complete payment of $${baseTotal.toLocaleString()} for your photography package`,
        terms: [
          'Full payment secures your date',
          'Includes all package features',
          'Service agreement begins upon payment',
          'No additional fees or charges'
        ]
      }
    }
  }

  const planDetails = getPaymentPlanDetails()

  // Show fallback if booking data is incomplete
  if (!bookingFlow.bookingId || !bookingFlow.scheduleDetails?.date || !bookingFlow.contractDetails?.contractSigned) {
    return (
      <div className="min-h-screen bg-dusty-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-dusty-900 mb-2">
            Session Expired or Incomplete
          </h2>
          <p className="text-dusty-600 mb-6">
            Your booking session has expired or is missing required information.
            Please restart your booking from the beginning.
          </p>
          <Button
            onClick={() => navigate('/browse')}
            className="w-full"
          >
            Return to Browse Photographers
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dusty-50">
      <BookingStepper
        steps={steps}
        currentStepIndex={4}
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

        {/* Payment Options Selection */}
        <div className="mb-8">
          <PaymentOptions
            totalAmount={bookingFlow.packageDetails?.packagePrice + (bookingFlow.addonsDetails?.totalAddonsPrice || 0)}
            eventDate={bookingFlow.scheduleDetails?.date}
            selectedPlan={selectedPaymentPlan}
            onSelectPlan={handlePaymentPlanChange}
          />
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

                {/* Hours Breakdown - Only show if we have schedule times */}
                {bookingFlow.scheduleDetails?.startTime && bookingFlow.scheduleDetails?.endTime && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-dusty-600 mb-1">Photoshoot Duration</p>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-dusty-700">Hours:</span>
                        <span className="font-semibold text-dusty-900">
                          {(() => {
                            const start = bookingFlow.scheduleDetails.startTime
                            const end = bookingFlow.scheduleDetails.endTime
                            const [startHour] = start.split(':').map(Number)
                            const [endHour] = end.split(':').map(Number)
                            const hours = endHour - startHour
                            return `${hours} hour${hours !== 1 ? 's' : ''}`
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-primary-300">
                        <span className="text-dusty-700 font-medium">Package Price:</span>
                        <span className="font-bold text-primary-600">
                          {(() => {
                            const start = bookingFlow.scheduleDetails.startTime
                            const end = bookingFlow.scheduleDetails.endTime
                            const [startHour] = start.split(':').map(Number)
                            const [endHour] = end.split(':').map(Number)
                            const hours = endHour - startHour
                            const price = getBasePhotoPrice(hours) || 0
                            return formatPrice(price)
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
              <PaymentElementWrapper
                onSuccess={handlePaymentSuccess}
                paymentPlan={selectedPaymentPlan}
              />
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