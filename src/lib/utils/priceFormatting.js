/**
 * Price Formatting Utilities
 * Ensures consistent USD price formatting across the application
 */

/**
 * Format a price value as USD currency
 * @param {number|string} price - The price to format
 * @returns {string} Formatted price string (e.g., "$1,234.56")
 */
export function formatPrice(price) {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price

  if (isNaN(numericPrice) || numericPrice === null || numericPrice === undefined) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericPrice)
}

/**
 * Get the final price from a booking object with proper fallback chain
 * Priority: final_price > total_amount > base_price > 0
 * @param {Object} booking - The booking object
 * @returns {number} The price value
 */
export function getBookingPrice(booking) {
  if (!booking) return 0

  return booking.final_price || booking.total_amount || booking.base_price || 0
}

/**
 * Format time from HH:MM:SS to 12-hour format with AM/PM
 * @param {string} timeString - Time string in HH:MM:SS format
 * @returns {string} Formatted time (e.g., "2:30 PM") or "TBD"
 */
export function formatEventTime(timeString) {
  if (!timeString) return 'TBD'

  try {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'TBD'
  }
}

/**
 * Get event location with cascading fallback
 * Priority: location_city + location_state > venue_name > venue_address > TBD
 * @param {Object} booking - The booking object
 * @returns {string} Location string
 */
export function getEventLocation(booking) {
  if (!booking) return 'TBD'

  // Priority 1: location_city + location_state
  if (booking.location_city && booking.location_state) {
    return `${booking.location_city}, ${booking.location_state}`
  }

  // Priority 2: venue_name (without address details)
  if (booking.venue_name) {
    return booking.venue_name
  }

  // Priority 3: venue_address object
  if (booking.venue_address?.city && booking.venue_address?.state) {
    return `${booking.venue_address.city}, ${booking.venue_address.state}`
  }

  // Priority 4: Fallback
  return 'TBD'
}
