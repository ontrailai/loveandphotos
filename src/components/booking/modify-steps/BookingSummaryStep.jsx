/**
 * Step 1: Booking Summary
 * Display current booking details before modifications
 */

import { format, parseISO } from 'date-fns'
import Button from '@components/ui/Button'
import { CalendarIcon, ClockIcon, MapPinIcon, DollarSignIcon } from 'lucide-react'
import { formatPrice, formatEventTime, getEventLocation } from '@lib/utils/priceFormatting'

const BookingSummaryStep = ({ booking, onNext, onCancel }) => {
  // Debug log for booking data
  console.log('📋 BookingSummaryStep - Booking Data:', {
    id: booking?.id,
    event_date: booking?.event_date,
    event_time: booking?.event_time,
    location_city: booking?.location_city,
    location_state: booking?.location_state,
    venue_name: booking?.venue_name,
    total_amount: booking?.total_amount,
    final_price: booking?.final_price,
    package: booking?.packages?.title
  })

  // Format location as City, State
  const locationDisplay = getEventLocation(booking)

  // Format time with AM/PM
  const timeDisplay = formatEventTime(booking?.event_time)

  // Format price
  const totalPrice = booking?.final_price || booking?.total_amount || 0
  const formattedPrice = formatPrice(totalPrice)

  return (
    <div className="space-y-6">
      {/* Current Booking Details */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Current Booking Details</h3>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="flex items-start space-x-3">
            <CalendarIcon className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">📅 Event Date</p>
              <p className="font-medium text-foreground">
                {format(parseISO(booking.event_date), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start space-x-3">
            <ClockIcon className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">🕒 Time</p>
              <p className="font-medium text-foreground">
                {timeDisplay}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start space-x-3">
            <MapPinIcon className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">📍 Location</p>
              <p className="font-medium text-foreground">
                {locationDisplay}
              </p>
            </div>
          </div>

          {/* Package */}
          {booking.packages && (
            <div className="flex items-start space-x-3">
              <DollarSignIcon className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">📦 Package</p>
                <p className="font-medium text-foreground">
                  {booking.packages.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {booking.packages.duration_minutes ? `${booking.packages.duration_minutes / 60} hours` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Current Total */}
          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">💲 Total Price</span>
              <span className="text-xl font-bold text-red-600">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What You Can Modify */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">What You Can Modify:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Add extra hours of coverage</li>
          <li>• Add or remove add-ons (second shooter, RAWs, rush delivery)</li>
          <li>• Payment based on days until event</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onNext}>
          Continue to Modify
        </Button>
      </div>
    </div>
  )
}

export default BookingSummaryStep