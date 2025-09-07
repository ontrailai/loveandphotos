// API Route Handler for Stripe and other backend services
// This should be deployed as serverless functions (Vercel, Netlify Functions, or Supabase Edge Functions)

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

// Create checkout session
export async function createCheckoutSession(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    customerId,
    photographerId,
    packageId,
    eventDate,
    amount,
    paymentType,
    customerEmail,
    metadata,
    successUrl,
    cancelUrl
  } = req.body

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Photography Service',
              description: `Event date: ${eventDate}`,
              metadata: {
                photographerId,
                packageId,
                eventDate
              }
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: paymentType === 'deposit' ? 'payment' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        customerId,
        photographerId,
        packageId,
        eventDate,
        paymentType
      },
      payment_intent_data: {
        metadata: {
          ...metadata,
          customerId,
          photographerId
        }
      }
    })

    res.status(200).json({ 
      id: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe session error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Verify payment session
export async function verifyPayment(req, res) {
  const { session_id } = req.query

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent', 'customer']
    })

    res.status(200).json({
      success: session.payment_status === 'paid',
      session,
      metadata: session.metadata
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Webhook handler
export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      // Update booking status in database
      await updateBookingStatus(session.metadata.bookingId, 'confirmed', {
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        payment_status: 'paid'
      })
      break

    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object
      // Update booking status to failed
      await updateBookingStatus(paymentIntent.metadata.bookingId, 'payment_failed')
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.status(200).json({ received: true })
}

// Helper function to update booking status
async function updateBookingStatus(bookingId, status, additionalData = {}) {
  // Import your Supabase client here
  const { createClient } = require('@supabase/supabase-js')
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { error } = await supabase
    .from('bookings')
    .update({
      booking_status: status,
      ...additionalData,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking status:', error)
    throw error
  }
}

// Create Connect account for photographer
export async function createConnectAccount(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, country = 'US' } = req.body

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    res.status(200).json({ accountId: account.id })
  } catch (error) {
    console.error('Connect account creation error:', error)
    res.status(500).json({ error: error.message })
  }
}

// Create onboarding link for Connect
export async function createConnectOnboarding(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accountId, refreshUrl, returnUrl } = req.body

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    res.status(200).json({ url: accountLink.url })
  } catch (error) {
    console.error('Onboarding link creation error:', error)
    res.status(500).json({ error: error.message })
  }
}
