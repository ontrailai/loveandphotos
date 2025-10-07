/**
 * Customer Dashboard - Exact Magic MCP Design
 * Adapted from Magic MCP output with Supabase integration
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Calendar } from 'lucide-react'
import StyleQuestionnaire from '@components/dashboard/StyleQuestionnaire'
import LogisticsCard from '@components/dashboard/LogisticsCard'
import ModifyBookingFlow from '@components/booking/ModifyBookingFlow'
import ContractsCard from '@components/dashboard/ContractsCard'
import QuestionnairesCard from '@components/dashboard/QuestionnairesCard'
import AddOnsCard from '@components/dashboard/AddOnsCard'
import PaymentCard from '@components/dashboard/PaymentCard'
import DateChangeCard from '@components/dashboard/DateChangeCard'
import StatsCards from '@components/dashboard/redesign/StatsCards'
import UpcomingBookingCard from '@components/dashboard/redesign/UpcomingBookingCard'
import PastBookingCard from '@components/dashboard/redesign/PastBookingCard'
import EmptyState from '@components/dashboard/redesign/EmptyState'
import SkeletonLoaders from '@components/dashboard/redesign/SkeletonLoaders'
import { supabase } from '@lib/supabase'
import { isPast, isFuture, parseISO } from 'date-fns'
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
    completedBookings: 0,
    photosReceived: 0,
    reviewsGiven: 0
  })
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [modifyingBooking, setModifyingBooking] = useState(null)

  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
      },
    },
  }

  const loadDashboardData = useCallback(async () => {
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
          ),
          contract_signatures (
            id,
            signed_at,
            signer_full_name
          )
        `)
        .eq('customer_id', user.id)
        .order('event_date', { ascending: false })

      if (!bookingsError && bookingsData) {
        setBookings(bookingsData)

        // Separate upcoming and past bookings
        const upcoming = bookingsData.filter(b => isFuture(parseISO(b.event_date)))
        const past = bookingsData.filter(b => isPast(parseISO(b.event_date)))

        setUpcomingBookings(upcoming)
        setPastBookings(past)

        // Calculate stats
        setStats({
          totalBookings: bookingsData.length,
          upcomingEvents: upcoming.length,
          completedBookings: past.length,
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
  }, [user?.id]) // Only depend on user ID, not entire user object

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered:', { userId: user?.id, hasUser: !!user })

    // Set a 5-second timeout to prevent infinite loading
    const loadingTimeoutId = setTimeout(() => {
      console.warn('⚠️ Dashboard loading timeout (5s), forcing loading=false')
      setLoading(false)
    }, 5000)

    if (user?.id) {
      loadDashboardData().finally(() => {
        clearTimeout(loadingTimeoutId)
      })
    } else {
      console.log('⚠️ No user ID available, setting loading to false')
      setLoading(false)
      clearTimeout(loadingTimeoutId)
    }

    return () => {
      clearTimeout(loadingTimeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only watch user?.id to prevent infinite loops on user object changes

  const handleWriteReview = (booking) => {
    navigate(`/review/${booking.id}`)
  }

  const handleViewPhotos = (booking) => {
    const jobQueue = booking.job_queue?.[0]

    if (jobQueue?.delivery_url) {
      window.open(jobQueue.delivery_url, '_blank')
    } else if (jobQueue?.upload_status === 'processing') {
      toast('Your photos are being processed. Check back soon!', { icon: '⏳' })
    } else {
      toast('Photos not yet available. We\'ll notify you when they\'re ready!', { icon: '📸' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Loading...</h1>
            <p className="text-muted-foreground mt-1">Fetching your bookings</p>
          </div>
          <SkeletonLoaders />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div
        variants={shouldAnimate ? containerVariants : {}}
        initial={shouldAnimate ? "hidden" : "visible"}
        animate="visible"
        className="w-full max-w-7xl mx-auto p-6 space-y-8"
      >
        {/* Header */}
        <motion.div variants={shouldAnimate ? itemVariants : {}}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your photography bookings</p>
        </motion.div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Universal Style Preferences Card */}
        <motion.div variants={shouldAnimate ? itemVariants : {}}>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">Style Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Set your photography style preferences once for all future bookings
                </p>
              </div>
              <motion.button
                whileHover={shouldAnimate ? { scale: 1.05 } : {}}
                whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                onClick={() => setShowQuestionnaire(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Manage Preferences
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bookings Section */}
        <motion.div variants={shouldAnimate ? itemVariants : {}} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Upcoming Bookings</h2>
            <motion.button
              whileHover={shouldAnimate ? { scale: 1.05 } : {}}
              whileTap={shouldAnimate ? { scale: 0.95 } : {}}
              onClick={() => navigate('/browse')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {upcomingBookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id}>
                  <UpcomingBookingCard
                    booking={booking}
                    onModify={() => setModifyingBooking(booking)}
                    onViewDetails={() => navigate(`/booking/${booking.id}`)}
                    onViewInvoice={async () => {
                      try {
                        const token = (await supabase.auth.getSession()).data.session?.access_token
                        const url = `/api/contracts/${booking.id}/pdf`
                        const response = await fetch(url, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        })

                        if (!response.ok) {
                          throw new Error('Failed to generate invoice PDF')
                        }

                        const blob = await response.blob()
                        const pdfUrl = window.URL.createObjectURL(blob)
                        window.open(pdfUrl, '_blank')
                      } catch (error) {
                        console.error('Error viewing invoice:', error)
                        toast.error('Failed to view invoice')
                      }
                    }}
                  />

                  {/* Payment Information */}
                  <div className="mt-4">
                    <PaymentCard
                      booking={booking}
                      onPaymentUpdate={loadDashboardData}
                    />
                  </div>

                  {/* Date Change Flexibility Offer */}
                  <div className="mt-4">
                    <DateChangeCard
                      booking={booking}
                      onDateChanged={() => {
                        // Refresh dashboard data after date change
                        loadDashboardData()
                        toast.success('Your booking has been updated!')
                      }}
                    />
                  </div>

                  {/* Wedding Day Logistics (T-60) */}
                  <div className="mt-4">
                    <LogisticsCard booking={booking} />
                  </div>

                  {/* Client Dashboard Expansion Cards */}
                  {import.meta.env.VITE_ENABLE_CLIENT_DASHBOARD_EXPANSION === 'true' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Event Preparation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ContractsCard booking={booking} />
                        <QuestionnairesCard booking={booking} />
                        <AddOnsCard booking={booking} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Past Bookings Section */}
        {(pastBookings.length > 0 || bookings.length > 0) && (
          <motion.div variants={shouldAnimate ? itemVariants : {}} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Past Bookings</h2>
              <span className="text-sm text-muted-foreground">
                {pastBookings.length} {pastBookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>

            {pastBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastBookings.map((booking) => (
                  <PastBookingCard
                    key={booking.id}
                    booking={booking}
                    onWriteReview={() => handleWriteReview(booking)}
                    onViewPhotos={() => handleViewPhotos(booking)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-card rounded-xl border">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Past Bookings Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Your completed bookings will appear here after your events
                </p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Style Questionnaire Modal */}
      {showQuestionnaire && (
        <StyleQuestionnaire
          onClose={() => setShowQuestionnaire(false)}
          onComplete={() => {
            setShowQuestionnaire(false)
            loadDashboardData()
          }}
        />
      )}

      {/* Modify Booking Modal */}
      {modifyingBooking && (
        <ModifyBookingFlow
          booking={modifyingBooking}
          onClose={() => setModifyingBooking(null)}
          onComplete={() => {
            setModifyingBooking(null)
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}

export default CustomerDashboard