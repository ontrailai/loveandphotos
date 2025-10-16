/**
 * Hook for fetching videographers with batched queries
 * Similar to usePhotographersBatched but filters for is_videographer = true
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { supabasePublic } from '@lib/supabase'
import { fetchPhotographerTrustMetrics } from '@utils/batchSupabaseQueries'
import type {
  PhotographerProfile,
  UsePhotographersBatchedReturn,
  TrustMetrics
} from '@utils/photographers/types'

// Constants
const CACHE_KEY_PREFIX = 'videographers'
const DEFAULT_PAGE_SIZE = 12
const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const ERROR_RETRY_DELAY = 1000
const MAX_RETRIES = 3

// Cache for trust metrics
const trustMetricsCache = new Map<string, { data: TrustMetrics; timestamp: number }>()
const TRUST_METRICS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Build Supabase query for videographers
 */
function buildVideographersQuery(offset: number = 0, limit: number = DEFAULT_PAGE_SIZE, stateFilter?: string) {
  let query = supabasePublic
    .from('photographers')
    .select('id, bio, portfolio_images, style_tags, experience_years, average_rating, total_reviews, is_verified, visible_in_search, profile_complete, user_id, city, state, zip_code, is_videographer, gear_has_camera, gear_has_lenses, gear_has_tripod, gear_has_gimbal, gear_has_audio_recorder, gear_has_lighting, users!inner(full_name, avatar_url)', { count: 'exact' })
    .eq('visible_in_search', true)
    .eq('profile_complete', true)
    .eq('is_videographer', true) // Only fetch videographers

  // Apply state filter if provided
  if (stateFilter) {
    query = query.eq('state', stateFilter)
  }

  return query
    .order('average_rating', { ascending: false, nullsLast: true })
    .range(offset, offset + limit - 1)
}

/**
 * Transform raw videographer data to PhotographerProfile
 */
function transformVideographerData(
  rawData: any,
  trustMetrics: Record<string, TrustMetrics> = {}
): PhotographerProfile {
  const fallbackImages = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
  ]

  const portfolioImages = [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600'
  ]

  const metrics = trustMetrics[rawData.user_id] || {}

  return {
    id: rawData.id,
    user_id: rawData.user_id || rawData.id,
    bio: rawData.bio || 'Professional videographer with years of experience',
    specialties: Array.isArray(rawData.style_tags) ? rawData.style_tags : ['Wedding', 'Event'],
    languages: Array.isArray(rawData.languages) ? rawData.languages : ['English'],
    years_experience: rawData.experience_years || 5,
    location_city: rawData.city || 'New York',
    location_state: rawData.state || 'NY',
    is_available: rawData.is_available !== false,
    is_public: true,
    is_verified: rawData.is_verified || false,
    is_love_and_photos_choice: rawData.is_love_and_photos_choice || false,
    is_videographer: true,
    average_rating: rawData.average_rating || 4.5,
    total_reviews: rawData.total_reviews || 10,
    total_bookings: rawData.total_bookings || 5,
    users: {
      full_name: rawData.users?.full_name || 'Videographer',
      avatar_url: rawData.users?.avatar_url || rawData.portfolio_images?.[0] || fallbackImages[0]
    },
    pay_tiers: {
      name: rawData.is_verified ? 'Professional' : 'Standard',
      hourly_rate: Number(rawData.hourly_rate) || 150,
      badge_color: rawData.is_verified ? 'gold' : 'silver'
    },
    portfolio_items: rawData.portfolio_images
      ? rawData.portfolio_images.slice(0, 4).map((url: string) => ({ image_url: url }))
      : [
          { image_url: portfolioImages[0] },
          { image_url: portfolioImages[1] }
        ],
    // Gear details for videographers
    gear_has_camera: rawData.gear_has_camera || false,
    gear_has_lenses: rawData.gear_has_lenses || false,
    gear_has_tripod: rawData.gear_has_tripod || false,
    gear_has_gimbal: rawData.gear_has_gimbal || false,
    gear_has_audio_recorder: rawData.gear_has_audio_recorder || false,
    gear_has_lighting: rawData.gear_has_lighting || false,
    // Trust metrics
    acceptance_rate: metrics.acceptance_rate,
    avg_response_time_minutes: metrics.avg_response_time_minutes,
    has_minimum_data: metrics.has_minimum_data || false,
    manual_override_acceptance_rate: metrics.manual_override_acceptance_rate,
    manual_override_response_time: metrics.manual_override_response_time,
    availability_level: 'high'
  }
}

/**
 * Fetch trust metrics with caching
 */
async function fetchTrustMetricsWithCache(userIds: string[]): Promise<Record<string, TrustMetrics>> {
  const now = Date.now()
  const uncachedIds: string[] = []
  const cachedMetrics: Record<string, TrustMetrics> = {}

  // Check cache first
  for (const userId of userIds) {
    const cached = trustMetricsCache.get(userId)
    if (cached && (now - cached.timestamp) < TRUST_METRICS_CACHE_TTL) {
      cachedMetrics[userId] = cached.data
    } else {
      uncachedIds.push(userId)
    }
  }

  // Fetch uncached metrics
  if (uncachedIds.length > 0) {
    try {
      const { data: metricsData, error } = await fetchPhotographerTrustMetrics(supabasePublic, uncachedIds)

      if (error) {
        console.warn('Trust metrics query had issues:', error)
      }

      if (metricsData && metricsData.length > 0) {
        metricsData.forEach((metric: TrustMetrics) => {
          trustMetricsCache.set(metric.user_id, {
            data: metric,
            timestamp: now
          })
          cachedMetrics[metric.user_id] = metric
        })
      }
    } catch (error) {
      console.error('Failed to fetch trust metrics:', error)
    }
  }

  return cachedMetrics
}

