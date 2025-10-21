/**
 * AddOnCard Component - Collapsible Version
 * Collapsible add-on selection card with Framer Motion animations
 * Enhanced with validation, state management, and accessibility features
 */

import { useState, useRef } from 'react'
import { CheckIcon, InfoIcon, AlertCircleIcon, Plus, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@components/ui/Badge'

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
  // Guard against invalid addon data first
  if (!addon || !addon.id || !addon.title) {
    return null
  }

  // Use addon.id as part of state key to ensure proper React reconciliation
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const cardRef = useRef(null)

  // Handle expand/collapse toggle
  const handleExpand = (event) => {
    event.stopPropagation()
    setIsExpanded(prev => !prev)
  }

  // Handle selection toggle
  const handleToggle = (event) => {
    event.stopPropagation()
    if (isDisabled) return

    if (onToggle) {
      onToggle(addon, !isSelected)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleExpand(event)
    }
  }

  // Handle info link click
  const handleInfoClick = (event) => {
    event.stopPropagation()
    if (onInfoClick) {
      onInfoClick(addon)
    }
  }

  // Calculate display price - ensure it's always a valid number
  let displayPrice = addon.displayPrice || addon.basePrice || 0
  let priceCalculation = addon.priceCalculation

  // Validate displayPrice is a number
  if (isNaN(displayPrice) || displayPrice === null || displayPrice === undefined) {
    displayPrice = addon.basePrice || 0
  }

  // Dynamic pricing for Second Shooter only (video-coverage is handled in getFormattedAddOn)
  if (addon.pricing?.isDynamic && addon.id === 'second-shooter') {
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
    <motion.div
      ref={cardRef}
      className={clsx(
        // Base styling
        'group relative overflow-hidden bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer',
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
      onClick={handleExpand}
      onKeyDown={handleKeyDown}
      role="button"
      aria-expanded={isExpanded}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      initial={false}
      animate={{
        scale: isSelected ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Collapsed Header View */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title and Price */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight truncate mb-1">
              {addon.title}
            </h3>

            <div className="flex items-baseline gap-2 flex-wrap">
              {/* "Starts at" prefix for Second Photographer */}
              {addon.badges?.priceNote && (
                <span className="text-xs text-gray-600 font-medium">
                  {addon.badges.priceNote}
                </span>
              )}

              <span className="text-xl font-bold text-gray-900">
                ${displayPrice}
              </span>

              {/* Original price with strikethrough */}
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
          </div>

          {/* Right: Selection Checkbox and Expand Icon */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Selection Checkbox */}
            <button
              type="button"
              onClick={handleToggle}
              disabled={isDisabled}
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 flex-shrink-0",
                {
                  'border-primary-500 bg-primary-500 text-white': isSelected && !hasError,
                  'border-red-500 bg-red-500 text-white': hasError,
                  'border-gray-300 bg-white text-gray-400 hover:border-primary-400 hover:text-primary-500': !isSelected && !hasError && !isDisabled,
                  'border-gray-200 bg-gray-100 text-gray-300 cursor-not-allowed': isDisabled
                }
              )}
              aria-label={isSelected ? `Remove ${addon.title}` : `Add ${addon.title}`}
            >
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
            </button>

            {/* Expand/Collapse Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-shrink-0"
            >
              <ChevronDown className={clsx(
                "h-5 w-5 text-gray-500 transition-colors",
                !isDisabled && "group-hover:text-primary-500"
              )} />
            </motion.div>
          </div>
        </div>

        {/* Badges row - always visible in collapsed view */}
        {(addon.badges?.popularity || addon.badges?.recommended || addon.badges?.priceWarning) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {addon.badges?.popularity && (
              <Badge variant="primary" size="sm" className="text-xs whitespace-nowrap">
                {addon.badges.popularity}
              </Badge>
            )}
            {addon.badges?.recommended && (
              <Badge variant="success" size="sm" className="text-xs whitespace-nowrap font-bold bg-green-600 text-white">
                Highly Recommended
              </Badge>
            )}
            {addon.badges?.priceWarning && (
              <Badge variant="warning" size="sm" className="text-xs whitespace-nowrap">
                {addon.badges.priceWarning}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content - Animated */}
      <AnimatePresence initial={false} mode="wait">
        {isExpanded && (
          <motion.div
            key={`expanded-${addon.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0 space-y-4 border-t border-gray-200">
              {/* Description */}
              <div className="pt-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {addon.description}
                </p>
              </div>

              {/* Price calculation helper */}
              {priceCalculation && (
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <strong>Pricing:</strong> {priceCalculation}
                  </p>
                </div>
              )}

              {/* Features list */}
              {addon.features && addon.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
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
                  className="flex items-start space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
                  role="alert"
                >
                  <AlertCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{validationError}</span>
                </div>
              )}

              {hasWarning && (
                <div className="flex items-start space-x-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                  <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{validationWarning}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </motion.div>
  )
}

export default AddOnCard
