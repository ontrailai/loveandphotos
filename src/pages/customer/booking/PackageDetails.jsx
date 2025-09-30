/**
 * PackageDetails Page
 * Step 2 of booking flow - Package selection with payment options
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCardIcon, CheckIcon, StarIcon } from 'lucide-react'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
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
    bookingFlow.packageDetails.packageType || null
  )

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
      packageType: packageData.paymentType,
      packagePrice: packageData.packagePrice, // Use the default package price for add-ons context
      hoursBooked: packageData.hours,
      isPhotoVideo: packageData.includesVideo,
      packageTitle: 'Photography Package' // Generic title since these are payment options
    })
  }

  // Handle continue to next step
  const handleContinue = () => {
    if (selectedPackage) {
      navigate(`/booking/${photographerId}/addons`)
    }
  }

  // Package configurations
  const packages = [
    {
      id: 'monthly',
      title: '$199 Payment Plan',
      price: '$199',
      period: '/month',
      badge: 'MOST POPULAR',
      description: 'Flexible monthly payments',
      // Add-ons context data (defaults for typical wedding package)
      packagePrice: 2000,
      hours: 6,
      includesVideo: false,
      paymentType: 'monthly',
      features: [
        'Split payment into 6 monthly installments',
        'No interest or hidden fees',
        'Automatic payment processing',
        'Full service access from day one',
        'Cancel anytime before final payment'
      ],
      buttonText: 'Monthly Plan',
      popular: true
    },
    {
      id: 'deposit',
      title: '$500 Deposit',
      price: '$500',
      period: 'upfront',
      description: 'Single upfront deposit',
      // Add-ons context data (defaults for typical wedding package)
      packagePrice: 2000,
      hours: 6,
      includesVideo: false,
      paymentType: 'deposit',
      features: [
        'Secure your photographer immediately',
        'Remaining balance due 30 days before event',
        'Preferred booking priority',
        'Direct communication with photographer',
        'Flexible rescheduling options'
      ],
      buttonText: 'Deposit',
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dusty-900 mb-2">
            Choose Your Package
          </h1>
          <p className="text-lg text-dusty-600">
            Select the payment option that works best for you
          </p>
        </div>

        {/* Package Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0">
                  <div className="bg-primary-500 text-white text-xs font-medium text-center py-2">
                    <StarIcon className="w-3 h-3 inline mr-1" />
                    {pkg.badge}
                  </div>
                </div>
              )}

              <div className={clsx('p-6', { 'pt-12': pkg.popular })}>
                {/* Package Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-dusty-900 mb-2">
                    {pkg.title}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl font-bold text-dusty-900">
                      {pkg.price}
                    </span>
                    <span className="text-dusty-600 ml-1">
                      {pkg.period}
                    </span>
                  </div>
                  <p className="text-sm text-dusty-600 mt-2">
                    {pkg.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-dusty-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  variant={selectedPackage === pkg.id ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full mb-4"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePackageSelect(pkg)
                  }}
                >
                  {pkg.buttonText}
                </Button>

                {/* Accepted Cards */}
                <div className="flex items-center justify-center space-x-2 text-dusty-400">
                  <CreditCardIcon className="w-4 h-4" />
                  <span className="text-xs">
                    Visa, Mastercard, Amex, Discover
                  </span>
                </div>

                {/* Selection Indicator */}
                {selectedPackage === pkg.id && (
                  <div className="absolute top-4 right-4">
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
                  Package Selected
                </p>
                <p className="text-sm text-primary-700">
                  {packages.find(p => p.id === selectedPackage)?.title} - Ready to continue
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
    </div>
  )
}

export default PackageDetails