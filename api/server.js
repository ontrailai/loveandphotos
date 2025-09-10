/**
 * Local API Server for Development
 * Provides mock endpoints when Stripe/Supabase are not configured
 */

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConfigured = {
    stripe: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('sk_test_your'),
    supabase: !!process.env.SUPABASE_SERVICE_KEY,
    resend: !!process.env.RESEND_API_KEY
  }

  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    configured: isConfigured,
    services: {
      stripe: isConfigured.stripe ? 'configured' : 'mock mode',
      supabase: isConfigured.supabase ? 'configured' : 'mock mode',
      email: isConfigured.resend ? 'configured' : 'mock mode'
    }
  })
})

// Mock Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  const { 
    customerEmail, 
    amount, 
    eventDate,
    photographerId,
    packageId,
    successUrl,
    cancelUrl 
  } = req.body

  console.log('📝 Creating checkout session:', { customerEmail, amount, eventDate })

  // Check if Stripe is configured
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('sk_test_your')) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Photography Service',
              description: `Event date: ${eventDate}`
            },
            unit_amount: Math.round(amount * 100) // Convert to cents
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: successUrl || 'http://localhost:5173/booking/confirm?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: cancelUrl || 'http://localhost:5173/browse',
        customer_email: customerEmail,
        metadata: {
          photographerId,
          packageId,
          eventDate
        }
      })

      return res.json({ 
        id: session.id,
        url: session.url 
      })
    } catch (error) {
      console.error('Stripe error:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // Mock response for development
  const mockSessionId = `cs_test_mock_${Date.now()}`
  res.json({
    id: mockSessionId,
    url: `http://localhost:5173/booking/confirm?session_id=${mockSessionId}&mock=true`
  })
})

// Verify payment session
app.get('/api/verify-payment', async (req, res) => {
  const { session_id } = req.query

  console.log('🔍 Verifying payment session:', session_id)

  // Check if this is a mock session
  if (session_id?.startsWith('cs_test_mock_')) {
    return res.json({
      success: true,
      session: {
        id: session_id,
        payment_status: 'paid',
        metadata: {
          mock: true,
          timestamp: new Date().toISOString()
        }
      }
    })
  }

  // Real Stripe verification
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('sk_test_your')) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      
      const session = await stripe.checkout.sessions.retrieve(session_id)
      
      return res.json({
        success: session.payment_status === 'paid',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          metadata: session.metadata
        }
      })
    } catch (error) {
      console.error('Stripe verification error:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  res.status(400).json({ error: 'Invalid session ID' })
})

// Mock email sending
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text } = req.body

  console.log('📧 Mock email sent:', { to, subject })

  // If Resend is configured, actually send the email
  if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('re_test')) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'LoveP <noreply@lovep.app>',
          to: [to],
          subject,
          html,
          text
        })
      })

      const data = await response.json()
      return res.json({ success: true, id: data.id })
    } catch (error) {
      console.error('Email send error:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // Mock response
  res.json({
    success: true,
    id: `mock_email_${Date.now()}`,
    message: 'Email sent (mock mode)'
  })
})

// Mock Stripe Connect onboarding
app.post('/api/create-connect-onboarding', (req, res) => {
  const { accountId, refreshUrl, returnUrl } = req.body

  console.log('🏦 Creating Connect onboarding link:', { accountId })

  res.json({
    url: returnUrl || 'http://localhost:5173/photographer/onboarding?step=stripe'
  })
})

// Mock file upload
app.post('/api/upload', (req, res) => {
  console.log('📁 Mock file upload')

  res.json({
    success: true,
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    path: 'mock/upload/path.jpg'
  })
})

// Webhook endpoint for Stripe
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  console.log('🪝 Stripe webhook received')
  res.json({ received: true })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/create-checkout-session',
      'GET /api/verify-payment',
      'POST /api/send-email',
      'POST /api/create-connect-onboarding',
      'POST /api/upload',
      'POST /api/webhooks/stripe'
    ]
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 LoveP API Server Running                        ║
║                                                       ║
║   URL: http://localhost:${PORT}                       ║
║   Mode: ${process.env.NODE_ENV || 'development'}                              ║
║                                                       ║
║   Endpoints:                                         ║
║   - GET  /api/health                                 ║
║   - POST /api/create-checkout-session                ║
║   - GET  /api/verify-payment                        ║
║   - POST /api/send-email                            ║
║                                                       ║
║   Check /api/health for configuration status         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)
})

export default app
