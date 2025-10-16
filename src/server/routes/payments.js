/**
 * Payments Router - Stripe Checkout Session Creation
 * Handles payment processing for Love & Photos bookings
 */

import express from 'express'
import Stripe from 'stripe'
import { computePayable, formatCurrency, generatePaymentSchedule } from '../payments/compute.js'
import {
  getBookingById,
  markBookingPaymentIntent,
  validateBookingAccess,
  createPaymentRecord
,
  supabase
} from '../db.js'
import { sendPaymentConfirmationEmail } from '../services/emailService.js'

const router = express.Router()

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
})

// CreateCheckoutSessionRequest shape:
// {
//   bookingId: string,
//   plan?: 'full' | 'deposit' | 'monthly',
//   userEmail?: string
// }

/**
 * POST /api/payments/checkout-session
 * Creates a Stripe Checkout Session for a booking
 */
router.post('/checkout-session', async (req, res) => {
  try {
    const { bookingId, plan = 'full', userEmail, userId } = req.body

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        error: 'Missing required field: bookingId'
      })
    }

    // Validate booking access and get booking data
    const validation = await validateBookingAccess(bookingId, { userEmail, userId })
    if (!validation.valid) {
      return res.status(validation.error === 'Booking not found' ? 404 : 403).json({
        error: validation.error
      })
    }

    const booking = validation.booking
    const customerEmail = validation.email || userEmail || undefined

    // Calculate payment amount using compute logic
    const paymentCalculation = computePayable(booking, plan)

    if (!Number.isFinite(paymentCalculation.amount_cents) || paymentCalculation.amount_cents <= 0) {
      return res.status(400).json({
        error: 'Invalid payment amount calculated for booking'
      })
    }

    // Create line items for Stripe checkout
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Photography Service',
            description: `Event date: ${new Date(booking.event_date).toLocaleDateString()}`,
            metadata: {
              booking_id: bookingId,
              photographer_id: booking.photographer_id
            }
          },
          unit_amount: paymentCalculation.base_cents
        },
        quantity: 1
      }
    ]

    // Add late fee as separate line item if applicable
    if (paymentCalculation.late_fee_cents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Late Booking Fee',
            description: 'Additional fee for bookings within 30 days of event'
          },
          unit_amount: paymentCalculation.late_fee_cents
        },
        quantity: 1
      })
    }

    // Generate idempotency key for Stripe request
    const idempotencyKey = `${bookingId}-${plan}-checkout`

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.SITE_URL}/booking/${bookingId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/booking/${booking.photographer_id}/contract`,
      metadata: {
        bookingId,
        plan,
        amount_base_cents: paymentCalculation.base_cents.toString(),
        late_fee_cents: paymentCalculation.late_fee_cents.toString(),
        late_fee_applied: (paymentCalculation.late_fee_cents > 0).toString(),
        wedding_date: booking.event_date,
        days_until_event: paymentCalculation.daysOut?.toString() || '0'
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingId,
          payment_plan: plan,
          late_fee_applied: (paymentCalculation.late_fee_cents > 0).toString(),
          wedding_date: booking.event_date,
          days_until_event: paymentCalculation.daysOut?.toString() || '0'
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    }, {
      idempotencyKey
    })

    // Store checkout session ID and late fee tracking data in booking for audit trail
    const updateSuccess = await markBookingPaymentIntent(bookingId, {
      checkout_session_id: session.id,
      payment_plan: paymentCalculation.planUsed,
      late_fee_applied: paymentCalculation.late_fee_cents > 0,
      days_until_event: paymentCalculation.daysOut
    })

    if (!updateSuccess) {
      console.error('Failed to update booking with checkout session ID')
      // Continue anyway - payment can still be processed
    }

    // Create payment record for tracking (disabled - payments table doesn't exist yet)
    // await createPaymentRecord({
    //   booking_id: bookingId,
    //   stripe_session_id: session.id,
    //   amount_cents: paymentCalculation.amount_cents,
    //   currency: 'usd',
    //   payment_plan: paymentCalculation.planUsed,
    //   status: 'pending'
    // })

    // Return checkout session URL to frontend
    res.json({
      url: session.url,
      sessionId: session.id,
      amount: paymentCalculation.amount_cents,
      breakdown: {
        base: formatCurrency(paymentCalculation.base_cents),
        lateFee: paymentCalculation.late_fee_cents > 0 ? formatCurrency(paymentCalculation.late_fee_cents) : null,
        total: formatCurrency(paymentCalculation.amount_cents),
        plan: paymentCalculation.planUsed
      }
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: 'Payment processing error',
        details: error.message
      })
    }

    res.status(500).json({
      error: 'Internal server error during payment setup'
    })
  }
})

/**
 * GET /api/payments/session/:sessionId
 * Retrieves checkout session details for verification
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    res.json({
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      metadata: session.metadata
    })

  } catch (error) {
    console.error('Error retrieving session:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(404).json({
        error: 'Session not found'
      })
    }

    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * POST /api/payments/create-payment-intent
 * Creates a Payment Intent for direct card payment processing with idempotency
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { bookingId, plan = 'full', userEmail, userId } = req.body

    console.log('💳 Creating payment intent for booking:', bookingId)
    console.log('Payment plan:', plan)
    console.log('User email:', userEmail)

    // Validate required fields
    if (!bookingId) {
      console.error('❌ No booking ID provided')
      return res.status(400).json({
        error: 'Missing required field: bookingId'
      })
    }

    // Validate booking access and get booking data
    const validation = await validateBookingAccess(bookingId, { userEmail, userId })
    if (!validation.valid) {
      console.error('❌ Booking validation failed:', validation.error)
      console.error('Booking ID:', bookingId)
      return res.status(validation.error === 'Booking not found' ? 404 : 403).json({
        error: validation.error
      })
    }

    const booking = validation.booking
    const customerEmail = validation.email || userEmail || undefined

    // Calculate payment amount using compute logic
    const paymentCalculation = computePayable(booking, plan)

    console.log('💰 Payment calculation result:', {
      amount_cents: paymentCalculation.amount_cents,
      base_cents: paymentCalculation.base_cents,
      late_fee_cents: paymentCalculation.late_fee_cents,
      processing_fee_cents: paymentCalculation.processing_fee_cents,
      plan_used: paymentCalculation.planUsed,
      package_total_cents: booking.package_total_cents
    })

    if (!Number.isFinite(paymentCalculation.amount_cents) || paymentCalculation.amount_cents <= 0) {
      console.error('❌ CRITICAL: Invalid payment calculation:', {
        paymentCalculation,
        booking: {
          id: booking.id,
          package_total_cents: booking.package_total_cents,
          package_type: booking.package_type,
          event_date: booking.event_date
        }
      })
      return res.status(400).json({
        error: 'Invalid payment amount calculated for booking',
        details: booking.package_total_cents ?
          'Payment calculation resulted in invalid amount. Please contact support.' :
          'Package pricing is missing. Please restart your booking from the schedule step.'
      })
    }

    // Create idempotency key based on booking ID, plan, pricing, and timestamp
    // This ensures each payment intent creation is unique when users switch between plans
    // v3: adds timestamp to avoid idempotency conflicts when switching payment options
    const pricingHash = `${paymentCalculation.base_cents}_${paymentCalculation.late_fee_cents}`
    const timestamp = Date.now()
    const idempotencyKey = `payment_intent_${bookingId}_${plan}_${pricingHash}_${timestamp}_v3`

    console.log('🔑 Idempotency key:', idempotencyKey)

    // Check if we already have a payment intent for this booking
    let paymentIntent = null

    // First, check if booking already has a payment intent ID stored
    if (booking.stripe_payment_intent_id) {
      console.log('📦 Found existing payment intent ID in booking:', booking.stripe_payment_intent_id)

      try {
        // Retrieve existing payment intent from Stripe
        const existingIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)

        // Check if the existing intent is still valid and matches our requirements
        const hasMatchingMetadata = existingIntent.metadata.late_fee_applied !== undefined &&
                                    existingIntent.metadata.wedding_date !== undefined &&
                                    existingIntent.metadata.days_until_event !== undefined

        if (existingIntent &&
            existingIntent.status !== 'canceled' &&
            existingIntent.status !== 'succeeded' &&
            existingIntent.amount === paymentCalculation.amount_cents &&
            existingIntent.metadata.payment_plan === paymentCalculation.planUsed) {

          // Update metadata if it's missing the new fields
          if (!hasMatchingMetadata) {
            console.log('🔄 Updating payment intent metadata with late fee tracking fields')
            paymentIntent = await stripe.paymentIntents.update(existingIntent.id, {
              metadata: {
                ...existingIntent.metadata,
                late_fee_applied: (paymentCalculation.late_fee_cents > 0).toString(),
                wedding_date: booking.event_date,
                days_until_event: paymentCalculation.daysOut?.toString() || '0'
              }
            })
            console.log('✅ Updated existing payment intent:', paymentIntent.id)
          } else {
            console.log('✅ Reusing existing valid payment intent:', existingIntent.id)
            paymentIntent = existingIntent
          }
        } else {
          console.log('⚠️ Existing payment intent is invalid or doesn\'t match requirements')
          console.log('Intent status:', existingIntent.status)
          console.log('Intent amount:', existingIntent.amount, 'vs required:', paymentCalculation.amount_cents)

          // If the old intent is not succeeded, cancel it to avoid confusion
          if (existingIntent.status !== 'succeeded' && existingIntent.status !== 'canceled') {
            try {
              await stripe.paymentIntents.cancel(existingIntent.id)
              console.log('🚫 Canceled old payment intent:', existingIntent.id)
            } catch (cancelError) {
              console.error('Failed to cancel old payment intent:', cancelError)
            }
          }
        }
      } catch (retrieveError) {
        console.error('Error retrieving existing payment intent:', retrieveError)
        // Intent doesn't exist or is invalid, we'll create a new one
      }
    }

    // Create new Payment Intent if we don't have a valid existing one
    if (!paymentIntent) {
      console.log('🆕 Creating new payment intent with idempotency key')

      // Validate amount before creating payment intent
      if (!paymentCalculation.amount_cents || paymentCalculation.amount_cents <= 0) {
        console.error('❌ CRITICAL: Cannot create payment intent with invalid amount:', {
          amount_cents: paymentCalculation.amount_cents,
          bookingId,
          package_total_cents: booking.package_total_cents,
          package_type: booking.package_type
        })
        return res.status(400).json({
          error: 'Invalid payment amount',
          details: 'Package pricing is missing or invalid. Please contact support.'
        })
      }

      // Generate payment schedule for metadata
      const paymentSchedule = generatePaymentSchedule(booking, plan)

      // Convert payment schedule to metadata (Stripe metadata must be strings)
      const scheduleMetadata = {}
      paymentSchedule.forEach((payment, index) => {
        scheduleMetadata[`payment_${index + 1}_date`] = payment.date
        scheduleMetadata[`payment_${index + 1}_amount`] = payment.amount_cents.toString()
        scheduleMetadata[`payment_${index + 1}_description`] = payment.description
      })

      // Log payment calculation for transparency
      console.log('💰 Payment Intent Calculation:', {
        bookingId,
        plan,
        amount_due_today: (paymentCalculation.amount_cents / 100).toFixed(2),
        base_amount: (paymentCalculation.base_cents / 100).toFixed(2),
        late_fee: (paymentCalculation.late_fee_cents / 100).toFixed(2),
        processing_fee: (paymentCalculation.processing_fee_cents / 100).toFixed(2),
        payment_plan: paymentCalculation.planUsed,
        months_until_cutoff: paymentCalculation.monthsUntilCutoff
      })

      paymentIntent = await stripe.paymentIntents.create({
        amount: paymentCalculation.amount_cents,
        currency: 'usd',
        metadata: {
          booking_id: bookingId,
          payment_plan: paymentCalculation.planUsed,
          photographer_id: booking.photographer_id,
          package_name: booking.package_type || 'Unknown',
          package_price: booking.package_total_cents ? (booking.package_total_cents / 100).toString() : '0',
          amount_due_today: (paymentCalculation.amount_cents / 100).toString(), // Amount charged today
          base_amount: (paymentCalculation.base_cents / 100).toString(),
          late_fee: (paymentCalculation.late_fee_cents / 100).toString(),
          processing_fee: (paymentCalculation.processing_fee_cents / 100).toString(),
          months_until_cutoff: paymentCalculation.monthsUntilCutoff.toString(),
          days_until_cutoff: paymentCalculation.daysUntilCutoff.toString(),
          total_payments: paymentSchedule.length.toString(),
          ...scheduleMetadata
        },
        description: `Photography service for event on ${new Date(booking.event_date).toLocaleDateString()}`,
        receipt_email: customerEmail,
        // Add automatic payment methods for better UX
        automatic_payment_methods: {
          enabled: true,
        }
      }, {
        idempotencyKey // Use idempotency key to prevent duplicate creation
      })

      console.log('✨ New payment intent created:', paymentIntent.id, '| Amount: $' + (paymentCalculation.amount_cents / 100).toFixed(2))

      // Store payment intent ID in booking for future reference
      const updateSuccess = await markBookingPaymentIntent(bookingId, {
        payment_intent_id: paymentIntent.id,
        payment_plan: paymentCalculation.planUsed,
        payment_status: 'pending'
      })

      if (!updateSuccess) {
        console.error('⚠️ Failed to update booking with payment intent ID, but continuing')
      }
    }

    // Return client secret to frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentCalculation.amount_cents,
      paymentIntentId: paymentIntent.id,
      breakdown: {
        base: formatCurrency(paymentCalculation.base_cents),
        lateFee: paymentCalculation.late_fee_cents > 0 ? formatCurrency(paymentCalculation.late_fee_cents) : null,
        total: formatCurrency(paymentCalculation.amount_cents),
        plan: paymentCalculation.planUsed
      }
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      // Check if it's an idempotency error (payment intent already exists)
      if (error.code === 'idempotency_key_in_use') {
        console.log('ℹ️ Idempotency key already used, this is expected for retries')
        // This is actually OK - it means we're preventing duplicates
        // Try to retrieve the existing payment intent
        // Note: In production, you'd want to store and retrieve this mapping
        return res.status(400).json({
          error: 'Payment already in progress. Please refresh and try again.'
        })
      }

      return res.status(400).json({
        error: 'Payment processing error',
        details: error.message
      })
    }

    res.status(500).json({
      error: 'Internal server error during payment setup'
    })
  }
})

/**
 * POST /api/payments/verify-intent
 * Verifies payment intent status for redirect-based confirmations
 */
router.post('/verify-intent', async (req, res) => {
  try {
    const { paymentIntentId, bookingId, userId } = req.body

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Missing payment intent ID'
      })
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      const bookingIdForEmail = paymentIntent.metadata?.booking_id || bookingId

      // Update booking payment status in database
      if (bookingIdForEmail) {
        try {
          console.log(`✅ Updating booking ${bookingIdForEmail} payment status to 'paid'`)

          const { data: updatedBooking, error: updateError } = await supabase
            .from('bookings')
            .update({
              payment_status: 'paid',
              stripe_payment_intent_id: paymentIntent.id,
              payment_updated_at: new Date().toISOString()
            })
            .eq('id', bookingIdForEmail)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Error updating booking payment status:', updateError)
            // Don't fail the request - payment succeeded, log error for monitoring
          } else {
            console.log('✅ Booking payment status updated successfully:', updatedBooking)
          }
        } catch (dbError) {
          console.error('❌ Database error updating payment status:', dbError)
          // Don't fail the request - payment succeeded, log error for monitoring
        }

        // Trigger confirmation email (non-blocking)
        sendPaymentConfirmationEmail({
          bookingId: bookingIdForEmail,
          paymentIntentId: paymentIntent.id,
          amountPaid: paymentIntent.amount,
          paymentPlan: paymentIntent.metadata?.payment_plan || 'full'
        }).catch(err => {
          console.error('📧 Email send error (non-blocking):', err)
        })
      }

      // Payment was successful
      res.json({
        status: 'succeeded',
        paymentDetails: {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || null
        },
        amount: paymentIntent.amount,
        receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || null,
        bookingId: bookingIdForEmail
      })
    } else if (paymentIntent.status === 'requires_payment_method') {
      // Payment failed and needs retry
      res.json({
        status: 'requires_payment_method',
        message: 'Payment requires additional authentication or was declined'
      })
    } else {
      // Other status (processing, requires_action, etc.)
      res.json({
        status: paymentIntent.status,
        message: 'Payment is still being processed'
      })
    }

  } catch (error) {
    console.error('Error verifying payment intent:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: 'Unable to verify payment',
        message: error.message
      })
    }

    res.status(500).json({
      error: 'Failed to verify payment intent'
    })
  }
})

/**
 * POST /api/payments/confirm-payment
 * Confirms payment completion and updates booking status
 */
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        error: 'Missing required fields'
      })
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not successful',
        status: paymentIntent.status
      })
    }

    // Update payment record (disabled - payments table doesn't exist yet)
    // await createPaymentRecord({
    //   booking_id: bookingId,
    //   stripe_payment_intent_id: paymentIntentId,
    //   amount_cents: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   payment_plan: paymentIntent.metadata.payment_plan,
    //   status: 'succeeded'
    // })

    res.json({
      success: true,
      amount: paymentIntent.amount,
      receipt_email: paymentIntent.receipt_email,
      payment_status: paymentIntent.status
    })

  } catch (error) {
    console.error('Error confirming payment:', error)

    res.status(500).json({
      error: 'Failed to confirm payment'
    })
  }
})

/**
 * POST /api/payments/create-addon-payment
 * Creates a Payment Intent for add-on purchases on existing bookings
 */
router.post('/create-addon-payment', async (req, res) => {
  try {
    const { bookingId, addons, totalAmount, userEmail, userId } = req.body

    console.log('🛒 Creating add-on payment intent for booking:', bookingId)
    console.log('Add-ons:', addons)
    console.log('Total amount (cents):', totalAmount)

    // Validate required fields
    if (!bookingId || !addons || addons.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId and addons'
      })
    }

    // Validate booking access
    const validation = await validateBookingAccess(bookingId, { userEmail, userId })
    if (!validation.valid) {
      console.error('❌ Booking validation failed:', validation.error)
      return res.status(validation.error === 'Booking not found' ? 404 : 403).json({
        error: validation.error
      })
    }

    const booking = validation.booking
    const customerEmail = validation.email || userEmail || undefined

    // Validate amount
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid total amount'
      })
    }

    // Create idempotency key
    const addonIds = addons.map(a => a.id).sort().join('_')
    const idempotencyKey = `addon_payment_${bookingId}_${addonIds}_${totalAmount}`

    console.log('🔑 Idempotency key:', idempotencyKey)

    // Create Payment Intent for add-ons
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        booking_id: bookingId,
        payment_type: 'addons',
        photographer_id: booking.photographer_id,
        addon_count: addons.length.toString(),
        addon_items: JSON.stringify(addons.map(a => ({ id: a.id, name: a.name, qty: a.qty || 1 })))
      },
      description: `Add-ons for booking ${bookingId}`,
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      }
    }, {
      idempotencyKey
    })

    console.log('✨ Add-on payment intent created:', paymentIntent.id, '| Amount: $' + (totalAmount / 100).toFixed(2))

    // Look up addon UUIDs from codes and insert into booking_addons table
    const addonInserts = []
    for (const addon of addons) {
      // Look up addon UUID from code
      const { data: addonData, error: addonError } = await supabase
        .from('addons')
        .select('id, price_cents')
        .eq('code', addon.id)
        .single()

      if (addonError || !addonData) {
        console.error(`❌ Could not find addon with code: ${addon.id}`, addonError)
        continue
      }

      // Insert into booking_addons
      const quantity = addon.qty || 1
      const unitPrice = addon.price
      const totalPrice = unitPrice * quantity

      addonInserts.push({
        booking_id: bookingId,
        addon_id: addonData.id,
        quantity: quantity,
        unit_price_cents: unitPrice,
        total_price_cents: totalPrice,
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
      })
    }

    // Batch insert all add-ons
    if (addonInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('booking_addons')
        .insert(addonInserts)

      if (insertError) {
        console.error('❌ Error inserting booking add-ons:', insertError)
        // Continue anyway - payment intent was created
      } else {
        console.log(`✅ Inserted ${addonInserts.length} add-ons into booking_addons table`)
      }
    }

    // Return client secret to frontend
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount
    })

  } catch (error) {
    console.error('Error creating add-on payment intent:', error)

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: 'Payment processing error',
        details: error.message
      })
    }

    res.status(500).json({
      error: 'Internal server error during payment setup'
    })
  }
})

/**
 * GET /api/payments/health
 * Health check for payment service
 */
router.get('/health', async (req, res) => {
  try {
    // Test Stripe connection
    await stripe.customers.list({ limit: 1 })

    res.json({
      status: 'healthy',
      stripe: 'connected',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Payment service health check failed:', error)

    res.status(503).json({
      status: 'unhealthy',
      stripe: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
