/**
 * PhotographerRow Component
 * List view row with compact layout and inline metadata
 */

import React from 'react'
import { motion } from 'motion/react'
import { StarIcon, LockIcon, CheckCircleIcon, MapPinIcon, CameraIcon, UsersIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import SafeAvatar from '@components/shared/SafeAvatar'
import SafeImage from '@components/shared/SafeImage'
import ImageErrorBoundary from '@components/shared/ImageErrorBoundary'
import { TrustBadges } from './TrustBadges'
import { clsx } from 'clsx'
import type { PhotographerRowProps } from '@utils/photographers/types'

/**
 * Main PhotographerRow component for list view
 */
export function PhotographerRow({
  photographer,
  showPricing = false,
  onClick,
  className
}: PhotographerRowProps) {
  const {
    users,
    specialties = [],
    average_rating,
    total_reviews,
    pay_tiers,
    portfolio_items = [],
    is_verified,
    is_love_and_photos_choice,
    languages = [],
    location_city,
    location_state,
    bio,
    acceptance_rate,
    avg_response_time_minutes,
    total_bookings
  } = photographer

  // Get primary portfolio image
  const portfolioImage = portfolio_items[0]?.image_url || photographer.portfolio_images?.[0]

  // Get photographer name
  const name = users?.full_name || 'Photographer'
  const firstName = name.split(' ')[0]

  // Format rating
  const rating = average_rating || 0
  const reviewCount = total_reviews || 0

  // Get tier info
  const tierName = pay_tiers?.name || 'Standard'
  const hourlyRate = pay_tiers?.hourly_rate || photographer.hourly_rate || 150

  // Format location
  const location = location_city && location_state
    ? `${location_city}, ${location_state}`
    : location_city || location_state || 'Location not specified'

  // Format bio
  const shortBio = bio ? bio.substring(0, 120) + (bio.length > 120 ? '...' : '') : 'Professional photographer'

  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden',
        'hover:border-gray-200 hover:shadow-md transition-all duration-200',
        'cursor-pointer group',
        className
      )}
      onClick={onClick}
    >
      <div className="flex">
        {/* Portfolio Image */}
        <div className="w-48 h-36 flex-shrink-0 relative overflow-hidden">
          <ImageErrorBoundary>
            <SafeImage
              src={portfolioImage}
              alt={`${name}'s portfolio`}
              fallbackType="portfolio"
              className="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          </ImageErrorBoundary>

          {/* Love & Photos Choice Badge */}
          {is_love_and_photos_choice && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="default"
                className="bg-[#FF4D6D] text-white text-xs font-medium shadow-sm"
              >
                LNP Choice
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 min-w-0">
          <div className="flex items-start justify-between mb-3">
            {/* Photographer Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <SafeAvatar
                src={users?.avatar_url}
                name={name}
                size="lg"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {firstName}
                  </h3>
                  {is_verified && (
                    <CheckCircleIcon
                      className="w-5 h-5 text-green-500 flex-shrink-0"
                      title="Verified Photographer"
                    />
                  )}
                  <Badge
                    variant={tierName.toLowerCase().includes('gold') ? 'default' : 'secondary'}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {tierName}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {shortBio}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="text-right ml-4 flex-shrink-0">
              {showPricing ? (
                <div className="text-xl font-bold text-gray-900 mb-2">
                  ${hourlyRate}/hr
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-[#FF4D6D] mb-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Navigate to login or pricing page
                  }}
                >
                  <LockIcon className="w-3 h-3 mr-1" />
                  <span className="text-sm">View Pricing</span>
                </Button>
              )}

              {/* Rating */}
              <div className="flex items-center justify-end mb-1">
                <div className="flex items-center mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={clsx(
                        'w-4 h-4',
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {rating.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {reviewCount.toLocaleString()} review{reviewCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Features and Specialties */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center">
              <CameraIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">
                {specialties.slice(0, 3).join(', ')}
                {specialties.length > 3 && ` +${specialties.length - 3} more`}
              </span>
            </div>
            {languages.length > 0 && (
              <div className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">
                  {languages.slice(0, 2).join(', ')}
                  {languages.length > 2 && ` +${languages.length - 2} more`}
                </span>
              </div>
            )}
          </div>

          {/* Trust Metrics */}
          <div className="text-xs">
            <TrustBadges
              totalBookings={total_bookings}
              avgResponseTimeMinutes={avg_response_time_minutes}
              acceptanceRate={acceptance_rate}
              layout="horizontal"
              className="gap-6"
            />
          </div>
        </div>
      </div>

    </div>
  )
}

export default PhotographerRow