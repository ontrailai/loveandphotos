import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useGuestBooking } from '@contexts/GuestBookingContext'
import { db } from '@lib/supabase'
import { calculatePricing, createCheckoutSession, redirectToCheckout } from '@lib/stripe'
import { useForm } from 'react-hook-form'
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, CameraIcon, CheckIcon } from 'lucide-react'
import InlineSignupModal from '@components/modals/InlineSignupModal'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const Booking = () => {
  const { photographerId } = useParams()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { savePendingBooking, saveBookingFormData, getPendingBookingForMigration } = useGuestBooking()
  const navigate = useNavigate()

  // Get date from URL parameters
  const urlDate = searchParams.get('date')

  // Calculate default values
  const defaultEventDate = urlDate || format(addDays(new Date(), 60), 'yyyy-MM-dd')
  const defaultEventTime = '10:00'
  
  const [photographer, setPhotographer] = useState(null)
  const [packages, setPackages] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [availability, setAvailability] = useState([])
  const [pricing, setPricing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      eventDate: defaultEventDate,
      eventTime: defaultEventTime,
      guestCount: 50
    }
  })

  const eventDate = watch('eventDate')
  const eventTime = watch('eventTime')

  useEffect(() => {
    loadPhotographerData()
  }, [photographerId])

  useEffect(() => {
    if (selectedPackage && eventDate) {
      const calculatedPricing = calculatePricing(eventDate, selectedPackage.base_price)
      setPricing(calculatedPricing)
    }
  }, [selectedPackage, eventDate])

  const loadPhotographerData = async () => {
    try {
      setLoading(true)
      
      // Load photographer profile
      const photographerData = await db.photographers.getPublicProfile(photographerId)
      if (!photographerData) {
        toast.error('Photographer not found')
        navigate('/browse')
        return
      }
      setPhotographer(photographerData)
      
      // Load packages
      const { data: packagesData } = await db.supabase
        .from('packages')
        .select('*')
        .eq('photographer_id', photographerId)
        .eq('is_active', true)
      
      setPackages(packagesData || [])
      if (packagesData?.length > 0) {
        setSelectedPackage(packagesData[0])
      }

      // Load availability for next 3 months
      const startDate = format(new Date(), 'yyyy-MM-dd')
      const endDate = format(addDays(new Date(), 90), 'yyyy-MM-dd')
      
      const availabilityData = await db.availability.getForPhotographer(
        photographerId,
        startDate,
        endDate
      )
      setAvailability(availabilityData || [])
      
    } catch (error) {
      console.error('Error loading photographer:', error)
      toast.error('Failed to load photographer data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data) => {
    if (!selectedPackage) {
      toast.error('Please select a package')
      return
    }

    if (!pricing) {
      toast.error('Unable to calculate pricing')
      return
    }

    // If user is not authenticated, save to guest context and show signup modal
    if (!user) {
      const guestBookingData = {
        photographer_id: photographerId,
        package_id: selectedPackage.id,
        package_title: selectedPackage.title,
        event_date: data.eventDate,
        event_time: data.eventTime,
        event_type: data.eventType,
        guest_count: data.guestCount,
        total_amount: pricing.finalPrice,
        special_requests: data.specialRequests,
        personalization_data: {
          quizCompleted: false,
          preferences: {}
        },
        pricing_data: pricing
      }
      
      // Save to guest context
      savePendingBooking(guestBookingData)
      saveBookingFormData(data)
      setPendingFormData(data)
      setShowSignupModal(true)
      return
    }

    // User is authenticated, proceed with normal booking flow
    await processAuthenticatedBooking(data)
  }

  const processAuthenticatedBooking = async (data) => {
    setSubmitting(true)

    try {
      // Create booking record
      const bookingData = await db.bookings.create({
        customer_id: user.id,
        photographer_id: photographerId,
        package_id: selectedPackage.id,
        event_date: data.eventDate,
        event_time: data.eventTime,
        event_type: data.eventType,
        guest_count: data.guestCount,
        total_amount: pricing.finalPrice,
        special_requests: data.specialRequests,
        personalization_data: {
          quizCompleted: false,
          preferences: {}
        }
      })

      // Create Stripe checkout session
      const session = await createCheckoutSession({
        customerId: user.id,
        photographerId: photographerId,
        packageId: selectedPackage.id,
        eventDate: data.eventDate,
        amount: pricing.finalPrice * 100, // Convert to cents
        paymentType: pricing.paymentOptions[0].type,
        customerEmail: profile.email,
        metadata: {
          bookingId: bookingData.id
        }
      })

      // Redirect to Stripe Checkout
      await redirectToCheckout(session.id)
      
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignupSuccess = async (newUser) => {
    try {
      setSubmitting(true)
      
      // Get the pending booking data
      const pendingBooking = getPendingBookingForMigration()
      if (!pendingBooking) {
        toast.error('No pending booking found')
        return
      }

      // Create booking record with the new user
      const bookingData = await db.bookings.create({
        customer_id: newUser.id,
        ...pendingBooking
      })

      // Create Stripe checkout session
      const session = await createCheckoutSession({
        customerId: newUser.id,
        photographerId: photographerId,
        packageId: pendingBooking.package_id,
        eventDate: pendingBooking.event_date,
        amount: pendingBooking.total_amount * 100, // Convert to cents
        paymentType: pendingBooking.pricing_data?.paymentOptions?.[0]?.type || 'full',
        customerEmail: newUser.email,
        metadata: {
          bookingId: bookingData.id
        }
      })

      // Close modal and redirect to Stripe Checkout
      setShowSignupModal(false)
      await redirectToCheckout(session.id)
      
    } catch (error) {
      console.error('Booking migration error:', error)
      toast.error('Failed to complete booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!photographer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Photographer not found</h2>
          <button
            onClick={() => navigate('/browse')}
            className="mt-4 btn-primary"
          >
            Browse Photographers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Photographer Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          <img
            src={photographer.users.avatar_url || `https://ui-avatars.com/api/?name=${photographer.users.full_name}`}
            alt={photographer.users.full_name}
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{photographer.users.full_name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`badge badge-${photographer.pay_tiers.name.toLowerCase()}`}>
                {photographer.pay_tiers.name} Tier
              </span>
              <span className="text-gray-600">
                ${photographer.pay_tiers.hourly_rate}/hour
              </span>
              {photographer.average_rating > 0 && (
                <span className="flex items-center">
                  ⭐ {photographer.average_rating.toFixed(1)} ({photographer.total_reviews} reviews)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Package Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Select Package</h2>
          <div className="space-y-3">
            {packages.map((pkg) => (
              <label
                key={pkg.id}
                className={`block relative cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                  selectedPackage?.id === pkg.id ? 'border-purple-600 bg-purple-50' : 'border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="package"
                  value={pkg.id}
                  checked={selectedPackage?.id === pkg.id}
                  onChange={() => setSelectedPackage(pkg)}
                  className="sr-only"
                />
                <div className="flex justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{pkg.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      <ClockIcon className="inline w-4 h-4 mr-1" />
                      {pkg.duration_minutes} minutes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">${pkg.base_price}</p>
                  </div>
                </div>
                {selectedPackage?.id === pkg.id && (
                  <CheckIcon className="absolute top-4 right-4 w-5 h-5 text-purple-600" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Type */}
            <div>
              <label className="label">Event Type</label>
              <select
                {...register('eventType', { required: 'Event type is required' })}
                className="input"
              >
                <option value="">Select event type</option>
                <option value="wedding">Wedding</option>
                <option value="engagement">Engagement</option>
                <option value="birthday">Birthday Party</option>
                <option value="corporate">Corporate Event</option>
                <option value="graduation">Graduation</option>
                <option value="other">Other</option>
              </select>
              {errors.eventType && (
                <p className="mt-1 text-sm text-red-600">{errors.eventType.message}</p>
              )}
            </div>

            {/* Guest Count */}
            <div>
              <label className="label">Number of Guests</label>
              <input
                type="number"
                {...register('guestCount', { 
                  required: 'Guest count is required',
                  min: { value: 1, message: 'At least 1 guest required' }
                })}
                className="input"
              />
              {errors.guestCount && (
                <p className="mt-1 text-sm text-red-600">{errors.guestCount.message}</p>
              )}
            </div>

            {/* Event Date */}
            <div>
              <label className="label">Event Date</label>
              <input
                type="date"
                {...register('eventDate', { required: 'Event date is required' })}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="input"
              />
              {errors.eventDate && (
                <p className="mt-1 text-sm text-red-600">{errors.eventDate.message}</p>
              )}
            </div>

            {/* Event Time */}
            <div>
              <label className="label">Event Time</label>
              <input
                type="time"
                {...register('eventTime', { required: 'Event time is required' })}
                className="input"
              />
              {errors.eventTime && (
                <p className="mt-1 text-sm text-red-600">{errors.eventTime.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Special Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Special Requests (Optional)</h2>
          <textarea
            {...register('specialRequests')}
            className="textarea"
            rows={4}
            placeholder="Any special requests or notes for the photographer..."
          />
        </div>

        {/* Pricing Summary */}
        {pricing && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Pricing Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Package Price</span>
                <span className="font-medium">${pricing.basePrice}</span>
              </div>
              
              {pricing.lateFee > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Late Booking Fee (within 30 days)</span>
                  <span className="font-medium">+${pricing.lateFee}</span>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${pricing.finalPrice}</span>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="mt-4">
              <h3 className="font-medium mb-2">Payment Options</h3>
              <div className="space-y-2">
                {pricing.paymentOptions.map((option, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/photographer/${photographerId}`)}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedPackage}
            className="btn-primary"
            aria-describedby={!user ? "guest-booking-help" : undefined}
          >
            {submitting ? 'Processing...' : user ? 'Proceed to Payment' : 'Continue to Checkout'}
          </button>
          {!user && (
            <p id="guest-booking-help" className="text-xs text-gray-600 mt-1">
              You'll be able to create an account in the next step
            </p>
          )}
        </div>
      </form>

      {/* Guest Signup Modal */}
      {showSignupModal && (
        <InlineSignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onSuccess={handleSignupSuccess}
          bookingData={{
            eventDate: pendingFormData?.eventDate,
            packageTitle: selectedPackage?.title,
            email: pendingFormData?.email || '',
            name: pendingFormData?.fullName || '',
            phone: pendingFormData?.phone || ''
          }}
          photographer={photographer}
        />
      )}
    </div>
  )
}

export default Booking
