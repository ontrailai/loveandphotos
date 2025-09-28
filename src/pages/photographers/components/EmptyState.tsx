/**
 * EmptyState Component
 * No results state with clear filters action and suggestions
 */

import React from 'react'
import { motion } from 'motion/react'
import { CameraIcon, MapPinIcon, FilterIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import { clsx } from 'clsx'
import type { EmptyStateProps } from '@utils/photographers/types'

/**
 * Main EmptyState component
 */
export function EmptyState({
  title = "No photographers found",
  description = "Try adjusting your filters to find more photographers.",
  showClearFilters = false,
  onClearFilters,
  suggestedCities = [],
  className
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        'flex flex-col items-center justify-center text-center',
        'py-16 px-8',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <CameraIcon className="w-8 h-8 text-gray-400" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-gray-900 mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 mb-6 max-w-md"
      >
        {description}
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        {showClearFilters && onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FilterIcon className="w-4 h-4" />
            Clear Filters
          </Button>
        )}

        <Button
          onClick={() => window.location.href = '/photographers'}
          className="bg-[#FF4D6D] hover:bg-[#FF4D6D]/90"
        >
          Browse All Photographers
        </Button>
      </motion.div>

      {/* Suggested Cities */}
      {suggestedCities.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            Try searching in these popular cities:
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {suggestedCities.map((city, index) => (
              <motion.button
                key={city}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                onClick={() => {
                  // In a real implementation, this would update the search
                  const searchParams = new URLSearchParams(window.location.search)
                  searchParams.set('zip', city)
                  window.location.search = searchParams.toString()
                }}
                className={clsx(
                  'px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200',
                  'text-gray-700 hover:text-gray-900',
                  'rounded-full transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/20'
                )}
              >
                {city}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default EmptyState