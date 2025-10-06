/**
 * TrustBadges Component
 * Trust metrics display for photographers (bookings only)
 */

import React from 'react'
import { clsx } from 'clsx'

// Individual trust badge props
export interface TrustBadgeProps {
  type: 'bookings'
  value: number | null | undefined
  label?: string
  className?: string
}

// Collection of trust badges props
export interface TrustBadgesProps {
  totalBookings?: number | null
  layout?: 'horizontal' | 'vertical'
  className?: string
}

/**
 * Individual trust badge component
 */
export function TrustBadge({ type, value, label, className }: TrustBadgeProps) {
  if (!value && value !== 0) return null

  const formatValue = () => {
    return `${value} Event${value !== 1 ? 's' : ''}`
  }

  const getColor = () => {
    if (value >= 50) return 'text-blue-600'
    if (value >= 10) return 'text-purple-600'
    return 'text-gray-600'
  }

  const getDefaultLabel = () => {
    return 'Events'
  }

  return (
    <div className={clsx('flex items-center text-xs', className)}>
      <span className={clsx('font-medium', getColor())}>
        {formatValue()}
      </span>
      {(label || getDefaultLabel()) && (
        <span className="text-gray-500 ml-1">
          {label || getDefaultLabel()}
        </span>
      )}
    </div>
  )
}

/**
 * Collection of trust badges component
 */
export function TrustBadges({
  totalBookings,
  layout = 'horizontal',
  className
}: TrustBadgesProps) {
  if (!totalBookings && totalBookings !== 0) return null

  return (
    <div className={clsx(
      'flex gap-4',
      layout === 'vertical' ? 'flex-col' : 'items-center justify-between',
      className
    )}>
      <TrustBadge
        type="bookings"
        value={totalBookings}
      />
    </div>
  )
}

export default TrustBadges