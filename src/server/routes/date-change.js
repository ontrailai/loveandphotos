/**
 * Date Change Router - Handles $495 post-booking date change feature
 * Includes Stripe checkout session creation and date update logic
 */

import express from 'express'
import Stripe from 'stripe'
import { supabase } from '../db.js'
import { sendDateChangeNotification } from '../services/emailService.js'

const router = express.Router()

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20'
})

/**
 * POST /api/bookings/date-change-checkout
 * Creates a Stripe Checkout Session for $495 date change payment
 */
router.post('/date-change-checkout', async (req, res) => {
  try {
    const { bookingId } = req.body

    // Validate required fields
    if (!bookingId) {
      return res.status(400).json({
        error: 'Missing required field: bookingId'
      })
    }

    // Get booking and verify eligibility
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, event_date, can_change_date, date_change_used, photographers(users(email, full_name))')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({
        error: 'Booking not found'
      })
    }

    // Check if already has date change permission
    if (booking.can_change_date) {
      return res.status(400).json({
        error: 'You already have date change flexibility'
      })
    }

    // Check if already used date change
    if (booking.date_change_used) {
      return res.status(400).json({
        error: 'Date change has already been used for this booking'
      })
    }

    // Get the correct site URL for redirects
    const siteUrl = process.env.VITE_APP_URL ||
                    process.env.SITE_URL ||
                    (process.env.NODE_ENV === 'production'
                      ? 'https://loveandphotos.onrender.com'
                      : 'http://localhost:5173')

    // Create Stripe Checkout Session for $495
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Change Shoot Date',
              description: `One-time date change for booking #${bookingId.substring(0, 8)}`,
              metadata: {
                booking_id: bookingId,
                type: 'date-change-addon'
              }
            },
            unit_amount: 49500 // $495.00 in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${siteUrl}/booking/${bookingId}/change-date/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard`,
      metadata: {
        bookingId,
        type: 'date-change-addon',
        amount_cents: '49500'
      },
      payment_intent_data: {
        metadata: {
          booking_id: bookingId,
          type: 'date-change-addon'
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    })

    // Return checkout session URL to frontend
    res.json({
      url: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Error creating date change checkout session:', error)

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
 * POST /api/bookings/:id/update-date
 * Updates booking date after successful $495 payment
 */
router.post('/:id/update-date', async (req, res) => {
  try {
    const { id } = req.params
    const { newDate, sessionId } = req.body

    if (!newDate || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: newDate, sessionId'
      })
    }

    // Verify Stripe payment session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'Payment not completed'
      })
    }

    if (session.metadata.bookingId !== id) {
      return res.status(400).json({
        error: 'Session does not match booking'
      })
    }

    // Get current booking with customer and photographer details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        event_date,
        can_change_date,
        date_change_used,
        customer_id,
        photographer_id,
        customers:users!bookings_customer_id_fkey (
          email,
          full_name
        ),
        photographers (
          id,
          users!inner (
            email,
            full_name
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return res.status(404).json({
        error: 'Booking not found'
      })
    }

    // Validate date change hasn't been used
    if (booking.date_change_used) {
      return res.status(400).json({
        error: 'Date change has already been used'
      })
    }

    const oldDate = booking.event_date

    // Update booking with new date and date change flags
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        event_date: newDate,
        can_change_date: true,
        date_change_used: true,
        date_change_method: 'post-booking-add-on',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return res.status(500).json({
        error: 'Failed to update booking date'
      })
    }

    // Send email notifications to customer and photographer
    const emailResult = await sendDateChangeNotification({
      bookingId: id,
      oldDate,
      newDate,
      customerEmail: booking.customers?.email || '',
      customerName: booking.customers?.full_name || 'Valued Customer',
      photographerEmail: booking.photographers?.users?.email || '',
      photographerName: booking.photographers?.users?.full_name?.split(' ')[0] || 'Photographer'
    })

    if (!emailResult.success) {
      console.error('⚠️ Email notifications failed, but booking was updated:', emailResult.error)
      // Continue anyway - booking update succeeded
    }

    res.json({
      success: true,
      message: 'Booking date updated successfully',
      oldDate,
      newDate,
      emailsSent: emailResult.success
    })

  } catch (error) {
    console.error('Error updating booking date:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
