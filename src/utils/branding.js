/**
 * Branding Utilities
 * Centralized brand constants and helpers
 */

export const BRAND = {
  name: 'Love & Photos',
  shortName: 'L&P',
  tagline: 'Connect with Professional Photographers',
  description: 'Find and book professional photographers for your special moments',
  domain: 'loveandphotos.com',
  productionUrl: 'https://love-and-photos.onrender.com',
  colors: {
    primary: '#EC4899', // primary-500
    secondary: '#F43F5E', // rose-500
    accent: '#FB923C', // orange-400
  },
  social: {
    twitter: '@loveandphotos',
    instagram: '@loveandphotos',
    facebook: 'loveandphotos'
  }
}

/**
 * Get brand name
 * @param {Object} options - Options
 * @param {boolean} options.short - Return short version
 * @returns {string} Brand name
 */
export function getBrandName(options = {}) {
  return options.short ? BRAND.shortName : BRAND.name
}

/**
 * Get brand domain
 * @param {Object} options - Options
 * @param {boolean} options.full - Return full URL
 * @returns {string} Domain or URL
 */
export function getBrandDomain(options = {}) {
  return options.full ? BRAND.productionUrl : BRAND.domain
}

/**
 * Get brand email
 * @param {string} department - Department (support, info, photographers, bookings)
 * @returns {string} Email address
 */
export function getBrandEmail(department = 'support') {
  return `${department}@${BRAND.domain}`
}

/**
 * Get page title with brand
 * @param {string} pageTitle - Page specific title (ignored - always returns brand name only)
 * @returns {string} Full page title (always 'Love & Photos')
 */
export function getPageTitle(pageTitle) {
  return BRAND.name
}

/**
 * Get meta description
 * @param {string} pageDescription - Page specific description
 * @returns {string} Meta description
 */
export function getMetaDescription(pageDescription) {
  return pageDescription || BRAND.description
}

/**
 * Get social media handle
 * @param {string} platform - Platform name (twitter, instagram, facebook)
 * @returns {string} Social media handle
 */
export function getSocialHandle(platform) {
  return BRAND.social[platform.toLowerCase()] || BRAND.social.twitter
}