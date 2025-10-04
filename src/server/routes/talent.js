/**
 * Talent Dashboard API Routes
 * Handles photographer-specific actions including job declines
 */

import express from 'express'
import { supabase } from '../db.js'

const router = express.Router()

/**
 * POST /api/talent/decline-job
 * Decline a job booking and blacklist talent from future jobs with this client
 *
 * Body: {
 *   booking_id: UUID,
 *   talent_id: UUID,
 *   reason: string (optional)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   declined_job_id?: UUID
 * }
 */
router.post('/decline-job', async (req, res) => {
  const startTime = performance.now()
  console.log('[POST /api/talent/decline-job] Request received:', {
    body: { ...req.body, reason: req.body.reason ? '[REDACTED]' : undefined },
    ip: req.ip,
    userAgent: req.get('user-agent')
  })

  try {
    const { booking_id, talent_id, reason } = req.body

    // Validate required fields
    if (!booking_id || !talent_id) {
      console.warn('[Decline Job] Missing required fields:', { booking_id, talent_id })
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: booking_id and talent_id are required'
      })
    }

    // Validate UUIDs format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(booking_id) || !uuidRegex.test(talent_id)) {
      console.warn('[Decline Job] Invalid UUID format:', { booking_id, talent_id })
      return res.status(400).json({
        success: false,
        message: 'Invalid UUID format for booking_id or talent_id'
      })
    }

    // Step 1: Fetch booking details to get customer_id and verify talent assignment
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, customer_id, photographer_id, booking_status')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      console.error('[Decline Job] Booking not found:', bookingError)
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    // Verify this booking is assigned to this talent
    if (booking.photographer_id !== talent_id) {
      console.warn('[Decline Job] Talent mismatch:', {
        expected: booking.photographer_id,
        received: talent_id
      })
      return res.status(403).json({
        success: false,
        message: 'This booking is not assigned to you'
      })
    }

    // Check if booking is already cancelled or completed
    if (booking.booking_status === 'cancelled') {
      console.warn('[Decline Job] Booking already cancelled:', booking_id)
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled'
      })
    }

    if (booking.booking_status === 'completed') {
      console.warn('[Decline Job] Cannot decline completed booking:', booking_id)
      return res.status(400).json({
        success: false,
        message: 'Cannot decline a completed booking'
      })
    }

    // Step 2: Check if already declined (idempotency)
    const { data: existingDecline, error: checkError } = await supabase
      .from('declined_jobs')
      .select('id')
      .eq('talent_id', talent_id)
      .eq('booking_id', booking_id)
      .single()

    if (existingDecline) {
      console.log('[Decline Job] Job already declined:', existingDecline.id)
      return res.status(200).json({
        success: true,
        message: 'Job already declined',
        declined_job_id: existingDecline.id,
        idempotent: true
      })
    }

    // Step 3: Create decline record with audit trail
    const { data: declinedJob, error: declineError } = await supabase
      .from('declined_jobs')
      .insert([{
        talent_id,
        booking_id,
        customer_id: booking.customer_id,
        reason: reason || null,
        ip_address: req.ip || null,
        user_agent: req.get('user-agent') || null,
        declined_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (declineError) {
      console.error('[Decline Job] Failed to create decline record:', declineError)
      return res.status(500).json({
        success: false,
        message: 'Failed to create decline record',
        error: declineError.message
      })
    }

    // Step 4: Update booking status to 'cancelled' and clear photographer assignment
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        photographer_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id)

    if (updateError) {
      console.error('[Decline Job] Failed to update booking status:', updateError)
      // Non-fatal error - decline record already created
      console.warn('[Decline Job] Decline record created but booking update failed')
    }

    const endTime = performance.now()
    console.log(`[Decline Job] ✅ Success in ${(endTime - startTime).toFixed(2)}ms`, {
      declined_job_id: declinedJob.id,
      booking_id,
      talent_id,
      customer_id: booking.customer_id
    })

    return res.status(200).json({
      success: true,
      message: 'Job successfully declined. You will no longer be matched with this client.',
      declined_job_id: declinedJob.id
    })

  } catch (error) {
    const endTime = performance.now()
    console.error(`[Decline Job] ❌ Error after ${(endTime - startTime).toFixed(2)}ms:`, error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    })
  }
})

/**
 * GET /api/talent/declined-jobs/:talent_id
 * Get list of declined jobs for a talent (for admin debugging)
 *
 * Returns: {
 *   success: boolean,
 *   declined_jobs: Array<{
 *     id: UUID,
 *     booking_id: UUID,
 *     customer_id: UUID,
 *     declined_at: ISO8601,
 *     reason: string
 *   }>
 * }
 */
router.get('/declined-jobs/:talent_id', async (req, res) => {
  try {
    const { talent_id } = req.params

    const { data: declinedJobs, error } = await supabase
      .from('declined_jobs')
      .select(`
        id,
        booking_id,
        customer_id,
        declined_at,
        reason,
        ip_address
      `)
      .eq('talent_id', talent_id)
      .order('declined_at', { ascending: false })

    if (error) {
      console.error('[Get Declined Jobs] Query error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch declined jobs'
      })
    }

    return res.status(200).json({
      success: true,
      declined_jobs: declinedJobs || []
    })

  } catch (error) {
    console.error('[Get Declined Jobs] Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router
