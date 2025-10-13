/**
 * Add-Ons Configuration
 * Authoritative data model for all available add-ons with pricing, validation, and display properties
 */

import { getVideoAddonPrice, BASE_PHOTO_PRICES, PHOTO_VIDEO_PRICES } from '@/lib/constants/pricing'

export const ADD_ONS_CONFIG = [
  {
    id: 'raw-footage',
    title: 'Raw Footage',
    basePrice: 395,
    originalPrice: null,
    discountPercent: 0,
    popularity: 81,
    category: 'photos',
    description: 'Receive all unedited photos from your event. Every single shot captured, delivered digitally for you to keep.',
    features: [
      'All unedited photos captured',
      'Complete day coverage',
      'Raw, unprocessed files',
      'Digital download included',
      'Professional quality images'
    ],
    extraInfo: {
      hasLink: true,
      linkText: 'View article and download instructions',
      linkAction: 'modal'
    },
    validation: {
      isAlwaysAvailable: true
    },
    badges: {
      discount: null,
      popularity: '81% of couples choose this'
    }
  },
  {
    id: 'liability-insurance',
    title: 'Insured Photographer',
    basePrice: 395,
    originalPrice: null,
    discountPercent: 0,
    popularity: 94,
    category: 'protection',
    description: 'Professional liability coverage protecting you from accidents or damage during your event.',
    features: [
      'Complete liability protection',
      'Equipment damage coverage',
      'Professional team insurance',
      'Venue requirement compliance',
      'Peace of mind guarantee'
    ],
    validation: {
      isAlwaysAvailable: true
    },
    badges: {
      discount: null,
      popularity: '94% of couples choose this',
      recommended: true
    }
  },
  {
    id: 'rush-delivery',
    title: 'Rush Delivery',
    basePrice: 650,
    originalPrice: null,
    discountPercent: 0,
    popularity: null,
    category: 'delivery',
    description: 'Fast-track your photos and videos with priority editing. Receive your final gallery in a fraction of the standard turnaround time.',
    features: [
      'Priority editing queue',
      'Expedited delivery',
      'First-in-line status',
      'Perfect for upcoming events',
      'Must purchase within 48 hours'
    ],
    validation: {
      isTimeDependent: true,
      timeLimitHours: 48,
      requiresEventDate: true,
      validationMessage: 'Must be purchased within 48 hours after your event'
    },
    badges: {
      discount: null,
      popularity: null
    }
  },
  {
    id: 'engagement-session',
    title: 'Engagement, Bridal, or Anniversary Session',
    basePrice: 750,
    originalPrice: 900,
    discountPercent: 17,
    popularity: null,
    category: 'sessions',
    description: 'Professional photo session perfect for engagement, bridal, or anniversary celebrations. Capture beautiful moments with expert photography.',
    features: [
      '2-3 hour session',
      'Professional photographer',
      '100+ edited photos',
      'Digital download included',
      'Social media ready images',
      '$199/mo payment plan'
    ],
    validation: {
      hasWarning: true,
      warningThresholdDays: 31,
      warningMessage: 'Sessions within 31 days require advance contact'
    },
    badges: {
      discount: 'Usually $900 — 17% off',
      popularity: null
    }
  },
  {
    id: 'second-shooter',
    title: 'Second Photographer',
    basePrice: 750,
    originalPrice: null,
    discountPercent: 0,
    popularity: 36,
    category: 'team',
    description: 'Add a second photographer to capture every moment from multiple angles. Perfect for comprehensive event coverage.',
    features: [
      'Additional photographer',
      '4 hour minimum',
      'Matches your package hours',
      'Dual angle coverage',
      'Professional coordination'
    ],
    pricing: {
      isDynamic: true,
      minimumHours: 4,
      photoOnlyRate: 100,
      photoVideoRate: 0.5
    },
    validation: {
      requiresMinimumHours: true,
      minimumHours: 4,
      errorMessage: 'Requires minimum 4 hour package'
    },
    badges: {
      discount: null,
      popularity: '36% of couples choose this',
      priceNote: 'Starts at'
    }
  },
  {
    id: 'date-change-flexibility',
    title: 'One-Time Date Change',
    basePrice: 50,
    originalPrice: null,
    discountPercent: 0,
    popularity: 72,
    category: 'flexibility',
    description: 'Protect yourself with one emergency date change option. Peace of mind for unexpected schedule changes.',
    features: [
      'One date reschedule included',
      'No additional fees when used',
      'Valid for emergencies',
      'Peace of mind protection',
      'Must purchase at booking'
    ],
    validation: {
      isAlwaysAvailable: true,
      isBookingOnly: true
    },
    badges: {
      discount: null,
      popularity: '72% of couples choose this',
      priceWarning: 'Becomes $495 after booking'
    }
  },
  {
    id: 'video-coverage',
    title: 'Video Coverage',
    basePrice: 700, // Base price for display, actual price is calculated dynamically
    originalPrice: null,
    discountPercent: 0,
    popularity: null,
    category: 'media',
    description: 'Professional video coverage for your wedding. Duration automatically matches your photo package for seamless coverage.',
    features: [
      'Professional video cinematography',
      'Duration matches photo package',
      'Cinematic highlight reel',
      'Full ceremony footage',
      'Professional editing included',
      'Digital download delivery'
    ],
    pricing: {
      isDynamic: true,
      // Calculated from authoritative pricing tables (Photo+Video minus Photo-Only)
      priceByHours: Object.keys(BASE_PHOTO_PRICES).reduce((acc, hours) => {
        const h = Number(hours)
        acc[h] = PHOTO_VIDEO_PRICES[h] - BASE_PHOTO_PRICES[h]
        return acc
      }, {})
    },
    validation: {
      requiresPhotoPackage: true,
      errorMessage: 'Video coverage requires a photo package to be selected',
      durationSynced: true,
      durationMessage: 'Video duration automatically matches your photo package duration'
    },
    badges: {
      discount: null,
      popularity: null
    }
  }
]

