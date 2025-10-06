import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import {
  User,
  Calendar,
  TrendingUp,
  Camera,
  CheckCircle2,
  ArrowRight,
  Star,
  Clock,
  Award,
  Sparkles,
  Tag,
  Info
} from 'lucide-react'
import Badge from '@components/ui/Badge'
import toast from 'react-hot-toast'

const OverviewPage = () => {
  const { profile, photographerProfile, loading } = useAuth()
  const [stats, setStats] = useState({
    totalShoots: 0,
    averageRating: 0,
    pendingRequests: 0,
    isLnpChoice: false,
    topStyleTag: null,
    loading: true,
    error: null
  })

  console.log('[OverviewPage] Render state:', {
    loading,
    hasProfile: !!profile,
    hasPhotographerProfile: !!photographerProfile,
    photographerId: photographerProfile?.id
  })

  // Fetch stats data from Supabase with optimized batching
  const fetchStats = useCallback(async () => {
    if (!photographerProfile?.id) {
      console.warn('[OverviewPage] No photographer profile ID available')
      return
    }

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }))
      console.log('[OverviewPage] Fetching stats for photographer:', photographerProfile.id)

      // Store photographer data in local variables to avoid dependency on entire object
      const photographerId = photographerProfile.id
      const profileRating = photographerProfile.rating || 0
      const profileLnpChoice = photographerProfile.lnp_choice || false
      const profileStyleTags = photographerProfile.style_tags || []

      // Batch all queries using Promise.all for optimal performance
      const [
        { count: totalShoots, error: shootsError },
        { count: pendingRequests, error: pendingError },
        { data: completedBookings, error: completedError }
      ] = await Promise.all([
        // Total confirmed shoots
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('photographer_id', photographerId)
          .eq('booking_status', 'confirmed'),

        // Pending requests
        supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('photographer_id', photographerId)
          .eq('booking_status', 'pending'),

        // Completed bookings with ratings for average calculation
        supabase
          .from('bookings')
          .select('rating')
          .eq('photographer_id', photographerId)
          .eq('booking_status', 'completed')
          .not('rating', 'is', null)
      ])

      // Handle query errors
      if (shootsError) {
        console.error('[OverviewPage] Error fetching total shoots:', shootsError)
      }
      if (pendingError) {
        console.error('[OverviewPage] Error fetching pending requests:', pendingError)
      }
      if (completedError) {
        console.error('[OverviewPage] Error fetching completed bookings:', completedError)
      }

      // Calculate average rating from completed bookings
      let averageRating = 0
      if (completedBookings && completedBookings.length > 0) {
        const totalRating = completedBookings.reduce((sum, booking) => sum + (booking.rating || 0), 0)
        averageRating = totalRating / completedBookings.length
        console.log('[OverviewPage] Calculated average rating:', averageRating, 'from', completedBookings.length, 'bookings')
      } else {
        // Fallback to photographer profile rating if no booking ratings exist
        averageRating = profileRating
        console.log('[OverviewPage] Using profile rating as fallback:', averageRating)
      }

      // Extract photographer profile data
      const isLnpChoice = profileLnpChoice

      // Get top style tag (first from array, could be enhanced to find most common)
      let topStyleTag = null
      if (profileStyleTags && profileStyleTags.length > 0) {
        topStyleTag = profileStyleTags[0]
      }

      console.log('[OverviewPage] Stats fetched successfully:', {
        totalShoots: totalShoots || 0,
        pendingRequests: pendingRequests || 0,
        averageRating,
        isLnpChoice,
        topStyleTag
      })

      setStats({
        totalShoots: totalShoots || 0,
        averageRating: averageRating,
        pendingRequests: pendingRequests || 0,
        isLnpChoice: isLnpChoice,
        topStyleTag: topStyleTag,
        loading: false,
        error: null
      })

    } catch (err) {
      console.error('[OverviewPage] Error fetching stats:', err)
      toast.error('Failed to load dashboard stats')
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to load stats'
      }))
    }
  }, [photographerProfile?.id]) // Only depend on ID to prevent infinite loops

  // Initial data fetch - only run once when photographer profile loads
  useEffect(() => {
    // Guard: Only fetch if we have profile, auth is loaded, and profile ID exists
    if (!photographerProfile?.id || loading) {
      console.log('[OverviewPage] Skipping fetchStats - missing profile or still loading')
      return
    }

    console.log('[OverviewPage] Running initial fetchStats')
    fetchStats()
  }, [photographerProfile?.id, loading, fetchStats]) // Include fetchStats since it's memoized

  // Set up real-time subscription for bookings changes
  useEffect(() => {
    if (!photographerProfile?.id) return

    console.log('[OverviewPage] Setting up real-time subscription for photographer:', photographerProfile.id)

    // Create subscription to bookings table
    const channel = supabase
      .channel(`bookings-${photographerProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
          filter: `photographer_id=eq.${photographerProfile.id}`
        },
        (payload) => {
          console.log('[OverviewPage] Real-time booking change detected:', payload)
          // Refetch stats when any booking changes
          fetchStats()
        }
      )
      .subscribe((status) => {
        console.log('[OverviewPage] Subscription status:', status)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('[OverviewPage] Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [photographerProfile?.id, fetchStats]) // Include fetchStats in dependencies since it's memoized and stable

  // Show loading spinner while auth is loading
  if (loading) {
    console.log('[OverviewPage] Auth loading state, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Memoize profile completion calculation with detailed requirements
  const completionPercentage = useMemo(() => {
    let completed = 0
    const total = 5

    if (photographerProfile?.portfolio_images?.length >= 3) completed++
    if (photographerProfile?.bio?.length >= 50) completed++
    if (photographerProfile?.experience_years > 0) completed++
    if (photographerProfile?.style_tags?.length > 0) completed++
    if (photographerProfile?.gender?.length > 0) completed++

    return Math.round((completed / total) * 100)
  }, [photographerProfile])

  const quickActions = [
    {
      title: 'Update Profile',
      description: 'Manage your photos, bio, and experience',
      icon: User,
      link: '/talent/dashboard/profile',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Manage Calendar',
      description: 'Set your availability and view bookings',
      icon: Calendar,
      link: '/talent/dashboard/calendar',
      gradient: 'from-green-500 to-green-600'
    }
  ]

  // Helper to get rating color
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-gray-600'
  }

  // Helper to get pending color
  const getPendingColor = (count) => {
    if (count === 0) return 'text-gray-600'
    if (count <= 2) return 'text-yellow-600'
    return 'text-orange-600'
  }

  // Format rating display
  const formatRating = (rating) => {
    if (!rating || rating === 0) return '–'
    return rating.toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <Camera className="w-12 h-12 text-primary-600 mr-4" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.trim() || 'Photographer'}!
            </h1>
            <p className="mt-1 text-gray-600">
              Manage your profile and availability from your dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-600" aria-hidden="true" />
            Performance Stats
            {!stats.loading && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                (Real-time)
              </span>
            )}
          </h2>
          {stats.isLnpChoice && (
            <Badge
              variant="gold"
              size="md"
              className="font-bold shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              LnP Choice
            </Badge>
          )}
        </div>

        {stats.loading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-5 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : stats.error ? (
          // Error State
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              Failed to load stats. <button onClick={fetchStats} className="underline font-medium">Retry</button>
            </p>
          </div>
        ) : (
          // Stats Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Shoots */}
            <div
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200 hover:shadow-lg transition-all duration-300 cursor-default"
              title="Total confirmed bookings completed"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <Info className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {stats.totalShoots}
              </div>
              <div className="text-sm font-medium text-blue-700">
                Total Shoots
              </div>
            </div>

            {/* Average Rating */}
            <div
              className="group relative bg-gradient-to-br from-yellow-50 to-amber-100/50 rounded-xl p-5 border border-yellow-200 hover:shadow-lg transition-all duration-300 cursor-default"
              title="Your average customer rating from completed bookings"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <Info className="w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${getRatingColor(stats.averageRating)}`}>
                {formatRating(stats.averageRating)}
              </div>
              <div className="text-sm font-medium text-yellow-700 flex items-center">
                Average Rating
                {stats.averageRating > 0 && (
                  <Star className="w-3.5 h-3.5 ml-1 fill-yellow-500 text-yellow-500" />
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div
              className="group relative bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200 hover:shadow-lg transition-all duration-300 cursor-default"
              title="Booking requests awaiting your response"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <Info className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={`text-3xl font-bold mb-1 ${getPendingColor(stats.pendingRequests)}`}>
                {stats.pendingRequests}
              </div>
              <div className="text-sm font-medium text-orange-700">
                Pending Requests
              </div>
            </div>

            {/* Top Style Tag */}
            <div
              className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200 hover:shadow-lg transition-all duration-300 cursor-default"
              title="Your primary photography style"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <Info className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-lg font-bold text-purple-900 mb-1 truncate">
                {stats.topStyleTag || '–'}
              </div>
              <div className="text-sm font-medium text-purple-700">
                Top Style Tag
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <Link
                key={action.link}
                to={action.link}
                className="group relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`bg-gradient-to-br ${action.gradient} rounded-xl p-3 mr-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-300" aria-hidden="true" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Profile Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-primary-600" aria-hidden="true" />
          Profile Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Profile Visibility</span>
            <span className={`text-sm font-medium ${photographerProfile?.is_public ? 'text-green-600' : 'text-gray-600'}`}>
              {photographerProfile?.is_public ? 'Public' : 'Private'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Verification Status</span>
            <span className={`text-sm font-medium ${photographerProfile?.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {photographerProfile?.is_verified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Onboarding</span>
            <span className={`text-sm font-medium ${photographerProfile?.onboarding_completed ? 'text-green-600' : 'text-blue-600'}`}>
              {photographerProfile?.onboarding_completed ? 'Complete' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      {completionPercentage < 100 && (
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border-2 border-primary-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-primary-900 mb-1 flex items-center">
                Complete Your Profile
                <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary-600 text-white">
                  {completionPercentage}%
                </span>
              </h2>
              <p className="text-sm text-primary-700">
                To start receiving bookings, complete your profile by uploading photos and setting your availability.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-primary-200 rounded-full h-2.5 mb-4">
            <div
              className="bg-gradient-to-r from-primary-600 to-primary-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center text-primary-900">
              <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${photographerProfile?.portfolio_images?.length >= 3 ? 'bg-green-500' : 'bg-primary-300'}`}>
                {photographerProfile?.portfolio_images?.length >= 3 && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className={photographerProfile?.portfolio_images?.length >= 10 ? 'font-medium' : ''}>
                Upload at least 10 portfolio photos {photographerProfile?.portfolio_images?.length > 0 && `(${photographerProfile.portfolio_images.length}/10)`}
              </span>
            </div>
            <div className="flex items-center text-primary-900">
              <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${photographerProfile?.bio?.length >= 50 ? 'bg-green-500' : 'bg-primary-300'}`}>
                {photographerProfile?.bio?.length >= 50 && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className={photographerProfile?.bio?.length >= 50 ? 'font-medium' : ''}>
                Write a bio (at least 50 characters) {photographerProfile?.bio?.length > 0 && photographerProfile.bio.length < 50 && `(${photographerProfile.bio.length}/50)`}
              </span>
            </div>
            <div className="flex items-center text-primary-900">
              <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${photographerProfile?.experience_years > 0 ? 'bg-green-500' : 'bg-primary-300'}`}>
                {photographerProfile?.experience_years > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className={photographerProfile?.experience_years > 0 ? 'font-medium' : ''}>
                Set your years of experience
              </span>
            </div>
            <div className="flex items-center text-primary-900">
              <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${photographerProfile?.style_tags?.length > 0 ? 'bg-green-500' : 'bg-primary-300'}`}>
                {photographerProfile?.style_tags?.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className={photographerProfile?.style_tags?.length > 0 ? 'font-medium' : ''}>
                Select at least one photography style
              </span>
            </div>
            <div className="flex items-center text-primary-900">
              <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center flex-shrink-0 ${photographerProfile?.gender?.length > 0 ? 'bg-green-500' : 'bg-primary-300'}`}>
                {photographerProfile?.gender?.length > 0 && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className={photographerProfile?.gender?.length > 0 ? 'font-medium' : ''}>
                Select your gender
              </span>
            </div>
          </div>

          {completionPercentage < 100 && (
            <Link
              to="/talent/dashboard/profile?from=overview"
              className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
            >
              Complete Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default OverviewPage