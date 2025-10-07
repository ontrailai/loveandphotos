/**
 * Date Change Calendar Modal Component
 * Displays after $495 payment success to select new shoot date
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar as CalendarIcon, Check, X } from 'lucide-react'
import { supabase } from '@lib/supabase'
import Calendar from '@components/ui/Calendar'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import toast from 'react-hot-toast'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { getFirstNameOnly } from '@lib/privacy/sanitizeTalentData'

const DateChangeCalendarModal = ({ bookingId, sessionId, onSuccess }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [booking, setBooking] = useState(null)
  const [availability, setAvailability] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [oldDate, setOldDate] = useState(null)

  useEffect(() => {
    if (bookingId && sessionId) {
      loadBookingAndAvailability()
    }
  }, [bookingId, sessionId])

  const loadBookingAndAvailability = async () => {
    try {
      setLoading(true)

      // Get booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          event_date,
          photographer_id,
          photographers (
            id,
            user_id,
            users!inner (
              full_name
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError

      if (!bookingData) {
        toast.error('Booking not found')
        navigate('/dashboard')
        return
      }

      setBooking(bookingData)
      setOldDate(bookingData.event_date)

      // Get photographer's availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('date, is_available')
        .eq('photographer_id', bookingData.photographer_id)
        .eq('is_available', true)
        .gte('date', format(new Date(), 'yyyy-MM-dd')) // Only future dates

      if (availabilityError) {
        console.error('Error loading availability:', availabilityError)
        // Continue anyway - user can select any date
      }

      setAvailability(availabilityData || [])

    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking details')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = async () => {
    if (!selectedDate) {
      toast.error('Please select a new date')
      return
    }

    // Validate date is in the future
    const today = startOfDay(new Date())
    if (isBefore(selectedDate, today)) {
      toast.error('Please select a future date')
      return
    }

    try {
      setSubmitting(true)

      // Call API to update booking date
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) throw new Error('Authentication required')

      const token = session.session.access_token

      const response = await fetch(`/api/bookings/${bookingId}/update-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newDate: format(selectedDate, 'yyyy-MM-dd'),
          sessionId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update booking date')
      }

      const result = await response.json()

      toast.success('Your shoot date has been updated!')

      // Call success callback or navigate to dashboard
      if (onSuccess) {
        onSuccess(result)
      } else {
        navigate('/dashboard')
      }

    } catch (error) {
      console.error('Error updating date:', error)
      toast.error(error.message || 'Failed to update shoot date')
    } finally {
      setSubmitting(false)
    }
  }

  // Check if a date is available
  const isDateAvailable = (date) => {
    if (!availability || availability.length === 0) return true // No availability data = all dates available

    const dateString = format(date, 'yyyy-MM-dd')
    return availability.some(slot => slot.date === dateString && slot.is_available)
  }

  // Disable unavailable dates
  const disabledDates = (date) => {
    // Disable past dates
    const today = startOfDay(new Date())
    if (isBefore(date, today)) return true

    // If we have availability data, disable unavailable dates
    if (availability && availability.length > 0) {
      return !isDateAvailable(date)
    }

    return false
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-dusty-600 mt-4">Loading booking details...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Select New Shoot Date
                </h2>
                <p className="text-sm text-gray-600">
                  With {getFirstNameOnly(booking?.photographers?.users?.full_name)}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={submitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Current Date Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Shoot Date:</p>
            <p className="text-lg font-semibold text-gray-900">
              {oldDate && format(parseISO(oldDate), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Calendar */}
          <div className="mb-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDates}
              disablePastDates={true}
              className="mx-auto"
            />

            {availability && availability.length > 0 && (
              <p className="text-xs text-gray-500 text-center mt-4">
                Only available dates are selectable based on photographer's calendar
              </p>
            )}
          </div>

          {/* Selected Date Display */}
          {selectedDate && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm text-primary-700 font-medium">New Date Selected:</p>
                  <p className="text-lg font-semibold text-primary-900">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> This is a one-time date change. After confirming, you won't be able to change your shoot date again without additional fees.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/dashboard')}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleDateChange}
              disabled={!selectedDate || submitting}
              loading={submitting}
              className="flex-1"
            >
              {submitting ? 'Updating...' : 'Confirm New Date'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DateChangeCalendarModal
