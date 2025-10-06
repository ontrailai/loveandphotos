/**
 * Pricing Configuration - Single Source of Truth
 * All pricing logic across the application must use these constants
 */

/**
 * Base Photo-Only Package Pricing by Hours
 * Maps hours (1-12) to USD price
 */
export const BASE_PHOTO_PRICES = {
  1: 550,
  2: 650,
  3: 700,
  4: 750,
  5: 800,
  6: 850,
  7: 900,
  8: 950,
  9: 1150,
  10: 1250,
  11: 1350,
  12: 1450
}

/**
 * Photo+Video Package Pricing by Hours
 * Maps hours (1-12) to USD price
 */
export const PHOTO_VIDEO_PRICES = {
  1: 1250,
  2: 1450,
  3: 1650,
  4: 1850,
  5: 2050,
  6: 2250,
  7: 2450,
  8: 2650,
  9: 2850,
  10: 3050,
  11: 3250,
  12: 3650
}

/**
 * Get base photo package price for given hours
 * @param {number} hours - Number of hours (1-12)
 * @returns {number|null} Price in dollars, or null if invalid
 */
export function getBasePhotoPrice(hours) {
  const roundedHours = Math.round(hours)

  if (!hours || roundedHours < 1 || roundedHours > 12) {
    return null
  }

  return BASE_PHOTO_PRICES[roundedHours]
}

/**
 * Get photo+video package price for given hours
 * @param {number} hours - Number of hours (1-12)
 * @returns {number|null} Price in dollars, or null if invalid
 */
export function getPhotoVideoPrice(hours) {
  const roundedHours = Math.round(hours)

  if (!hours || roundedHours < 1 || roundedHours > 12) {
    return null
  }

  return PHOTO_VIDEO_PRICES[roundedHours]
}

/**
 * Get video add-on price (difference between photo+video and photo-only)
 * @param {number} hours - Number of hours (1-12)
 * @returns {number|null} Price in dollars, or null if invalid
 */
export function getVideoAddonPrice(hours) {
  const photoPrice = getBasePhotoPrice(hours)
  const photoVideoPrice = getPhotoVideoPrice(hours)

  if (photoPrice === null || photoVideoPrice === null) {
    return null
  }

  return photoVideoPrice - photoPrice
}

/**
 * Format price for display
 * @param {number} price - Price in dollars
 * @returns {string} Formatted price (e.g., "$1,450")
 */
export function formatPrice(price) {
  if (price === null || price === undefined || !Number.isFinite(price)) {
    return '$0'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Validate hours are within acceptable range
 * @param {number} hours - Number of hours
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
export function validateHours(hours) {
  if (!hours || !Number.isFinite(hours)) {
    return {
      isValid: false,
      error: 'Invalid photo hours selected'
    }
  }

  const roundedHours = Math.round(hours)

  if (roundedHours < 1 || roundedHours > 12) {
    return {
      isValid: false,
      error: 'Photo hours must be between 1 and 12 hours'
    }
  }

  return {
    isValid: true,
    error: null
  }
}
