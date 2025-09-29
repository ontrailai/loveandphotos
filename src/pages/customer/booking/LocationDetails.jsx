/**
 * LocationDetails Page
 * Step 3 of booking flow - Location selection with photographer locations
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPinIcon } from 'lucide-react'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { usePhotographerLocations } from '@hooks/usePhotographerLocations'
import BookingStepper from '@components/booking/BookingStepper'
import LocationCard, { LoadingLocationCard, EmptyLocationCard } from '@components/booking/LocationCard'
import Button from '@components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@components/ui/Dialog'
import { clsx } from 'clsx'

const LocationDetails = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const {
    bookingFlow,
    goToStep,
    getStepsForStepper,
    canAccessStep,
    updateLocationDetails
  } = useBookingFlow()

  // Fetch photographer locations
  const { locations, isLoading, error } = usePhotographerLocations(photographerId)

  // Local state for location selection and modal
  const [selectedLocationId, setSelectedLocationId] = useState(
    bookingFlow.locationDetails?.locationId || null
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLocation, setModalLocation] = useState(null)

  // Check if user can access this step
  useEffect(() => {
    if (!canAccessStep('location')) {
      // Find the first incomplete step and redirect there
      if (!canAccessStep('package')) {
        navigate(`/booking/${photographerId}/schedule`, { replace: true })
      } else {
        navigate(`/booking/${photographerId}/package`, { replace: true })
      }
      return
    }

    // Ensure we're on the correct step
    goToStep('location')
  }, [photographerId, canAccessStep, goToStep, navigate])

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocationId(location.id)
  }

  // Handle route details modal
  const handleRouteDetails = (location) => {
    setModalLocation(location)
    setIsModalOpen(true)
  }

  // Handle continue to next step
  const handleContinue = () => {
    if (!selectedLocationId) return

    const selectedLocation = locations.find(loc => loc.id === selectedLocationId)
    if (!selectedLocation) return

    // Update booking context with location details
    updateLocationDetails({
      locationId: selectedLocation.id,
      locationTitle: selectedLocation.title,
      locationVibe: selectedLocation.vibe
    })

    // Navigate to next step (Add-Ons)
    navigate(`/booking/${photographerId}/addons`)
  }

  const steps = getStepsForStepper()
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId)
  const canContinue = !!selectedLocationId

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Stepper */}
      <BookingStepper
        steps={steps}
        currentStepIndex={2}
        onStepClick={(stepIndex, step) => {
          if (step.status === 'completed') {
            const stepId = steps[stepIndex].id
            navigate(`/booking/${photographerId}/${stepId}`)
          }
        }}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dusty-900 mb-2">
            Choose Your Location
          </h1>
          <p className="text-lg text-dusty-600">
            Select where you'd like your photo session to take place
          </p>
        </div>

        {/* Location Grid */}
        {error ? (
          // Error State
          <div className="text-center py-12">
            <MapPinIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dusty-900 mb-2">
              Unable to Load Locations
            </h3>
            <p className="text-dusty-600 mb-4">
              There was an error loading the available locations.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          // Loading State
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
            aria-label="Loading locations"
          >
            {[...Array(6)].map((_, index) => (
              <LoadingLocationCard key={index} />
            ))}
          </div>
        ) : locations.length === 0 ? (
          // Empty State
          <div className="flex justify-center mb-8">
            <EmptyLocationCard />
          </div>
        ) : (
          // Location Cards Grid
          <div
            role="radiogroup"
            aria-label="Location selection"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          >
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                isSelected={selectedLocationId === location.id}
                onSelect={handleLocationSelect}
                onRouteDetails={handleRouteDetails}
              />
            ))}
          </div>
        )}

        {/* Selection Summary */}
        {selectedLocation && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <MapPinIcon className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-primary-900">
                  Location Selected
                </p>
                <p className="text-sm text-primary-700">
                  {selectedLocation.title} - {selectedLocation.vibe}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/booking/${photographerId}/package`)}
          >
            Back to Packages
          </Button>

          <Button
            size="lg"
            disabled={!canContinue}
            onClick={handleContinue}
            className="min-w-32"
          >
            Continue
          </Button>
        </div>

        {/* Help Text */}
        {!selectedLocationId && !isLoading && locations.length > 0 && (
          <p className="text-center text-sm text-dusty-500 mt-4">
            Please select a location to continue to the next step
          </p>
        )}
      </div>

      {/* Route Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalLocation?.title}</DialogTitle>
            <DialogDescription className="text-sm text-dusty-600 font-medium">
              {modalLocation?.vibe}
            </DialogDescription>
          </DialogHeader>

          <DialogClose onClose={() => setIsModalOpen(false)} />

          {modalLocation?.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={modalLocation.imageUrl}
                alt={modalLocation.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-dusty-900 mb-2">About This Location</h4>
              <p className="text-sm text-dusty-700 leading-relaxed">
                {modalLocation?.description}
              </p>
            </div>

            {modalLocation?.badge && (
              <div>
                <h4 className="font-medium text-dusty-900 mb-2">Why Choose This Location</h4>
                <p className="text-sm text-dusty-700">
                  {modalLocation.badge === 'Local\'s Choice'
                    ? 'Recommended by local photographers for its unique beauty and accessibility.'
                    : 'One of our most popular locations, chosen frequently by couples for its stunning backdrops.'
                  }
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={() => {
                  handleLocationSelect(modalLocation)
                  setIsModalOpen(false)
                }}
                className="w-full"
                variant={selectedLocationId === modalLocation?.id ? 'primary' : 'outline'}
              >
                {selectedLocationId === modalLocation?.id ? 'Selected' : 'Select This Location'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LocationDetails