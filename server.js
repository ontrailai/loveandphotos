// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

/**
 * Production Server for Love & Photos
 * Serves both the React app and API endpoints
 */

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import { checkRateLimit, normalizeError, auditLog } from './src/lib/async/withTimeout.js'
import {
  verifyBookingOwnership,
  verifyContractHash,
  storeContractSignature,
  contractServiceHealthCheck
} from './src/lib/async/contractService.js'

// Import payment and date change routes
import paymentsRouter from './src/server/routes/payments.js'
import stripeWebhookRouter from './src/server/routes/stripe-webhook.js'
import dateChangeRouter from './src/server/routes/date-change.js'
import talentRouter from './src/server/routes/talent.js'
import bookingsRouter from './src/server/routes/bookings.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 10000

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://love-and-photos.onrender.com']
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}))

// Mount Stripe webhook route BEFORE json middleware (needs raw body)
app.use('/api/stripe', stripeWebhookRouter)

// 2MB payload limit for contract signatures
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Mount payment and date change routes
app.use('/api/payments', paymentsRouter)
app.use('/api/bookings', dateChangeRouter)
app.use('/api/booking', bookingsRouter)
app.use('/api/talent', talentRouter)

// Authentication endpoints
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'EMAIL_REQUIRED',
        message: 'Email is required'
      })
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_SERVICE_KEY) {
      // In development mode without Supabase, simulate email check
      const testEmails = ['test@example.com', 'admin@test.com']
      return res.json({
        exists: testEmails.includes(email.toLowerCase()),
        message: 'Email check completed (development mode)'
      })
    }

    // Import Supabase only if configured
    const { createClient } = await import('@supabase/supabase-js')
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

    // Check if user exists with this email
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error('Error checking email:', error)
      return res.status(500).json({
        error: 'EMAIL_CHECK_FAILED',
        message: 'Failed to check email'
      })
    }

    const userExists = data.users.some(user => user.email === email)

    res.json({
      exists: userExists,
      message: userExists ? 'User found' : 'User not found'
    })

  } catch (error) {
    console.error('Email check error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    })
  }
})

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isConfigured = {
    stripe: !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('sk_test_your'),
    supabase: !!process.env.SUPABASE_SERVICE_KEY,
    resend: !!process.env.RESEND_API_KEY
  }

  let contractServiceStatus = { status: 'mock mode' }
  if (isConfigured.supabase) {
    try {
      contractServiceStatus = await contractServiceHealthCheck()
    } catch (error) {
      contractServiceStatus = { status: 'unhealthy', error: error.message }
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    configured: isConfigured,
    services: {
      stripe: isConfigured.stripe ? 'configured' : 'mock mode',
      supabase: isConfigured.supabase ? 'configured' : 'mock mode',
      email: isConfigured.resend ? 'configured' : 'mock mode',
      contractSigning: contractServiceStatus.status
    },
    contractService: contractServiceStatus
  })
})

// Booking routes moved to ./src/server/routes/bookings.js
// See bookingsRouter mounted at /api/booking

