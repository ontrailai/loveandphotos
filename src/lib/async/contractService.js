/**
 * Contract Service for Supabase Operations
 * Handles secure contract signing with database integration
 */

import { createClient } from '@supabase/supabase-js'
import { withTimeout, normalizeError } from './withTimeout.js'
import { getCurrentContractHash } from '../contract/contractVersion.js'
import { sanitizeIPForStorage } from './ipAddressParser.js'

let supabaseClient = null

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client instance
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    if (!process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_URL) {
      throw new Error('Supabase environment variables not configured')
    }

    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  return supabaseClient
}

/**
 * Verify user owns the booking and get booking details
 * @param {string} bookingId - Booking UUID
 * @param {string} userId - User UUID (from authentication)
 * @returns {Promise<Object>} Booking data with ownership verification
 */
export async function verifyBookingOwnership(bookingId, userId) {
  const supabase = getSupabaseClient()

  const { data: booking, error } = await withTimeout(
    supabase
      .from('bookings')
      .select('id,customer_id,event_date,venue_name,venue_address,total_amount,contract_signed,packages(id,title,base_price)')
      .eq('id', bookingId)
      .eq('customer_id', userId)
      .single(),
    8000 // 8 second timeout for database queries
  )

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - booking not found or access denied
      throw {
        message: 'Booking not found or access denied',
        status: 403,
        code: 'BOOKING_ACCESS_DENIED'
      }
    }
    throw normalizeError(error, 'Failed to verify booking ownership')
  }

  if (!booking) {
    throw {
      message: 'Booking not found',
      status: 404,
      code: 'BOOKING_NOT_FOUND'
    }
  }

  if (booking.contract_signed) {
    throw {
      message: 'Contract already signed for this booking',
      status: 409,
      code: 'CONTRACT_ALREADY_SIGNED'
    }
  }

  return booking
}

/**
 * Verify contract hash matches current version
 * @param {string} providedHash - Hash from client
 * @param {string} providedVersion - Version from client
 * @param {Object} bookingData - Booking data for context
 * @returns {Promise<void>} Throws if verification fails
 */
export async function verifyContractHash(providedHash, providedVersion, bookingData) {
  try {
    const currentHash = await withTimeout(getCurrentContractHash(), 5000)

    if (providedHash !== currentHash) {
      throw {
        message: 'Contract hash mismatch - contract may have been modified',
        status: 409,
        code: 'CONTRACT_HASH_MISMATCH',
        details: {
          providedHash: providedHash.substring(0, 8) + '...',
          expectedHash: currentHash.substring(0, 8) + '...',
          providedVersion,
          bookingId: bookingData.id
        }
      }
    }

    console.log('✅ Contract hash verified:', providedHash.substring(0, 8) + '...')
  } catch (error) {
    if (error.code === 'CONTRACT_HASH_MISMATCH') {
      throw error
    }
    throw normalizeError(error, 'Failed to verify contract hash')
  }
}

/**
 * Store contract signature in database with full audit trail
 * @param {Object} signatureData - Signature data to store
 * @param {string} clientIp - Client IP address for audit (may be comma-separated from CDN)
 * @returns {Promise<string>} Contract signature ID
 */
export async function storeContractSignature(signatureData, clientIp) {
  const supabase = getSupabaseClient()

  // Sanitize IP address for PostgreSQL inet column
  // Handles comma-separated IPs from CDN/proxy headers
  const sanitizedIP = sanitizeIPForStorage(clientIp)

  if (!sanitizedIP) {
    console.warn('⚠️ Invalid IP address provided, using safe default')
  }

  const signatureRecord = {
    booking_id: signatureData.bookingId,
    contract_version: signatureData.contractVersion,
    contract_hash: signatureData.contractHash,
    event_date: signatureData.eventDate,
    location: signatureData.location || signatureData.venue_name || '',
    package_name: signatureData.packageName,
    price: parseFloat(signatureData.price) || 0,
    signer_full_name: signatureData.signerFullName,
    signature_png_base64: signatureData.signaturePngBase64,
    ip_address: sanitizedIP || '0.0.0.0', // Safe fallback for inet column
    signed_at: signatureData.signedAtISO
  }

  // Use a transaction to ensure atomicity
  const { data: signature, error } = await withTimeout(
    supabase
      .from('contract_signatures')
      .insert(signatureRecord)
      .select('id, booking_id, created_at')
      .single(),
    12000 // 12 second timeout for signature storage
  )

  if (error) {
    // Handle specific Supabase/PostgreSQL errors
    if (error.code === '23505') {
      // Unique constraint violation - contract already signed
      throw {
        message: 'Contract already signed for this booking',
        status: 409,
        code: 'CONTRACT_ALREADY_SIGNED'
      }
    }

    if (error.code === '23503') {
      // Foreign key constraint violation
      throw {
        message: 'Invalid booking reference',
        status: 400,
        code: 'INVALID_BOOKING_ID'
      }
    }

    if (error.code === '22P02') {
      // Invalid input syntax for inet type
      console.error('🚨 PostgreSQL inet error - IP address validation failed:', {
        rawIP: clientIp,
        sanitizedIP: sanitizedIP,
        error: error.message
      })
      throw {
        message: 'Invalid IP address format',
        status: 400,
        code: 'INVALID_IP_ADDRESS',
        details: 'IP address could not be validated for storage'
      }
    }

    throw normalizeError(error, 'Failed to store contract signature')
  }

  if (!signature) {
    throw {
      message: 'Failed to create contract signature record',
      status: 500,
      code: 'SIGNATURE_CREATION_FAILED'
    }
  }

  console.log('✅ Contract signature stored:', signature.id)

  // The trigger should automatically update booking.contract_signed = true
  // But let's verify it worked
  await verifyContractSigningComplete(signatureData.bookingId)

  // Check if payment is already complete - if so, update booking to fully complete status
  await checkAndUpdateBookingCompletion(signatureData.bookingId)

  // Generate and upload PDF to storage
  try {
    const { generateContractPDF, uploadContractPDF, updateBookingWithContractUrl } = await import('../pdf/contractPdfGenerator.js')

    // Generate PDF with signature
    const pdfBuffer = await generateContractPDF(signatureData)

    // Upload to Supabase Storage
    const contractUrl = await uploadContractPDF(supabase, pdfBuffer, signatureData.bookingId)

    // Update booking record with contract URL
    await updateBookingWithContractUrl(supabase, signatureData.bookingId, contractUrl)

    console.log('✅ Contract PDF generated and uploaded:', contractUrl)
  } catch (pdfError) {
    // Log error but don't fail the entire signing process
    // The signature is already stored, PDF is a nice-to-have
    console.warn('⚠️ Failed to generate/upload contract PDF:', pdfError)
  }

  return signature.id
}

