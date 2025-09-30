/**
 * Skeleton Loaders with Shimmer Effects
 * Generated with 21st.dev via Magic MCP
 * Loading states for dashboard components
 */

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const ShimmerEffect = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full"
    style={{
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
    }}
    animate={{
      translateX: ["0%", "200%"],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
)

const Skeleton = ({ className }) => (
  <div
    className={cn(
      "bg-muted/50 rounded animate-pulse",
      className
    )}
  />
)

export const StatsCardLoader = () => {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm p-6">
      <div className="space-y-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-28" />
      </div>
      <ShimmerEffect />
    </div>
  )
}

export const BookingCardLoader = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white shadow-lg">
      {/* Header section */}
      <div className="p-6 border-b border-border bg-muted/30">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>

      {/* Content section */}
      <div className="p-6 space-y-5">
        <Skeleton className="h-6 w-48" />

        {/* Event details */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>

        {/* Countdown timer */}
        <div className="bg-muted/50 rounded-xl p-4">
          <Skeleton className="h-3 w-32 mx-auto mb-3" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-3 text-center border">
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-muted/30 px-6 py-4 border-t">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>

      <ShimmerEffect />
    </div>
  )
}

export const PastBookingCardLoader = () => {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-gradient-to-b from-muted/30 to-background p-4">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="pt-3 pb-2">
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
      <ShimmerEffect />
    </div>
  )
}

const SkeletonLoaders = () => {
  return (
    <div className="space-y-8">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardLoader key={i} />
        ))}
      </div>

      {/* Upcoming bookings skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <BookingCardLoader key={i} />
          ))}
        </div>
      </div>

      {/* Past bookings skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-36" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <PastBookingCardLoader key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoaders