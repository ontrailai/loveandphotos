/**
 * Bookings Router - Handles booking creation and management
 */

import express from 'express'
import { supabase } from '../db.js'
import { getBasePhotoPrice } from '../../lib/constants/pricing.js'
import { computePayable } from '../payments/compute.js'

const router = express.Router()

/**
 * POST /api/booking/create
 * Creates a new booking with all booking flow data
 */
router.post('/create', async (req, res) => {
  try {
    const {
      customerId,
      photographerId,
      videographerId,
      packageDetails,
      scheduleDetails,
      locationDetails,
      addonsDetails,
      totalAmount,
      accountDetails
    } = req.body

    console.log('📅 Creating booking for customer:', customerId, 'photographer:', photographerId, 'videographer:', videographerId || 'none')

    // Validate required fields
    if (!customerId || !photographerId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: customerId and photographerId'
      })
    }

    // Schedule details are optional - date/time can be coordinated with photographer later

    // Verify photographer exists
    const { data: photographer, error: photographerError } = await supabase
      .from('photographers')
      .select('id, user_id')
      .eq('id', photographerId)
      .single()

    if (photographerError || !photographer) {
      console.error('Photographer not found:', photographerId, photographerError)
      return res.status(404).json({
        error: 'PHOTOGRAPHER_NOT_FOUND',
        message: 'Photographer not found',
        details: photographerError?.message
      })
    }

    // Verify videographer exists if provided
    if (videographerId) {
      const { data: videographer, error: videographerError } = await supabase
        .from('photographers')
        .select('id, user_id, is_videographer')
        .eq('id', videographerId)
        .single()

      if (videographerError || !videographer) {
        console.error('Videographer not found:', videographerId, videographerError)
        return res.status(404).json({
          error: 'VIDEOGRAPHER_NOT_FOUND',
          message: 'Videographer not found',
          details: videographerError?.message
        })
      }

      // Verify they are actually a videographer
      if (!videographer.is_videographer) {
        console.error('Photographer is not a videographer:', videographerId)
        return res.status(400).json({
          error: 'INVALID_VIDEOGRAPHER',
          message: 'Selected photographer is not a videographer'
        })
      }
    }

    // Get hours from package details (set during package selection)
    const hoursBooked = packageDetails?.hoursBooked || 0
    const packagePrice = packageDetails?.packagePrice || getBasePhotoPrice(hoursBooked) || 0

    // Calculate add-ons total
    const addonsPrice = (addonsDetails?.selectedAddons || []).reduce(
      (sum, addon) => sum + (addon.price * (addon.qty || 1)),
      0
    )

    // Calculate total in cents (base amount before late fee)
    const packageTotalCents = Math.round(packagePrice * 100)
    const addonsTotalCents = Math.round(addonsPrice * 100)
    const baseTotalCents = packageTotalCents + addonsTotalCents

    // Create a temporary booking object to calculate late fee
    const tempBooking = {
      event_date: scheduleDetails.date,
      package_total_cents: packageTotalCents,
      upsells_total_cents: addonsTotalCents,
      personalization_data: {
        pricing_summary: {
          package_price_cents: packageTotalCents,
          addons_price_cents: addonsTotalCents,
          total_amount_cents: baseTotalCents
        }
      }
    }

    // Use computePayable to calculate total including any late booking fee
    const paymentCalculation = computePayable(tempBooking, 'full')
    const totalAmountCents = paymentCalculation.amount_cents
    const lateFeeAmount = paymentCalculation.late_fee_cents

    console.log('💰 Booking total calculation:', {
      base_cents: baseTotalCents,
      late_fee_cents: lateFeeAmount,
      total_cents: totalAmountCents,
      event_date: scheduleDetails.date
    })

    // Build personalization_data
    const personalizationData = {
      package: {
        packageType: packageDetails?.packageType || 'photoOnly',
        packagePrice: packagePrice,
        hoursBooked: hoursBooked,
        packageDetails: packageDetails
      },
      schedule: {
        date: scheduleDetails.date,
        startTime: scheduleDetails.startTime || null,
        endTime: scheduleDetails.endTime || null,
        hours: hoursBooked
      },
      location: locationDetails || {},
      addons: addonsDetails?.selectedAddons || [],
      pricing_summary: {
        package_price_cents: packageTotalCents,
        addons_price_cents: addonsTotalCents,
        late_fee_cents: lateFeeAmount,
        total_amount_cents: totalAmountCents
      }
    }

    // Create booking in database
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        photographer_id: photographerId,
        videographer_id: videographerId || null,
        event_date: scheduleDetails.date,
        event_time: scheduleDetails.startTime || null,
        location_city: locationDetails?.city || null,
        location_state: locationDetails?.state || null,
        venue_name: locationDetails?.locationTitle || null,
        package_type: packageDetails?.packageType || 'photoOnly',
        package_total_cents: packageTotalCents,
        total_amount: totalAmountCents / 100, // Store in dollars for compatibility
        payment_status: 'pending',
        booking_status: 'pending',
        personalization_data: personalizationData
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)

      // Check for foreign key errors (user doesn't exist yet)
      if (bookingError.code === '23503') {
        return res.status(400).json({
          code: 'BOOKING_CREATION_FAILED',
          message: 'User account not ready',
          errorCode: bookingError.code,
          details: bookingError.message
        })
      }

      return res.status(500).json({
        error: 'BOOKING_CREATION_FAILED',
        message: 'Failed to create booking',
        details: bookingError.message
      })
    }

    console.log('✅ Booking created successfully:', booking.id)

    res.status(201).json({
      success: true,
      bookingId: booking.id,
      booking: {
        id: booking.id,
        eventDate: booking.event_date,
        packageTotalCents: booking.package_total_cents,
        totalAmount: booking.total_amount,
        paymentStatus: booking.payment_status,
        bookingStatus: booking.booking_status
      }
    })

  } catch (error) {
    console.error('Unexpected error creating booking:', error)
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: error.message
    })
  }
})

export default router
