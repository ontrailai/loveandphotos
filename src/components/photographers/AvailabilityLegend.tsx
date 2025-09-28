/**
 * AvailabilityLegend Component
 * Tiny legend for calendar dot colors when availability data is present
 * No-ops if availability data is absent - fails silently
 */

import React from 'react'
import { clsx } from 'clsx'

interface AvailabilityLegendProps {
  availability?: Record<string, 'high' | 'med' | 'low' | 'unknown'>
  className?: string
}

export function AvailabilityLegend({ availability, className }: AvailabilityLegendProps) {
  // Return null if no availability data - fail soft
  if (!availability || Object.keys(availability).length === 0) {
    return null
  }

  // Check which availability levels are actually present in the data
  const presentLevels = new Set(Object.values(availability))

  const legends = [
    { level: 'high' as const, label: 'High availability', color: 'bg-green-500' },
    { level: 'med' as const, label: 'Medium availability', color: 'bg-yellow-500' },
    { level: 'low' as const, label: 'Low availability', color: 'bg-red-500' },
    { level: 'unknown' as const, label: 'Unknown availability', color: 'bg-gray-400' }
  ].filter(legend => presentLevels.has(legend.level))

  // Return null if no relevant availability levels found
  if (legends.length === 0) {
    return null
  }

  return (
    <div className={clsx(
      'flex items-center gap-4 text-xs text-gray-600',
      className
    )}>
      <span className="font-medium text-gray-700">Availability:</span>
      <div className="flex items-center gap-3">
        {legends.map(({ level, label, color }) => (
          <div key={level} className="flex items-center gap-1.5">
            <div
              className={clsx('w-2 h-2 rounded-full', color)}
              aria-hidden="true"
            />
            <span className="capitalize">
              {level === 'med' ? 'Medium' : level}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility function to render availability dot on individual calendar days
export function renderAvailabilityDot(
  date: Date,
  availability?: Record<string, 'high' | 'med' | 'low' | 'unknown'>
): React.ReactNode {
  if (!availability) return null

  const dateKey = date.toISOString().split('T')[0]
  const level = availability[dateKey]
  if (!level) return null

  const colorClasses = {
    high: 'bg-green-500',
    med: 'bg-yellow-500',
    low: 'bg-red-500',
    unknown: 'bg-gray-400'
  }

  const labels = {
    high: 'High availability',
    med: 'Medium availability',
    low: 'Low availability',
    unknown: 'Unknown availability'
  }

  return (
    <div
      className={clsx(
        'absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full',
        colorClasses[level]
      )}
      title={labels[level]}
      aria-label={labels[level]}
    />
  )
}

// Hook to process availability data for calendar display
export function useAvailabilityData(
  availability?: Record<string, 'high' | 'med' | 'low' | 'unknown'>
) {
  return React.useMemo(() => {
    if (!availability) {
      return {
        hasAvailability: false,
        availabilityLevels: [],
        getAvailabilityForDate: () => null
      }
    }

    const levels = [...new Set(Object.values(availability))]

    return {
      hasAvailability: levels.length > 0,
      availabilityLevels: levels,
      getAvailabilityForDate: (date: Date) => {
        const dateKey = date.toISOString().split('T')[0]
        return availability[dateKey] || null
      }
    }
  }, [availability])
}

export default AvailabilityLegend