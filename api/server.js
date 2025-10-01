// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

/**
 * Local API Server for Development
 * Provides mock endpoints when Stripe/Supabase are not configured
 */

import express from 'express'
import cors from 'cors'
import { checkRateLimit, normalizeError, auditLog } from '../src/lib/async/withTimeout.js'
import {
  verifyBookingOwnership,
  verifyContractHash,
  storeContractSignature,
  contractServiceHealthCheck
} from '../src/lib/async/contractService.js'

// Import new payment routes (after environment variables are loaded)
import paymentsRouter from '../src/server/routes/payments.js'
import stripeWebhookRouter from '../src/server/routes/stripe-webhook.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

// Mount Stripe webhook route BEFORE json middleware (needs raw body)
app.use('/api/stripe', stripeWebhookRouter)

// 2MB payload limit for contract signatures
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Mount payment routes (after json middleware)
app.use('/api/payments', paymentsRouter)

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

// Booking creation endpoint
app.post('/api/booking/create', async (req, res) => {
  const startTime = Date.now()

  try {
    console.log('📅 Creating new booking...')
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2))

    const {
      customerId,
      photographerId,
      packageDetails,
      scheduleDetails,
      locationDetails,
      addonsDetails,
      totalAmount,
      accountDetails = {},
      eventType = 'photoshoot'
    } = req.body

    // Comprehensive field validation with detailed error messages
    const missingFields = []
    if (!customerId) missingFields.push('customerId')
    if (!photographerId) missingFields.push('photographerId')
    if (!scheduleDetails?.date) missingFields.push('scheduleDetails.date')
    if (!totalAmount && totalAmount !== 0) missingFields.push('totalAmount')

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields)
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields',
        code: 'MISSING_REQUIRED_FIELDS',
        missing: missingFields,
        received: {
          hasCustomerId: !!customerId,
          hasPhotographerId: !!photographerId,
          hasScheduleDate: !!scheduleDetails?.date,
          hasTotalAmount: totalAmount !== undefined
        }
      })
    }

    console.log('✅ All required fields present')
    console.log(`🔍 Looking up photographer with user_id: ${photographerId}`)

    // Import Supabase client
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

    // Look up the actual photographer ID from the user_id
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('id')
      .eq('user_id', photographerId)
      .single()

    if (photographerError) {
      console.error('❌ Photographer lookup error:', photographerError)
      return res.status(404).json({
        success: false,
        message: 'Photographer not found',
        code: 'PHOTOGRAPHER_NOT_FOUND',
        details: photographerError.message,
        photographerUserId: photographerId
      })
    }

    if (!photographer) {
      console.error('❌ No photographer found with user_id:', photographerId)
      return res.status(404).json({
        success: false,
        message: 'Photographer not found',
        code: 'PHOTOGRAPHER_NOT_FOUND',
        photographerUserId: photographerId
      })
    }

    // Use the actual photographer ID for the booking
    const actualPhotographerId = photographer.id
    console.log(`✅ Found photographer: ${actualPhotographerId}`)

    // Ensure customer exists in users table (auth.users → public.users)
    console.log(`🔍 Checking if customer exists in users table: ${customerId}`)
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', customerId)
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('❌ Error checking user existence:', userCheckError)
    }

    if (!existingUser) {
      console.log('⚠️  Customer not found in users table, creating user record...')
      const { error: insertUserError } = await supabase
        .from('users')
        .insert({
          id: customerId,
          email: accountDetails?.email || null,
          full_name: accountDetails?.fullName || null,
          phone: accountDetails?.phone || null,
          role: 'customer',
          created_at: new Date().toISOString()
        })

      if (insertUserError) {
        console.error('❌ Failed to create user record:', insertUserError)
        return res.status(500).json({
          success: false,
          message: 'Failed to create user record in database',
          code: 'USER_CREATION_FAILED',
          details: insertUserError.message
        })
      }
      console.log('✅ User record created successfully')
    } else {
      console.log('✅ Customer already exists in users table')
    }

    // Convert amounts to cents for consistent storage
    const packagePriceCents = Math.round((packageDetails?.packagePrice || 0) * 100)
    const addonsTotalCents = Math.round((addonsDetails?.totalAddonsPrice || 0) * 100)
    const totalAmountNumber = Number(totalAmount) || 0
    const totalAmountCents = Math.round(totalAmountNumber * 100)
    const pricingSummary = {
      package_price_cents: packagePriceCents,
      addons_price_cents: addonsTotalCents,
      total_amount_cents: totalAmountCents
    }

    const accountSnapshot = {
      user_id: customerId,
      email: accountDetails?.email || null,
      full_name: accountDetails?.fullName || null,
      phone: accountDetails?.phone || null,
      captured_at: new Date().toISOString()
    }

    // Create booking record
    const bookingData = {
      customer_id: customerId,
      photographer_id: actualPhotographerId,
      event_date: scheduleDetails.date,
      event_time: (() => {
        const timeOfDay = scheduleDetails.timeOfDay
        if (!timeOfDay) return '10:00'
        switch (timeOfDay) {
          case 'morning': return '09:00'
          case 'afternoon': return '14:00'
          case 'evening': return '18:00'
          default: return '10:00'
        }
      })(),
      event_type: eventType,
      venue_name: locationDetails?.locationTitle || 'TBD',
      venue_address: locationDetails ? {
        title: locationDetails.locationTitle,
        vibe: locationDetails.locationVibe
      } : null,
      total_amount: totalAmountNumber,
      package_total_cents: packagePriceCents, // Store package price in cents for compute.js
      package_type: packageDetails?.packageType || null, // Store tier name (Bronze/Silver/Gold/Platinum)
      payment_status: 'pending',
      booking_status: 'pending',
      contract_signed: false,
      personalization_data: {
        package: packageDetails,
        addons: addonsDetails?.selectedAddons || [],
        session_info: {
          hours_booked: packageDetails?.hoursBooked || 2,
          is_photo_video: packageDetails?.isPhotoVideo || false
        },
        pricing_summary: pricingSummary,
        account: accountSnapshot
      }
    }

    console.log('💾 Attempting to insert booking with data:', {
      customer_id: bookingData.customer_id,
      photographer_id: bookingData.photographer_id,
      event_date: bookingData.event_date,
      total_amount: bookingData.total_amount
    })

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('id, created_at')
      .single()

    if (error) {
      console.error('❌ Booking creation failed:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error details:', error.details)
      console.error('❌ Error hint:', error.hint)

      // Return appropriate status codes based on error type
      const statusCode = error.code === '23503' ? 400 : // Foreign key violation
                        error.code === '23505' ? 409 : // Unique constraint violation
                        error.code === '42501' ? 403 : // RLS policy violation
                        500

      return res.status(statusCode).json({
        success: false,
        message: 'Failed to create booking',
        code: 'BOOKING_CREATION_FAILED',
        details: error.message,
        hint: error.hint,
        errorCode: error.code,
        bookingData: {
          customer_id: bookingData.customer_id,
          photographer_id: bookingData.photographer_id,
          event_date: bookingData.event_date
        }
      })
    }

    console.log('✅ Booking created successfully:', booking.id)
    console.log(`⏱️  Processing time: ${Date.now() - startTime}ms`)

    res.json({
      success: true,
      bookingId: booking.id,
      createdAt: booking.created_at,
      processingTime: Date.now() - startTime
    })

  } catch (error) {
    console.error('❌ Booking creation error:', error)
    console.error('❌ Error stack:', error.stack)

    res.status(500).json({
      success: false,
      message: 'Internal server error during booking creation',
      code: 'INTERNAL_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/payments/checkout-session',
      'GET /api/payments/session/:sessionId',
      'GET /api/payments/health',
      'POST /api/stripe/webhook',
      'GET /api/stripe/webhook/health',
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
║   - POST /api/auth/check-email                       ║
║   - POST /api/booking/create                         ║
║   - POST /api/payments/create-payment-intent         ║
║   - POST /api/payments/confirm-payment               ║
║   - POST /api/payments/checkout-session              ║
║   - GET  /api/payments/session/:sessionId            ║
║   - POST /api/stripe/webhook                         ║
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
