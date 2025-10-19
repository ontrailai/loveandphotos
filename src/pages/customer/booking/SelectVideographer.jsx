/**
 * SelectVideographer Page
 * Grid of available videographers with 1-click selection
 * Accessed from booking flow after package selection when user opts for video add-on
 */

import React, { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { VideoIcon, StarIcon, MapPinIcon, CheckCircle2Icon, CameraIcon, XIcon } from 'lucide-react'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { useVideographersBatched } from '@hooks/useVideographersBatched'
import Button from '@components/ui/Button'
import SafeAvatar from '@components/shared/SafeAvatar'
import { getPhotoPackagePrice } from '@/lib/constants/packagePricing'

/**
 * VideographerCard Component
 * Simplified card with 1-click "Add to Booking" button
 */
function VideographerCard({ videographer, onSelect, isSelected }) {
  const {
    users,
    average_rating,
    total_reviews,
    location_city,
    location_state,
    gear_has_camera,
    gear_has_lenses,
    gear_has_tripod,
    gear_has_gimbal,
    gear_has_audio_recorder,
    gear_has_lighting
  } = videographer

  const fullName = users?.full_name || 'Videographer'
  const location = location_city && location_state
    ? `${location_city}, ${location_state}`
    : location_city || location_state || 'Location not specified'

  // Count gear items
  const gearCount = [
    gear_has_camera,
    gear_has_lenses,
    gear_has_tripod,
    gear_has_gimbal,
    gear_has_audio_recorder,
    gear_has_lighting
  ].filter(Boolean).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl bg-white border-2 transition-all duration-200 ${
        isSelected
          ? 'border-rose-500 shadow-lg shadow-rose-100'
          : 'border-gray-200 hover:border-rose-300 hover:shadow-md'
      }`}
    >
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle2Icon className="w-4 h-4" />
            Selected
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Avatar and Info */}
        <div className="flex items-start gap-4 mb-4">
          <SafeAvatar
            src={users?.avatar_url}
            alt={fullName}
            fallback={fullName.charAt(0)}
            className="w-16 h-16 rounded-full border-2 border-gray-100"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {fullName}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900">
                  {average_rating?.toFixed(1) || '5.0'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ({total_reviews || 0} reviews)
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Gear Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CameraIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Professional Equipment ({gearCount} items)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {gear_has_camera && (
              <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">
                📷 Camera
              </span>
            )}
            {gear_has_gimbal && (
              <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">
                🤸 Gimbal
              </span>
            )}
            {gear_has_audio_recorder && (
              <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">
                🎙️ Audio
              </span>
            )}
            {gear_has_lighting && (
              <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded">
                💡 Lighting
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onSelect(videographer)}
          variant={isSelected ? 'secondary' : 'primary'}
          className="w-full"
        >
          {isSelected ? (
            <>
              <CheckCircle2Icon className="w-4 h-4 mr-2" />
              Added to Booking
            </>
          ) : (
            <>
              <VideoIcon className="w-4 h-4 mr-2" />
              Add to Booking
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

/**
 * Main SelectVideographer Page
 */
export default function SelectVideographer() {
  const navigate = useNavigate()
  const { photographerId } = useParams()
  const { bookingFlow, setVideographerId, updatePackageDetails } = useBookingFlow()

  // Get event location from booking flow to filter videographers by location
  const eventCity = bookingFlow.locationDetails?.city
  const eventState = bookingFlow.locationDetails?.state

  // Fetch videographers filtered by event location (city first, then state fallback)
  const { data: videographers, isLoading, error, isEmpty } = useVideographersBatched({ city: eventCity, state: eventState })

  // Check if user has selected a package (route protection)
  useEffect(() => {
    if (!bookingFlow.packageDetails?.packagePrice && photographerId) {
      console.warn('⚠️ No package selected, redirecting to package selection')
      navigate(`/booking/${photographerId}/packages`, { replace: true })
    }
  }, [bookingFlow.packageDetails, navigate, photographerId])

  // Handle videographer selection
  const handleSelectVideographer = useCallback((videographer) => {
    console.log('🎥 Selected videographer:', videographer.id)
    setVideographerId(videographer.id)

    // Navigate to add-ons step
    navigate(`/booking/${photographerId}/addons`)
  }, [setVideographerId, navigate, photographerId])

  // Handle skip (no videographer)
  const handleSkip = useCallback(() => {
    console.log('⏭️ Skipping videographer selection')
    setVideographerId(null)

    // Revert package price to photo-only pricing since user is declining video
    const hoursBooked = bookingFlow.packageDetails.hoursBooked
    const photoOnlyPrice = getPhotoPackagePrice(hoursBooked)

    updatePackageDetails({
      ...bookingFlow.packageDetails,
      packagePrice: photoOnlyPrice,
      isPhotoVideo: false,
      packageTitle: `${hoursBooked} Hour${hoursBooked > 1 ? 's' : ''} - Photography`
    })

    navigate(`/booking/${photographerId}/addons`)
  }, [setVideographerId, updatePackageDetails, bookingFlow.packageDetails, navigate, photographerId])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <VideoIcon className="w-6 h-6 text-rose-600" />
                  <h1 className="text-3xl font-display font-bold text-gray-900">
                    Add a Videographer
                  </h1>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  Capture your special moments on video. Select a professional videographer to add to your booking.
                </p>
              </div>

              {/* Skip Button */}
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-900"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-32" />
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-4 bg-gray-200 rounded w-28" />
                    </div>
                  </div>
                  <div className="h-20 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-800 font-medium mb-2">Failed to load videographers</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="bg-red-100 text-red-700 hover:bg-red-200"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {isEmpty && !isLoading && (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <VideoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Videographers Available
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {eventCity
                  ? `We don't have any videographers available in ${eventCity} at the moment. You can continue with photography only.`
                  : "We don't have any videographers available in your area at the moment. You can continue with photography only."
                }
              </p>
              <Button onClick={handleSkip}>
                Continue without Video
              </Button>
            </div>
          )}

          {/* Videographers Grid */}
          {!isLoading && !isEmpty && (
            <>
              <div className="mb-6">
                <p className="text-gray-700">
                  <span className="font-medium">{videographers.length}</span> videographer{videographers.length !== 1 ? 's' : ''} available
                  {eventCity && <span className="text-gray-500"> in {eventCity}</span>}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videographers.map((videographer, index) => (
                  <VideographerCard
                    key={videographer.id}
                    videographer={videographer}
                    onSelect={handleSelectVideographer}
                    isSelected={bookingFlow.videographerId === videographer.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
