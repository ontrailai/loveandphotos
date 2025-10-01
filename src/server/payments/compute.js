/**
 * Payment Calculation Logic for Love & Photos Booking System
 *
 * This is the authoritative source of truth for all payment calculations.
 * Frontend components (PaymentStep.jsx, PaymentOptions.jsx) must match this logic exactly.
 *
 * 🎯 CRITICAL RULE: All payments must be COMPLETE 60 days before the event date.
 *
 * PAYMENT RULES BY DAYS UNTIL EVENT:
 *
 * 1. Within 60 Days (0-60 days):
 *    - Late booking fee: $450
 *    - Payment plans: NOT AVAILABLE (full payment only)
 *    - Total charged: base_amount + $450 late fee
 *    - Reason: Not enough time for installment payments before 60-day cutoff
 *
 * 2. Medium Notice (61-89 days):
 *    - Late booking fee: $0
 *    - Payment plans: LIMITED (full payment or $500 deposit only)
 *    - Not enough months for $199/month plan
 *    - Reason: Need at least 90 days for monthly payment plan
 *
 * 3. Advance Booking (90+ days):
 *    - Late booking fee: $0
 *    - Payment plans: ALL AVAILABLE (full, $500 deposit, $199/month)
 *    - Full payment: base_amount
 *    - $500 Deposit: $500 upfront, remaining split into monthly payments (complete 60 days before event)
 *    - $199/Month: Monthly payments + $150 processing fee (complete 60 days before event)
 *
 * PAYMENT PLAN DETAILS:
 *
 * A. Full Payment ('full'):
 *    - One-time payment of entire balance
 *    - Late fee ($450) applies if booked within 60 days
 *
 * B. $500 Deposit ('deposit500'):
 *    - $500 due today
 *    - Remaining balance split into equal monthly payments
 *    - Payments scheduled monthly until 60 days before event
 *    - No processing fee
 *
 * C. $199 Monthly Plan ('monthly199'):
 *    - $150 one-time processing fee added to total
 *    - Monthly payments calculated as: (base_amount + $150) / months_until_60day_cutoff
 *    - First payment due today
 *    - Subsequent payments charged monthly
 *    - All payments complete 60 days before event
 *
 * BASE AMOUNT CALCULATION:
 * base_amount = package_price + sum(addon_price * addon_quantity)
 *
 * CURRENCY HANDLING:
 * All amounts stored in cents to avoid floating point errors.
 * Use toCentsFromDollars() for dollar-to-cents conversion.
 */


/**
 * Computes the payable amount based on booking details and payment plan
 *
 * @param booking - Booking data with package price, addons, and event date
 * @param plan - Payment plan selection ('full', 'deposit+3', 'installments')
 * @returns {Object} Payment calculation with amount_cents, base_cents, late_fee_cents, planUsed
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
    console.warn('⚠️ WARNING: No valid pricing found for booking:', {
      bookingId: booking.id,
      package_total_cents: booking.package_total_cents,
      package_type: booking.package_type,
      pricing_summary: pricingSummary,
      personalization_package: booking.personalization_data?.package
    })
    base_cents = 0
  }

  // Calculate days between today and event date
  const today = new Date()
  const eventDate = new Date(booking.event_date)
  const timeDiff = eventDate.getTime() - today.getTime()
  const daysOut = Math.ceil(timeDiff / (1000 * 3600 * 24))

  // Calculate 60-day cutoff date (payments must complete before this)
  const cutoffDate = new Date(eventDate)
  cutoffDate.setDate(cutoffDate.getDate() - 60)
  const daysUntilCutoff = Math.ceil((cutoffDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
  const monthsUntilCutoff = Math.max(1, Math.floor(daysUntilCutoff / 30))

  let amount_cents = base_cents
  let late_fee_cents = 0
  let processing_fee_cents = 0
  const planUsed = plan ?? 'full'

  // Apply pricing rules based on days until event
  if (daysOut <= 60) {
    // Within 60 days: Late booking fee applies, only full payment available
    late_fee_cents = 45000 // $450 late fee
    amount_cents = base_cents + late_fee_cents
  } else if (daysOut < 90) {
    // 61-89 days: No late fee, limited payment plans
    // Only full payment or $500 deposit available (not enough time for $199/month)
    if (plan === 'deposit500') {
      // $500 deposit + remaining balance split into monthly payments
      amount_cents = 50000 // $500 deposit
    } else {
      // Full payment (default)
      amount_cents = base_cents
    }
  } else {
    // 90+ days: All payment plans available
    if (plan === 'deposit500') {
      // $500 deposit + remaining balance split into monthly payments
      amount_cents = 50000 // $500 deposit
    } else if (plan === 'monthly199') {
      // Monthly plan: Total balance (base + $150 fee) divided into monthly $199 payments
      // First payment includes processing fee, remaining balance paid in subsequent months
      processing_fee_cents = 15000 // $150 processing fee
      const totalWithFee = base_cents + processing_fee_cents

      // Calculate monthly payment amount to spread total over available months
      const monthlyPayment = Math.ceil(totalWithFee / monthsUntilCutoff)

      // First payment due today
      amount_cents = monthlyPayment

      console.log('💳 Monthly Plan Breakdown:', {
        base_cents,
        processing_fee_cents,
        total_with_fee: totalWithFee,
        months_available: monthsUntilCutoff,
        monthly_payment: monthlyPayment,
        first_payment_today: amount_cents
      })
    } else if (plan === 'deposit+3' || plan === 'installments') {
      // Legacy support: map old plan names
      if (plan === 'deposit+3') {
        amount_cents = 50000 // Map to deposit500
      } else {
        // Map installments to monthly199
        processing_fee_cents = 15000
        const totalWithFee = base_cents + processing_fee_cents
        amount_cents = Math.round(totalWithFee / monthsUntilCutoff)
      }
    } else {
      // Full payment (default)
      amount_cents = base_cents
    }
  }

  // Log calculation for debugging
  console.log('📊 Payment Calculation (compute.js):', {
    booking_id: booking.id,
    plan: planUsed,
    amount_due_today: (amount_cents / 100).toFixed(2),
    base_amount: (base_cents / 100).toFixed(2),
    late_fee: (late_fee_cents / 100).toFixed(2),
    processing_fee: (processing_fee_cents / 100).toFixed(2),
    months_until_cutoff: monthsUntilCutoff,
    days_until_cutoff: daysUntilCutoff
  })

  return {
    amount_cents,
    base_cents,
    late_fee_cents,
    processing_fee_cents,
    planUsed,
    monthsUntilCutoff,
    daysUntilCutoff
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

  if (daysOut <= 60) {
    // Within 60 days: Only full payment available (late fee applies)
    return ['full']
  } else if (daysOut < 90) {
    // 61-89 days: Limited plans (full payment or $500 deposit only)
    return ['full', 'deposit500']
  } else {
    // 90+ days: All payment plans available
    return ['full', 'deposit500', 'monthly199']
  }
}

/**
 * Generates payment schedule for installment plans
 *
 * @param booking - Booking data with package price, addons, and event date
 * @param plan - Payment plan selection ('deposit500' or 'monthly199')
 * @returns Array of payment schedule objects with date and amount
 */
