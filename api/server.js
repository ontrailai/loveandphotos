/**
 * Local API Server for Development
 * Provides mock endpoints when Stripe/Supabase are not configured
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { checkRateLimit, normalizeError, auditLog } from '../src/lib/async/withTimeout.js'
import {
  verifyBookingOwnership,
  verifyContractHash,
  storeContractSignature,
  contractServiceHealthCheck
} from '../src/lib/async/contractService.js'

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production' || process.env.PORT

// Middleware
if (!isProduction) {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }))
} else {
  // Production CORS configuration
  app.use(cors({
    origin: true,
    credentials: true
  }))
}

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')))
}

// 2MB payload limit for contract signatures
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Health check endpoint with contract service status
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

// Contract signing endpoint with bulletproof security and reliability
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
      userId // Should come from authentication middleware in production
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
    // Step 1: Verify booking ownership and get booking details
    // Note: In production, userId should come from JWT authentication middleware
    if (!userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required for contract signing'
      })
    }
    const bookingData = await verifyBookingOwnership(bookingId, userId)

    // Step 2: Verify contract hash matches server version
    await verifyContractHash(contractHash, contractVersion, bookingData)

    // Step 3: Store signature with full audit trail
    const signatureData = {
      bookingId,
      contractVersion,
      contractHash,
      eventDate: eventDate || bookingData.event_date,
      location: location || bookingData.location,
      packageName: packageName || bookingData.packages?.name || 'Custom Package',
      price: price || bookingData.total_amount,
      signerFullName,
      signaturePngBase64,
      signedAtISO: signedAtISO || new Date().toISOString()
    }

    const contractSignatureId = await storeContractSignature(signatureData, clientIp)

    // Success response with full audit trail
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

    // Return appropriate error response based on error type
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

// Contract status endpoint - get signature details by ID
app.get('/api/contract/status/:signatureId', async (req, res) => {
  const { signatureId } = req.params

  try {
    console.log('📋 Contract status request for:', signatureId)

    // Check if we're in mock mode
    const isSupabaseConfigured = !!process.env.SUPABASE_SERVICE_KEY

    if (!isSupabaseConfigured) {
      // Mock response
      if (signatureId.startsWith('cs_mock_')) {
        return res.json({
          success: true,
          signature: {
            id: signatureId,
            booking_id: 'mock-booking-id',
            contract_version: '1.0',
            event_date: '2024-06-15',
            location: 'Mock Location',
            package_name: 'Mock Package',
            price: 299.99,
            signer_full_name: 'Mock Signer',
            signed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          message: 'Contract signature found (mock mode)'
        })
      } else {
        return res.status(404).json({
          success: false,
          error: 'Contract signature not found',
          code: 'SIGNATURE_NOT_FOUND'
        })
      }
    }

    // Production mode with Supabase
    const { getContractSignature } = await import('../src/lib/async/contractService.js')
    const signature = await getContractSignature(signatureId)

    res.json({
      success: true,
      signature,
      message: 'Contract signature found'
    })

  } catch (error) {
    const normalizedError = normalizeError(error, 'Failed to retrieve contract signature')

    console.error('❌ Contract status error:', normalizedError)

    const statusCode = normalizedError.status || 500
    res.status(statusCode).json({
      success: false,
      error: normalizedError.message,
      code: normalizedError.code,
      timestamp: new Date().toISOString()
    })
  }
})

// 404 handler for API routes
app.use('/api/*', (req, res) => {
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
      'POST /api/webhooks/stripe',
      'POST /api/contract/sign',
      'GET /api/contract/status/:signatureId'
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

// Catch-all route for client-side routing in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 LoveP API Server Running                        ║
║                                                       ║
║   URL: http://localhost:${PORT}                       ║
║   Mode: ${isProduction ? 'production' : 'development'}                       ║
║                                                       ║
║   Endpoints:                                         ║
║   - GET  /api/health                                 ║
║   - POST /api/create-checkout-session                ║
║   - GET  /api/verify-payment                        ║
║   - POST /api/send-email                            ║
║   - POST /api/contract/sign                         ║
║   - GET  /api/contract/status/:id                   ║
║                                                       ║
║   Check /api/health for configuration status         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)

  // Validate required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = [
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_URL'
    ]

    const missing = requiredEnvVars.filter(key => !process.env[key])

    if (missing.length > 0) {
      console.error(`
╔═══════════════════════════════════════════════════════╗
║  ❌ STARTUP FAILED - Missing Environment Variables    ║
║                                                       ║
║  Missing: ${missing.join(', ')}                    ║
║                                                       ║
║  Please configure these in your Render dashboard:    ║
║  - SUPABASE_SERVICE_KEY (service role key)          ║
║  - SUPABASE_URL (project URL)                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `)
      process.exit(1)
    }

    console.log(`
╔═══════════════════════════════════════════════════════╗
║  ✅ Environment Validation Passed                     ║
║                                                       ║
║  ✓ SUPABASE_SERVICE_KEY configured                   ║
║  ✓ SUPABASE_URL configured                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `)
  }
})

export default app
