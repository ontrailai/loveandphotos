import { useState, useEffect } from 'react'
import { CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import Card from '@components/ui/Card'
import { supabasePublic } from '@lib/supabase'

const PhotographerStatsCard = ({ photographerUserId }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [photographerUserId])

  const loadStats = async () => {
    if (!photographerUserId) {
      console.log('PhotographerStatsCard: No user ID provided, skipping stats load')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('PhotographerStatsCard: Loading stats for user_id:', photographerUserId)

      // Call the Supabase function to get stats
      const { data, error: statsError } = await supabasePublic
        .rpc('get_photographer_stats', { photographer_user_id: photographerUserId })
        .single()

      if (statsError) {
        console.error('Error loading photographer stats:', statsError)
        setError('Unable to load statistics')
        return
      }

      setStats(data)
    } catch (err) {
      console.error('Error in loadStats:', err)
      setError('Unable to load statistics')
    } finally {
      setLoading(false)
    }
  }

  // Format response time for display
  const formatResponseTime = (hours) => {
    if (!hours || hours === 0) return 'N/A'
    
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`
    } else if (hours < 24) {
      return `${Math.round(hours)} hr${Math.round(hours) !== 1 ? 's' : ''}`
    } else {
      const days = Math.round(hours / 24)
      return `${days} day${days !== 1 ? 's' : ''}`
    }
  }

  // Get color for acceptance rate
  const getAcceptanceRateColor = (rate) => {
    if (!rate) return 'text-gray-500'
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get color for response time
  const getResponseTimeColor = (hours) => {
    if (!hours) return 'text-gray-500'
    if (hours <= 4) return 'text-green-600'
    if (hours <= 24) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card className="animate-pulse w-full">
        <h3 className="font-semibold text-dusty-900 mb-4 text-base sm:text-lg">Performance Stats</h3>
        <div className="space-y-4">
          <div className="h-14 sm:h-16 bg-gray-100 rounded"></div>
          <div className="h-14 sm:h-16 bg-gray-100 rounded"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <h3 className="font-semibold text-dusty-900 mb-4 text-base sm:text-lg">Performance Stats</h3>
        <div className="text-center py-3 sm:py-4 text-dusty-600">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-xs sm:text-sm">{error}</p>
        </div>
      </Card>
    )
  }

  // If no stats or not enough data
  if (!stats || !stats.has_enough_data) {
    return (
      <Card className="w-full">
        <h3 className="font-semibold text-dusty-900 mb-4 text-base sm:text-lg">Performance Stats</h3>
        <div className="text-center py-3 sm:py-4 text-dusty-600">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-xs sm:text-sm font-medium mb-1">Building Track Record</p>
          <p className="text-xs text-dusty-500 px-2">
            Not enough data yet. Stats will appear after more bookings.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <h3 className="font-semibold text-dusty-900 mb-4 text-base sm:text-lg">Performance Stats</h3>
      
      <div className="space-y-4">
        {/* Acceptance Rate */}
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-0 mb-1">
              <span className="text-xs sm:text-sm font-medium text-dusty-700">
                Acceptance Rate
              </span>
              <span className={`text-xl sm:text-2xl font-bold ${getAcceptanceRateColor(stats.acceptance_rate)}`}>
                {stats.acceptance_rate}%
              </span>
            </div>
            <div className="text-xs text-dusty-500 break-words">
              {stats.accepted_offers} of {stats.total_offers} offers accepted
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-0 mb-1">
              <span className="text-xs sm:text-sm font-medium text-dusty-700">
                Avg Response Time
              </span>
              <span className={`text-xl sm:text-2xl font-bold ${getResponseTimeColor(stats.avg_response_time_hours)}`}>
                {formatResponseTime(stats.avg_response_time_hours)}
              </span>
            </div>
            <div className="text-xs text-dusty-500 break-words">
              Typically responds within {formatResponseTime(stats.avg_response_time_hours)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
        <p className="text-xs text-dusty-500 text-center">
          Based on last 6 months of activity
        </p>
      </div>
    </Card>
  )
}

export default PhotographerStatsCard