/**
 * Unified Calendar Page - Talent Dashboard
 * Combines availability management and booking views in one interface
 * - Mark dates as available/unavailable (inverse model: all dates available by default)
 * - View confirmed bookings with details
 * - Toggle between "Availability Mode" and "Bookings View"
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  Package,
  FileText,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Info
} from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, isPast, parseISO, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'

const CalendarPage = () => {
  const location = useLocation()
  const { user, photographerProfile, loading: authLoading, fetchUserData } = useAuth()

  // State management
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState('bookings') // 'bookings' or 'availability'

  // Availability state
  const [blockedDates, setBlockedDates] = useState([])
  const [isPublic, setIsPublic] = useState(true)
  const [isVisibleInSearch, setIsVisibleInSearch] = useState(false)

  // Bookings state
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const [declining, setDeclining] = useState(false)

  // Load data when component mounts
  useEffect(() => {
    if (photographerProfile?.id && !authLoading) {
      loadCalendarData()
    }
  }, [photographerProfile?.id, authLoading, location.pathname])

  // Setup realtime subscription for new bookings
  useEffect(() => {
    if (!photographerProfile?.id) return

    const subscription = supabase
      .channel('photographer-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `photographer_id=eq.${photographerProfile.id}`
        },
        (payload) => {
          console.log('[CalendarPage] New booking received:', payload.new)
          toast.success('📸 New Booking Received!', { duration: 5000, icon: '🎉' })
          loadCalendarData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `photographer_id=eq.${photographerProfile.id}`
        },
        (payload) => {
          if (payload.old.booking_status !== payload.new.booking_status) {
            toast.info('Booking status updated', { duration: 3000 })
            loadCalendarData()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [photographerProfile?.id])

  const loadCalendarData = async () => {
    if (!photographerProfile || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Load availability data and bookings in parallel
      const [availabilityResult, bookingsResult, declinedResult] = await Promise.allSettled([
        // Load photographer availability settings
        supabase
          .from('photographers')
          .select('unavailable_dates, is_public, visible_in_search')
          .eq('user_id', user.id)
          .single(),

        // Load bookings
        supabase
          .from('bookings')
          .select(`
            id,
            event_date,
            event_time,
            event_end_time,
            event_type,
            venue_name,
            venue_address,
            special_requests,
            booking_status,
            payment_status,
            customer_id,
            package_id
          `)
          .eq('photographer_id', photographerProfile.id)
          .neq('booking_status', 'cancelled')
          .order('event_date', { ascending: true }),

        // Get declined booking IDs
        supabase
          .from('declined_jobs')
          .select('booking_id')
          .eq('talent_id', photographerProfile.id)
      ])

      // Process availability data
      if (availabilityResult.status === 'fulfilled' && availabilityResult.value.data) {
        const { data } = availabilityResult.value
        const dates = (data.unavailable_dates || []).map(dateStr => new Date(dateStr))

        // Deduplicate by converting to ISO strings, using Set, then back to Date objects
        const uniqueDateStrings = [...new Set(dates.map(d => d.toISOString().split('T')[0]))]
        const uniqueDates = uniqueDateStrings.map(str => new Date(str))

        setBlockedDates(uniqueDates)
        setIsPublic(data.is_public ?? true)
        setIsVisibleInSearch(data.visible_in_search ?? false)
      }

      // Process declined bookings
      const declinedBookingIds = declinedResult.status === 'fulfilled' && declinedResult.value.data
        ? declinedResult.value.data.map(d => d.booking_id)
        : []

      // Process bookings data
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.data) {
        let bookingsData = bookingsResult.value.data

        // Filter out declined bookings
        if (declinedBookingIds.length > 0) {
          bookingsData = bookingsData.filter(b => !declinedBookingIds.includes(b.id))
        }

        if (bookingsData.length > 0) {
          // Fetch customer and package info
          const customerIds = [...new Set(bookingsData.map(b => b.customer_id))]
          const packageIds = [...new Set(bookingsData.map(b => b.package_id).filter(Boolean))]

          const [customersResult, packagesResult] = await Promise.allSettled([
            supabase.from('users').select('id, full_name, email').in('id', customerIds),
            packageIds.length > 0
              ? supabase.from('packages').select('id, title').in('id', packageIds)
              : Promise.resolve({ data: [] })
          ])

          const customers = customersResult.status === 'fulfilled' ? customersResult.value.data : []
          const packages = packagesResult.status === 'fulfilled' ? packagesResult.value.data : []

          // Enrich bookings with customer and package data
          const enrichedBookings = bookingsData.map(booking => ({
            ...booking,
            client_name: customers?.find(c => c.id === booking.customer_id)?.full_name || 'Unknown Client',
            package_name: packages?.find(p => p.id === booking.package_id)?.title || 'Custom Package'
          }))

          setBookings(enrichedBookings)
        } else {
          setBookings([])
        }
      }

    } catch (error) {
      console.error('[CalendarPage] Error loading calendar data:', error)
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  // Availability management functions
  const handleDateSelect = (dates) => {
    setBlockedDates(dates || [])
  }

  const handleSaveAvailability = async () => {
    setSaving(true)

    try {
      const dateStrings = blockedDates.map(date => {
        const d = new Date(date)
        return d.toISOString().split('T')[0]
      })

      // Deduplicate using Set to prevent duplicate dates
      const uniqueDateStrings = [...new Set(dateStrings)]

      const { error } = await supabase
        .from('photographers')
        .update({
          unavailable_dates: uniqueDateStrings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Availability updated successfully!')

      if (user) {
        await fetchUserData(user)
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleClearAllDates = () => {
    if (confirm('Are you sure you want to clear all blocked dates? This will make your calendar fully available.')) {
      setBlockedDates([])
    }
  }

  const toggleVisibility = async () => {
    const newVisibility = !isPublic

    try {
      const { error } = await supabase
        .from('photographers')
        .update({
          is_public: newVisibility,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      setIsPublic(newVisibility)
      toast.success(`Profile ${newVisibility ? 'visible' : 'hidden'} in search`)

      if (user) {
        await fetchUserData(user)
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Failed to update visibility')
    }
  }

  // Booking management functions
  const handleDateClick = useCallback((date) => {
    if (viewMode === 'availability') return // Don't handle clicks in availability mode

    const dateString = format(date, 'yyyy-MM-dd')
    const dayBookings = bookings.filter(b => b.event_date === dateString)

    if (dayBookings.length > 0) {
      setSelectedBooking(dayBookings[0])
      setShowBookingModal(true)
    }
  }, [viewMode, bookings])

  const closeBookingModal = () => {
    setShowBookingModal(false)
    setSelectedBooking(null)
  }

  const handleDeclineJob = async () => {
    if (!selectedBooking || !photographerProfile) return

    setDeclining(true)
    const declineToast = toast.loading('Declining job...')

    try {
      const response = await fetch('/api/talent/decline-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          talent_id: photographerProfile.id
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to decline job')
      }

      toast.success('Job successfully declined.', { id: declineToast, duration: 5000 })
      setShowDeclineConfirm(false)
      setShowBookingModal(false)
      setSelectedBooking(null)
      await loadCalendarData()

    } catch (error) {
      console.error('[CalendarPage] Error declining job:', error)
      toast.error(error.message || 'Failed to decline job.', { id: declineToast })
    } finally {
      setDeclining(false)
    }
  }

  // Computed values
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const futureBlockedDates = blockedDates.filter(date => date >= today)
  const bookedDates = useMemo(() => bookings.map(b => b.event_date), [bookings])

  // Custom day renderer for DayPicker
  const modifiers = {
    blocked: blockedDates,
    booked: bookedDates.map(dateStr => new Date(dateStr))
  }

  const modifiersClassNames = {
    blocked: 'blocked-date',
    booked: 'booked-date'
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-gray-600">
          Manage your availability and view confirmed bookings
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('bookings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'bookings'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Bookings View
          </button>
          <button
            onClick={() => setViewMode('availability')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'availability'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Availability Mode
          </button>
        </div>

        {viewMode === 'availability' && (
          <Button
            variant={isPublic ? 'secondary' : 'primary'}
            onClick={toggleVisibility}
            className="flex items-center gap-2"
          >
            {isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPublic ? 'Hide Profile' : 'Show Profile'}
          </Button>
        )}
      </div>

      {/* Visibility Status Banner (shown in both modes) */}
      {viewMode === 'availability' && (
        <Card className="border-l-4" style={{ borderLeftColor: isVisibleInSearch ? '#10b981' : '#f59e0b' }}>
          <div className="flex items-start gap-4">
            <div className="mt-1">
              {isVisibleInSearch ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Info className="w-6 h-6 text-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {isVisibleInSearch ? 'Visible in Client Search' : 'Not Visible in Client Search'}
              </h3>
              <p className="text-sm text-gray-600">
                {isVisibleInSearch
                  ? "Your profile is visible to clients. All future dates are available except those you've blocked."
                  : 'To appear in search results, you must enable profile visibility.'
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Calendar */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold">
              {viewMode === 'bookings' ? 'Booking Calendar' : 'Availability Calendar'}
            </h2>
          </div>

          {viewMode === 'availability' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <strong>How it works:</strong> All future dates are available by default. Click dates to block them when you're unavailable.
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <DayPicker
              mode={viewMode === 'availability' ? 'multiple' : 'default'}
              selected={viewMode === 'availability' ? blockedDates : undefined}
              onSelect={viewMode === 'availability' ? handleDateSelect : undefined}
              disabled={viewMode === 'availability' ? { before: today } : undefined}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              onDayClick={viewMode === 'bookings' ? handleDateClick : undefined}
              className="calendar-custom"
            />
          </div>

          {viewMode === 'availability' && (
            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleSaveAvailability}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Blocked Dates'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleClearAllDates}
                disabled={blockedDates.length === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          )}
        </Card>

        {/* Sidebar Stats & Info */}
        <div className="space-y-6">
          {/* Stats Card */}
          {viewMode === 'bookings' ? (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Booking Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="font-semibold text-gray-900">{bookings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Upcoming</span>
                  <span className="font-semibold text-primary-600">
                    {bookings.filter(b => !isPast(parseISO(b.event_date))).length}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Availability Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Future Blocked Dates</span>
                  <span className="font-semibold text-red-600">{futureBlockedDates.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Blocked</span>
                  <span className="font-semibold text-gray-900">{blockedDates.length}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Legend */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2 text-sm">
              {viewMode === 'bookings' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-primary-500"></div>
                    <span className="text-gray-600">Confirmed Booking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-gray-400"></div>
                    <span className="text-gray-600">Available</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-gray-600">Blocked (Unavailable)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                    <span className="text-gray-600">Available (Default)</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Recent Bookings List (Bookings Mode) */}
          {viewMode === 'bookings' && bookings.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Next 5 Bookings</h3>
              <div className="space-y-2">
                {bookings
                  .filter(b => !isPast(parseISO(b.event_date)))
                  .slice(0, 5)
                  .map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => {
                        setSelectedBooking(booking)
                        setShowBookingModal(true)
                      }}
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-gray-900 text-sm">{booking.client_name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {format(parseISO(booking.event_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Blocked Dates Preview (Availability Mode) */}
          {viewMode === 'availability' && futureBlockedDates.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Upcoming Blocked Dates</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {futureBlockedDates
                  .sort((a, b) => a - b)
                  .slice(0, 10)
                  .map((date) => {
                    // Use ISO date string as unique key to prevent duplicate rendering
                    const dateKey = date.toISOString().split('T')[0]
                    return (
                      <div key={dateKey} className="text-sm text-gray-600 flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-500" />
                        {date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    )
                  })}
                {futureBlockedDates.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{futureBlockedDates.length - 10} more
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
              <button onClick={closeBookingModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <User className="w-4 h-4 mr-2" />
                  Client
                </div>
                <p className="text-lg font-semibold text-gray-900">{selectedBooking.client_name}</p>
              </div>

              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Clock className="w-4 h-4 mr-2" />
                  Date & Time
                </div>
                <p className="text-gray-900">
                  {format(parseISO(selectedBooking.event_date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-gray-900 mt-1">
                  {selectedBooking.event_time}
                  {selectedBooking.event_end_time && ` - ${selectedBooking.event_end_time}`}
                </p>
              </div>

              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </div>
                <p className="text-gray-900">{selectedBooking.venue_name || 'Location TBD'}</p>
              </div>

              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Package className="w-4 h-4 mr-2" />
                  Package
                </div>
                <p className="text-gray-900">{selectedBooking.package_name}</p>
              </div>

              {selectedBooking.special_requests && (
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <FileText className="w-4 h-4 mr-2" />
                    Special Instructions
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedBooking.special_requests}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Confirmed
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between border-t border-gray-200">
              <button
                onClick={() => setShowDeclineConfirm(true)}
                disabled={declining}
                className="px-4 py-2 border-2 border-red-600 rounded-lg text-red-600 hover:bg-red-50 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Decline Job
              </button>
              <button
                onClick={closeBookingModal}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Confirmation Modal */}
      {showDeclineConfirm && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-red-50 border-b-2 border-red-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">Decline Job Warning</h3>
                  <p className="text-sm text-red-700">This action is permanent</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-900 font-medium">Are you sure you want to decline this job?</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ Important Consequences:</p>
                <ul className="text-sm text-amber-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You will be <strong>permanently blacklisted</strong> from this job</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>You will <strong>never be matched</strong> with this client again</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowDeclineConfirm(false)}
                disabled={declining}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineJob}
                disabled={declining}
                className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {declining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Declining...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Yes, Decline Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for calendar styling */}
      <style>{`
        .calendar-custom .blocked-date {
          background-color: #ef4444 !important;
          color: white !important;
          font-weight: 600;
        }
        .calendar-custom .blocked-date:hover {
          background-color: #dc2626 !important;
        }
        .calendar-custom .booked-date {
          background-color: #8b5cf6 !important;
          color: white !important;
          font-weight: 600;
          cursor: pointer;
        }
        .calendar-custom .booked-date:hover {
          background-color: #7c3aed !important;
        }
      `}</style>
    </div>
  )
}

export default CalendarPage