/**
 * SWR fetcher function
 */
async function fetcherFunction(
  key: string,
  offset: number = 0,
  stateFilter?: string
): Promise<{ videographers: PhotographerProfile[]; hasMore: boolean; total: number }> {
  try {
    console.log('🎥 Fetching videographers, offset:', offset, 'state filter:', stateFilter)

    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) {
      console.error('🚨 Supabase not configured - videographers will not load')
      return { videographers: [], hasMore: false, total: 0 }
    }

    const query = buildVideographersQuery(offset, DEFAULT_PAGE_SIZE, stateFilter)
    const { data: rawVideographers, error, count } = await query

    console.log('📊 Videographers query result:', {
      data: rawVideographers?.length || 0,
      error: error?.message || null,
      count
    })

    if (error) {
      console.error('❌ Supabase query error:', error)
      throw new Error(`Failed to fetch videographers: ${error.message}`)
    }

    if (!rawVideographers || rawVideographers.length === 0) {
      console.log('📭 No videographers found')
      return { videographers: [], hasMore: false, total: count || 0 }
    }

    // Fetch trust metrics
    const userIds = rawVideographers
      .filter(v => v.user_id)
      .map(v => v.user_id)

    const trustMetrics = userIds.length > 0
      ? await fetchTrustMetricsWithCache(userIds)
      : {}

    // Transform data
    console.log('🔄 Transforming data for', rawVideographers.length, 'videographers')
    const videographers = rawVideographers.map(v =>
      transformVideographerData(v, trustMetrics)
    )

    console.log('✅ Transformation complete:', videographers.length, 'videographers processed')

    const hasMore = rawVideographers.length === DEFAULT_PAGE_SIZE
    const total = count || videographers.length

    console.log('📤 Returning result:', { videographers: videographers.length, hasMore, total })
    return { videographers, hasMore, total }

  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

/**
 * Custom hook for fetching videographers with infinite scroll
 * @param stateFilter - Optional state abbreviation to filter videographers by location
 */
export function useVideographersBatched(stateFilter?: string): UsePhotographersBatchedReturn {
  const [allVideographers, setAllVideographers] = useState<PhotographerProfile[]>([])
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  // SWR for initial data
  const {
    data: initialData,
    error,
    isLoading,
    mutate
  } = useSWR(
    [CACHE_KEY_PREFIX, 0, stateFilter],
    ([key, offset, state]) => fetcherFunction(key, offset, state),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: STALE_TIME,
      errorRetryInterval: ERROR_RETRY_DELAY,
      errorRetryCount: MAX_RETRIES,
      onError: (err) => {
        console.error('SWR error:', err)
        retryCountRef.current += 1
      }
    }
  )

  // Reset state when cache key changes (including state filter)
  useEffect(() => {
    setAllVideographers([])
    setCurrentOffset(0)
    setHasMore(true)
    setIsLoadingMore(false)
    retryCountRef.current = 0

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [CACHE_KEY_PREFIX, stateFilter])

  // Update videographers when initial data changes
  useEffect(() => {
    console.log('📈 SWR initialData changed:', initialData)
    if (initialData) {
      console.log('📦 Setting videographers:', initialData.videographers.length, 'items')
      setAllVideographers(initialData.videographers)
      setHasMore(initialData.hasMore)
      setCurrentOffset(initialData.videographers.length)
    } else {
      console.log('❌ No initialData available')
    }
  }, [initialData])

  // Fetch next page for infinite scroll
  const fetchNext = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) {
      return
    }

    setIsLoadingMore(true)

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const nextOffset = currentOffset
      const nextData = await fetcherFunction(CACHE_KEY_PREFIX, nextOffset, stateFilter)

      if (nextData.videographers.length > 0) {
        setAllVideographers(prev => [...prev, ...nextData.videographers])
        setCurrentOffset(prev => prev + nextData.videographers.length)
        setHasMore(nextData.hasMore)
      } else {
        setHasMore(false)
      }

      retryCountRef.current = 0

    } catch (err) {
      console.error('Error fetching next page:', err)

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1
        setTimeout(() => {
          fetchNext()
        }, ERROR_RETRY_DELAY * retryCountRef.current)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, isLoading, currentOffset, stateFilter])

  // Refetch function
  const refetch = useCallback(async () => {
    setAllVideographers([])
    setCurrentOffset(0)
    setHasMore(true)
    retryCountRef.current = 0
    await mutate()
  }, [mutate])

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const result = {
    data: allVideographers,
    isLoading: isLoading || isLoadingMore,
    error: error?.message || null,
    hasMore,
    fetchNext,
    refetch,
    total: initialData?.total || allVideographers.length,
    isEmpty: !isLoading && allVideographers.length === 0
  }

  console.log('🎯 Hook returning:', {
    dataLength: result.data.length,
    isLoading: result.isLoading,
    error: result.error,
    isEmpty: result.isEmpty,
    total: result.total
  })

  return result
}

export default useVideographersBatched