export function generatePaymentSchedule(booking, plan) {
  const result = computePayable(booking, plan)
  const { base_cents, processing_fee_cents, monthsUntilCutoff, daysUntilCutoff } = result

  const today = new Date()
  const eventDate = new Date(booking.event_date)

  // Calculate cutoff date (60 days before event)
  const cutoffDate = new Date(eventDate)
  cutoffDate.setDate(cutoffDate.getDate() - 60)

  const schedule = []

  if (plan === 'deposit500') {
    // $500 Deposit Plan: $500 today, remaining split into monthly payments
    const remainingBalance = base_cents - 50000 // base - $500 deposit
    const monthlyPayment = Math.round(remainingBalance / monthsUntilCutoff)

    // First payment (deposit)
    schedule.push({
      date: today.toISOString(),
      amount_cents: 50000,
      description: 'Initial deposit',
      payment_number: 1,
      total_payments: monthsUntilCutoff + 1
    })

    // Remaining monthly payments
    for (let i = 1; i <= monthsUntilCutoff; i++) {
      const paymentDate = new Date(today)
      paymentDate.setMonth(paymentDate.getMonth() + i)

      // Ensure last payment doesn't exceed cutoff date
      if (paymentDate > cutoffDate) {
        paymentDate.setTime(cutoffDate.getTime())
      }

      // Last payment might be adjusted to account for rounding
      const isLastPayment = i === monthsUntilCutoff
      const amount = isLastPayment
        ? (base_cents - 50000 - (monthlyPayment * (monthsUntilCutoff - 1)))
        : monthlyPayment

      schedule.push({
        date: paymentDate.toISOString(),
        amount_cents: amount,
        description: `Monthly payment ${i} of ${monthsUntilCutoff}`,
        payment_number: i + 1,
        total_payments: monthsUntilCutoff + 1
      })
    }
  } else if (plan === 'monthly199') {
    // Monthly Plan: Fixed $199/month payments until 60 days before event, then lump sum
    const processingFee = 15000 // $150 processing fee
    const monthlyPayment = 19900 // $199 fixed monthly payment

    // Calculate how many full months we have until the 60-day cutoff
    const monthsAvailable = Math.max(1, Math.floor(daysUntilCutoff / 30))

    // First payment: $199 + $150 processing fee
    schedule.push({
      date: today.toISOString(),
      amount_cents: monthlyPayment + processingFee,
      description: 'First monthly payment ($199 + $150 processing fee)',
      payment_number: 1,
      total_payments: monthsAvailable + 1 // monthly payments + final lump sum
    })

    let totalPaidSoFar = monthlyPayment + processingFee

    // Monthly $199 payments (excluding first payment which we already added)
    for (let i = 1; i < monthsAvailable; i++) {
      const paymentDate = new Date(today)
      paymentDate.setMonth(paymentDate.getMonth() + i)

      schedule.push({
        date: paymentDate.toISOString(),
        amount_cents: monthlyPayment,
        description: `Monthly payment ${i + 1} of ${monthsAvailable}`,
        payment_number: i + 1,
        total_payments: monthsAvailable + 1
      })

      totalPaidSoFar += monthlyPayment
    }

    // Final lump sum payment at 60-day cutoff
    const finalLumpSum = base_cents - totalPaidSoFar

    schedule.push({
      date: cutoffDate.toISOString(),
      amount_cents: finalLumpSum,
      description: `Final balance due 60 days before event`,
      payment_number: monthsAvailable + 1,
      total_payments: monthsAvailable + 1
    })
  } else if (plan === 'full') {
    // Full payment: Single payment today
    schedule.push({
      date: today.toISOString(),
      amount_cents: result.amount_cents,
      description: 'Full payment',
      payment_number: 1,
      total_payments: 1
    })
  }

  return schedule
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
