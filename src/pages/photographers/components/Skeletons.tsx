/**
 * Skeletons Component
 * Loading states for photographer cards and list items
 */

import React from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'
import type { SkeletonsProps, ViewMode } from '@utils/photographers/types'

/**
 * Single skeleton shimmer effect
 */
const shimmerAnimation = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
}

/**
 * Card skeleton for grid view
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden', className)}>
      {/* Image skeleton */}
      <motion.div
        className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"
        {...shimmerAnimation}
      />

      {/* Content skeleton */}
      <div className="p-5 space-y-3">
        {/* Header with avatar and name */}
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"
            {...shimmerAnimation}
          />
          <div className="flex-1 space-y-2">
            <motion.div
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-3/4"
              {...shimmerAnimation}
            />
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-1/2"
              {...shimmerAnimation}
            />
          </div>
          <motion.div
            className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-16"
            {...shimmerAnimation}
          />
        </div>

        {/* Rating skeleton */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="w-4 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded"
                {...shimmerAnimation}
              />
            ))}
          </div>
          <motion.div
            className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-12"
            {...shimmerAnimation}
          />
        </div>

        {/* Location skeleton */}
        <motion.div
          className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-2/3"
          {...shimmerAnimation}
        />

        {/* Trust metrics skeleton */}
        <div className="flex justify-between">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-16"
              {...shimmerAnimation}
            />
          ))}
        </div>

        {/* Bottom section skeleton */}
        <div className="flex justify-between items-center">
          <motion.div
            className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-20"
            {...shimmerAnimation}
          />
          <div className="flex space-x-1">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-full w-12"
                {...shimmerAnimation}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Row skeleton for list view
 */
function RowSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden', className)}>
      <div className="flex">
        {/* Image skeleton */}
        <motion.div
          className="w-48 h-36 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] flex-shrink-0"
          {...shimmerAnimation}
        />

        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <div className="flex justify-between mb-4">
            {/* Left side - photographer info */}
            <div className="flex items-center space-x-4 flex-1">
              <motion.div
                className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]"
                {...shimmerAnimation}
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <motion.div
                    className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-32"
                    {...shimmerAnimation}
                  />
                  <motion.div
                    className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-16"
                    {...shimmerAnimation}
                  />
                </div>
                <motion.div
                  className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-3/4"
                  {...shimmerAnimation}
                />
              </div>
            </div>

            {/* Right side - pricing */}
            <div className="text-right space-y-2">
              <motion.div
                className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-20 ml-auto"
                {...shimmerAnimation}
              />
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded"
                    {...shimmerAnimation}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Features skeleton */}
          <div className="flex space-x-6">
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-32"
              {...shimmerAnimation}
            />
            <motion.div
              className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-24"
              {...shimmerAnimation}
            />
          </div>

          {/* Trust metrics skeleton */}
          <div className="flex space-x-4 mt-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-20"
                {...shimmerAnimation}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Filter skeleton for loading filters
 */
function FilterSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white rounded-2xl shadow-sm border border-gray-100 p-6', className)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <motion.div
          className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-16"
          {...shimmerAnimation}
        />
        <motion.div
          className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-12"
          {...shimmerAnimation}
        />
      </div>

      {/* Filter sections */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map((section) => (
          <div key={section} className="space-y-3">
            <motion.div
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded w-24"
              {...shimmerAnimation}
            />
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <motion.div
                    className="w-4 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded"
                    {...shimmerAnimation}
                  />
                  <motion.div
                    className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded flex-1"
                    {...shimmerAnimation}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Main Skeletons component
 */
export function Skeletons({
  count = 6,
  viewMode = 'grid',
  className
}: SkeletonsProps) {
  // Generate array of skeleton components
  const skeletons = Array.from({ length: count }, (_, index) => index)

  if (viewMode === 'grid') {
    return (
      <div className={clsx('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6', className)}>
        {skeletons.map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <CardSkeleton />
          </motion.div>
        ))}
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className={clsx('space-y-4', className)}>
        {skeletons.map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <RowSkeleton />
          </motion.div>
        ))}
      </div>
    )
  }

  // Filter skeleton
  if (viewMode === 'filter') {
    return <FilterSkeleton className={className} />
  }

  return null
}

// Export individual skeleton components for reuse
export { CardSkeleton, RowSkeleton, FilterSkeleton }
export default Skeletons