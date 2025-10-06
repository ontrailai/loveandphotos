/**
 * Optimized hook for fetching photographers with batched queries and infinite scroll
 * Extends existing batchSupabaseQueries.js with modern React patterns
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { supabasePublic } from '@lib/supabase'
import { fetchPhotographerTrustMetrics } from '@utils/batchSupabaseQueries'
import { normalizeLocationQuery } from '@lib/utils/normalizeLocationQuery'
import { resolveZipToCity } from '@lib/server/resolveZipToCity'
import type {
  PhotographerProfile,
  PhotographersQueryParams,
  UsePhotographersBatchedReturn,
  FilterState,
  SortOption,
  TrustMetrics,
  BatchQueryResult
} from '@utils/photographers/types'
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_PAGE_SIZE
} from '@utils/photographers/types'

// Constants
const CACHE_KEY_PREFIX = 'photographers'
const STALE_TIME = 5 * 60 * 1000 // 5 minutes
const ERROR_RETRY_DELAY = 1000
const MAX_RETRIES = 3

// Cache for trust metrics to avoid repeated fetches
const trustMetricsCache = new Map<string, { data: TrustMetrics; timestamp: number }>()
const TRUST_METRICS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Build Supabase query with filters and sorting
 */
function buildPhotographersQuery(
  params: PhotographersQueryParams,
  offset: number = 0,
  limit: number = DEFAULT_PAGE_SIZE,
  locationCity?: string
) {
  const { filters, sortBy } = params

  let query = supabasePublic
    .from('photographers')
    .select('id, bio, portfolio_images, style_tags, experience_years, average_rating, total_reviews, is_verified, visible_in_search, profile_complete, user_id, city, state, zip_code, users!inner(full_name, avatar_url)', { count: 'exact' })
    .eq('visible_in_search', true)
    .eq('profile_complete', true)
    .range(offset, offset + limit - 1)

  // Apply filters
  if (filters.languages.length > 0) {
    query = query.overlaps('languages', filters.languages)
  }

  // Apply location filtering
  if (locationCity) {
    query = query.or(`city.ilike.%${locationCity}%,state.ilike.%${locationCity}%,zip_code.ilike.%${locationCity}%`)
  }

  // Apply sorting
  switch (sortBy) {
    case 'rating':
      query = query.order('average_rating', { ascending: false, nullsLast: true })
      break
    case 'reviews':
      query = query.order('total_reviews', { ascending: false, nullsLast: true })
      break
    case 'experience':
      query = query.order('years_experience', { ascending: false, nullsLast: true })
      break
    case 'recent':
      query = query.order('created_at', { ascending: false, nullsLast: true })
      break
    case 'available':
      query = query.order('is_available', { ascending: false })
      break
    case 'price_low':
      query = query.order('hourly_rate', { ascending: true, nullsLast: true })
      break
    case 'price_high':
      query = query.order('hourly_rate', { ascending: false, nullsLast: true })
      break
    default:
      query = query.order('average_rating', { ascending: false, nullsLast: true })
  }

  return query
}

/**
 * Transform raw photographer data to PhotographerProfile
 */
function transformPhotographerData(
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
    bio: rawData.bio || 'Professional photographer with years of experience',
    specialties: Array.isArray(rawData.style_tags) ? rawData.style_tags : ['Wedding', 'Portrait'],
    languages: Array.isArray(rawData.languages) ? rawData.languages : ['English'],
    years_experience: rawData.experience_years || 5,
    location_city: rawData.city || 'New York',
    location_state: rawData.state || 'NY',
    is_available: rawData.is_available !== false,
    is_public: true,
    is_verified: rawData.is_verified || false,
    is_love_and_photos_choice: rawData.is_love_and_photos_choice || false,
    average_rating: rawData.average_rating || 4.5,
    total_reviews: rawData.total_reviews || 10,
    total_bookings: rawData.total_bookings || 5,
    users: {
      full_name: rawData.users?.full_name || 'Photographer',
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
    // Trust metrics
    acceptance_rate: metrics.acceptance_rate,
    avg_response_time_minutes: metrics.avg_response_time_minutes,
    has_minimum_data: metrics.has_minimum_data || false,
    manual_override_acceptance_rate: metrics.manual_override_acceptance_rate,
    manual_override_response_time: metrics.manual_override_response_time,
    availability_level: 'high' // TODO: Calculate based on real metrics
  }
}

/**
 * Resolve location query to a city name for database filtering
 */
async function resolveLocationToCity(locationQuery: string): Promise<string | null> {
  if (!locationQuery.trim()) {
    return null
  }

  const normalized = normalizeLocationQuery(locationQuery)
  let cityKey = ''

  if (normalized.kind === 'zip' && normalized.zip) {
    // Try to resolve ZIP to city
    const resolved = await resolveZipToCity(supabasePublic, normalized.zip)
    if (resolved) {
      cityKey = resolved.city.toLowerCase()
    } else {
      // Unknown ZIP - return empty results
      throw new Error(`We don't recognize that ZIP code yet. Please try entering the city name instead.`)
    }
  } else if (normalized.kind === 'city' && normalized.city) {
    cityKey = normalized.city.toLowerCase()
  }

  return cityKey || null
}

/**
 * Apply location-based filtering (legacy - keeping for potential fallback)
 */