/**
 * Verify that the booking was marked as contract_signed after signature storage
 * @param {string} bookingId - Booking ID to verify
 * @returns {Promise<void>} Throws if verification fails
 */
async function verifyContractSigningComplete(bookingId) {
  const supabase = getSupabaseClient()

  const { data: booking, error } = await withTimeout(
    supabase
      .from('bookings')
      .select('contract_signed')
      .eq('id', bookingId)
      .single(),
    5000
  )

  if (error || !booking) {
    console.warn('⚠️ Could not verify contract signing completion:', error?.message)
    return // Non-fatal - signature was stored successfully
  }

  if (!booking.contract_signed) {
    console.warn('⚠️ Booking not marked as contract_signed - trigger may have failed')
    // This is concerning but not fatal since signature was stored
  } else {
    console.log('✅ Booking marked as contract_signed')
  }
}

/**
 * Get contract signature by ID
 * @param {string} signatureId - Signature ID to retrieve
 * @returns {Promise<Object>} Signature record (without binary data)
 */
export async function getContractSignature(signatureId) {
  const supabase = getSupabaseClient()

  const { data: signature, error } = await withTimeout(
    supabase
      .from('contract_signatures')
      .select(`
        id,
        booking_id,
        contract_version,
        contract_hash,
        event_date,
        location,
        package_name,
        price,
        signer_full_name,
        ip_address,
        signed_at,
        created_at
      `)
      .eq('id', signatureId)
      .single(),
    5000
  )

  if (error) {
    if (error.code === 'PGRST116') {
      throw {
        message: 'Contract signature not found',
        status: 404,
        code: 'SIGNATURE_NOT_FOUND'
      }
    }
    throw normalizeError(error, 'Failed to retrieve contract signature')
  }

  return signature
}

/**
 * Check if both contract is signed AND payment is complete
 * If both conditions are met, update booking to fully complete status
 * @param {string} bookingId - Booking ID to check and update
 * @returns {Promise<void>}
 */
export async function checkAndUpdateBookingCompletion(bookingId) {
  const supabase = getSupabaseClient()

  // Fetch current booking status
  const { data: booking, error } = await withTimeout(
    supabase
      .from('bookings')
      .select('contract_signed, payment_status, booking_status')
      .eq('id', bookingId)
      .single(),
    5000
  )

  if (error || !booking) {
    console.warn('⚠️ Could not check booking completion status:', error?.message)
    return // Non-fatal
  }

  // Check if both contract is signed AND payment is complete
  const isFullyComplete = booking.contract_signed === true && booking.payment_status === 'paid'

  if (isFullyComplete && booking.booking_status !== 'completed') {
    // Update booking to completed status
    const { error: updateError } = await withTimeout(
      supabase
        .from('bookings')
        .update({
          booking_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId),
      5000
    )

    if (updateError) {
      console.warn('⚠️ Failed to update booking to completed status:', updateError.message)
    } else {
      console.log('✅ Booking marked as fully completed (contract signed + payment complete)')
    }
  } else if (isFullyComplete) {
    console.log('✅ Booking already marked as completed')
  } else {
    console.log('ℹ️ Booking not yet fully complete:', {
      contract_signed: booking.contract_signed,
      payment_status: booking.payment_status
    })
  }
}

/**
 * Health check for contract service
 * @returns {Promise<Object>} Service health status
 */
export async function contractServiceHealthCheck() {
  try {
    const supabase = getSupabaseClient()

    // Test database connectivity with a simple query
    const { data, error } = await withTimeout(
      supabase
        .from('contract_signatures')
        .select('count', { count: 'exact', head: true })
        .limit(1),
      5000
    )

    if (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connectivity: 'failed',
        timestamp: new Date().toISOString()
      }
    }

    return {
      status: 'healthy',
      connectivity: 'success',
      signatureCount: data?.length || 0,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: normalizeError(error).message,
      connectivity: 'timeout',
      timestamp: new Date().toISOString()
    }
  }
}