// Contract signing endpoint
app.post('/api/contract/sign', async (req, res) => {
  const startTime = Date.now()

  // Get client IP for rate limiting and audit
  const clientIp = req.headers['x-forwarded-for'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : '127.0.0.1')

  try {
    console.log('📋 Contract signature submission received from', clientIp)

    // Rate limiting: max 5 requests per minute per IP
    const rateLimit = checkRateLimit(clientIp, 5, 60000)
    if (!rateLimit.allowed) {
      auditLog('RATE_LIMIT_EXCEEDED', { ip: clientIp, retryAfter: rateLimit.retryAfter }, clientIp)

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many contract signing attempts. Try again in ${rateLimit.retryAfter} seconds.`,
        retryAfter: rateLimit.retryAfter,
        code: 'RATE_LIMIT_EXCEEDED'
      })
    }

    // Extract and validate request data
    const {
      bookingId,
      contractVersion,
      contractHash,
      eventDate,
      location,
      packageName,
      price,
      signerFullName,
      signaturePngBase64,
      signedAtISO,
      userId
    } = req.body

    // Validate required fields
    const requiredFields = ['bookingId', 'contractVersion', 'contractHash', 'signaturePngBase64']
    const missingFields = requiredFields.filter(field => !req.body[field])

    if (missingFields.length > 0) {
      auditLog('VALIDATION_ERROR', { missingFields, bookingId }, clientIp)

      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: requiredFields,
        missing: missingFields,
        code: 'MISSING_REQUIRED_FIELDS'
      })
    }

    // Validate signature format and size
    if (!signaturePngBase64.startsWith('data:image/png;base64,')) {
      auditLog('VALIDATION_ERROR', { error: 'Invalid signature format', bookingId }, clientIp)

      return res.status(400).json({
        success: false,
        error: 'Invalid signature format (must be PNG base64)',
        code: 'INVALID_SIGNATURE_FORMAT'
      })
    }

    const signatureSize = Buffer.byteLength(signaturePngBase64, 'base64')
    if (signatureSize > 2 * 1024 * 1024) {
      auditLog('VALIDATION_ERROR', { error: 'Signature too large', size: signatureSize, bookingId }, clientIp)

      return res.status(400).json({
        success: false,
        error: 'Signature image too large (max 2MB)',
        actualSize: Math.round(signatureSize / 1024) + 'KB',
        code: 'SIGNATURE_TOO_LARGE'
      })
    }

    // Check if we're in mock mode or have Supabase configured
    const isSupabaseConfigured = !!process.env.SUPABASE_SERVICE_KEY

    if (!isSupabaseConfigured) {
      // Mock mode - simulate the full workflow
      console.log('📋 Mock mode: Contract signature data:', {
        bookingId,
        contractVersion,
        eventDate,
        location,
        packageName,
        price,
        signerName: signerFullName || 'Anonymous',
        signatureSize: `${Math.round(signatureSize / 1024)}KB`,
        clientIp,
        signedAt: signedAtISO
      })

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const contractSignatureId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      auditLog('CONTRACT_SIGNED_MOCK', {
        signatureId: contractSignatureId,
        bookingId,
        contractVersion,
        processingTime: Date.now() - startTime
      }, clientIp)

      return res.json({
        success: true,
        contractSignatureId,
        message: 'Contract signature recorded successfully (mock mode)',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        metadata: {
          contractVersion,
          bookingId,
          signedAt: signedAtISO,
          mode: 'mock'
        }
      })
    }

    // Production mode with full Supabase integration
    if (!userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required for contract signing'
      })
    }

    const bookingData = await verifyBookingOwnership(bookingId, userId)
    await verifyContractHash(contractHash, contractVersion, bookingData)

    const signatureData = {
      bookingId,
      contractVersion,
      contractHash,
      eventDate: eventDate || bookingData.event_date,
      location: location || bookingData.venue_name || '',
      venue_name: bookingData.venue_name,
      venue_address: bookingData.venue_address,
      packageName: packageName || bookingData.packages?.title || 'Custom Package',
      price: price || bookingData.total_amount,
      signerFullName,
      signaturePngBase64,
      signedAtISO: signedAtISO || new Date().toISOString()
    }

    const contractSignatureId = await storeContractSignature(signatureData, clientIp)

    auditLog('CONTRACT_SIGNED_SUCCESS', {
      signatureId: contractSignatureId,
      bookingId,
      contractVersion,
      processingTime: Date.now() - startTime
    }, clientIp)

    res.json({
      success: true,
      contractSignatureId,
      message: 'Contract signature recorded successfully',
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      metadata: {
        contractVersion,
        bookingId,
        signedAt: signatureData.signedAtISO,
        eventDate: signatureData.eventDate,
        location: signatureData.location
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const normalizedError = normalizeError(error, 'Contract signing failed')

    console.error('❌ Contract signing error:', normalizedError)

    auditLog('CONTRACT_SIGNING_ERROR', {
      error: normalizedError.message,
      code: normalizedError.code,
      processingTime,
      bookingId: req.body?.bookingId
    }, clientIp)

    const statusCode = normalizedError.status || 500

    res.status(statusCode).json({
      success: false,
      error: normalizedError.message,
      code: normalizedError.code,
      timestamp: new Date().toISOString(),
      processingTime,
      ...(process.env.NODE_ENV === 'development' && {
        details: normalizedError.details,
        stack: normalizedError.stack
      })
    })
  }
})

// Additional API endpoints (simplified versions for production)
app.post('/api/create-checkout-session', async (req, res) => {
  const { customerEmail, amount, eventDate, photographerId, packageId, successUrl, cancelUrl } = req.body

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
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: successUrl || `${process.env.BASE_URL || 'http://localhost:5173'}/booking/confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.BASE_URL || 'http://localhost:5173'}/browse`,
        customer_email: customerEmail,
        metadata: { photographerId, packageId, eventDate }
      })

      return res.json({ id: session.id, url: session.url })
    } catch (error) {
      console.error('Stripe error:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // Mock response for development
  const mockSessionId = `cs_test_mock_${Date.now()}`
  res.json({
    id: mockSessionId,
    url: `${process.env.BASE_URL || 'http://localhost:5173'}/booking/confirm?session_id=${mockSessionId}&mock=true`
  })
})

app.get('/api/verify-payment', async (req, res) => {
  const { session_id } = req.query

  if (session_id?.startsWith('cs_test_mock_')) {
    return res.json({
      success: true,
      session: {
        id: session_id,
        payment_status: 'paid',
        metadata: { mock: true, timestamp: new Date().toISOString() }
      }
    })
  }

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

app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, text } = req.body

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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')))

// Handle all other routes by serving the index.html (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Love & Photos Server Running                    ║
║                                                       ║
║   URL: http://localhost:${PORT}                     ║
║   Mode: ${process.env.NODE_ENV || 'development'}                              ║
║                                                       ║
║   Static Files: /dist                                ║
║   API Base: /api                                     ║
║                                                       ║
║   Health Check: /api/health                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)

  // Validate required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = ['SUPABASE_SERVICE_KEY', 'SUPABASE_URL']
    const missing = requiredEnvVars.filter(key => !process.env[key])

    if (missing.length > 0) {
      console.error(`
╔═══════════════════════════════════════════════════════╗
║  ⚠️  Missing Environment Variables                     ║
║                                                       ║
║  Missing: ${missing.join(', ')}                    ║
║                                                       ║
║  Please configure these in your Render dashboard     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `)
    }
  }
})

export default app