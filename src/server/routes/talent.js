/**
 * Talent Dashboard API Routes
 * Handles photographer-specific actions including job declines
 */

import express from 'express'
import { supabase } from '../db.js'

const router = express.Router()

/**
 * POST /api/talent/decline-job
 * Decline a job booking, blacklist talent account, and schedule for deletion
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
 *   purge_date?: ISO8601
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

    // Step 1: Fetch booking details and verify talent assignment
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

    // Check if booking is already declined, cancelled or completed
    if (booking.booking_status === 'declined_by_talent') {
      console.warn('[Decline Job] Booking already declined:', booking_id)
      return res.status(400).json({
        success: false,
        message: 'This booking has already been declined'
      })
    }

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

    // Step 2: Check if user is already blacklisted (idempotency)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_blacklisted, soft_deleted')
      .eq('id', talent_id)
      .single()

    if (userError) {
      console.error('[Decline Job] Failed to fetch user:', userError)
      return res.status(500).json({
        success: false,
        message: 'Failed to verify user account'
      })
    }

    if (user.is_blacklisted || user.soft_deleted) {
      console.log('[Decline Job] User already blacklisted/deleted')
      return res.status(200).json({
        success: true,
        message: 'Account already blacklisted and scheduled for deletion',
        idempotent: true
      })
    }

    // Step 3: Execute transaction - Update booking, blacklist user, queue purge
    const now = new Date()
    const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    // Update booking status to 'declined_by_talent'
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        booking_status: 'declined_by_talent',
        updated_at: now.toISOString()
      })
      .eq('id', booking_id)

    if (bookingUpdateError) {
      console.error('[Decline Job] Failed to update booking:', bookingUpdateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to update booking status'
      })
    }

    // Blacklist and soft-delete user account
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_blacklisted: true,
        soft_deleted: true,
        deleted_at: now.toISOString(),
        delete_reason: reason || 'Declined job booking'
      })
      .eq('id', talent_id)

    if (userUpdateError) {
      console.error('[Decline Job] Failed to blacklist user:', userUpdateError)
      return res.status(500).json({
        success: false,
        message: 'Failed to blacklist account'
      })
    }

    // Queue account for purge in 30 days
    const { error: purgeQueueError } = await supabase
      .from('account_purge_queue')
      .insert([{
        user_id: talent_id,
        booking_id: booking_id,
        purge_after: purgeDate.toISOString(),
        created_by: talent_id
      }])

    if (purgeQueueError) {
      console.error('[Decline Job] Failed to queue purge:', purgeQueueError)
      // Non-fatal - account is already blacklisted
      console.warn('[Decline Job] Account blacklisted but purge queue failed')
    }

    // Log to admin audit trail
    const { error: auditError } = await supabase
      .from('admin_audit_log')
      .insert([{
        user_id: talent_id,
        actor_id: talent_id,
        action: 'talent_declined_job',
        payload: {
          booking_id,
          reason: reason || null,
          purge_date: purgeDate.toISOString()
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }])

    if (auditError) {
      console.warn('[Decline Job] Audit log failed:', auditError)
      // Non-fatal
    }

    const endTime = performance.now()
    console.log(`[Decline Job] ✅ Success in ${(endTime - startTime).toFixed(2)}ms`, {
      booking_id,
      talent_id,
      purge_date: purgeDate.toISOString()
    })

    return res.status(200).json({
      success: true,
      message: 'Account blacklisted and scheduled for deletion in 30 days. You will be logged out immediately.',
      purge_date: purgeDate.toISOString()
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
