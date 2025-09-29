/**
 * Payment Calculation Logic for Love & Photos Booking System
 * Handles pricing calculations based on event date and payment plans
 */


/**
 * Computes the payable amount based on booking details and payment plan
 *
 * @param booking - Booking data with totals and event date
 * @param plan - Payment plan selection ('full', 'deposit', 'monthly')
 * @returns Payment calculation with amount, fees, and plan used
 */
function toIntegerCents(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return Math.max(Math.round(numeric), 0)
}

function toCentsFromDollars(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return Math.max(Math.round(numeric * 100), 0)
}

function sumAddonCents(addons) {
  if (!Array.isArray(addons) || addons.length === 0) {
    return 0
  }

  const total = addons.reduce((sum, addon) => {
    const price = Number(addon?.price) || 0
    const quantity = Number(addon?.qty || 1) || 1
    return sum + price * quantity
  }, 0)

  const cents = toCentsFromDollars(total)
  return cents ?? 0
}

export function computePayable(booking, plan) {
  const pricingSummary = booking.personalization_data?.pricing_summary

  const packageCents = toIntegerCents(
    pricingSummary?.package_price_cents ?? booking.package_total_cents
  )
  const addonsCents = toIntegerCents(
    pricingSummary?.addons_price_cents ?? booking.upsells_total_cents
  )

  let base_cents = 0

  if (Number.isFinite(packageCents)) {
    base_cents += packageCents
  }

  if (Number.isFinite(addonsCents)) {
    base_cents += addonsCents
  }

  if (base_cents === 0) {
    const totalFromSummary = toIntegerCents(pricingSummary?.total_amount_cents)
    if (Number.isFinite(totalFromSummary) && totalFromSummary > 0) {
      base_cents = totalFromSummary
    } else {
      const totalFromAmount = toCentsFromDollars(booking.total_amount)
      const inferredPackage = toCentsFromDollars(
        booking.personalization_data?.package?.packagePrice
      )
      const inferredAddons = sumAddonCents(booking.personalization_data?.addons)

      if (Number.isFinite(totalFromAmount) && totalFromAmount > 0) {
        base_cents = totalFromAmount
      } else if (Number.isFinite(inferredPackage)) {
        base_cents = inferredPackage + inferredAddons
      }
    }
  }

  // Ensure we never return a negative or NaN base
  if (!Number.isFinite(base_cents) || base_cents <= 0) {
    base_cents = 0
  }

  // Calculate days between today and event date
  const today = new Date()
  const eventDate = new Date(booking.event_date)
  const timeDiff = eventDate.getTime() - today.getTime()
  const daysOut = Math.ceil(timeDiff / (1000 * 3600 * 24))

  let amount_cents = base_cents
  let late_fee_cents = 0
  const planUsed = plan ?? 'full'

  // Apply pricing rules based on days until event
  if (daysOut <= 30) {
    // Late booking fee applies (within 30 days)
    late_fee_cents = 45000 // $450 late fee
    amount_cents = base_cents + late_fee_cents
  } else if (daysOut <= 59) {
    // No late fee, but only full payment allowed (30-59 days out)
    amount_cents = base_cents
  } else {
    // More than 59 days out - payment plan options available
    if (plan === 'deposit') {
      // 30% deposit for bookings >59 days out
      amount_cents = Math.round(base_cents * 0.30)
    } else if (plan === 'monthly') {
      // First installment of 6-month plan (placeholder logic)
      amount_cents = Math.round(base_cents / 6)
    } else {
      // Full payment
      amount_cents = base_cents
    }
  }

  return {
    amount_cents,
    base_cents,
    late_fee_cents,
    planUsed
  }
}

/**
 * Validates payment plan eligibility based on event date
 *
 * @param eventDate - Event date string (ISO format)
 * @returns Array of available payment plans
 */
export function getAvailablePaymentPlans(eventDate) {
  const today = new Date()
  const event = new Date(eventDate)
  const daysOut = Math.ceil((event.getTime() - today.getTime()) / (1000 * 3600 * 24))

  if (daysOut <= 59) {
    // Only full payment available for events within 59 days
    return ['full']
  } else {
    // All payment options available for events >59 days out
    return ['full', 'deposit', 'monthly']
  }
}

/**
 * Formats amount in cents to display string
 *
 * @param cents - Amount in cents
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100)
}

/**
 * Calculates late fee warning for display
 *
 * @param eventDate - Event date string
 * @returns Object with warning status and days remaining
 */
export function getLateFeeWarning(eventDate) {
  const today = new Date()
  const event = new Date(eventDate)
  const daysOut = Math.ceil((event.getTime() - today.getTime()) / (1000 * 3600 * 24))

  if (daysOut <= 30) {
    return {
      hasLateFee: true,
      daysRemaining: daysOut,
      message: `Late booking fee applies for events within 30 days (${daysOut} days remaining)`
    }
  } else if (daysOut <= 45) {
    return {
      hasLateFee: false,
      daysRemaining: daysOut,
      message: `Book soon! Late fees apply in ${daysOut - 30} days`
    }
  } else {
    return {
      hasLateFee: false,
      daysRemaining: daysOut,
      message: null
    }
  }
}
