/**
 * Upcoming Booking Card - Exact Magic MCP Design
 * Copied directly from Magic MCP output and adapted for Supabase data
 */

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  X,
  VideoIcon
} from 'lucide-react'
import { parseISO } from 'date-fns'
import { getFirstNameOnly } from '@lib/privacy/sanitizeTalentData'

// Countdown Timer Component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, Math.floor((+targetDate - Date.now()) / 1000))
  })

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.floor((+targetDate - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  const days = Math.floor(timeLeft / 86400)
  const hours = Math.floor((timeLeft % 86400) / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex gap-2">
      {[
        { value: days, label: "d" },
        { value: hours, label: "h" },
        { value: minutes, label: "m" },
        { value: seconds, label: "s" },
      ].map((unit, index) => (
        <div key={unit.label} className="flex items-baseline gap-0.5">
          <span className="text-lg font-bold tabular-nums">
            {unit.value.toString().padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">{unit.label}</span>
          {index < 3 && <span className="text-muted-foreground mx-0.5">:</span>}
        </div>
      ))}
    </div>
  )
}

const UpcomingBookingCard = ({
  booking,
  onModify,
  onViewDetails,
  onViewInvoice
}) => {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const photographerName = getFirstNameOnly(booking.photographers?.users?.full_name) || 'Photographer'
  const photographerAvatar = booking.photographers?.users?.avatar_url
  const photographerRating = booking.photographers?.average_rating || 0
  const photographerSpecialty = booking.photographers?.pay_tiers?.name || 'Photography'
  const packageTitle = booking.packages?.title || booking.package_type || 'Photography Package'

  // Handle missing or invalid event_date gracefully
  let eventDate = null
  let isDateTBD = false
  try {
    if (booking.event_date) {
      eventDate = parseISO(booking.event_date)
      // Check if date is valid
      if (isNaN(eventDate.getTime())) {
        eventDate = null
        isDateTBD = true
      }
    } else {
      isDateTBD = true
    }
  } catch (error) {
    console.warn('Invalid event_date:', booking.event_date)
    isDateTBD = true
  }

  // Videographer data (optional)
  const hasVideographer = !!booking.videographer
  const videographerName = hasVideographer ? getFirstNameOnly(booking.videographer?.users?.full_name) : null
  const videographerAvatar = booking.videographer?.users?.avatar_url

  // Format event time with AM/PM
  const eventTime = booking.event_time
    ? new Date(`2000-01-01T${booking.event_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'TBD'

  // Location with cascading fallback: location_city + location_state -> venue_name -> venue_address -> TBD
  const eventLocation = booking.location_city && booking.location_state
    ? `${booking.location_city}, ${booking.location_state}`
    : booking.venue_name ||
      (booking.venue_address?.city && booking.venue_address?.state
        ? `${booking.venue_address.city}, ${booking.venue_address.state}`
        : 'TBD')

  // Price formatting with proper USD display
  const price = booking.final_price || booking.total_amount || booking.base_price || 0
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)

  // Add-ons from personalization_data
  const addons = booking.personalization_data?.addons || []
  const hasAddons = addons.length > 0

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
      },
    },
  }

  return (
    <motion.div
      variants={shouldAnimate ? itemVariants : {}}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : false}
      whileHover={shouldAnimate ? { scale: 1.01, y: -2 } : {}}
      className="bg-card rounded-xl border shadow-sm overflow-hidden"
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Photographer Info */}
          <div className="flex items-start gap-4 flex-1">
            <motion.img
              whileHover={shouldAnimate ? { scale: 1.1 } : {}}
              src={photographerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(photographerName)}&size=150`}
              alt={photographerName}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{photographerName}</h3>
              <p className="text-sm text-muted-foreground">{photographerSpecialty}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-medium">{photographerRating.toFixed(1)}</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{isDateTBD ? 'Date TBD' : eventDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{eventTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{eventLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Videographer Info (if present) */}
          {hasVideographer && (
            <div className="flex items-start gap-4 flex-1 pt-4 border-t">
              <motion.img
                whileHover={shouldAnimate ? { scale: 1.1 } : {}}
                src={videographerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(videographerName)}&size=150`}
                alt={videographerName}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-4 h-4 text-rose-600" />
                  <h3 className="text-lg font-semibold">{videographerName}</h3>
                </div>
                <p className="text-sm text-muted-foreground">Videographer</p>
              </div>
            </div>
          )}

          {/* Booking Details */}
          <div className="lg:border-l lg:pl-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Package</p>
              <p className="font-semibold">{packageTitle}</p>
            </div>
            {hasAddons && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Add-ons</p>
                <ul className="text-sm space-y-0.5">
                  {addons.map((addon, index) => (
                    <li key={index} className="text-foreground">
                      {addon.name} {addon.qty && addon.qty > 1 ? `(×${addon.qty})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!isDateTBD && eventDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Starts in</p>
                <CountdownTimer targetDate={eventDate} />
              </div>
            )}
            {isDateTBD && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                📅 Event date to be confirmed with photographer
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Price</p>
              <p className="text-2xl font-bold text-red-600">{formattedPrice}</p>
            </div>
          </div>
        </div>

        {/* Studio Contact Notice */}
        <div className="mt-6 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Questions about your booking? Contact our Studio team at{' '}
            <a href="mailto:support@lp.loveandphotos.com" className="font-medium underline hover:text-blue-700">
              support@lp.loveandphotos.com
            </a>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.02 } : {}}
            whileTap={shouldAnimate ? { scale: 0.98 } : {}}
            onClick={onViewDetails}
            className="flex-1 min-w-[140px] bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            View Details
          </motion.button>
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.02 } : {}}
            whileTap={shouldAnimate ? { scale: 0.98 } : {}}
            onClick={onModify}
            className="px-4 py-2 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            Modify
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default UpcomingBookingCard