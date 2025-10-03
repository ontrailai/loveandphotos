import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

const BOOKINGS_PER_PAGE = 10

const BookingsPage = () => {
  const { photographerProfile, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchBookings = useCallback(async () => {
    if (!photographerProfile?.id) {
      console.log('[BookingsPage] No photographer profile ID available')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('[BookingsPage] Fetching bookings for photographer:', photographerProfile.id)

      // Calculate pagination range
      const from = (currentPage - 1) * BOOKINGS_PER_PAGE
      const to = from + BOOKINGS_PER_PAGE - 1

      // Fetch bookings with customer and package data
      const { data, error: fetchError, count } = await supabase
        .from('bookings')
        .select(`
          id,
          event_date,
          event_time,
          event_end_time,
          venue_name,
          venue_address,
          booking_status,
          total_amount,
          created_at,
          users!bookings_customer_id_fkey (
            full_name,
            email
          ),
          packages (
            title
          )
        `, { count: 'exact' })
        .eq('photographer_id', photographerProfile.id)
        .neq('booking_status', 'cancelled')
        .order('event_date', { ascending: true })
        .range(from, to)

      if (fetchError) {
        console.error('[BookingsPage] Error fetching bookings:', fetchError)
        throw new Error('Failed to load bookings')
      }

      console.log('[BookingsPage] Fetched bookings:', data?.length || 0)
      setBookings(data || [])
      setTotalCount(count || 0)

    } catch (err) {
      console.error('[BookingsPage] Error:', err)
      setError(err.message || 'Failed to load bookings')
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [photographerProfile?.id, currentPage]) // Only depend on ID and currentPage

  useEffect(() => {
    if (photographerProfile?.id && !authLoading) {
      fetchBookings()
    }
  }, [photographerProfile?.id, authLoading, fetchBookings]) // Include fetchBookings since it's memoized

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    // Handle time format (HH:MM:SS)
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatLocation = (venueName, venueAddress) => {
    if (venueName) return venueName
    if (venueAddress) {
      if (typeof venueAddress === 'object') {
        return venueAddress.address || venueAddress.city || 'Location provided'
      }
      return venueAddress
    }
    return 'Location TBD'
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending'
      },
      confirmed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Confirmed'
      },
      completed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Completed'
      }
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const totalPages = Math.ceil(totalCount / BOOKINGS_PER_PAGE)
  const hasNextPage = currentPage < totalPages
  const hasPrevPage = currentPage > 1

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="animate-pulse p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Bookings</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg mr-4">
              <FileText className="w-8 h-8 text-primary-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1">
                View and manage all your confirmed bookings
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <span className="text-lg font-semibold text-gray-900">{totalCount}</span>
            <span className="text-gray-600">Booking{totalCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {bookings.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You don't have any bookings yet. Your confirmed bookings will appear here once clients book your services.
            </p>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      {bookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Client Name
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking Date
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Time
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Package
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {(booking.users?.full_name || booking.users?.email || 'Client')
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.users?.full_name || 'Client'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.users?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatDate(booking.event_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(booking.event_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {formatLocation(booking.venue_name, booking.venue_address)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.packages?.title || 'Custom Package'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.booking_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!hasPrevPage}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    hasPrevPage
                      ? 'text-gray-700 bg-white hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={!hasNextPage}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    hasNextPage
                      ? 'text-gray-700 bg-white hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * BOOKINGS_PER_PAGE) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * BOOKINGS_PER_PAGE, totalCount)}
                    </span>{' '}
                    of <span className="font-medium">{totalCount}</span> bookings
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!hasPrevPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        hasPrevPage
                          ? 'text-gray-500 bg-white hover:bg-gray-50'
                          : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Page Numbers */}
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1
                      // Show first, last, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span
                            key={pageNum}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        )
                      }
                      return null
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={!hasNextPage}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        hasNextPage
                          ? 'text-gray-500 bg-white hover:bg-gray-50'
                          : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BookingsPage