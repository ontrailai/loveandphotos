/**
 * Supabase Database Helpers for Payment Processing
 * Server-side database operations for booking and payment management
 */

import dotenv from 'dotenv'
dotenv.config()

import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// BookingRecord shape:
// {
//   id: string,
//   customer_email: string,
//   event_date: string,
//   package_total_cents: number,
//   upsells_total_cents?: number,
//   photographer_id: string,
//   status: string,
//   created_at: string,
//   checkout_session_id?: string,
//   payment_intent_id?: string,
//   amount_paid_cents?: number,
//   payment_status?: 'pending' | 'paid' | 'failed' | 'refunded',
//   payment_plan?: 'full' | 'deposit' | 'monthly',
//   currency?: string,
//   paid_at?: string
// }

/**
 * Retrieves booking by ID with required payment information
 *
 * @param bookingId - The booking ID to fetch
 * @returns Booking record or null if not found
 */
export async function getBookingById(bookingId) {
  console.log('🔍 Fetching booking with ID:', bookingId)

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_id,
      event_date,
      total_amount,
      personalization_data,
      photographer_id,
      booking_status,
      payment_status,
      stripe_session_id,
      stripe_payment_intent_id,
      deposit_amount,
      final_amount,
      payment_schedule,
      payment_plan,
      created_at,
      updated_at
    `)
    .eq('id', bookingId)
    .single()

  if (error) {
    console.error('❌ Error fetching booking:', error)
    console.error('Booking ID attempted:', bookingId)
    return null
  }

  console.log('✅ Booking found:', data?.id)
  return data
}

/**
 * Updates booking with Stripe checkout session ID for audit trail
 *
 * @param bookingId - The booking ID to update
 * @param sessionData - Checkout session data
 * @returns Success boolean
 */
export async function markBookingPaymentIntent(bookingId, sessionData = {}) {
  const updatePayload = {
    updated_at: new Date().toISOString()
  }

  const checkoutSessionId = sessionData.checkout_session_id || sessionData.stripe_session_id
  if (checkoutSessionId) {
    updatePayload.stripe_session_id = checkoutSessionId
    updatePayload.payment_status = sessionData.payment_status || 'pending'
  }

  const paymentIntentId = sessionData.payment_intent_id || sessionData.stripe_payment_intent_id
  if (paymentIntentId) {
    updatePayload.stripe_payment_intent_id = paymentIntentId
    if (sessionData.payment_status) {
      updatePayload.payment_status = sessionData.payment_status
    }
  }

  // Save payment_schedule if provided (from generatePaymentSchedule)
  if (sessionData.payment_schedule) {
    updatePayload.payment_schedule = sessionData.payment_schedule
  }

  // Save late fee tracking data if provided
  if (sessionData.late_fee_applied !== undefined) {
    updatePayload.late_fee_applied = sessionData.late_fee_applied
  }

  if (sessionData.days_until_event !== undefined) {
    updatePayload.days_until_event = sessionData.days_until_event
  }

  if (Object.keys(updatePayload).length === 1) {
    // Nothing to update besides timestamp
    return true
  }

  const { error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking with payment intent data:', error)
    return false
  }

  return true
}

/**
 * Marks booking as paid after successful Stripe payment
 *
 * @param bookingId - The booking ID to update
 * @param paymentData - Payment completion data from Stripe
 * @returns Success boolean
 */
export async function markBookingPaid(bookingId, paymentData) {
  // First, fetch the current booking to get existing payment_schedule
  const booking = await getBookingById(bookingId)
  if (!booking) {
    console.error('Booking not found:', bookingId)
    return false
  }

  // Get current payment_schedule or initialize as empty array
  const currentSchedule = Array.isArray(booking.payment_schedule) ? booking.payment_schedule : []

  // Calculate the amount paid
  const amountPaid = typeof paymentData.amount_paid_cents === 'number'
    ? paymentData.amount_paid_cents / 100
    : typeof paymentData.amount_cents === 'number'
      ? paymentData.amount_cents / 100
      : paymentData.final_amount ?? 0

  // Create a new payment record to add to the schedule
  const newPayment = {
    amount: amountPaid.toString(),
    status: 'paid',
    due_date: new Date().toISOString(),
    paid_at: new Date().toISOString(),
    payment_intent_id: paymentData.payment_intent_id || paymentData.stripe_payment_intent_id || null,
    description: paymentData.description || `Payment #${currentSchedule.filter(p => p.status === 'paid').length + 1}`
  }

  // Add the new payment to the schedule
  const updatedSchedule = [...currentSchedule, newPayment]

  const updatePayload = {
    payment_status: paymentData.status || 'paid',
    stripe_payment_intent_id: paymentData.payment_intent_id || paymentData.stripe_payment_intent_id || null,
    final_amount: amountPaid,
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payment_schedule: updatedSchedule
  }

  const { error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', bookingId)

  if (error) {
    console.error('Error marking booking as paid:', error)
    return false
  }

  console.log(`✅ Updated payment_schedule for booking ${bookingId}, added payment of ${amountPaid}`)
  return true
}

