/**
 * Add-On Pricing Utilities Tests
 * Comprehensive test suite for pricing calculations and validation
 */

import {
  computeSecondShooterPrice,
  validateRushDelivery,
  validateSecondShooter,
  formatPriceWithDiscount,
  calculateAddonsTotal,
  validateAddOnSelections
} from '../addOnPricing'

describe('computeSecondShooterPrice', () => {
  describe('photoOnly packages', () => {
    test('calculates correct price for 8 hours', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoOnly',
        packagePrice: 2000,
        hoursBooked: 8
      })

      expect(result.price).toBe(800)
      expect(result.isValid).toBe(true)
      expect(result.calculation).toBe('8 hours × $100/hour = $800')
      expect(result.minimumMet).toBe(true)
    })

    test('enforces 4-hour minimum for photoOnly', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoOnly',
        packagePrice: 2000,
        hoursBooked: 2
      })

      expect(result.price).toBe(400) // 4 hours × $100
      expect(result.effectiveHours).toBe(4)
      expect(result.minimumMet).toBe(false)
    })

    test('handles exactly 4 hours', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoOnly',
        packagePrice: 2000,
        hoursBooked: 4
      })

      expect(result.price).toBe(400)
      expect(result.minimumMet).toBe(true)
    })
  })

  describe('photoVideo packages', () => {
    test('calculates 50% of package price', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoVideo',
        packagePrice: 2500,
        hoursBooked: 8
      })

      expect(result.price).toBe(1250)
      expect(result.isValid).toBe(true)
      expect(result.calculation).toBe('50% of $2500 = $1250')
    })

    test('rounds to nearest dollar', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoVideo',
        packagePrice: 2333,
        hoursBooked: 6
      })

      expect(result.price).toBe(1167) // 50% of 2333 = 1166.5, rounded to 1167
    })

    test('still enforces minimum hours for validation', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoVideo',
        packagePrice: 2500,
        hoursBooked: 2
      })

      expect(result.minimumMet).toBe(false)
      expect(result.effectiveHours).toBe(4)
    })
  })

  describe('error handling', () => {
    test('handles missing packageType', () => {
      const result = computeSecondShooterPrice({
        packagePrice: 2000,
        hoursBooked: 8
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Missing required parameters')
    })

    test('handles invalid packageType', () => {
      const result = computeSecondShooterPrice({
        packageType: 'invalid',
        packagePrice: 2000,
        hoursBooked: 8
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid package type')
    })

    test('handles missing hoursBooked', () => {
      const result = computeSecondShooterPrice({
        packageType: 'photoOnly',
        packagePrice: 2000
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Missing required parameters')
    })
  })
})

describe('validateRushDelivery', () => {
  test('allows rush delivery for future events', () => {
    const futureDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days from now
    const result = validateRushDelivery(futureDate)

    expect(result.isValid).toBe(true)
    expect(result.reason).toBe('Rush delivery available')
    expect(result.hoursRemaining).toBeGreaterThan(0)
  })

  test('allows rush delivery for events within 48 hours', () => {
    const recentDate = new Date(Date.now() - (12 * 60 * 60 * 1000)) // 12 hours ago
    const result = validateRushDelivery(recentDate)

    expect(result.isValid).toBe(true)
    expect(result.reason).toBe('Rush delivery available')
  })

  test('disallows rush delivery for events more than 48 hours ago', () => {
    const pastDate = new Date(Date.now() - (72 * 60 * 60 * 1000)) // 72 hours ago
    const result = validateRushDelivery(pastDate)

    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('Rush delivery must be purchased within 48 hours after your event')
    expect(result.hoursRemaining).toBe(0)
  })

  test('handles no date provided', () => {
    const result = validateRushDelivery(null)

    expect(result.isValid).toBe(false)
    expect(result.reason).toBe('No date selected')
  })

  test('handles string dates', () => {
    const futureDate = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
    const result = validateRushDelivery(futureDate)

    expect(result.isValid).toBe(true)
  })
})

describe('validateSecondShooter', () => {
  test('validates sufficient hours', () => {
    const result = validateSecondShooter(8)

    expect(result.isValid).toBe(true)
    expect(result.error).toBe(null)
    expect(result.minimumHours).toBe(4)
    expect(result.hoursBooked).toBe(8)
  })

  test('validates exactly minimum hours', () => {
    const result = validateSecondShooter(4)

    expect(result.isValid).toBe(true)
    expect(result.error).toBe(null)
  })

  test('rejects insufficient hours', () => {
    const result = validateSecondShooter(2)

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Second shooter requires minimum 4 hours (2 hours booked)')
  })

  test('handles zero hours', () => {
    const result = validateSecondShooter(0)

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Second shooter requires minimum 4 hours (0 hours booked)')
  })
})

describe('formatPriceWithDiscount', () => {
  test('formats price with discount', () => {
    const result = formatPriceWithDiscount(395, 795, 50)

    expect(result.currentPrice).toBe(395)
    expect(result.originalPrice).toBe(795)
    expect(result.hasDiscount).toBe(true)
    expect(result.discountPercent).toBe(50)
    expect(result.discountAmount).toBe(400)
    expect(result.formattedCurrent).toBe('$395')
    expect(result.formattedOriginal).toBe('$795')
    expect(result.formattedDiscount).toBe('50% off')
    expect(result.displayText).toBe('Usually $795 — 50% off')
  })

  test('calculates discount percentage when not provided', () => {
    const result = formatPriceWithDiscount(395, 595)

    expect(result.discountPercent).toBe(34) // (595-395)/595 = 33.6%, rounded to 34%
    expect(result.displayText).toBe('Usually $595 — 34% off')
  })

  test('handles no discount', () => {
    const result = formatPriceWithDiscount(395)

    expect(result.hasDiscount).toBe(false)
    expect(result.discountPercent).toBe(0)
    expect(result.discountAmount).toBe(0)
    expect(result.displayText).toBe(null)
    expect(result.formattedDiscount).toBe(null)
  })

  test('handles equal prices', () => {
    const result = formatPriceWithDiscount(395, 395)

    expect(result.hasDiscount).toBe(false)
    expect(result.displayText).toBe(null)
  })
})

describe('calculateAddonsTotal', () => {
  test('calculates total for multiple add-ons', () => {
    const addons = [
      { id: 'addon1', price: 100, qty: 1 },
      { id: 'addon2', price: 200, qty: 2 },
      { id: 'addon3', price: 50, qty: 1 }
    ]

    const total = calculateAddonsTotal(addons)
    expect(total).toBe(550) // 100 + (200*2) + 50
  })

  test('handles missing qty (defaults to 1)', () => {
    const addons = [
      { id: 'addon1', price: 100 },
      { id: 'addon2', price: 200 }
    ]

    const total = calculateAddonsTotal(addons)
    expect(total).toBe(300)
  })

  test('handles empty array', () => {
    const total = calculateAddonsTotal([])
    expect(total).toBe(0)
  })

  test('handles null/undefined input', () => {
    expect(calculateAddonsTotal(null)).toBe(0)
    expect(calculateAddonsTotal(undefined)).toBe(0)
  })

  test('handles missing price', () => {
    const addons = [
      { id: 'addon1', qty: 2 },
      { id: 'addon2', price: 100, qty: 1 }
    ]

    const total = calculateAddonsTotal(addons)
    expect(total).toBe(100) // Missing price treated as 0
  })
})

describe('validateAddOnSelections', () => {
  const mockContext = {
    selectedDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
    hoursBooked: 6,
    packageType: 'photoOnly'
  }

  test('validates valid selections', () => {
    const addons = [
      { id: 'raw-footage', price: 395 },
      { id: 'liability-insurance', price: 395 }
    ]

    const result = validateAddOnSelections(addons, mockContext)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  test('validates second shooter with sufficient hours', () => {
    const addons = [
      { id: 'second-shooter', price: 800 }
    ]

    const result = validateAddOnSelections(addons, mockContext)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('rejects second shooter with insufficient hours', () => {
    const addons = [
      { id: 'second-shooter', price: 800 }
    ]

    const contextWithFewHours = { ...mockContext, hoursBooked: 2 }
    const result = validateAddOnSelections(addons, contextWithFewHours)

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].addonId).toBe('second-shooter')
  })

  test('rejects rush delivery for old events', () => {
    const addons = [
      { id: 'rush-delivery', price: 650 }
    ]

    const contextWithOldDate = {
      ...mockContext,
      selectedDate: new Date(Date.now() - (72 * 60 * 60 * 1000)).toISOString()
    }
    const result = validateAddOnSelections(addons, contextWithOldDate)

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].addonId).toBe('rush-delivery')
  })

  test('warns about engagement session timing', () => {
    const addons = [
      { id: 'engagement-session', price: 750 }
    ]

    const contextWithSoonDate = {
      ...mockContext,
      selectedDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)).toISOString()
    }
    const result = validateAddOnSelections(addons, contextWithSoonDate)

    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].addonId).toBe('engagement-session')
  })

  test('handles non-array input', () => {
    const result = validateAddOnSelections(null, mockContext)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})