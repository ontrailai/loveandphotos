/**
 * Add-Ons Configuration
 * Authoritative data model for all available add-ons with pricing, validation, and display properties
 */

export const ADD_ONS_CONFIG = [
  {
    id: 'raw-footage',
    title: 'Raw Footage',
    basePrice: 395,
    originalPrice: 795,
    discountPercent: 50,
    popularity: 81,
    category: 'photos',
    description: `During your wedding day, we take thousands of photos—capturing all the hugs, smiles, and fun moments as they happen. But usually, we pick and edit just a few hundred of the very best pictures to give you.

If you want every single photo we took—no matter if it made the final cut or not—you can buy the raw photos add-on. These are straight from the camera, with no edits or changes, exactly how they were snapped.

This way, you get to keep all those extra special moments that don't always show up in the edited set—like a quick laugh with a friend, a little tear during the vows, your grandma's smile in the crowd, or a silly dance move on the dance floor. It's a great way to relive your day from every angle and never miss a memory.`,
    features: [
      'Thousands of unedited photos',
      'Complete coverage of your day',
      'Every single shot we captured',
      'Raw, unprocessed files',
      'Digital download included'
    ],
    extraInfo: {
      hasLink: true,
      linkText: 'Please read this article before booking, and for download instructions.',
      linkAction: 'modal' // Could be 'modal', 'external', etc.
    },
    validation: {
      isAlwaysAvailable: true
    },
    badges: {
      discount: 'Usually $795 — 50% off',
      popularity: '81% of couples choose this'
    }
  },
  {
    id: 'liability-insurance',
    title: 'Liability Insurance',
    basePrice: 395,
    originalPrice: 595,
    discountPercent: 34,
    popularity: 94,
    category: 'protection',
    description: 'Protects you from liability in case of accidents or damage caused by our team or gear. Highly Recommended.',
    features: [
      'Complete liability protection',
      'Equipment damage coverage',
      'Professional team insurance',
      'Peace of mind guarantee',
      'Highly recommended by venues'
    ],
    validation: {
      isAlwaysAvailable: true
    },
    badges: {
      discount: 'Usually $595 — 34% off',
      popularity: '94% of couples choose this'
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
    description: `Our premium Rush Delivery option fast-tracks your wedding film or photo gallery, giving you priority editing, first-in-line status, and expedited turnaround well ahead of our standard schedule. Perfect for couples who can't wait to relive their day — or who want to share the final product at an upcoming event.

You'll be bumped to the front of the editing queue, with final delivery completed in a fraction of the standard turnaround time. Rush Delivery must be purchased before or within 48 hours after your wedding and is subject to limited availability.`,
    features: [
      'Priority editing queue',
      'First-in-line status',
      'Expedited turnaround',
      'Perfect for upcoming events',
      'Limited availability'
    ],
    validation: {
      isTimeDependent: true,
      timeLimitHours: 48,
      requiresEventDate: true,
      validationMessage: 'Must be purchased within 48 hours after your wedding'
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
    description: 'Engagement, Bridal, and Anniversary Session. Lasts 2–3 Hours. 1 Pro Photographer, 100+ Edited Photos, Digital Download, Social Media Ready Images, $199/mo Payment Plan. If your session is within 31 days, please contact us before booking.',
    features: [
      '2-3 hour session duration',
      '1 professional photographer',
      '100+ edited photos',
      'Digital download included',
      'Social media ready images',
      '$199/mo payment plan available'
    ],
    validation: {
      hasWarning: true,
      warningThresholdDays: 31,
      warningMessage: 'If your session is within 31 days, please contact us before booking.'
    },
    badges: {
      discount: 'Usually $900 — 17% off',
      popularity: null
    }
  },
  {
    id: 'second-shooter',
    title: 'His & Hers Photographer',
    basePrice: 800, // Base price for display, actual price is calculated dynamically
    originalPrice: null,
    discountPercent: 0,
    popularity: 36,
    category: 'team',
    description: `A second photographer or videographer — 4 hour minimum. Second shooters always match your booked hours for seamless coverage. For photo only packages, second shooters are billed at $100 per hour. For photo + video packages, the second shooter fee is 50% of the total package price.

Example for 8 hours (second photographer only):
• Photo-only package: 8 × $100 = $800
• Photo + video package: 50% of $2,500 = $1,250`,
    features: [
      'Second photographer included',
      '4 hour minimum coverage',
      'Matches your booked hours',
      'Seamless dual coverage',
      'Professional coordination'
    ],
    pricing: {
      isDynamic: true,
      minimumHours: 4,
      photoOnlyRate: 100, // per hour
      photoVideoRate: 0.5 // 50% of package price
    },
    validation: {
      requiresMinimumHours: true,
      minimumHours: 4,
      errorMessage: 'Second shooter requires minimum 4 hours'
    },
    badges: {
      discount: null,
      popularity: '36% of couples choose this'
    }
  },
  {
    id: 'date-change-flexibility',
    title: 'Change Date Flexibility',
    basePrice: 50,
    originalPrice: null,
    discountPercent: 0,
    popularity: null,
    category: 'flexibility',
    description: 'Life happens! This add-on allows you to reschedule your shoot date once at no additional cost. Perfect for peace of mind if your plans might change.',
    features: [
      'Reschedule your shoot date once',
      'No additional fees when used',
      'Valid for one date change',
      'Peace of mind protection',
      'Must be purchased at booking'
    ],
    validation: {
      isAlwaysAvailable: true,
      isBookingOnly: true // Can only be purchased during initial booking
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