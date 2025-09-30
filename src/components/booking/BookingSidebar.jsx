/**
 * BookingSidebar Component
 * Date and time selection sidebar for photographer profile pages
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Calendar from '@components/ui/Calendar'
import { clsx } from 'clsx'

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
  const { initializeBookingFlow, updateScheduleDetails } = useBookingFlow()

  const [selectedDate, setSelectedDate] = useState(() => normalizeDate(initialDate))

  useEffect(() => {
    setSelectedDate(normalizeDate(initialDate))
  }, [initialDate])

  const handleDateSelect = (day) => {
    setSelectedDate(day ? normalizeDate(day) : null)
  }

  const handleRequestToBook = () => {
    if (!selectedDate) return

    // Initialize the booking flow with schedule details AND default package
    initializeBookingFlow(photographer.id, {
      date: selectedDate,
      packageDetails: {
        packageType: 'standard',
        packagePrice: photographer.hourly_rate * 6, // Default 6-hour package
        hoursBooked: 6,
        isPhotoVideo: true,
        packageTitle: '6-Hour Photography Package'
      }
    })

    // Update schedule details in context
    updateScheduleDetails(selectedDate)

    // Navigate to add-ons step (first step in booking flow after schedule)
    navigate(`/booking/${photographer.id}/addons`)
  }

  const hasValidDate = selectedDate instanceof Date && !Number.isNaN(selectedDate?.getTime?.())
  const isBookingReady = hasValidDate

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
            className="w-full"
          />
        </div>

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
              Please select a date to continue
            </p>
          )}
        </div>

        {/* Selected Details Summary */}
        {isBookingReady && (
          <div className="bg-dusty-50 rounded-lg p-4">
            <h5 className="font-medium text-dusty-900 mb-2">Your Selection</h5>
            <div className="space-y-1 text-sm text-dusty-600">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default BookingSidebar
