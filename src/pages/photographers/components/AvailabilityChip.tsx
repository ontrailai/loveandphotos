/**
 * AvailabilityChip Component
 * Color-coded availability indicator for photographers
 * Green = high, yellow = medium, red = low, gray = unknown
 */

import React from 'react'
import { clsx } from 'clsx'
import { CalendarIcon } from 'lucide-react'

export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'unknown'

export interface AvailabilityChipProps {
  level: AvailabilityLevel
  showIcon?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const AVAILABILITY_CONFIG = {
  high: {
    color: 'bg-green-100 text-green-700 border-green-200',
    label: 'High Availability',
    shortLabel: 'Available',
    dot: 'bg-green-500'
  },
  medium: {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    label: 'Medium Availability',
    shortLabel: 'Limited',
    dot: 'bg-yellow-500'
  },
  low: {
    color: 'bg-red-100 text-red-700 border-red-200',
    label: 'Low Availability',
    shortLabel: 'Busy',
    dot: 'bg-red-500'
  },
  unknown: {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: 'Availability Unknown',
    shortLabel: 'Unknown',
    dot: 'bg-gray-500'
  }
} as const

/**
 * Get availability level from percentage or booking density
 */
export function getAvailabilityLevel(
  availabilityPercentage?: number | null,
  recentBookings?: number | null
): AvailabilityLevel {
  // If we have a direct percentage
  if (availabilityPercentage !== null && availabilityPercentage !== undefined) {
    if (availabilityPercentage >= 80) return 'high'
    if (availabilityPercentage >= 50) return 'medium'
    if (availabilityPercentage >= 20) return 'low'
    return 'unknown'
  }

  // If we have recent booking data, infer availability
  if (recentBookings !== null && recentBookings !== undefined) {
    if (recentBookings <= 2) return 'high'
    if (recentBookings <= 5) return 'medium'
    return 'low'
  }

  return 'unknown'
}

/**
 * Main AvailabilityChip component
 */
export function AvailabilityChip({
  level,
  showIcon = false,
  showLabel = true,
  size = 'sm',
  className
}: AvailabilityChipProps) {
  const config = AVAILABILITY_CONFIG[level]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      {/* Status dot */}
      <div className={clsx('w-2 h-2 rounded-full', config.dot)} />

      {/* Optional calendar icon */}
      {showIcon && (
        <CalendarIcon className={clsx(
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
      )}

      {/* Label */}
      {showLabel && (
        <span>
          {size === 'sm' ? config.shortLabel : config.label}
        </span>
      )}
    </div>
  )
}

/**
 * Minimal dot-only version for tight spaces
 */
export function AvailabilityDot({
  level,
  size = 'sm',
  className
}: {
  level: AvailabilityLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const config = AVAILABILITY_CONFIG[level]

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div
      className={clsx(
        'rounded-full',
        config.dot,
        sizeClasses[size],
        className
      )}
      title={config.label}
    />
  )
}

export default AvailabilityChip