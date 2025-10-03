/**
 * AddOnCard Component
 * Enhanced add-on selection card with equal-height layout, dynamic pricing, and validation
 * Combines Magic UI design patterns with booking system business logic
 * Fully accessible with keyboard navigation and screen reader support
 */

import { useState, useRef } from 'react'
import { CheckIcon, InfoIcon, AlertCircleIcon, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import Badge from '@components/ui/Badge'
import CollapsibleText from '@components/ui/CollapsibleText'

const AddOnCard = ({
  addon,
  isSelected = false,
  isDisabled = false,
  onToggle,
  onInfoClick = null,
  validationError = null,
  validationWarning = null,
  context = {}, // Package context for dynamic pricing
  className = '',
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const cardRef = useRef(null)

  // Handle card click/keyboard interaction
  const handleInteraction = (event) => {
    if (isDisabled) {
      event.preventDefault()
      return
    }

    if (onToggle) {
      onToggle(addon, !isSelected)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleInteraction(event)
    }
  }

  // Handle info link click
  const handleInfoClick = (event) => {
    event.stopPropagation()
    if (onInfoClick) {
      onInfoClick(addon)
    }
  }

  // Calculate display price
  let displayPrice = addon.displayPrice || addon.basePrice
  let priceCalculation = addon.priceCalculation

  // Dynamic pricing for His & Hers
  if (addon.pricing?.isDynamic) {
    const { packageType, packagePrice, hoursBooked } = context

    if (packageType && hoursBooked) {
      if (packageType === 'photoOnly') {
        const effectiveHours = Math.max(hoursBooked, addon.pricing.minimumHours)
        displayPrice = effectiveHours * addon.pricing.photoOnlyRate
        priceCalculation = `${effectiveHours} hours × $${addon.pricing.photoOnlyRate}/hour = $${displayPrice}`
      } else if (packageType === 'photoVideo' && packagePrice) {
        displayPrice = Math.round(packagePrice * addon.pricing.photoVideoRate)
        priceCalculation = `50% of $${packagePrice} = $${displayPrice}`
      }
    }
  }

  // Validation state
  const hasError = validationError || (isDisabled && validationError)
  const hasWarning = validationWarning && !hasError

  return (
    <div
      ref={cardRef}
      className={clsx(
        // Equal height layout with modern styling
        'group relative flex h-full flex-col justify-between overflow-hidden',
        'bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-primary/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        {
          // Selected state
          'border-primary-500 bg-primary-50 shadow-md shadow-primary/20': isSelected && !hasError,
          // Default state
          'border-gray-200 hover:border-primary-400': !isSelected && !hasError && !isDisabled,
          // Error state
          'border-red-500 bg-red-50': hasError,
          // Warning state
          'border-yellow-400 bg-yellow-50': hasWarning,
          // Disabled state
          'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed hover:border-gray-200 hover:shadow-none': isDisabled,
        },
        className
      )}
      onClick={handleInteraction}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      aria-describedby={hasError ? `${addon.id}-error` : hasWarning ? `${addon.id}-warning` : `${addon.id}-description`}
      tabIndex={isDisabled ? -1 : 0}
      {...props}
    >

      {/* Selection indicator - top right */}
      <div className={clsx(
        "absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 z-10",
        {
          // Selected state
          'border-primary-500 bg-primary-500 text-white': isSelected && !hasError,
          // Error state
          'border-red-500 bg-red-500 text-white': hasError,
          // Default state
          'border-gray-300 bg-white text-gray-400 group-hover:border-primary-400 group-hover:text-primary-500': !isSelected && !hasError && !isDisabled,
          // Disabled state
          'border-gray-200 bg-gray-100 text-gray-300': isDisabled
        }
      )}>
        {isSelected && !hasError ? (
          <CheckIcon className="h-3 w-3" />
        ) : hasError ? (
          <AlertCircleIcon className="h-3 w-3" />
        ) : (
          <Plus className={clsx(
            "h-3 w-3 transition-transform duration-200",
            !isDisabled && "group-hover:scale-110"
          )} />
        )}
      </div>

      {/* Card content - flex grow to fill height */}
      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="space-y-3 mb-4">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 leading-tight pr-8">
              {addon.title}
            </h3>

            {/* Price display */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ${displayPrice}
              </span>

              {/* Original price with strikethrough and discount percentage */}
              {addon.originalPrice && addon.originalPrice > displayPrice && (
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-gray-500 line-through">
                    ${addon.originalPrice}
                  </span>
                  {addon.discountPercent && (
                    <span className="text-xs text-green-600 font-medium">
                      ({addon.discountPercent}% off)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price calculation helper (for His & Hers) */}
            {priceCalculation && (
              <p className="text-xs text-gray-600">
                {priceCalculation}
              </p>
            )}
          </div>

          {/* Badges section - under price */}
          {addon.badges?.popularity && (
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Popularity badge */}
              <Badge
                variant="primary"
                size="sm"
                className="text-xs whitespace-nowrap"
              >
                {addon.badges.popularity}
              </Badge>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex-1 space-y-4">
          <div>
            <CollapsibleText
              id={`${addon.id}-description`}
              maxLength={120}
              className="text-sm text-gray-700 leading-relaxed"
              expandOnDesktop={false}
            >
              {addon.description}
            </CollapsibleText>
          </div>

          {/* Features list (if available) */}
          {addon.features && addon.features.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                What's included:
              </h4>
              <ul className="space-y-2" role="list">
                  {addon.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2" role="listitem">
                      <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600 flex-shrink-0">
                        <CheckIcon className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
            </div>
          )}
        </div>

        {/* Bottom section - always at bottom */}
        <div className="mt-6 space-y-3">
          {/* Extra info link */}
          {addon.extraInfo?.hasLink && (
            <button
              type="button"
              onClick={handleInfoClick}
              className={clsx(
                'inline-flex items-center text-xs text-primary-600 hover:text-primary-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md',
                'transition-colors duration-200'
              )}
            >
              <InfoIcon className="w-3 h-3 mr-1" />
              {addon.extraInfo.linkText}
            </button>
          )}

          {/* Validation messages */}
          {hasError && (
            <div
              id={`${addon.id}-error`}
              className="flex items-start space-x-2 text-red-600"
              role="alert"
            >
              <AlertCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{validationError}</span>
            </div>
          )}

          {hasWarning && (
            <div
              id={`${addon.id}-warning`}
              className="flex items-start space-x-2 text-yellow-700"
            >
              <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{validationWarning}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={clsx(
        "absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 transition-opacity duration-300 pointer-events-none rounded-xl",
        "group-hover:opacity-100",
        isSelected && "opacity-100",
        isDisabled && "group-hover:opacity-0"
      )} />

      {/* Disabled overlay with tooltip */}
      {isDisabled && (
        <div
          className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-xl flex items-center justify-center cursor-not-allowed z-20"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {showTooltip && validationError && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30">
              <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                {validationError}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => {}} // Controlled by parent
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

export default AddOnCard