/**
 * Booking Details Page
 * Shows comprehensive information about a specific booking
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { format, parseISO } from 'date-fns'
import { getFirstNameOnly } from '@lib/privacy/sanitizeTalentData'
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  ArrowLeft,
  Package
} from 'lucide-react'
import toast from 'react-hot-toast'

const BookingDetails = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && bookingId) {
      loadBookingDetails()
    }
  }, [user, bookingId])

  const loadBookingDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          photographer:photographer_id (
            id,
            users!inner (
              full_name,
              avatar_url,
              phone,
              email
            ),
            pay_tiers (
              name,
              badge_color
            ),
            average_rating,
            total_reviews
          ),
          package:package_id (
            title,
            duration_minutes,
            description
          ),
          contract_signatures (
            id,
            signed_at,
            signer_full_name
          )
        `)
        .eq('id', bookingId)
        .single()

      if (error) throw error

      // Verify ownership
      if (data.customer_id !== user.id) {
        toast.error('Access denied')
        navigate('/dashboard')
        return
      }

      // Debug logging to verify contract status logic
      console.log('🔍 [BookingDetails] Booking data loaded:', {
        bookingId: data.id,
        payment_status: data.payment_status,
        contract_signatures: data.contract_signatures,
        has_signature: !!data.contract_signatures?.[0],
        isPaid: data.payment_status === 'paid' || data.payment_status === 'completed',
        shouldShowComplete: !!(data.contract_signatures?.[0]) && (data.payment_status === 'paid' || data.payment_status === 'completed')
      })

      setBooking(data)
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Booking Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const photographerName = getFirstNameOnly(booking.photographer?.users?.full_name || 'Photographer')
  const packageTitle = booking.package?.title || booking.package_title || 'Photography Package'
  const totalAmount = parseFloat(booking.final_amount || booking.total_amount || 0)
  const isSigned = !!booking.contract_signatures?.[0]
  const isPaid = booking.payment_status === 'paid' || booking.payment_status === 'completed'
  const isContractComplete = isSigned && isPaid

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground">Booking ID: {booking.id.slice(0, 8)}...</p>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Event Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Event Details</h2>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(parseISO(booking.event_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{booking.event_time || 'TBD'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{booking.venue_name || 'TBD'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p className="font-medium">{packageTitle}</p>
                </div>
              </div>
            </div>

            {/* Photographer Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold border-b pb-2">Photographer</h2>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{photographerName}</p>
                </div>
              </div>

              {/* Studio Contact Information */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-1">Questions about this booking?</p>
                <p className="text-sm text-blue-800">
                  Contact our Studio team at{' '}
                  <a href="mailto:support@lp.loveandphotos.com" className="font-medium underline hover:text-blue-600">
                    support@lp.loveandphotos.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Status Card */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Payment & Status</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="font-medium capitalize">{booking.payment_status}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Contract Status</p>
                <p className="font-medium">
                  <span className="text-green-600">Approved</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {booking.special_requests && (
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Special Requests</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {booking.special_requests}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingDetails
