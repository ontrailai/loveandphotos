import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import { getAllPhotoPackages, getPhotoPackagePrice } from '@/lib/constants/packagePricing'
import Button from '@components/ui/Button'
import { Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const PackageSelection = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const { updatePackageDetails, bookingFlow } = useBookingFlow()
  const [selectedHours, setSelectedHours] = useState(bookingFlow.packageDetails.hoursBooked || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const packages = getAllPhotoPackages()

  const handlePackageSelect = (hours, price) => {
    setSelectedHours(hours)
  }

  const handleContinue = async () => {
    if (!selectedHours) {
      toast.error('Please select a package')
      return
    }

    setIsSubmitting(true)

    try {
      const price = getPhotoPackagePrice(selectedHours)

      // Update booking flow context with selected package
      await updatePackageDetails({
        hoursBooked: selectedHours,
        packagePrice: price,
        packageType: 'hourly', // We're using hourly packages now
        packageTitle: `${selectedHours} Hour${selectedHours > 1 ? 's' : ''} - Photography`,
        isPhotoVideo: false // Photo only at this stage
      })

      toast.success('Package selected!')

      // Navigate to video selection
      navigate(`/booking/${photographerId}/video`)
    } catch (error) {
      console.error('[PackageSelection] Error:', error)
      toast.error('Failed to save package selection')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Package
          </h1>
          <p className="text-lg text-gray-600">
            Select the duration that best fits your event
          </p>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {packages.map((pkg) => {
            const isSelected = selectedHours === pkg.hours
            const isPopular = pkg.hours === 6 || pkg.hours === 8

            return (
              <button
                key={pkg.hours}
                onClick={() => handlePackageSelect(pkg.hours, pkg.price)}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-lg ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                {/* Selected Check */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-primary-600 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Package Content */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-primary-600">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl font-bold">{pkg.hours}</span>
                    <span className="text-lg">Hour{pkg.hours > 1 ? 's' : ''}</span>
                  </div>

                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${pkg.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Photography Coverage
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="pt-4 border-t border-gray-200">
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Professional photographer</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Edited high-res photos</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Online gallery delivery</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedHours || isSubmitting}
            size="lg"
            className="min-w-[200px] bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Video Options'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help choosing? Most couples book 6-8 hours for wedding coverage.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PackageSelection
