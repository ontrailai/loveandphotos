/**
 * Add-On Pricing Utilities
 * Business logic for calculating add-on prices, validation, and formatting
 */

/**
 * Compute second shooter pricing based on package type and hours
 * @param {Object} params - Pricing parameters
 * @param {string} params.packageType - 'photoOnly' or 'photoVideo'
 * @param {number} params.packagePrice - Base package price
 * @param {number} params.hoursBooked - Number of hours booked
 * @returns {Object} Pricing result with price and calculation details
 */
export const computeSecondShooterPrice = ({ packageType, packagePrice, hoursBooked }) => {
  // Validate inputs
  if (!packageType || hoursBooked === null || hoursBooked === undefined) {
    return {
      price: 0,
      isValid: false,
      error: 'Missing required parameters'
    }
  }

  // Ensure minimum 4 hours
  const effectiveHours = Math.max(hoursBooked, 4)

  let price = 0
  let calculation = ''

  if (packageType === 'photoOnly') {
    // Photo-only: $100 per hour with 4-hour minimum
    price = effectiveHours * 100
    calculation = `${effectiveHours} hours × $100/hour = $${price}`
  } else if (packageType === 'photoVideo') {
    // Photo + video: 50% of total package price
    price = Math.round(packagePrice * 0.5)
    calculation = `50% of $${packagePrice} = $${price}`
  } else {
    return {
      price: 0,
      isValid: false,
      error: 'Invalid package type'
    }
  }

  return {
    price,
    isValid: true,
    calculation,
    effectiveHours,
    minimumMet: hoursBooked >= 4
  }
}

/**
 * Validate if Rush Delivery is available based on event date
 * @param {string|Date} selectedDate - The event date
 * @returns {Object} Validation result
 */
export const validateRushDelivery = (selectedDate) => {
  if (!selectedDate) {
    return {
      isValid: false,
      reason: 'No date selected'
    }
  }

  const eventDate = new Date(selectedDate)
  const now = new Date()
  const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000))

  // Rush delivery only available if event is more than 48 hours in the past
  // (meaning the event hasn't happened yet or happened very recently)
  const isValid = eventDate > fortyEightHoursAgo

  return {
    isValid,
    reason: isValid
      ? 'Rush delivery available'
      : 'Rush delivery must be purchased within 48 hours after your event',
    hoursRemaining: isValid ? Math.ceil((eventDate - now) / (1000 * 60 * 60)) : 0
  }
}

/**
 * Validate second shooter minimum hours requirement
 * @param {number} hoursBooked - Number of hours booked
 * @returns {Object} Validation result
 */
export const validateSecondShooter = (hoursBooked) => {
  const minimumHours = 4
  const isValid = hoursBooked >= minimumHours

  return {
    isValid,
    minimumHours,
    hoursBooked,
    error: isValid ? null : `Second shooter requires minimum ${minimumHours} hours (${hoursBooked} hours booked)`
  }
}

/**
 * Format price with discount information
 * @param {number} price - Current price
 * @param {number} originalPrice - Original price before discount
 * @param {number} discountPercent - Discount percentage
 * @returns {Object} Formatted pricing display
 */
export const formatPriceWithDiscount = (price, originalPrice, discountPercent) => {
  const hasDiscount = originalPrice && originalPrice > price
  const calculatedDiscount = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  return {
    currentPrice: price,
    originalPrice: originalPrice || price,
    hasDiscount,
    discountPercent: discountPercent || calculatedDiscount,
    discountAmount: hasDiscount ? originalPrice - price : 0,
    formattedCurrent: `$${price}`,
    formattedOriginal: `$${originalPrice || price}`,
    formattedDiscount: hasDiscount ? `${discountPercent || calculatedDiscount}% off` : null,
    displayText: hasDiscount
      ? `Usually $${originalPrice} — ${discountPercent || calculatedDiscount}% off`
      : null
  }
}

/**
 * Calculate total add-ons price from selected add-ons array
 * @param {Array} selectedAddons - Array of selected add-on objects
 * @returns {number} Total price
 */
export const calculateAddonsTotal = (selectedAddons) => {
  if (!Array.isArray(selectedAddons)) {
    return 0
  }

  return selectedAddons.reduce((total, addon) => {
    const price = addon.price || 0
    const qty = addon.qty || 1
    return total + (price * qty)
  }, 0)
}

/**
 * Validate all add-on selections and return any errors
 * @param {Array} selectedAddons - Array of selected add-ons
 * @param {Object} context - Booking context for validation
 * @returns {Object} Validation results
 */
export const validateAddOnSelections = (selectedAddons, context) => {
  const errors = []
  const warnings = []

  if (!Array.isArray(selectedAddons)) {
    return { isValid: true, errors, warnings }
  }

  selectedAddons.forEach(addon => {
    // Validate His & Hers photographer
    if (addon.id === 'second-shooter') {
      const validation = validateSecondShooter(context.hoursBooked)
      if (!validation.isValid) {
        errors.push({
          addonId: addon.id,
          message: validation.error
        })
      }
    }

    // Validate Rush Delivery
    if (addon.id === 'rush-delivery') {
      const validation = validateRushDelivery(context.selectedDate)
      if (!validation.isValid) {
        errors.push({
          addonId: addon.id,
          message: validation.reason
        })
      }
    }

    // Validate Engagement Session timing
    if (addon.id === 'engagement-session') {
      const eventDate = new Date(context.selectedDate)
      const now = new Date()
      const thirtyOneDaysFromNow = new Date(now.getTime() + (31 * 24 * 60 * 60 * 1000))

      if (eventDate <= thirtyOneDaysFromNow) {
        warnings.push({
          addonId: addon.id,
          message: 'If your session is within 31 days, please contact us before booking.'
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}