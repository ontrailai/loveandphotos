import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { getPhotoVideoPackagePrice, getPhotoPackagePrice } from '@/lib/constants/packagePricing'
import Button from '@components/ui/Button'
import { Video, X, Check, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const VideoSelection = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const { updatePackageDetails, bookingFlow } = useBookingFlow()
  const [wantsVideo, setWantsVideo] = useState(bookingFlow.packageDetails.isPhotoVideo || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hoursBooked = bookingFlow.packageDetails.hoursBooked

  // Calculate pricing
  const photoOnlyPrice = getPhotoPackagePrice(hoursBooked)
  const photoVideoPrice = getPhotoVideoPackagePrice(hoursBooked)
  const videoPremium = photoVideoPrice - photoOnlyPrice

  if (!hoursBooked || !photoOnlyPrice) {
    // If no package selected, redirect back
    navigate(`/booking/${photographerId}/packages`)
    return null
  }

  const handleSelection = (includeVideo) => {
    setWantsVideo(includeVideo)
  }

  const handleContinue = async () => {
    setIsSubmitting(true)

    try {
      const finalPrice = wantsVideo ? photoVideoPrice : photoOnlyPrice
      const packageTitle = wantsVideo
        ? `${hoursBooked} Hour${hoursBooked > 1 ? 's' : ''} - Photo + Video`
        : `${hoursBooked} Hour${hoursBooked > 1 ? 's' : ''} - Photography`

      // Update booking flow context with video selection
      await updatePackageDetails({
        ...bookingFlow.packageDetails,
        packagePrice: finalPrice,
        isPhotoVideo: wantsVideo,
        packageTitle
      })

      toast.success(wantsVideo ? 'Video added to your package!' : 'Photography package confirmed!')

      // If video selected, go to videographer selection; otherwise skip to add-ons
      if (wantsVideo) {
        navigate(`/booking/${photographerId}/select-videographer`)
      } else {
        navigate(`/booking/${photographerId}/addons`)
      }
    } catch (error) {
      console.error('[VideoSelection] Error:', error)
      toast.error('Failed to save video selection')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Do You Want Video?
          </h1>
          <p className="text-lg text-gray-600">
            Capture your special day in motion with professional videography
          </p>
        </div>

        {/* Current Package Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Selected Package</p>
              <p className="text-xl font-semibold text-gray-900">
                {hoursBooked} Hour{hoursBooked > 1 ? 's' : ''} Photography
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${photoOnlyPrice.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Base Price</p>
            </div>
          </div>
        </div>

        {/* Video Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* No Video Option */}
          <button
            onClick={() => handleSelection(false)}
            className={`relative p-8 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
              !wantsVideo
                ? 'border-gray-900 bg-gray-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-400'
            }`}
          >
            {/* Selected Check */}
            {!wantsVideo && (
              <div className="absolute top-4 right-4">
                <div className="bg-gray-900 rounded-full p-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-gray-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No, Thank You
                </h3>
                <p className="text-gray-600">
                  Continue with photography only
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-3xl font-bold text-gray-900">
                  ${photoOnlyPrice.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Photography Package
                </div>
              </div>
            </div>
          </button>

          {/* Yes Video Option */}
          <button
            onClick={() => handleSelection(true)}
            className={`relative p-8 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
              wantsVideo
                ? 'border-primary-600 bg-primary-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Recommended</span>
              </span>
            </div>

            {/* Selected Check */}
            {wantsVideo && (
              <div className="absolute top-4 right-4">
                <div className="bg-primary-600 rounded-full p-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-primary-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Yes, Add Video
                </h3>
                <p className="text-gray-600">
                  Professional videographer for {hoursBooked} hour{hoursBooked > 1 ? 's' : ''}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-3xl font-bold text-primary-600">
                  ${photoVideoPrice.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Photo + Video Bundle
                  <span className="ml-2 text-green-600 font-semibold">
                    (+${videoPremium.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* What's Included */}
              <div className="pt-4 border-t border-gray-200">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Professional videographer</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Edited highlight film</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Cinematic storytelling</span>
                  </li>
                </ul>
              </div>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={isSubmitting}
            size="lg"
            className="min-w-[200px] bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Add-Ons'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-500">
            85% of couples add video to preserve their memories in motion
          </p>
          <button
            onClick={() => navigate(`/booking/${photographerId}/packages`)}
            className="text-sm text-primary-600 hover:text-primary-700 underline"
          >
            ← Change Package Duration
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoSelection
