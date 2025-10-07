/**
 * BookingSidebar Component
 * Date and time selection sidebar for photographer profile pages
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, ClockIcon, MapPinIcon } from 'lucide-react'
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
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
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
    if (!selectedDate || !startTime || !endTime) return

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

    // Initialize the booking flow with schedule details AND default package
    initializeBookingFlow(photographer.id, {
      date: selectedDate,
      startTime,
      endTime,
      packageDetails: {
        packageType: 'standard',
        packagePrice: photographer.hourly_rate * 6, // Default 6-hour package
        hoursBooked: 6,
        isPhotoVideo: true,
        packageTitle: '6-Hour Photography Package'
      }
    })

    // Update schedule details in context
    updateScheduleDetails(selectedDate, startTime, endTime)

    // Update location details in context
    updateLocationDetails({
      city: locationCity,
      state: locationState,
      locationTitle: locationTitle || null,
      address: null
    })

    // Navigate to add-ons step (first step in booking flow after schedule)
    navigate(`/booking/${photographer.id}/addons`)
  }

  const hasValidDate = selectedDate instanceof Date && !Number.isNaN(selectedDate?.getTime?.())
  const hasValidTimes = startTime && endTime
  const hasValidLocation = locationCity && locationState
  const isBookingReady = hasValidDate && hasValidTimes && hasValidLocation

  // Calculate hours between start and end time
  const calculateHours = () => {
    if (!startTime || !endTime) return 0

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const startTotalMin = startHour * 60 + startMin
    const endTotalMin = endHour * 60 + endMin

    const diffMinutes = endTotalMin - startTotalMin
    return (diffMinutes / 60).toFixed(1)
  }

  const hoursBooked = calculateHours()

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

        {/* Time Selection */}
        {hasValidDate && hasValidLocation && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <h4 className="text-sm font-medium text-dusty-900 mb-3 flex items-center justify-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                Select Photoshoot Time
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start-time" className="block text-xs font-medium text-dusty-700 mb-1">
                  Start Time
                </label>
                <select
                  id="start-time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white text-dusty-900 font-semibold transition-all duration-200 hover:border-primary-400 cursor-pointer shadow-sm hover:shadow-md"
                  required
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem',
                    appearance: 'none',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="" className="text-dusty-400">Select time</option>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hour = Math.floor(i / 2)
                    const minute = i % 2 === 0 ? '00' : '30'
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                    const period = hour < 12 ? 'AM' : 'PM'
                    const value = `${String(hour).padStart(2, '0')}:${minute}`
                    return (
                      <option key={value} value={value} className="py-2 text-dusty-900">
                        {displayHour}:{minute} {period}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="end-time" className="block text-xs font-medium text-dusty-700 mb-1">
                  End Time
                </label>
                <select
                  id="end-time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white text-dusty-900 font-semibold transition-all duration-200 hover:border-primary-400 cursor-pointer shadow-sm hover:shadow-md"
                  required
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem',
                    appearance: 'none',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="" className="text-dusty-400">Select time</option>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hour = Math.floor(i / 2)
                    const minute = i % 2 === 0 ? '00' : '30'
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                    const period = hour < 12 ? 'AM' : 'PM'
                    const value = `${String(hour).padStart(2, '0')}:${minute}`
                    return (
                      <option key={value} value={value} className="py-2 text-dusty-900">
                        {displayHour}:{minute} {period}
                      </option>
                    )
                  })}
                </select>
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
                : !hasValidLocation
                  ? 'Please enter event city and state to continue'
                  : 'Please select start and end times to continue'
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
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                <span>{hoursBooked} {hoursBooked === '1.0' ? 'hour' : 'hours'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default BookingSidebar
