import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { CheckCircle, Download, Calendar, User, MapPin, Package, X } from 'lucide-react'
import Button from '@components/ui/Button'
import Confetti from 'react-confetti'

/**
 * PaymentSuccessModal Component
 * Modal overlay that appears immediately after successful payment
 * Shows booking confirmation, receipt, and next steps with confetti
 */
const PaymentSuccessModal = ({ isOpen, onClose, paymentIntent }) => {
  const navigate = useNavigate()
  const { bookingFlow } = useBookingFlow()
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Stop confetti after 5 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showConfetti])

  if (!isOpen) return null

  const handleViewDashboard = () => {
    onClose()
    navigate('/dashboard')
  }

  const handleViewBooking = () => {
    onClose()
    if (bookingFlow?.bookingId) {
      navigate(`/booking/${bookingFlow.bookingId}`)
    } else {
      navigate('/dashboard')
    }
  }

  const handleDownloadReceipt = () => {
    if (paymentIntent?.receipt_url) {
      window.open(paymentIntent.receipt_url, '_blank')
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate payment amount
  const getPaymentAmount = () => {
    if (paymentIntent?.amount) {
      return (paymentIntent.amount / 100).toFixed(2)
    }
    const { packageDetails, addonsDetails } = bookingFlow
    const packagePrice = packageDetails?.packagePrice || 0
    const addonsPrice = addonsDetails?.totalAddonsPrice || 0

    if (packageDetails?.packageType === 'monthly') {
      return Math.round((packagePrice + addonsPrice) / 6).toFixed(2)
    } else if (packageDetails?.packageType === 'deposit') {
      return '500.00'
    }
    return (packagePrice + addonsPrice).toFixed(2)
  }

  return (
    <>
      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal Content */}
          <div className="relative z-50 w-full max-w-2xl transform rounded-lg bg-white p-6 shadow-xl transition-all">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Success Icon and Title */}
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>

              <h2 className="mt-4 text-3xl font-bold text-gray-900">
                Payment Successful! 🎉
              </h2>

              <p className="mt-2 text-lg text-gray-600">
                Your booking has been confirmed
              </p>
            </div>

            {/* Payment Details */}
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-gray-900">
                    ${getPaymentAmount()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-900">
                    {paymentIntent?.payment_method_types?.[0] || 'Card'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {paymentIntent?.id || bookingFlow?.bookingId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="mt-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Booking Summary</h3>

              {/* Photographer */}
              {bookingFlow?.photographerDetails && (
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Photographer</p>
                    <p className="text-sm text-gray-600">
                      {bookingFlow.photographerDetails.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Date */}
              {bookingFlow?.scheduleDetails?.date && (
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Session Date</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(bookingFlow.scheduleDetails.date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {bookingFlow?.locationDetails && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-600">
                      {bookingFlow.locationDetails.address ||
                       bookingFlow.locationDetails.city ||
                       'To be confirmed'}
                    </p>
                  </div>
                </div>
              )}

              {/* Package */}
              {bookingFlow?.packageDetails && (
                <div className="flex items-start space-x-3">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Package</p>
                    <p className="text-sm text-gray-600">
                      {bookingFlow.packageDetails.packageName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Your photographer will contact you within 24 hours</li>
                <li>• You can view and manage your booking in your dashboard</li>
                {bookingFlow?.packageDetails?.packageType === 'deposit' && (
                  <li>• Remaining balance will be due 14 days before the session</li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={handleViewBooking}
              >
                View Booking Details
              </Button>

              {paymentIntent?.receipt_url && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={handleDownloadReceipt}
                  icon={<Download className="h-4 w-4" />}
                >
                  Download Receipt
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleViewDashboard}
              >
                Go to Dashboard
              </Button>
            </div>

            {/* Footer Message */}
            <p className="mt-4 text-center text-xs text-gray-500">
              Thank you for choosing Love & Photos! We're excited to capture your special moments.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default PaymentSuccessModal