async function applyLocationFilter(
  photographers: any[],
  locationQuery: string
): Promise<any[]> {
  const cityKey = await resolveLocationToCity(locationQuery)

  if (cityKey) {
    return photographers.filter(p =>
      p.location_city?.toLowerCase().includes(cityKey) ||
      p.location_state?.toLowerCase().includes(cityKey)
    )
  }

  return photographers
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
        // Cache new metrics
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
  params: PhotographersQueryParams,
  offset: number = 0
): Promise<{ photographers: PhotographerProfile[]; hasMore: boolean; total: number }> {
  try {
    console.log('🔍 Fetching photographers with params:', params, 'offset:', offset)

    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-project')) {
      console.error('🚨 Supabase not configured - photographers will not load')
      return { photographers: [], hasMore: false, total: 0 }
    }

    // Resolve location before building query
    let locationCity: string | undefined
    if (params.filters.zip) {
      locationCity = await resolveLocationToCity(params.filters.zip) || undefined
    }

    console.log('🏗️ Building query with location:', locationCity)

    // Build and execute query with location filter
    const query = buildPhotographersQuery(params, offset, DEFAULT_PAGE_SIZE, locationCity)
    const { data: rawPhotographers, error, count } = await query

    console.log('📊 Query result:', {
      data: rawPhotographers?.length || 0,
      error: error?.message || null,
      count
    })

    if (error) {
      console.error('❌ Supabase query error:', error)
      throw new Error(`Failed to fetch photographers: ${error.message}`)
    }

    if (!rawPhotographers || rawPhotographers.length === 0) {
      console.log('📭 No photographers found')
      return { photographers: [], hasMore: false, total: count || 0 }
    }

    // No need for post-query location filtering - already handled by database
    // Fetch trust metrics for photographers that have user_id
    const userIds = rawPhotographers
      .filter(p => p.user_id)
      .map(p => p.user_id)

    const trustMetrics = userIds.length > 0
      ? await fetchTrustMetricsWithCache(userIds)
      : {}

    // Transform data
    console.log('🔄 Transforming data for', rawPhotographers.length, 'photographers')
    const photographers = rawPhotographers.map(p =>
      transformPhotographerData(p, trustMetrics)
    )

    console.log('✅ Transformation complete:', photographers.length, 'photographers processed')

    const hasMore = rawPhotographers.length === DEFAULT_PAGE_SIZE
    const total = count || photographers.length

    console.log('📤 Returning result:', { photographers: photographers.length, hasMore, total })
    return { photographers, hasMore, total }

  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

/**
 * Generate cache key for SWR
 */
function generateCacheKey(params: PhotographersQueryParams, offset: number = 0): string {
  const { filters, sortBy } = params
  const keyParts = [
    CACHE_KEY_PREFIX,
    sortBy,
    filters.tier,
    filters.languages.sort().join(','),
    filters.photographyStyle,
    filters.femaleOnly ? '1' : '0',
    filters.zip,
    filters.date,
    offset
  ]
  return keyParts.join('|')
}

/**
 * Custom hook for fetching photographers with batched queries and infinite scroll
 */
export function usePhotographersBatched(
  params: PhotographersQueryParams
): UsePhotographersBatchedReturn {
  const [allPhotographers, setAllPhotographers] = useState<PhotographerProfile[]>([])
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  // Generate cache key for current params
  const cacheKey = useMemo(() =>
    generateCacheKey(params, 0),
    [params]
  )

  // SWR for initial data
  const {
    data: initialData,
    error,
    isLoading,
    mutate
  } = useSWR(
    [cacheKey, params, 0],
    ([key, queryParams, offset]) => fetcherFunction(key, queryParams, offset),
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

  // Reset state when params change
  useEffect(() => {
    setAllPhotographers([])
    setCurrentOffset(0)
    setHasMore(true)
    setIsLoadingMore(false)
    retryCountRef.current = 0

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [cacheKey])

  // Update photographers when initial data changes
  useEffect(() => {
    console.log('📈 SWR initialData changed:', initialData)
    if (initialData) {
      console.log('📦 Setting photographers:', initialData.photographers.length, 'items')
      setAllPhotographers(initialData.photographers)
      setHasMore(initialData.hasMore)
      setCurrentOffset(initialData.photographers.length)
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
      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const nextOffset = currentOffset
      const nextData = await fetcherFunction(
        generateCacheKey(params, nextOffset),
        params,
        nextOffset
      )

      if (nextData.photographers.length > 0) {
        setAllPhotographers(prev => [...prev, ...nextData.photographers])
        setCurrentOffset(prev => prev + nextData.photographers.length)
        setHasMore(nextData.hasMore)
      } else {
        setHasMore(false)
      }

      retryCountRef.current = 0

    } catch (err) {
      console.error('Error fetching next page:', err)

      // Retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1
        setTimeout(() => {
          fetchNext()
        }, ERROR_RETRY_DELAY * retryCountRef.current)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, isLoading, currentOffset, params])

  // Refetch function
  const refetch = useCallback(async () => {
    setAllPhotographers([])
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
    data: allPhotographers,
    isLoading: isLoading || isLoadingMore,
    error: error?.message || null,
    hasMore,
    fetchNext,
    refetch,
    total: initialData?.total || allPhotographers.length,
    isEmpty: !isLoading && allPhotographers.length === 0
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

export default usePhotographersBatched