/**
 * Get add-on configuration by ID
 * @param {string} id - Add-on ID
 * @returns {Object|null} Add-on configuration or null if not found
 */
export const getAddOnById = (id) => {
  return ADD_ONS_CONFIG.find(addon => addon.id === id) || null
}

/**
 * Get all add-ons by category
 * @param {string} category - Category filter
 * @returns {Array} Array of add-ons in the category
 */
export const getAddOnsByCategory = (category) => {
  return ADD_ONS_CONFIG.filter(addon => addon.category === category)
}

/**
 * Get add-ons that have popularity badges
 * @returns {Array} Array of add-ons with popularity data
 */
export const getPopularAddOns = () => {
  return ADD_ONS_CONFIG.filter(addon => addon.popularity !== null)
}

/**
 * Get add-ons that have discount badges
 * @returns {Array} Array of add-ons with discounts
 */
export const getDiscountedAddOns = () => {
  return ADD_ONS_CONFIG.filter(addon => addon.originalPrice && addon.originalPrice > addon.basePrice)
}

/**
 * Get add-ons that require validation
 * @returns {Array} Array of add-ons with validation requirements
 */
export const getValidationRequiredAddOns = () => {
  return ADD_ONS_CONFIG.filter(addon =>
    addon.validation?.isTimeDependent ||
    addon.validation?.requiresMinimumHours ||
    addon.validation?.hasWarning
  )
}

/**
 * Get formatted display data for an add-on
 * @param {string} id - Add-on ID
 * @param {Object} context - Booking context for dynamic pricing
 * @returns {Object} Formatted add-on data for display
 */
export const getFormattedAddOn = (id, context = {}) => {
  const addon = getAddOnById(id)
  if (!addon) return null

  let displayPrice = addon.basePrice
  let priceCalculation = null

  // Handle dynamic pricing for second shooter
  if (addon.pricing?.isDynamic && id === 'second-shooter') {
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

  // Handle dynamic pricing for video coverage
  if (addon.pricing?.isDynamic && id === 'video-coverage') {
    const { hoursBooked } = context

    if (hoursBooked && hoursBooked > 0) {
      // Round to nearest whole hour for pricing lookup
      const roundedHours = Math.round(hoursBooked)

      // Get price from lookup table or use base price as fallback
      const calculatedPrice = addon.pricing.priceByHours[roundedHours]
      displayPrice = calculatedPrice !== undefined ? calculatedPrice : addon.basePrice
      priceCalculation = `${roundedHours} hour${roundedHours !== 1 ? 's' : ''} video coverage`
    } else {
      // If no hours booked, use base price as default
      displayPrice = addon.basePrice
      priceCalculation = null
    }
  }

  return {
    ...addon,
    displayPrice,
    priceCalculation,
    formattedPrice: `$${displayPrice}`,
    hasDiscount: addon.originalPrice && addon.originalPrice > addon.basePrice,
    discountDisplay: addon.badges?.discount || null,
    popularityDisplay: addon.badges?.popularity || null
  }
}