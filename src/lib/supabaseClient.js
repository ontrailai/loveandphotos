/**
 * Dedicated Supabase client for Featured Photographers data
 * Uses ONLY real database data with proper error handling
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Format currency values for display
 */
export function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create Supabase client
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    storageKey: 'lovep-auth'
  }
})

/**
 * Fetch featured photographers with complete data only
 * Filters out any incomplete records (missing avatar_url, slug/id, etc.)
 */
export async function getFeaturedPhotographers(limit = 6) {
  try {
    const { data, error } = await supabaseClient
      .from('photographers')
      .select(`
        id,
        user_id,
        bio,
        is_verified,
        average_rating,
        total_reviews,
        completed_jobs_count,
        created_at,
        users!inner (
          id,
          full_name,
          avatar_url
        ),
        pay_tiers!inner (
          name,
          badge_color,
          hourly_rate
        )
      `)
      .eq('is_public', true)
      .not('users.avatar_url', 'is', null)
      .not('users.full_name', 'is', null)
      .order('average_rating', { ascending: false, nullsLast: true })
      .limit(limit)

    if (error) {
      console.error('Database query error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // Get location data for photographers
    const photographerIds = data.map(p => p.user_id);
    let locationData = {};
    if (photographerIds.length > 0) {
      const { data: locations } = await supabaseClient
        .from('photographer_preview_profiles')
        .select('user_id, location_city, location_state')
        .in('user_id', photographerIds);

      if (locations) {
        locationData = locations.reduce((acc, loc) => {
          acc[loc.user_id] = {
            city: loc.location_city,
            state: loc.location_state
          };
          return acc;
        }, {});
      }
    }

    // Transform data to component format, filtering out incomplete records
    const photographers = data
      .filter(photographer => {
        // Strict filtering: must have all required fields
        return photographer.users?.avatar_url &&
               photographer.users?.full_name &&
               photographer.id &&
               photographer.users?.id
      })
      .map(photographer => {
        const location = locationData[photographer.user_id] || {};
        return {
          id: photographer.id,
          slug: photographer.id, // Use id as slug for routing
          full_name: photographer.users.full_name,
          avatar_url: photographer.users.avatar_url,
          city: location.city,
          state: location.state,
          created_at: photographer.created_at,
          joinedDate: new Date(photographer.created_at).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          }),
          average_rating: photographer.average_rating || 0,
          weddings_completed: photographer.completed_jobs_count || 0,
          vetted: photographer.is_verified || false,
          tier: photographer.pay_tiers?.name || 'Bronze',
          tierColor: photographer.pay_tiers?.badge_color || '#cd7f32',
          total_reviews: photographer.total_reviews || 0,
          bio: photographer.bio,
          hourly_rate: photographer.pay_tiers?.hourly_rate
        };
      })

    return photographers
  } catch (error) {
    console.error('Error fetching featured photographers:', error)
    throw error // Re-throw to handle at component level
  }
}

/**
 * Get booking acceptance rate for featured photographers
 * Calculate weighted acceptance rate across the featured photographer set
 */
export async function getFeaturedPhotographersAcceptanceRate(photographerIds) {
  try {
    if (!photographerIds || photographerIds.length === 0) {
      return null
    }

    const { data, error } = await supabaseClient
      .from('photographers')
      .select('booking_acceptance_rate')
      .in('id', photographerIds)
      .not('booking_acceptance_rate', 'is', null)

    if (error) {
      console.error('Error fetching booking acceptance rates:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return null // Not enough data
    }

    // Calculate average acceptance rate across featured photographers
    const acceptanceRates = data
      .map(p => parseFloat(p.booking_acceptance_rate))
      .filter(rate => !isNaN(rate) && rate > 0)

    if (acceptanceRates.length < 3) { // Minimum threshold for reliable stats
      return null
    }

    // Calculate weighted average (simple average for now)
    const averageRate = acceptanceRates.reduce((sum, rate) => sum + rate, 0) / acceptanceRates.length
    return parseFloat(averageRate.toFixed(1))
  } catch (error) {
    console.error('Error calculating acceptance rate:', error)
    throw error
  }
}

/**
 * Get 5-star review percentage for featured photographers
 * Calculate percentage of reviews with 5-star rating
 */
export async function getFeaturedPhotographers5StarReviews(photographerIds) {
  try {
    if (!photographerIds || photographerIds.length === 0) {
      return null
    }

    const { data, error } = await supabaseClient
      .from('reviews')
      .select('rating, photographer_id')
      .in('photographer_id', photographerIds)
      .not('rating', 'is', null)

    if (error) {
      console.error('Error fetching review data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return null // Not enough data
    }

    // Count 5-star vs total reviews
    const totalReviews = data.length
    const fiveStarReviews = data.filter(review =>
      parseInt(review.rating) === 5
    ).length

    if (totalReviews < 3) { // Minimum threshold for reliable stats
      return null
    }

    const fiveStarPercentage = (fiveStarReviews / totalReviews) * 100
    return parseFloat(fiveStarPercentage.toFixed(1))
  } catch (error) {
    console.error('Error calculating 5-star review percentage:', error)
    throw error
  }
}

/**
 * Get median response time for featured photographers
 * Use existing response_time_hours field from photographers table
 */
export async function getFeaturedPhotographersResponseTime(photographerIds) {
  try {
    if (!photographerIds || photographerIds.length === 0) {
      return null
    }

    const { data, error } = await supabaseClient
      .from('photographers')
      .select('response_time_hours, id')
      .in('id', photographerIds)
      .not('response_time_hours', 'is', null)

    if (error) {
      console.error('Error fetching response time data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return null // Not enough data
    }

    // Get response times and calculate median
    const responseTimes = data
      .map(p => parseFloat(p.response_time_hours))
      .filter(time => !isNaN(time) && time > 0)
      .sort((a, b) => a - b)

    if (responseTimes.length < 3) { // Minimum threshold for reliable stats
      return null
    }

    // Calculate median
    const middle = Math.floor(responseTimes.length / 2)
    const median = responseTimes.length % 2 === 0
      ? (responseTimes[middle - 1] + responseTimes[middle]) / 2
      : responseTimes[middle]

    return parseFloat(median.toFixed(1))
  } catch (error) {
    console.error('Error calculating response time:', error)
    throw error
  }
}

/**
 * Get all three metrics for featured photographers stats bar
 * Combines all metrics into a single object with proper null handling
 */
export async function getFeaturedPhotographersMetrics(photographerIds) {
  try {
    if (!photographerIds || photographerIds.length === 0) {
      return {
        acceptanceRate: null,
        fiveStarReviews: null,
        responseTime: null
      }
    }

    // Run all metric calculations in parallel for efficiency
    const [acceptanceRate, fiveStarReviews, responseTime] = await Promise.all([
      getFeaturedPhotographersAcceptanceRate(photographerIds),
      getFeaturedPhotographers5StarReviews(photographerIds),
      getFeaturedPhotographersResponseTime(photographerIds)
    ])

    return {
      acceptanceRate,
      fiveStarReviews,
      responseTime
    }
  } catch (error) {
    console.error('Error fetching featured photographers metrics:', error)
    throw error
  }
}

/**
 * Get photographer profile link
 * Returns proper routing path or null if not available
 */
export function getPhotographerProfileLink(photographer) {
  if (photographer.slug) {
    return `/photographers/${photographer.slug}`
  } else if (photographer.id) {
    return `/photographers/${photographer.id}`
  }
  return null // Return null to hide button if no valid link
}