/**
 * Package Pricing Constants
 * Hard-coded pricing tables for photo-only and photo+video packages
 * DO NOT modify these values without approval - they are exact pricing tiers
 */

// Photo-only package pricing (exact values, not calculated)
export const PHOTO_PACKAGES = [
  { hours: 1, price: 550 },
  { hours: 2, price: 650 },
  { hours: 3, price: 700 },
  { hours: 4, price: 750 },
  { hours: 5, price: 800 },
  { hours: 6, price: 850 },
  { hours: 7, price: 900 },
  { hours: 8, price: 950 },
  { hours: 9, price: 1150 },
  { hours: 10, price: 1250 },
  { hours: 11, price: 1350 },
  { hours: 12, price: 1450 }
]

// Photo+Video bundle pricing (exact values, not calculated)
export const PHOTO_VIDEO_PACKAGES = [
  { hours: 1, price: 1250 },
  { hours: 2, price: 1450 },
  { hours: 3, price: 1650 },
  { hours: 4, price: 1850 },
  { hours: 5, price: 2050 },
  { hours: 6, price: 2250 },
  { hours: 7, price: 2450 },
  { hours: 8, price: 2650 },
  { hours: 9, price: 2850 },
  { hours: 10, price: 3050 },
  { hours: 11, price: 3250 },
  { hours: 12, price: 3650 }
]

// Add-on pricing
export const ADDONS_PRICING = {
  INSURED_PHOTOGRAPHER: {
    id: 'insured_photographer',
    title: 'Insured Photographer',
    price: 395,
    description: '94% of couples choose this',
    recommended: true
  },
  DATE_CHANGE: {
    id: 'date_change',
    title: 'One-Time Date Change',
    price: 50,
    description: '72% of couples choose this',
    recommended: true
  },
  SECOND_PHOTOGRAPHER: {
    id: 'second_photographer',
    title: 'Second Photographer',
    basePrice: 750,
    description: 'Matches photo duration',
    requiresHours: true
  },
  RAW_FOOTAGE: {
    id: 'raw_footage',
    title: 'Raw Footage',
    price: 395,
    description: '81% of couples choose this',
    recommended: true,
    requiresVideo: true // Only show if video was selected
  }
}

/**
 * Get photo-only package price by hours
 * @param {number} hours - Number of hours (1-12)
 * @returns {number|null} Price in dollars, or null if invalid
 */
export const getPhotoPackagePrice = (hours) => {
  const pkg = PHOTO_PACKAGES.find(p => p.hours === hours)
  return pkg ? pkg.price : null
}

/**
 * Get photo+video bundle price by hours
 * @param {number} hours - Number of hours (1-12)
 * @returns {number|null} Price in dollars, or null if invalid
 */
export const getPhotoVideoPackagePrice = (hours) => {
  const pkg = PHOTO_VIDEO_PACKAGES.find(p => p.hours === hours)
  return pkg ? pkg.price : null
}

/**
 * Get all available photo packages for display
 * @returns {Array} Array of package objects with hours and price
 */
export const getAllPhotoPackages = () => {
  return [...PHOTO_PACKAGES]
}

/**
 * Get all available photo+video packages for display
 * @returns {Array} Array of package objects with hours and price
 */
export const getAllPhotoVideoPackages = () => {
  return [...PHOTO_VIDEO_PACKAGES]
}

/**
 * Calculate second photographer price (matches photo duration)
 * Base price is $750, scales with hours
 * @param {number} hours - Number of hours
 * @returns {number} Price in dollars
 */
export const getSecondPhotographerPrice = (hours) => {
  // Base price for second photographer matches duration
  return ADDONS_PRICING.SECOND_PHOTOGRAPHER.basePrice + (hours * 50)
}

/**
 * Validate if hours are valid for packages
 * @param {number} hours - Number of hours to validate
 * @returns {boolean} True if valid hours (1-12)
 */
export const isValidPackageHours = (hours) => {
  return Number.isInteger(hours) && hours >= 1 && hours <= 12
}
