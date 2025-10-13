/**
 * BookingSidebar Component
 * Date and time selection sidebar for photographer profile pages
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Calendar from '@components/ui/Calendar'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

// Ensures dates coming from URLs or storage hydrate into Date objects
const normalizeDate = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const BookingSidebar = ({
  photographer,
  initialDate = null,
  className = ''
}) => {
  const navigate = useNavigate()
  const { initializeBookingFlow, updateScheduleDetails, updateLocationDetails } = useBookingFlow()

  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(initialDate))
  const [locationCity, setLocationCity] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationTitle, setLocationTitle] = useState('')

  useEffect(() => {
    setSelectedDate(normalizeDate(initialDate))
  }, [initialDate])

  // Convert unavailable_dates array to Date objects for Calendar component (using local timezone)
  const unavailableDates = (photographer?.unavailable_dates || []).map(dateStr => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day) // Local date, no UTC conversion
  })

  const handleDateSelect = (day) => {
    setSelectedDate(day ? normalizeDate(day) : null)
  }

  const handleRequestToBook = () => {
    if (!selectedDate) {
      toast.error('Please select a date.')
      return
    }

    // Validate location is provided
    if (!locationCity || !locationState) {
      toast.error('Please enter the event city and state.')
      return
    }

    // Validate selected date is not in photographer's unavailable dates
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    if (unavailableDates.some(unavailableDate => {
      const unavailableDateStr = format(unavailableDate, 'yyyy-MM-dd')
      return selectedDateStr === unavailableDateStr
    })) {
      toast.error('This photographer is not available on the selected date. Please choose another date.')
      return
    }

    // Initialize the booking flow with basic schedule and location details
    initializeBookingFlow(photographer.id, {
      date: selectedDate,
      startTime: null,
      endTime: null
    })

    // Update schedule details in context (without times - will be set via package selection)
    updateScheduleDetails(selectedDate, null, null)

    // Update location details in context
    updateLocationDetails({
      city: locationCity,
      state: locationState,
      locationTitle: locationTitle || null,
      address: null
    })

    // Navigate to package selection (first step in new booking flow)
    navigate(`/booking/${photographer.id}/packages`)
  }

  const hasValidDate = selectedDate instanceof Date && !Number.isNaN(selectedDate?.getTime?.())
  const hasValidLocation = locationCity && locationState
  const isBookingReady = hasValidDate && hasValidLocation

  return (
    <Card className={clsx('sticky top-8', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-dusty-900 mb-2">
            Please choose your ideal date
          </h3>
          <div className="flex items-center justify-center text-dusty-600">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">Select your preferred date</span>
          </div>
        </div>

        {/* Calendar */}
        <div>
          <Calendar
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            disablePastDates
            disabledDates={unavailableDates}
            className="w-full"
          />
        </div>

        {/* Event Location */}
        {hasValidDate && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-sm font-medium text-dusty-900 mb-3 flex items-center justify-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                Event Location
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="location-city" className="block text-xs font-medium text-dusty-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="location-city"
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white text-dusty-900 transition-all duration-200 hover:border-primary-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="location-state" className="block text-xs font-medium text-dusty-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="location-state"
                  type="text"
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  placeholder="Enter state"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white text-dusty-900 transition-all duration-200 hover:border-primary-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="location-title" className="block text-xs font-medium text-dusty-700 mb-1">
                  Venue Name (Optional)
                </label>
                <input
                  id="location-title"
                  type="text"
                  value={locationTitle}
                  onChange={(e) => setLocationTitle(e.target.value)}
                  placeholder="Enter venue name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white text-dusty-900 transition-all duration-200 hover:border-primary-400"
                />
              </div>
            </div>
          </div>
        )}


        {/* Request to Book Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            size="lg"
            disabled={!isBookingReady}
            onClick={handleRequestToBook}
            className="w-full"
          >
            Request to book {photographer?.users?.full_name || photographer?.display_name}
          </Button>

          {!isBookingReady && (
            <p className="text-sm text-dusty-500 mt-2 text-center">
              {!hasValidDate
                ? 'Please select a date to continue'
                : 'Please enter event city and state to continue'
              }
            </p>
          )}
        </div>

        {/* Selected Details Summary */}
        {isBookingReady && (
          <div className="bg-dusty-50 rounded-lg p-4">
            <h5 className="font-medium text-dusty-900 mb-2">Your Selection</h5>
            <div className="space-y-2 text-sm text-dusty-600">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                <span>{locationCity}, {locationState}</span>
              </div>
              <p className="text-xs text-dusty-500 pt-2 border-t border-dusty-200">
                You'll select your package duration on the next step
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default BookingSidebar
