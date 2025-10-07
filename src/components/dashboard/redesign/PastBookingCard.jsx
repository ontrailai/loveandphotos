/**
 * Compact Past Booking Card
 * Generated with 21st.dev via Magic MCP
 * Displays past bookings with review status and photo access
 */

import { motion } from 'framer-motion'
import { Calendar, Star, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import Button from '@components/ui/Button'
import { format, parseISO } from 'date-fns'
import { getFirstNameOnly } from '@lib/privacy/sanitizeTalentData'

const PastBookingCard = ({
  booking,
  onWriteReview,
  onViewPhotos
}) => {
  const photographerName = getFirstNameOnly(booking.photographers?.users?.full_name)
  const photographerAvatar = booking.photographers?.users?.avatar_url
  const eventType = booking.event_type || 'Photography Session'
  const eventDate = parseISO(booking.event_date)
  const hasReview = !!booking.reviews?.[0]
  const hasPhotos = booking.job_queue?.[0]?.upload_status === 'completed'

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.02,
        boxShadow: "0px 10px 30px -5px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 },
      }}
      className={cn(
        "flex flex-col rounded-lg border bg-gradient-to-b from-muted/30 to-background p-4",
        "hover:border-primary-200 transition-all duration-200"
      )}
    >
      {/* Header with photographer info */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Avatar
          src={photographerAvatar}
          name={photographerName}
          size="md"
          className="ring-2 ring-muted"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {photographerName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{format(eventDate, 'MMM dd, yyyy')}</span>
            <span>•</span>
            <span>{eventType}</span>
          </div>
        </div>
      </div>

      {/* Review status or rating */}
      <div className="pt-3 pb-2">
        {hasReview ? (
          <div className="flex items-center gap-2">
            <RatingStars rating={booking.reviews[0].rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              Your review
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <Star className="w-4 h-4" />
            <span>Review pending</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        {hasPhotos && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewPhotos(booking)}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Photos
          </Button>
        )}
        {!hasReview && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onWriteReview(booking)}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" />
            Write Review
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default PastBookingCard