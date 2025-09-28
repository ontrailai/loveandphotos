/**
 * BookingSidebar Component
 * Date and time selection sidebar for photographer profile pages
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, SunIcon, MoonIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import Card from '@components/ui/Card'
import Button from '@components/ui/Button'
import Calendar from '@components/ui/Calendar'
import { clsx } from 'clsx'

const BookingSidebar = ({
  photographer,
  initialDate = null,
  className = ''
}) => {
  const navigate = useNavigate()
  const { initializeBookingFlow, updateScheduleDetails } = useBookingFlow()
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedTime, setSelectedTime] = useState(null) // 'morning' | 'afternoon' | null

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate)
    }
  }, [initialDate])

  const handleTimeSelection = (timeOfDay) => {
    setSelectedTime(timeOfDay === selectedTime ? null : timeOfDay)
  }

  const handleRequestToBook = () => {
    if (!selectedDate || !selectedTime) return

    // Initialize the booking flow with schedule details
    initializeBookingFlow(photographer.id, {
      date: selectedDate,
      timeOfDay: selectedTime
    })

    // Update schedule details in context
    updateScheduleDetails(selectedDate, selectedTime)

    // Navigate to package selection step
    navigate(`/booking/${photographer.id}/package`)
  }

  const isBookingReady = selectedDate && selectedTime

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
            <span className="text-sm">Select your preferred date and time</span>
          </div>
        </div>

        {/* Calendar */}
        <div>
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            disablePastDates={true}
            className="w-full"
          />
        </div>

        {/* Time of Day Selection */}
        <div>
          <h4 className="text-lg font-medium text-dusty-900 mb-3">
            What time of day would you like?
          </h4>
          <div className="space-y-3">
            {/* Morning Button */}
            <Button
              variant={selectedTime === 'morning' ? 'primary' : 'outline'}
              size="lg"
              onClick={() => handleTimeSelection('morning')}
              className="w-full justify-start"
            >
              <SunIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Morning</div>
                <div className="text-sm opacity-75">sunrise–11:59am</div>
              </div>
            </Button>

            {/* Afternoon Button */}
            <Button
              variant={selectedTime === 'afternoon' ? 'primary' : 'outline'}
              size="lg"
              onClick={() => handleTimeSelection('afternoon')}
              className="w-full justify-start"
            >
              <MoonIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Afternoon</div>
                <div className="text-sm opacity-75">12pm–sunset</div>
              </div>
            </Button>
          </div>
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
              Please select both a date and time to continue
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
              <div className="flex items-center">
                {selectedTime === 'morning' ? (
                  <SunIcon className="w-4 h-4 mr-2" />
                ) : (
                  <MoonIcon className="w-4 h-4 mr-2" />
                )}
                <span>
                  {selectedTime === 'morning' ? 'Morning (sunrise–11:59am)' : 'Afternoon (12pm–sunset)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default BookingSidebar