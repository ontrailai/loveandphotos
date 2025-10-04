import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { CalendarView } from '@components/talent/CalendarView'
import { Calendar as CalendarIcon, MapPin, Clock, User, Package, FileText, X, AlertTriangle } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const CalendarPage = () => {
  const location = useLocation()
  const { photographerProfile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const [declining, setDeclining] = useState(false)

  // Load bookings when component mounts or route changes
  useEffect(() => {
    if (photographerProfile?.id && !authLoading) {
      console.log('[CalendarPage] Route or profile changed, loading bookings')
      setLoading(true)
      loadBookingsData()
    }
  }, [photographerProfile?.id, authLoading, location.pathname]) // Only depend on ID to prevent infinite loop

  // Setup realtime subscription for new bookings
  useEffect(() => {
    if (!photographerProfile?.id) return

    console.log('[CalendarPage] Setting up realtime subscription for photographer:', photographerProfile.id)

    // Subscribe to bookings table changes
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
          console.log('[CalendarPage] 📸 New booking received:', payload.new)

          // Show notification toast
          toast.success('📸 New Booking Received!', {
            duration: 5000,
            icon: '🎉'
          })

          // Reload bookings to get fresh data with customer/package info
          loadBookingsData()
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
          console.log('[CalendarPage] 📝 Booking updated:', payload.new)

          // Reload bookings if status changed
          if (payload.old.booking_status !== payload.new.booking_status) {
            toast.info('Booking status updated', { duration: 3000 })
            loadBookingsData()
          }
        }
      )
      .subscribe((status) => {
        console.log('[CalendarPage] Realtime subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('[CalendarPage] Cleaning up realtime subscription')
      subscription.unsubscribe()
    }
  }, [photographerProfile?.id]) // Only depend on ID to prevent infinite loop from object recreation

  const loadBookingsData = async () => {
    if (!photographerProfile) return

    const startTime = performance.now()
    console.log('[CalendarPage] Starting bookings fetch for photographer:', photographerProfile.id)

    try {
      // Step 1: Get declined booking IDs for this talent to exclude them
      const { data: declinedBookings } = await supabase
        .from('declined_jobs')
        .select('booking_id')
        .eq('talent_id', photographerProfile.id)

      const declinedBookingIds = (declinedBookings || []).map(d => d.booking_id)
      console.log('[CalendarPage] Filtering out declined bookings:', declinedBookingIds.length)

      // Step 2: Batch all queries with Promise.allSettled for better performance
      let bookingsQuery = supabase
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
        .order('event_date', { ascending: true })

      // Filter out declined bookings if any exist
      if (declinedBookingIds.length > 0) {
        bookingsQuery = bookingsQuery.not('id', 'in', `(${declinedBookingIds.join(',')})`)
      }

      const [bookingsResult, _customersResult, _packagesResult] = await Promise.allSettled([
        bookingsQuery,
        // Customers and packages queries will be executed after we have booking IDs
        Promise.resolve({ data: null })  // Placeholder
      ])

      // Handle bookings result
      if (bookingsResult.status === 'rejected') {
        throw new Error('Failed to fetch bookings')
      }

      const { data: bookingsData, error: bookingsError } = bookingsResult.value
      if (bookingsError) throw bookingsError

      console.log('[CalendarPage] Bookings fetched:', bookingsData?.length || 0)

      // If no bookings, return early
      if (!bookingsData || bookingsData.length === 0) {
        setBookings([])
        const endTime = performance.now()
        console.log(`[CalendarPage] Load completed in ${(endTime - startTime).toFixed(2)}ms (no bookings)`)
        return
      }

      // Extract unique IDs for related data
      const customerIds = [...new Set(bookingsData.map(b => b.customer_id))]
      const packageIds = [...new Set(bookingsData.map(b => b.package_id).filter(Boolean))]

      // Batch fetch customers and packages
      const [customersResult, packagesResult] = await Promise.allSettled([
        supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', customerIds),
        packageIds.length > 0
          ? supabase
              .from('packages')
              .select('id, title')
              .in('id', packageIds)
          : Promise.resolve({ data: [] })
      ])

      // Extract data with error handling
      const customers = customersResult.status === 'fulfilled' ? customersResult.value.data : []
      const packages = packagesResult.status === 'fulfilled' ? packagesResult.value.data : []

      if (customersResult.status === 'rejected') {
        console.warn('[CalendarPage] Failed to fetch customers:', customersResult.reason)
      }
      if (packagesResult.status === 'rejected') {
        console.warn('[CalendarPage] Failed to fetch packages:', packagesResult.reason)
      }

      // Combine data efficiently
      const enrichedBookings = bookingsData.map(booking => {
        const customer = customers?.find(c => c.id === booking.customer_id)
        const pkg = packages?.find(p => p.id === booking.package_id)

        return {
          ...booking,
          client_name: customer?.full_name || customer?.email || 'Unknown Client',
          package_name: pkg?.title || 'Custom Package'
        }
      })

      setBookings(enrichedBookings)

      const endTime = performance.now()
      console.log(`[CalendarPage] ✅ Load completed successfully in ${(endTime - startTime).toFixed(2)}ms`)
    } catch (error) {
      console.error('[CalendarPage] ❌ Error loading bookings:', error)
      toast.error('Failed to load bookings')
      setBookings([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date) => {
    // Find bookings for this date
    const dateString = format(date, 'yyyy-MM-dd')
    const dayBookings = bookings.filter(b => b.event_date === dateString)

    if (dayBookings.length > 0) {
      // If multiple bookings, show the first one (or we could show a list)
      setSelectedBooking(dayBookings[0])
      setShowModal(true)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedBooking(null)
  }

  const handleDeclineClick = () => {
    setShowDeclineConfirm(true)
  }

  const cancelDecline = () => {
    setShowDeclineConfirm(false)
  }

  const confirmDecline = async () => {
    if (!selectedBooking || !photographerProfile) return

    setDeclining(true)
    const declineToast = toast.loading('Declining job...')

    try {
      const response = await fetch('/api/talent/decline-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          talent_id: photographerProfile.id
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to decline job')
      }

      // Success - remove from UI and close modals
      toast.success('Job successfully declined. You will no longer be matched with this client.', {
        id: declineToast,
        duration: 5000
      })

      setShowDeclineConfirm(false)
      setShowModal(false)
      setSelectedBooking(null)

      // Reload bookings to reflect the change
      await loadBookingsData()

    } catch (error) {
      console.error('[CalendarPage] Error declining job:', error)
      toast.error(error.message || 'Failed to decline job. Please try again.', {
        id: declineToast
      })
    } finally {
      setDeclining(false)
    }
  }

  // Memoize expensive operations
  const bookedDates = useMemo(() => {
    return bookings.map(b => b.event_date)
  }, [bookings])

  const upcomingBookings = useMemo(() => {
    const today = new Date()
    return bookings
      .filter(b => !isPast(parseISO(b.event_date)) || format(parseISO(b.event_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
      .slice(0, 5)
  }, [bookings])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Upcoming Assignments</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your confirmed bookings and assignment schedule
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-900">Total Confirmed Bookings</p>
            <p className="text-3xl font-bold text-primary-700 mt-1">{bookings.length}</p>
          </div>
          <CalendarIcon className="w-12 h-12 text-primary-600 opacity-50" aria-hidden="true" />
        </div>
      </div>

      {/* Calendar and Upcoming Bookings Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h2>
          <CalendarView
            bookedDates={bookedDates}
            onDateSelect={handleDateClick}
            selectedDate={null}
            readOnly={true}
          />
          <p className="mt-3 text-xs text-gray-500 text-center">
            Click on a marked date to view booking details
          </p>
        </div>

        {/* Upcoming Bookings List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next 5 Assignments</h2>
          {upcomingBookings.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Upcoming Bookings</h3>
              <p className="text-sm text-gray-600">
                You have no confirmed assignments yet. Assignments will be assigned by the admin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => {
                const bookingDate = parseISO(booking.event_date)
                const isToday = format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                const isPastDate = isPast(bookingDate) && !isToday

                return (
                  <div
                    key={booking.id}
                    onClick={() => {
                      setSelectedBooking(booking)
                      setShowModal(true)
                    }}
                    className={`bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${
                      isToday ? 'border-primary-500 border-2' : isPastDate ? 'opacity-60 border-gray-300' : 'border-gray-200'
                    }`}
                  >
                    {isToday && (
                      <span className="inline-block px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded mb-2">
                        TODAY
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {booking.client_name}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                            <span>
                              {format(bookingDate, 'MMMM d, yyyy')} at {booking.event_time}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{booking.venue_name || 'Location TBD'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Bookings List */}
      {bookings.length > 5 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Confirmed Bookings</h2>
          <div className="space-y-2">
            {bookings.map((booking) => {
              const bookingDate = parseISO(booking.event_date)
              const isPastDate = isPast(bookingDate)

              return (
                <div
                  key={booking.id}
                  onClick={() => {
                    setSelectedBooking(booking)
                    setShowModal(true)
                  }}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    isPastDate ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {format(bookingDate, 'MMMM d, yyyy')} - {booking.client_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {booking.event_time} • {booking.venue_name || 'Location TBD'}
                    </div>
                  </div>
                  <div className="text-sm text-primary-600 font-medium">
                    View Details →
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <User className="w-4 h-4 mr-2" aria-hidden="true" />
                  Client
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBooking.client_name}
                </p>
              </div>

              {/* Date & Time */}
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
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

              {/* Location */}
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                  Location
                </div>
                <p className="text-gray-900">
                  {selectedBooking.venue_name || 'Location TBD'}
                </p>
                {selectedBooking.venue_address && (
                  <p className="text-sm text-gray-600 mt-1">
                    {typeof selectedBooking.venue_address === 'object'
                      ? `${selectedBooking.venue_address.street || ''}, ${selectedBooking.venue_address.city || ''}, ${selectedBooking.venue_address.state || ''} ${selectedBooking.venue_address.zip || ''}`
                      : selectedBooking.venue_address
                    }
                  </p>
                )}
              </div>

              {/* Package */}
              <div>
                <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Package className="w-4 h-4 mr-2" aria-hidden="true" />
                  Package
                </div>
                <p className="text-gray-900">{selectedBooking.package_name}</p>
              </div>

              {/* Event Type */}
              {selectedBooking.event_type && (
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <CalendarIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    Event Type
                  </div>
                  <p className="text-gray-900 capitalize">{selectedBooking.event_type}</p>
                </div>
              )}

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500 mb-2">
                    <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                    Special Instructions
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedBooking.special_requests}
                  </p>
                </div>
              )}

              {/* Status Badge */}
              <div className="pt-4 border-t border-gray-200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                  ✓ Confirmed
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between border-t border-gray-200">
              <button
                onClick={handleDeclineClick}
                disabled={declining}
                className="px-4 py-2 border-2 border-red-600 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Decline Job
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Job Confirmation Modal */}
      {showDeclineConfirm && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            {/* Warning Header */}
            <div className="bg-red-50 border-b-2 border-red-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    Decline Job Warning
                  </h3>
                  <p className="text-sm text-red-700">
                    This action is permanent
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-gray-900 font-medium">
                  Are you sure you want to decline this job?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900 font-semibold mb-2">
                    ⚠️ Important Consequences:
                  </p>
                  <ul className="text-sm text-amber-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>You will be <strong>permanently blacklisted</strong> from this job</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>You will <strong>never be matched</strong> with this client again</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>This action <strong>cannot be undone</strong></span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1 font-medium">Job Details:</p>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.client_name} • {format(parseISO(selectedBooking.event_date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={cancelDecline}
                disabled={declining}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDecline}
                disabled={declining}
                className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {declining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Declining...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    Yes, Decline Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPage