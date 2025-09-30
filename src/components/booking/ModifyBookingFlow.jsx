/**
 * ModifyBookingFlow Component
 * 5-step wizard for modifying existing bookings (add hours, add-ons)
 * Steps: 1) Summary 2) Modify 3) Preview 4) Payment 5) Confirmation
 */

import { useState } from 'react'
import { useAuth } from '@contexts/AuthContext'
import toast from 'react-hot-toast'
import Modal from '@components/ui/Modal'
import BookingSummaryStep from './modify-steps/BookingSummaryStep'
import ModificationFormStep from './modify-steps/ModificationFormStep'
import PricePreviewStep from './modify-steps/PricePreviewStep'
import PaymentStep from './modify-steps/PaymentStep'
import ConfirmationStep from './modify-steps/ConfirmationStep'

const ModifyBookingFlow = ({ booking, onClose, onComplete }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [modifications, setModifications] = useState({
    hoursToAdd: 0,
    addOnsToAdd: [],
    addOnsToRemove: []
  })

  // Preview data from API
  const [preview, setPreview] = useState(null)

  // Amendment record after creation
  const [amendment, setAmendment] = useState(null)

  // Step 1 → Step 2: Review → Modify
  const handleProceedToModify = () => {
    setCurrentStep(2)
  }

  // Step 2 → Step 3: Fetch preview from API
  const handleFetchPreview = async (modData) => {
    try {
      setLoading(true)
      setModifications(modData)

      const token = (await import('@lib/supabase')).supabase.auth.getSession().then(s => s.data.session?.access_token)

      const response = await fetch(`/api/bookings/${booking.id}/amendments/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hoursToAdd: modData.hoursToAdd,
          addOnsToAdd: modData.addOnsToAdd,
          addOnsToRemove: modData.addOnsToRemove
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate price preview')
      }

      const data = await response.json()
      setPreview(data.preview)
      setCurrentStep(3)
    } catch (error) {
      console.error('Error fetching preview:', error)
      toast.error('Failed to calculate price preview')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 → Step 4: Proceed to payment
  const handleProceedToPayment = () => {
    setCurrentStep(4)
  }

  // Step 4 → Step 5: Create amendment and process payment
  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      setLoading(true)

      const { supabase } = await import('@lib/supabase')
      const token = (await supabase.auth.getSession()).data.session?.access_token

      // Create amendment record
      const response = await fetch(`/api/bookings/${booking.id}/amendments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hoursToAdd: modifications.hoursToAdd,
          addOnsToAdd: modifications.addOnsToAdd,
          addOnsToRemove: modifications.addOnsToRemove,
          priceDifferential: preview.priceDifferential,
          lateFee: preview.lateFee,
          stripePaymentIntentId: paymentIntentId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create amendment')
      }

      const data = await response.json()
      setAmendment(data.amendment)

      // Confirm payment status
      const confirmResponse = await fetch(
        `/api/bookings/${booking.id}/amendments/${data.amendment.id}/confirm`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm payment')
      }

      // Send confirmation email (via backend or directly)
      // TODO: Trigger email via /api/send-email endpoint

      setCurrentStep(5)
      toast.success('Booking modification confirmed!')

      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  // Step navigation
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    if (currentStep === 5 || window.confirm('Are you sure you want to cancel? Your changes will be lost.')) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={currentStep === 5 ? 'Modification Complete' : 'Modify Booking'}
      size="xl"
    >
      <div className="min-h-[500px]">
        {/* Progress Indicator */}
        {currentStep < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${currentStep >= step
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`h-1 flex-1 mx-2
                        ${currentStep > step ? 'bg-primary-600' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Review</span>
              <span>Modify</span>
              <span>Preview</span>
              <span>Payment</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <BookingSummaryStep
            booking={booking}
            onNext={handleProceedToModify}
            onCancel={handleClose}
          />
        )}

        {currentStep === 2 && (
          <ModificationFormStep
            booking={booking}
            onNext={handleFetchPreview}
            onBack={handleBack}
            loading={loading}
          />
        )}

        {currentStep === 3 && preview && (
          <PricePreviewStep
            booking={booking}
            preview={preview}
            modifications={modifications}
            onNext={handleProceedToPayment}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && preview && (
          <PaymentStep
            booking={booking}
            preview={preview}
            onSuccess={handlePaymentSuccess}
            onBack={handleBack}
            loading={loading}
          />
        )}

        {currentStep === 5 && amendment && (
          <ConfirmationStep
            booking={booking}
            amendment={amendment}
            preview={preview}
            onClose={handleClose}
          />
        )}
      </div>
    </Modal>
  )
}

export default ModifyBookingFlow