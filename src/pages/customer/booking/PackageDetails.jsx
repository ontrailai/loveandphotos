/**
 * PackageDetails Page
 * Step 2 of booking flow - Photography tier package selection
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, CheckIcon, StarIcon, Clock, Image } from 'lucide-react'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import VideoAddOnModal from '@components/booking/VideoAddOnModal'
import { clsx } from 'clsx'

const PackageDetails = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const {
    bookingFlow,
    updatePackageDetails,
    goToStep,
    getStepsForStepper,
    canAccessStep
  } = useBookingFlow()

  const [selectedPackage, setSelectedPackage] = useState(
    bookingFlow.packageDetails?.packageType || null
  )
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Check if user can access this step
  useEffect(() => {
    if (!canAccessStep('package')) {
      // Redirect to schedule step if prerequisites not met
      navigate(`/booking/${photographerId}/schedule`, { replace: true })
      return
    }

    // Ensure we're on the correct step
    goToStep('package')
  }, [photographerId, canAccessStep, goToStep, navigate])

  // Handle package selection
  const handlePackageSelect = (packageData) => {
    setSelectedPackage(packageData.id)
    updatePackageDetails({
      packageType: packageData.tier, // Store tier name (Bronze/Silver/Gold/Platinum)
      packagePrice: packageData.packagePrice, // Store package price
      hoursBooked: packageData.hours,
      isPhotoVideo: packageData.includesVideo,
      packageTitle: packageData.title // Store full package title
    })
  }

  // Handle continue to next step - show video modal first
  const handleContinue = () => {
    if (selectedPackage) {
      // Show video add-on modal before proceeding
      setShowVideoModal(true)
    }
  }

  // Handle video modal "Yes" - navigate to videographer selection
  const handleAddVideo = () => {
    setShowVideoModal(false)
    navigate(`/booking/${photographerId}/select-videographer`)
  }

  // Handle video modal "No" - proceed to add-ons
  const handleSkipVideo = () => {
    setShowVideoModal(false)
    navigate(`/booking/${photographerId}/addons`)
  }

  // Photography tier packages with pricing
  // Prices based on 6-hour wedding package (hours × hourly_rate from pay_tiers)
  const packages = [
    {
      id: 'bronze',
      tier: 'Bronze',
      title: 'Bronze Package',
      price: '$900',
      badge: 'BEST VALUE',
      badgeColor: 'bg-amber-600',
      description: '6 hours of professional photography',
      packagePrice: 900, // 6 hours × $150/hour
      hours: 6,
      includesVideo: false,
      features: [
        '6 hours of coverage',
        'Professional photographer',
        '200+ edited high-resolution photos',
        'Online gallery',
        'Print release included'
      ],
      popular: false
    },
    {
      id: 'silver',
      tier: 'Silver',
      title: 'Silver Package',
      price: '$1,350',
      badge: 'MOST POPULAR',
      badgeColor: 'bg-gray-400',
      description: '6 hours with enhanced features',
      packagePrice: 1350, // 6 hours × $225/hour
      hours: 6,
      includesVideo: false,
      features: [
        '6 hours of coverage',
        'Experienced photographer',
        '300+ edited high-resolution photos',
        'Priority editing turnaround',
        'Online gallery & print release',
        'Engagement session included'
      ],
      popular: true
    },
    {
      id: 'gold',
      tier: 'Gold',
      title: 'Gold Package',
      price: '$2,100',
      badge: 'PREMIUM',
      badgeColor: 'bg-yellow-500',
      description: '6 hours with premium service',
      packagePrice: 2100, // 6 hours × $350/hour
      hours: 6,
      includesVideo: false,
      features: [
        '6 hours of coverage',
        'Premium photographer',
        '400+ edited high-resolution photos',
        'Same-day sneak peek photos',
        'Premium online gallery',
        'Engagement + bridal session',
        'Custom photo album'
      ],
      popular: false
    },
    {
      id: 'platinum',
      tier: 'Platinum',
      title: 'Platinum Package',
      price: '$3,000',
      badge: 'LUXURY',
      badgeColor: 'bg-slate-300',
      description: '6 hours with luxury service',
      packagePrice: 3000, // 6 hours × $500/hour
      hours: 6,
      includesVideo: false,
      features: [
        '6 hours of coverage',
        'Elite photographer',
        '500+ edited high-resolution photos',
        'Same-day highlights reel',
        'Luxury online gallery',
        'Full engagement + bridal sessions',
        'Premium custom album',
        'Second shooter included'
      ],
      popular: false
    }
  ]

  const steps = getStepsForStepper()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Stepper */}
      <BookingStepper
        steps={steps}
        currentStepIndex={1}
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
            Choose Your Photography Package
          </h1>
          <p className="text-lg text-dusty-600">
            Select the tier that best fits your needs and budget
          </p>
          <p className="text-sm text-dusty-500 mt-2">
            Payment plans available at checkout • All packages include 6 hours of coverage
          </p>
        </div>

        {/* Package Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={clsx(
                'relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg',
                {
                  'ring-2 ring-primary-500 shadow-lg': selectedPackage === pkg.id,
                  'border-gray-200 hover:border-primary-300': selectedPackage !== pkg.id
                }
              )}
              onClick={() => handlePackageSelect(pkg)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePackageSelect(pkg)
                }
              }}
              aria-label={`Select ${pkg.title} package`}
              aria-pressed={selectedPackage === pkg.id}
            >
              {/* Badge */}
              <div className="absolute top-0 left-0 right-0">
                <div className={clsx(
                  'text-white text-xs font-medium text-center py-2',
                  pkg.badgeColor
                )}>
                  {pkg.popular && <StarIcon className="w-3 h-3 inline mr-1" />}
                  {pkg.badge}
                </div>
              </div>

              <div className="p-6 pt-12">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-dusty-900 mb-2">
                    {pkg.tier}
                  </h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl font-bold text-dusty-900">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-xs text-dusty-600 mb-3">
                    {pkg.description}
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-dusty-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {pkg.hours}h
                    </div>
                    <div className="flex items-center">
                      <Image className="w-3 h-3 mr-1" />
                      {pkg.features[2]?.match(/\d+/)?.[0] || '200'}+ photos
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-dusty-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  variant={selectedPackage === pkg.id ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePackageSelect(pkg)
                  }}
                >
                  {selectedPackage === pkg.id ? 'Selected' : 'Select'}
                </Button>

                {/* Selection Indicator */}
                {selectedPackage === pkg.id && (
                  <div className="absolute top-14 right-4">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedPackage && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckIcon className="w-5 h-5 text-primary-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-primary-900">
                  Package Selected: {packages.find(p => p.id === selectedPackage)?.title}
                </p>
                <p className="text-sm text-primary-700">
                  Base price: {packages.find(p => p.id === selectedPackage)?.price} • Payment plans available at checkout
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/booking/${photographerId}/schedule`)}
          >
            Back to Schedule
          </Button>

          <Button
            size="lg"
            disabled={!selectedPackage}
            onClick={handleContinue}
            className="min-w-32"
          >
            Continue
          </Button>
        </div>

        {/* Help Text */}
        {!selectedPackage && (
          <p className="text-center text-sm text-dusty-500 mt-4">
            Please select a package to continue to the next step
          </p>
        )}
      </div>

      {/* Video Add-On Modal */}
      <VideoAddOnModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onAddVideo={handleAddVideo}
        onSkip={handleSkipVideo}
      />
    </div>
  )
}

export default PackageDetails
