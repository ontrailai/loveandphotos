/**
 * PhotographerCard Component
 * Enhanced grid view card with 3D hover effects, glassmorphism, portfolio preview, and trust badges
 */

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { StarIcon, MapPinIcon, CalendarIcon, MessageSquareIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import SafeAvatar from '@components/shared/SafeAvatar'
import SafeImage from '@components/shared/SafeImage'
import ImageErrorBoundary from '@components/shared/ImageErrorBoundary'
import { clsx } from 'clsx'
import type { PhotographerCardProps } from '@utils/photographers/types'

/**
 * Main PhotographerCard component with enhanced 3D effects and glassmorphism
 */
export function PhotographerCard({
  photographer,
  viewMode = 'grid',
  showPricing = false,
  onClick,
  className
}: PhotographerCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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
    acceptance_rate,
    avg_response_time_minutes,
    total_bookings,
    availability_level = 'unknown'
  } = photographer

  // Additional computed values not in memoized data
  const reviewCount = total_reviews || 0

  // Format response time
  const responseTime = avg_response_time_minutes
    ? avg_response_time_minutes < 60
      ? `${avg_response_time_minutes}min`
      : `${Math.round(avg_response_time_minutes / 60)}hr`
    : 'N/A'


  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])



  // Memoize expensive computations
  const computedData = useMemo(() => {
    const portfolioImage = portfolio_items[0]?.image_url || photographer.portfolio_images?.[0]
    const portfolioImages = portfolio_items.slice(0, 4).map(item => item.image_url) || photographer.portfolio_images?.slice(0, 4) || []
    const name = users?.full_name?.split(' ')[0] || 'Photographer'
    const fullName = users?.full_name || 'Photographer'
    const rating = average_rating || 0
    const reviewCount = total_reviews || 0
    const tierName = pay_tiers?.name || 'Standard'
    const hourlyRate = pay_tiers?.hourly_rate || photographer.hourly_rate || 150
    const location = location_city && location_state
      ? `${location_city}, ${location_state}`
      : location_city || location_state || 'Location not specified'

    return {
      portfolioImage,
      portfolioImages,
      name,
      fullName,
      rating,
      reviewCount,
      tierName,
      hourlyRate,
      location
    }
  }, [portfolio_items, photographer, users, average_rating, total_reviews, pay_tiers, location_city, location_state])

  return (
    <div
      className={clsx(
        'relative group cursor-pointer',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl',
          'bg-white border border-gray-100 shadow-sm',
          'transition-all duration-200',
          isHovered ? 'shadow-xl border-[#FF4D6D] -translate-y-1' : '',
        )}
      >
        {/* Portfolio Preview */}
        <div className="relative h-56 overflow-hidden">
          <ImageErrorBoundary>
            <SafeImage
              src={computedData.portfolioImage}
              alt={`${computedData.name}'s portfolio`}
              fallbackType="portfolio"
              className="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          </ImageErrorBoundary>


          {/* Love & Photos Choice Badge */}
          {is_love_and_photos_choice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute top-3 right-3"
            >
              <Badge
                variant="default"
                className="bg-[#FF4D6D] text-white text-xs font-medium shadow-lg backdrop-blur-sm"
              >
                LNP Choice
              </Badge>
            </motion.div>
          )}



        </div>

        {/* Card Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, staggerChildren: 0.05 }}
          className="p-6"
        >
          {/* Photographer Header */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            initial="hidden"
            animate="visible"
            className="flex items-start justify-between mb-4"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <SafeAvatar
                src={users?.avatar_url}
                name={computedData.name}
                size="lg"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 truncate text-lg">
                    {computedData.name}
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rating and Stats Grid */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-xl"
          >
            {/* Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="font-bold text-gray-900">{computedData.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-500">{reviewCount} reviews</p>
            </div>

            {/* Trust Score */}
            <div className="text-center">
              <div className="font-bold text-gray-900 mb-1">
                {acceptance_rate ? Math.round(acceptance_rate * 100) : 'N/A'}%
              </div>
              <p className="text-xs text-gray-500">Accept Rate</p>
            </div>

            {/* Projects */}
            <div className="text-center">
              <div className="font-bold text-gray-900 mb-1">
                {total_bookings || 0}
              </div>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
          </motion.div>

          {/* Location and Response Time */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            className="space-y-2 mb-4"
          >
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0 text-[#FF4D6D]" />
              <span className="truncate font-medium">{computedData.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MessageSquareIcon className="w-4 h-4 mr-2 flex-shrink-0 text-emerald-500" />
              <span>Responds in {responseTime}</span>
            </div>
          </motion.div>

          {/* Request to Book Button */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
              className="w-full bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-medium"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Request to Book
            </Button>
          </motion.div>

        </motion.div>

      </div>
    </div>
  )
}

export default PhotographerCard