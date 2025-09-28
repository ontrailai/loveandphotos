/**
 * TrustBadges Component
 * Trust metrics display for photographers (bookings, response time, acceptance rate)
 */

import React from 'react'
import { clsx } from 'clsx'

// Individual trust badge props
export interface TrustBadgeProps {
  type: 'bookings' | 'response' | 'acceptance'
  value: number | null | undefined
  label?: string
  className?: string
}

// Collection of trust badges props
export interface TrustBadgesProps {
  totalBookings?: number | null
  avgResponseTimeMinutes?: number | null
  acceptanceRate?: number | null
  layout?: 'horizontal' | 'vertical'
  className?: string
}

/**
 * Individual trust badge component
 */
export function TrustBadge({ type, value, label, className }: TrustBadgeProps) {
  if (!value && value !== 0) return null

  const formatValue = () => {
    switch (type) {
      case 'bookings':
        return `${value} Event${value !== 1 ? 's' : ''}`
      case 'response':
        return value < 60 ? `${value}min` : `${Math.round(value / 60)}h`
      case 'acceptance':
        return `${Math.round(value * 100)}%`
      default:
        return value.toString()
    }
  }

  const getColor = () => {
    switch (type) {
      case 'acceptance':
        if (value >= 0.9) return 'text-green-600'
        if (value >= 0.7) return 'text-yellow-600'
        return 'text-gray-600'
      case 'response':
        if (value <= 30) return 'text-green-600'
        if (value <= 120) return 'text-yellow-600'
        return 'text-gray-600'
      case 'bookings':
        if (value >= 50) return 'text-blue-600'
        if (value >= 10) return 'text-purple-600'
        return 'text-gray-600'
      default:
        return 'text-blue-600'
    }
  }

  const getDefaultLabel = () => {
    switch (type) {
      case 'bookings':
        return 'Events'
      case 'response':
        return 'Response'
      case 'acceptance':
        return 'Accept Rate'
      default:
        return ''
    }
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
  avgResponseTimeMinutes,
  acceptanceRate,
  layout = 'horizontal',
  className
}: TrustBadgesProps) {
  const badges = [
    { type: 'bookings' as const, value: totalBookings },
    { type: 'response' as const, value: avgResponseTimeMinutes },
    { type: 'acceptance' as const, value: acceptanceRate }
  ].filter(badge => badge.value !== null && badge.value !== undefined)

  if (badges.length === 0) return null

  return (
    <div className={clsx(
      'flex gap-4',
      layout === 'vertical' ? 'flex-col' : 'items-center justify-between',
      className
    )}>
      {badges.map(({ type, value }) => (
        <TrustBadge
          key={type}
          type={type}
          value={value}
        />
      ))}
    </div>
  )
}

export default TrustBadges