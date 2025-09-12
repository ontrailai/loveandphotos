/**
 * Customer Dashboard Component
 * Main dashboard for customers with bookings and activity
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { 
  CalendarIcon,
  CameraIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  ChevronRightIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ImageIcon,
  MessageSquareIcon,
  DownloadIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import { supabase } from '@lib/supabase'
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns'
import toast from 'react-hot-toast'

const CustomerDashboard = () => {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [pastBookings, setPastBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingEvents: 0,
    photosReceived: 0,
    reviewsGiven: 0
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          photographers (
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
          packages (
            title,
            duration_minutes
          ),
          job_queue (
            upload_status,
            delivery_url,
            delivered_at
          ),
          reviews (
            id,
            rating,
            comment
          )
        `)
        .eq('customer_id', user.id)
        .order('event_date', { ascending: false })

      if (!bookingsError && bookingsData) {
        setBookings(bookingsData)
        
        // Separate upcoming and past bookings
        const upcoming = bookingsData.filter(b => isFuture(new Date(b.event_date)))
        const past = bookingsData.filter(b => isPast(new Date(b.event_date)))
        
        setUpcomingBookings(upcoming)
        setPastBookings(past)

        // Calculate stats
        setStats({
          totalBookings: bookingsData.length,
          upcomingEvents: upcoming.length,
          photosReceived: bookingsData.filter(b => b.job_queue?.[0]?.upload_status === 'completed').length,
          reviewsGiven: bookingsData.filter(b => b.reviews?.[0]?.id).length
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getBookingStatus = (booking) => {
    if (booking.booking_status === 'cancelled') return { label: 'Cancelled', variant: 'danger' }
    if (booking.job_queue?.[0]?.upload_status === 'completed') return { label: 'Delivered', variant: 'success' }
    if (isPast(new Date(booking.event_date))) return { label: 'Completed', variant: 'secondary' }
    if (booking.payment_status === 'paid') return { label: 'Confirmed', variant: 'primary' }
    return { label: 'Pending', variant: 'warning' }
  }

  const handleWriteReview = (booking) => {
    navigate(`/review/${booking.id}`)
  }

  const handleViewPhotos = (booking) => {
    if (booking.job_queue?.[0]?.delivery_url) {
      window.open(booking.job_queue[0].delivery_url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-dusty-900">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-dusty-600 mt-1">
                Manage your bookings and discover new photographers
              </p>
            </div>
            <Link to="/browse">
              <Button>
                <PlusIcon className="w-5 h-5 mr-2" />
                Book Photographer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blush-50 to-blush-100 border-blush-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blush-600 text-sm font-medium">Total Bookings</p>
                <p className="text-3xl font-bold text-blush-900">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-blush-500 rounded-lg flex items-center justify-center">
                <CameraIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-sage-50 to-sage-100 border-sage-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sage-600 text-sm font-medium">Upcoming Events</p>
                <p className="text-3xl font-bold text-sage-900">{stats.upcomingEvents}</p>
              </div>
              <div className="w-12 h-12 bg-sage-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-dusty-50 to-dusty-100 border-dusty-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dusty-600 text-sm font-medium">Photos Received</p>
                <p className="text-3xl font-bold text-dusty-900">{stats.photosReceived}</p>
              </div>
              <div className="w-12 h-12 bg-dusty-500 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Reviews Given</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.reviewsGiven}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dusty-900 mb-4">Upcoming Events</h2>
            <div className="grid gap-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={booking.photographers?.users?.avatar_url}
                        name={booking.photographers?.users?.full_name}
                        size="lg"
                      />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-dusty-900">
                            {booking.photographers?.users?.full_name}
                          </h3>
                          <Badge 
                            variant={booking.photographers?.pay_tiers?.name?.toLowerCase() || 'default'}
                            size="sm"
                          >
                            {booking.photographers?.pay_tiers?.name}
                          </Badge>
                          <Badge variant={getBookingStatus(booking).variant} size="sm">
                            {getBookingStatus(booking).label}
                          </Badge>
                        </div>
                        <p className="text-sm text-dusty-600 mb-2">
                          {booking.packages?.title} • {booking.packages?.duration_minutes} minutes
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-dusty-600">
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {format(new Date(booking.event_date), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {booking.event_time}
                          </span>
                          <span className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {booking.venue_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <MessageSquareIcon className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Link to={`/booking/${booking.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ChevronRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Event countdown */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-dusty-600">
                        Event in {formatDistanceToNow(new Date(booking.event_date), { addSuffix: false })}
                      </p>
                      {booking.contract_signed_at ? (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Contract signed
                        </span>
                      ) : (
                        <span className="flex items-center text-sm text-yellow-600">
                          <AlertCircleIcon className="w-4 h-4 mr-1" />
                          Contract pending
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-dusty-900 mb-4">Past Events</h2>
            <div className="grid gap-4">
              {pastBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id} className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={booking.photographers?.users?.avatar_url}
                        name={booking.photographers?.users?.full_name}
                        size="md"
                      />
                      <div>
                        <h3 className="font-semibold text-dusty-900">
                          {booking.photographers?.users?.full_name}
                        </h3>
                        <p className="text-sm text-dusty-600">
                          {booking.event_type} • {format(new Date(booking.event_date), 'MMM dd, yyyy')}
                        </p>
                        {booking.reviews?.[0] ? (
                          <div className="mt-1">
                            <RatingStars rating={booking.reviews[0].rating} size="sm" />
                          </div>
                        ) : (
                          <p className="text-sm text-blush-600 mt-1">Review pending</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {booking.job_queue?.[0]?.upload_status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewPhotos(booking)}
                        >
                          <DownloadIcon className="w-4 h-4 mr-2" />
                          Photos
                        </Button>
                      )}
                      {!booking.reviews?.[0] && isPast(new Date(booking.event_date)) && (
                        <Button 
                          size="sm"
                          onClick={() => handleWriteReview(booking)}
                        >
                          <StarIcon className="w-4 h-4 mr-2" />
                          Write Review
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {pastBookings.length > 5 && (
              <div className="text-center mt-6">
                <Link to="/my-bookings">
                  <Button variant="outline">
                    View All Bookings
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {bookings.length === 0 && (
          <Card className="text-center py-12">
            <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-dusty-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-dusty-600 mb-6 max-w-md mx-auto">
              Start your journey by finding the perfect photographer for your special moments
            </p>
            <Link to="/browse">
              <Button size="lg">
                Browse Photographers
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CustomerDashboard
