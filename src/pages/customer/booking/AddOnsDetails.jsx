/**
 * AddOnsDetails Page
 * Magic UI enhanced booking flow step 4 - Add-ons selection with dynamic pricing
 * Features: responsive Magic UI grid, sticky totals sidebar, validation, accessibility
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import AddOnsGrid from '@components/booking/AddOnsGrid'
import TotalsPanel from '@components/booking/TotalsPanel'
import Button from '@components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@components/ui/Dialog'

const AddOnsDetails = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const {
    bookingFlow,
    goToStep,
    getStepsForStepper,
    canAccessStep,
    updateAddonsDetails
  } = useBookingFlow()

  // Local state for add-ons selection
  const [selectedAddons, setSelectedAddons] = useState(
    bookingFlow.addonsDetails?.selectedAddons || []
  )

  // Info modal state
  const [infoModal, setInfoModal] = useState({
    isOpen: false,
    addon: null
  })

  // Check if user can access this step
  useEffect(() => {
    if (!canAccessStep('addons')) {
      // Find the first incomplete step and redirect there
      if (!canAccessStep('schedule')) {
        navigate(`/booking/${photographerId}/schedule`, { replace: true })
      } else if (!canAccessStep('package')) {
        navigate(`/booking/${photographerId}/package`, { replace: true })
      } else if (!canAccessStep('location')) {
        navigate(`/booking/${photographerId}/location`, { replace: true })
      }
      return
    }

    // Ensure we're on the correct step
    goToStep('addons')
  }, [photographerId, canAccessStep, goToStep, navigate])

  // Build package context for pricing and validation
  const packageContext = {
    selectedDate: bookingFlow.scheduleDetails?.date,
    packageType: bookingFlow.packageDetails?.packageType === 'monthly' ? 'photoOnly' : 'photoVideo',
    packagePrice: bookingFlow.packageDetails?.packagePrice || 0,
    hoursBooked: bookingFlow.packageDetails?.hoursBooked || 6,
    isPhotoVideo: bookingFlow.packageDetails?.isPhotoVideo || false
  }

  // Handle add-on selection changes
  const handleSelectionChange = (newSelections) => {
    setSelectedAddons(newSelections)
  }

  // Handle info click
  const handleInfoClick = (addon) => {
    setInfoModal({
      isOpen: true,
      addon
    })
  }

  // Handle remove add-on from totals panel
  const handleRemoveAddon = (addonId) => {
    const newSelections = selectedAddons.filter(addon => addon.id !== addonId)
    setSelectedAddons(newSelections)
  }

  // Handle continue to next step
  const handleContinue = () => {
    // Update booking context with add-ons details
    updateAddonsDetails({
      selectedAddons: selectedAddons
    })

    // Navigate to contract step
    navigate(`/booking/${photographerId}/contract`)
  }

  // Handle skip add-ons
  const handleSkip = () => {
    // Update with empty add-ons to mark step as completed
    updateAddonsDetails({
      selectedAddons: []
    })

    // Navigate to contract step
    navigate(`/booking/${photographerId}/contract`)
  }

  const steps = getStepsForStepper()
  const packagePrice = bookingFlow.packageDetails?.packagePrice || 0
  const packageTitle = bookingFlow.packageDetails?.packageTitle || 'Package'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Stepper */}
      <BookingStepper
        steps={steps}
        currentStepIndex={3}
        onStepClick={(stepIndex, step) => {
          if (step.status === 'completed') {
            const stepId = steps[stepIndex].id
            if (stepId === 'location') {
              navigate(`/booking/${photographerId}/location`)
            } else if (stepId === 'package') {
              navigate(`/booking/${photographerId}/package`)
            } else if (stepId === 'schedule') {
              navigate(`/booking/${photographerId}/schedule`)
            }
          }
        }}
      />

      {/* Main Content - Magic UI enhanced */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-dusty-900 mb-3 leading-tight">
            Enhance Your Experience
          </h1>
          <p className="text-lg text-dusty-600 max-w-2xl mx-auto leading-relaxed">
            Choose from our curated selection of add-ons to make your photo session even more special. Each add-on is designed to enhance your experience and deliver exceptional value.
          </p>
        </div>

        {/* Magic UI Responsive Layout */}
        <div className="lg:grid lg:grid-cols-4 gap-8 xl:gap-10">
          {/* Add-ons Grid (3 columns on desktop) */}
          <div className="lg:col-span-3">
            <AddOnsGrid
              selectedAddons={selectedAddons}
              onSelectionChange={handleSelectionChange}
              onInfoClick={handleInfoClick}
              context={packageContext}
              className="mb-8 lg:mb-0"
            />
          </div>

          {/* Desktop Totals Panel (1 column sidebar) */}
          <div className="hidden lg:block lg:col-span-1">
            <TotalsPanel
              selectedAddons={selectedAddons}
              packagePrice={packagePrice}
              packageTitle={packageTitle}
              onRemoveAddon={handleRemoveAddon}
              onContinue={handleContinue}
              onSkip={selectedAddons.length === 0 ? handleSkip : null}
              position="right"
              isSticky={true}
            />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden mt-8">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/booking/${photographerId}/location`)}
            >
              Back to Locations
            </Button>

            <div className="flex space-x-3">
              {selectedAddons.length === 0 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip Add-Ons
                </Button>
              )}

              <Button
                size="lg"
                onClick={handleContinue}
                className="min-w-32"
                disabled={!packagePrice}
              >
                Continue
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-dusty-500">
            You can modify your selection before finalizing
          </p>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate(`/booking/${photographerId}/location`)}
          >
            Back to Locations
          </Button>

          <p className="text-sm text-dusty-500">
            You can modify your selection before finalizing
          </p>
        </div>
      </div>

      {/* Mobile Totals Panel (Bottom Sheet) */}
      <div className="lg:hidden">
        <TotalsPanel
          selectedAddons={selectedAddons}
          packagePrice={packagePrice}
          packageTitle={packageTitle}
          onRemoveAddon={handleRemoveAddon}
          onContinue={handleContinue}
          onSkip={selectedAddons.length === 0 ? handleSkip : null}
          position="bottom"
          isSticky={false}
        />
      </div>

      {/* Info Modal */}
      <Dialog
        open={infoModal.isOpen}
        onOpenChange={(open) => !open && setInfoModal({ isOpen: false, addon: null })}
      >
        <DialogContent className="max-w-lg">
          <DialogClose onClose={() => setInfoModal({ isOpen: false, addon: null })} />
          <DialogHeader>
            <DialogTitle>{infoModal.addon?.title || ''}</DialogTitle>
          </DialogHeader>

          {infoModal.addon && (
            <div className="space-y-4">
              {/* Price Information */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ${infoModal.addon.displayPrice || infoModal.addon.basePrice}
                  </span>
                  {infoModal.addon.originalPrice && infoModal.addon.originalPrice > (infoModal.addon.displayPrice || infoModal.addon.basePrice) && (
                    <span className="text-sm text-gray-500 line-through">
                      ${infoModal.addon.originalPrice}
                    </span>
                  )}
                </div>
                {infoModal.addon.priceCalculation && (
                  <p className="text-xs text-gray-600 mt-1">
                    {infoModal.addon.priceCalculation}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {infoModal.addon.description}
                </p>
              </div>

              {/* Features */}
              {infoModal.addon.features && infoModal.addon.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">What's Included</h4>
                  <ul className="space-y-1">
                    {infoModal.addon.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 mt-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Badges */}
              {(infoModal.addon.badges?.discount || infoModal.addon.badges?.popularity) && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                  <div className="space-y-1">
                    {infoModal.addon.badges.popularity && (
                      <p className="text-xs text-blue-600">
                        ✨ {infoModal.addon.badges.popularity}
                      </p>
                    )}
                    {infoModal.addon.badges.discount && (
                      <p className="text-xs text-green-600">
                        💰 {infoModal.addon.badges.discount}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddOnsDetails