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
  Mail,
  Phone,
  X
} from 'lucide-react'
import { parseISO } from 'date-fns'

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
  onMessage,
  onViewDetails,
  onViewInvoice
}) => {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const photographerName = booking.photographers?.users?.full_name || 'Unknown Photographer'
  const photographerAvatar = booking.photographers?.users?.avatar_url
  const photographerRating = booking.photographers?.average_rating || 0
  const photographerSpecialty = booking.photographers?.pay_tiers?.name || 'Photography'
  const packageTitle = booking.packages?.title || 'Photography Package'
  const eventDate = parseISO(booking.event_date)
  const eventTime = booking.event_time || 'TBD'
  const eventLocation = booking.venue_name || 'TBD'
  const price = parseFloat(booking.final_amount || booking.total_amount || 0)

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
                  <span>{eventDate.toLocaleDateString()}</span>
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

          {/* Booking Details */}
          <div className="lg:border-l lg:pl-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Package</p>
              <p className="font-semibold">{packageTitle}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Starts in</p>
              <CountdownTimer targetDate={eventDate} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-2xl font-bold text-primary">${price}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.02 } : {}}
            whileTap={shouldAnimate ? { scale: 0.98 } : {}}
            onClick={onMessage}
            className="flex-1 min-w-[140px] bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Message
          </motion.button>
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.02 } : {}}
            whileTap={shouldAnimate ? { scale: 0.98 } : {}}
            className="flex-1 min-w-[140px] bg-muted text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Call
          </motion.button>
          <motion.button
            whileHover={shouldAnimate ? { scale: 1.02 } : {}}
            whileTap={shouldAnimate ? { scale: 0.98 } : {}}
            onClick={onViewDetails}
            className="flex-1 min-w-[140px] bg-muted text-foreground px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition-colors"
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