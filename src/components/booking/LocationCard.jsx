/**
 * LocationCard Component
 * Selectable card for photographer location selection
 * Implements radiogroup semantics with full accessibility support
 */

import { CheckIcon, MapPinIcon, ExternalLinkIcon } from 'lucide-react'
import Badge from '@components/ui/Badge'
import { clsx } from 'clsx'

const LocationCard = ({
  location,
  isSelected = false,
  onSelect,
  onRouteDetails,
  className = '',
  ...props
}) => {
  const handleClick = () => {
    onSelect?.(location)
  }

  const handleKeyDown = (event) => {
    // Handle Enter and Space for selection (standard radio behavior)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.(location)
    }
  }

  const handleRouteDetailsClick = (event) => {
    // Prevent card selection when clicking route details
    event.stopPropagation()
    onRouteDetails?.(location)
  }

  const handleRouteDetailsKeyDown = (event) => {
    // Prevent card selection when using keyboard on route details
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation()
    }
  }

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-label={`Select ${location.title} - ${location.vibe}`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        // Base styles
        'relative rounded-lg overflow-hidden bg-white cursor-pointer transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        'min-h-[280px] group',

        // Border and shadow states
        {
          'border-2 border-primary-500 ring-2 ring-primary-500 shadow-lg': isSelected,
          'border border-gray-200 hover:border-primary-300 hover:shadow-lg': !isSelected,
        },

        className
      )}
      {...props}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Badge (Optional) */}
      {location.badge && (
        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant={location.badge === 'Most Booked' ? 'success' : 'primary'}
            size="sm"
            className="shadow-sm"
          >
            {location.badge}
          </Badge>
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={location.imageUrl}
          alt={location.title}
          className={clsx(
            'w-full h-full object-cover transition-transform duration-200',
            'group-hover:scale-105'
          )}
          loading="lazy"
        />

        {/* Image overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title and Vibe */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-dusty-900 leading-tight">
            {location.title}
          </h3>
          <p className="text-sm text-dusty-600 font-medium">
            {location.vibe}
          </p>
        </div>

        {/* Route Details Button */}
        <button
          onClick={handleRouteDetailsClick}
          onKeyDown={handleRouteDetailsKeyDown}
          className={clsx(
            'flex items-center text-sm text-primary-600 hover:text-primary-700',
            'focus:outline-none focus:text-primary-700 transition-colors duration-200',
            'min-h-[44px] -mx-2 px-2 py-2 rounded-md', // 44px+ touch target
            'hover:bg-primary-50 focus:bg-primary-50'
          )}
          aria-label={`View route details for ${location.title}`}
        >
          <MapPinIcon className="w-4 h-4 mr-2" />
          <span>Route Details</span>
          <ExternalLinkIcon className="w-3 h-3 ml-1 opacity-60" />
        </button>
      </div>

      {/* Focus Ring Enhancement */}
      <div
        className={clsx(
          'absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-200',
          isSelected
            ? 'bg-primary-500/5'
            : 'bg-transparent group-hover:bg-primary-500/2'
        )}
      />
    </div>
  )
}

/**
 * LoadingLocationCard Component
 * Skeleton loader for LocationCard while data is loading
 */
export const LoadingLocationCard = ({ className = '' }) => {
  return (
    <div className={clsx('rounded-lg overflow-hidden bg-white border border-gray-200', className)}>
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200 animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />

        {/* Vibe Skeleton */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />

        {/* Button Skeleton */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
      </div>
    </div>
  )
}

/**
 * EmptyLocationCard Component
 * Display when no locations are available
 */
export const EmptyLocationCard = ({ className = '' }) => {
  return (
    <div className={clsx(
      'rounded-lg overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300',
      'flex flex-col items-center justify-center text-center p-8 min-h-[280px]',
      className
    )}>
      <MapPinIcon className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        No Locations Available
      </h3>
      <p className="text-sm text-gray-500">
        This photographer hasn't added any locations yet.
        Check back soon!
      </p>
    </div>
  )
}

export default LocationCard