/**
 * Retrieves booking by checkout session ID for webhook processing
 *
 * @param sessionId - Stripe checkout session ID
 * @returns Booking record or null if not found
 */
export async function getBookingBySessionId(sessionId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('checkout_session_id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching booking by session ID:', error)
    return null
  }

  return data
}

/**
 * Validates that a booking exists and belongs to the specified user
 *
 * @param bookingId - The booking ID to validate
 * @param userEmail - Email to validate ownership (optional)
 * @returns Validation result
 */
function extractStoredEmail(booking) {
  const personalization = booking.personalization_data || {}

  const possibleEmails = [
    personalization.account?.email,
    personalization.accountDetails?.email,
    personalization.account_details?.email,
    personalization.customer?.email,
    personalization.account?.contact?.email
  ]

  return possibleEmails.find((email) => typeof email === 'string' && email.trim().length > 0) || null
}

export async function validateBookingAccess(bookingId, options = {}) {
  const { userEmail, userId } = options
  const booking = await getBookingById(bookingId)

  if (!booking) {
    return { valid: false, error: 'Booking not found' }
  }

  if (userId && booking.customer_id && booking.customer_id !== userId) {
    return { valid: false, error: 'Access denied' }
  }

  const storedEmail = extractStoredEmail(booking)

  if (userEmail && storedEmail) {
    if (storedEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
      return { valid: false, error: 'Access denied' }
    }
  }

  if (userEmail && !storedEmail) {
    // Enrich personalization data with the email for future access checks
    try {
      const personalization = booking.personalization_data || {}
      const updatedPersonalization = {
        ...personalization,
        account: {
          ...(personalization.account || {}),
          email: userEmail.trim(),
          user_id: personalization.account?.user_id || booking.customer_id || null,
          updated_at: new Date().toISOString()
        }
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          personalization_data: updatedPersonalization,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (!error) {
        booking.personalization_data = updatedPersonalization
      } else {
        console.warn('⚠️ Failed to backfill booking email:', error)
      }
    } catch (error) {
      console.warn('⚠️ Error enriching booking personalization data:', error)
    }
  }

  // Check if booking is in a valid state for payment
  // For installment plans, allow multiple payments until fully paid
  if (booking.payment_status === 'paid') {
    // Calculate remaining balance from payment_schedule
    const paymentSchedule = Array.isArray(booking.payment_schedule) ? booking.payment_schedule : []
    const totalPaid = paymentSchedule
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

    const totalDue = booking.final_amount || booking.calculated_amount || 0
    const remainingBalance = totalDue - totalPaid

    // Only block if fully paid (no remaining balance)
    if (remainingBalance <= 0) {
      return { valid: false, error: 'Booking already paid in full' }
    }
  }

  return { valid: true, booking, email: storedEmail || (userEmail ? userEmail.trim() : null) }
}

/**
 * Creates a payment record for audit/tracking purposes
 *
 * @param paymentData - Payment transaction data
 * @returns Payment record ID or null if failed
 */
export async function createPaymentRecord(paymentData) {
  const record = {
    booking_id: paymentData.booking_id,
    stripe_session_id: paymentData.checkout_session_id || paymentData.stripe_session_id || null,
    amount_cents: paymentData.amount_cents,
    currency: paymentData.currency,
    payment_plan: paymentData.payment_plan,
    stripe_payment_intent_id: paymentData.stripe_payment_intent_id || paymentData.payment_intent_id || null,
    status: paymentData.status,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([record])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating payment record:', error)
    return null
  }

  return data?.id || null
}

/**
 * Health check for database connectivity
 *
 * @returns Database connection status
 */
export async function databaseHealthCheck() {
  try {
    const { error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1)

    if (error) {
      return { healthy: false, error: error.message }
    }

    return { healthy: true }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    }
  }
}

// Export supabase client for direct use in routes
export { supabase }
