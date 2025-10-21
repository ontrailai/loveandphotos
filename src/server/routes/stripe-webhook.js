/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment completion
 */

import express from 'express'
import Stripe from 'stripe'
import { markBookingPaid, getBookingBySessionId, supabase } from '../db.js'
import { sendPhotographerBookingNotification } from '../services/emailService.js'

const router = express.Router()

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
})

// Webhook endpoint secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 *
 * IMPORTANT: This endpoint must use express.raw middleware for signature verification
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({
      error: 'Webhook signature verification failed'
    })
  }

  console.log(`Received Stripe webhook: ${event.type}`)

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook event:', error)
    res.status(500).json({
      error: 'Internal server error processing webhook'
    })
  }
})

/**
 * Handles successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session) {
  console.log(`Processing checkout.session.completed: ${session.id}`)

  // Support both camelCase and snake_case for backward compatibility
  const bookingId = session.metadata?.bookingId || session.metadata?.booking_id
  if (!bookingId) {
    console.error('No bookingId or booking_id found in session metadata:', session.metadata)
    return
  }

  // Mark booking as paid in database
  const paymentData = {
    amount_paid_cents: session.amount_total || 0,
    currency: session.currency || 'usd',
    plan: session.metadata?.plan || 'full',
    status: 'paid',
    payment_intent_id: session.payment_intent
  }

  const success = await markBookingPaid(bookingId, paymentData)

  if (success) {
    console.log(`Booking ${bookingId} marked as paid successfully`)

    // Send photographer notification email
    try {
      // Fetch booking details with photographer and customer info
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          event_date,
          event_time,
          venue_name,
          venue_address,
          package_type,
          total_amount,
          customer:users!bookings_customer_id_fkey (
            id,
            full_name,
            email
          ),
          photographer:photographers!bookings_photographer_id_fkey (
            id,
            user_id,
            users (
              full_name,
              email
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError || !booking) {
        console.error('Failed to fetch booking details for photographer notification:', bookingError)
      } else if (booking.photographer?.users?.email) {
        // Extract photographer details
        const photographerFullName = booking.photographer.users.full_name || 'Photographer'
        const photographerFirstName = photographerFullName.split(' ')[0]
        const photographerEmail = booking.photographer.users.email

        // Extract event location
        let eventLocation = booking.venue_name || 'Location TBD'
        if (!eventLocation && booking.venue_address) {
          if (typeof booking.venue_address === 'object') {
            eventLocation = booking.venue_address.address || booking.venue_address.city || 'Location TBD'
          }
        }

        // Send photographer notification
        await sendPhotographerBookingNotification({
          bookingId,
          photographerEmail,
          photographerFirstName,
          customerFullName: booking.customer?.full_name || 'Customer',
          eventDate: booking.event_date,
          eventTime: booking.event_time,
          eventLocation,
          packageType: booking.package_type || 'Photography Package',
          packagePrice: Number(booking.total_amount) || 0
        })
      }
    } catch (emailError) {
      console.error('Error sending photographer notification:', emailError)
      // Don't fail the webhook - email failures should not block payment processing
    }

  } else {
    console.error(`Failed to mark booking ${bookingId} as paid`)
  }
}

/**
 * Handles successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`Payment intent succeeded: ${paymentIntent.id}`)

  // Additional processing if needed
  // This is called after checkout.session.completed for most payments

  const bookingId = paymentIntent.metadata?.booking_id
  if (!bookingId) {
    console.error('No booking_id found in payment intent metadata')
    return
  }

  console.log(`Payment confirmed for booking: ${bookingId}`)

  // Update booking status to confirmed
  const paymentData = {
    amount_paid_cents: paymentIntent.amount || 0,
    currency: paymentIntent.currency || 'usd',
    plan: paymentIntent.metadata?.payment_plan || 'full',
    status: 'paid',
    payment_intent_id: paymentIntent.id
  }

  const success = await markBookingPaid(bookingId, paymentData)

  if (success) {
    console.log(`✅ Booking ${bookingId} marked as paid successfully via payment_intent.succeeded`)

    // Send confirmation email (non-blocking)
    sendPaymentConfirmationEmail({
      bookingId,
      paymentIntentId: paymentIntent.id,
      amountPaid: paymentIntent.amount,
      paymentPlan: paymentIntent.metadata?.payment_plan || 'full'
    }).catch(err => {
      console.error('📧 Email send error (non-blocking):', err)
    })
  } else {
    console.error(`❌ Failed to mark booking ${bookingId} as paid`)
  }
}

/**
 * Handles expired checkout sessions
 */
async function handleCheckoutSessionExpired(session) {
  console.log(`Checkout session expired: ${session.id}`)

  const bookingId = session.metadata?.bookingId
  if (bookingId) {
    // Optionally update booking status to indicate payment window expired
    console.log(`Payment window expired for booking: ${bookingId}`)

    // TODO: Send reminder email to customer
    // TODO: Update booking status to 'payment_expired'
  }
}

/**
 * Handles failed payment attempts
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`Payment intent failed: ${paymentIntent.id}`)

  const bookingId = paymentIntent.metadata?.booking_id
  if (bookingId) {
    console.log(`Payment failed for booking: ${bookingId}`)

    // TODO: Send payment failure notification
    // TODO: Update booking status to 'payment_failed'
    // TODO: Provide retry mechanism
  }
}

/**
 * GET /api/stripe/webhook/health
 * Health check for webhook endpoint
 */
router.get('/webhook/health', (req, res) => {
  res.json({
    status: 'healthy',
    webhook_endpoint: '/api/stripe/webhook',
    required_env: {
      stripe_secret_key: !!process.env.STRIPE_SECRET_KEY,
      webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET
    },
    timestamp: new Date().toISOString()
  })
})

export default router