/**
 * Date Change Card Component - Compact Redesign
 * Displays $495 post-booking date change option on customer dashboard
 * Only shows if user hasn't changed date and doesn't have flexibility included
 */

import { useState } from 'react'
import { Calendar, CheckCircle } from 'lucide-react'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'

const DateChangeCard = ({ booking, onDateChanged }) => {
  const [processing, setProcessing] = useState(false)

  // Don't show card if:
  // 1. User already has date change flexibility (purchased $50 add-on)
  // 2. User already used their date change
  if (booking.can_change_date || booking.date_change_used) {
    return null
  }

  const handlePurchaseDateChange = async () => {
    try {
      setProcessing(true)

      // Create Stripe checkout session for $495 date change payment
      const { data: session, error } = await supabase.auth.getSession()
      if (error) throw new Error('Authentication required')

      const token = session.session?.access_token

      const response = await fetch('/api/bookings/date-change-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: booking.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url

    } catch (error) {
      console.error('Error purchasing date change:', error)
      toast.error(error.message || 'Failed to process payment')
      setProcessing(false)
    }
  }

  return (
    <div className="bg-pink-50 border-l-4 border-red-300 rounded-lg shadow-sm p-4 md:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
              Change Your Shoot Date
            </h3>
            <p className="text-sm text-gray-600">$495 – One-Time Use</p>
          </div>
        </div>
      </div>

      {/* Compact Features List */}
      <ul className="mb-4 space-y-1.5 text-xs md:text-sm text-gray-700">
        <li className="flex items-start gap-2">
          <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span>One-time use only</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span>Pick any available date from photographer's calendar</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span>Both parties will be notified</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span>Cannot be reused after change</span>
        </li>
      </ul>

      {/* CTA Button */}
      <button
        onClick={handlePurchaseDateChange}
        disabled={processing}
        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Pay $495 to Change Date'
        )}
      </button>

      {/* Fine Print */}
      <p className="mt-3 text-xs text-gray-400 text-center leading-relaxed">
        Payment will be processed through Stripe. You'll be redirected to select a new date after payment.
      </p>
    </div>
  )
}

export default DateChangeCard
