/**
 * Supabase Query Builders for Photographers
 * Modular query building functions for filters and sorting
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  FilterState,
  SortOption,
  PhotographersQueryParams
} from './types'

/**
 * Base photographer fields to select
 */
export const BASE_PHOTOGRAPHER_FIELDS = `
  id,
  display_name,
  portfolio_images,
  bio,
  specialties,
  hourly_rate,
  location_city,
  location_state,
  average_rating,
  total_reviews,
  total_bookings,
  is_verified,
  is_available,
  user_id,
  languages,
  years_experience,
  created_at,
  updated_at
` as const

/**
 * Extended photographer fields including relationships
 */
export const EXTENDED_PHOTOGRAPHER_FIELDS = `
  ${BASE_PHOTOGRAPHER_FIELDS},
  is_love_and_photos_choice:is_lnp_choice
` as const

/**
 * Apply rating filter to query
 */
export function applyRatingFilter(query: any, rating: number) {
  if (rating > 0) {
    return query.gte('average_rating', rating)
  }
  return query
}

/**
 * Apply tier filter to query
 */
export function applyTierFilter(query: any, tier: string) {
  if (tier !== 'all') {
    // Note: This would need to be joined with pay_tiers table in a real implementation
    // For now, we'll use a simplified approach based on verification status
    switch (tier.toLowerCase()) {
      case 'platinum':
      case 'gold':
        return query.eq('is_verified', true)
      case 'silver':
      case 'bronze':
        return query.eq('is_verified', false)
      default:
        return query
    }
  }
  return query
}

/**
 * Apply specialties filter to query
 */
export function applySpecialtiesFilter(query: any, specialties: string[]) {
  if (specialties.length > 0) {
    return query.overlaps('specialties', specialties)
  }
  return query
}

/**
 * Apply languages filter to query
 */
export function applyLanguagesFilter(query: any, languages: string[]) {
  if (languages.length > 0) {
    return query.overlaps('languages', languages)
  }
  return query
}

/**
 * Apply location filter to query
 * Note: This is a basic text search. Real implementation might use PostGIS for geo-queries
 */
export function applyLocationFilter(query: any, locationQuery: string) {
  if (locationQuery.trim()) {
    const searchTerm = locationQuery.toLowerCase().trim()

    // Check if it looks like a ZIP code (5 digits)
    if (/^\d{5}$/.test(searchTerm)) {
      // For ZIP codes, we'd typically need a separate geo-lookup table
      // For now, return the query as-is (will be handled in post-processing)
      return query
    } else {
      // City/state search
      return query.or(`location_city.ilike.%${searchTerm}%,location_state.ilike.%${searchTerm}%`)
    }
  }
  return query
}

/**
 * Apply photography style filter
 */
export function applyStyleFilter(query: any, style: string) {
  if (style !== 'all') {
    // In a real implementation, this would filter by photography_style array field
    // For now, we'll skip this filter as it's not in the current schema
    return query
  }
  return query
}

/**
 * Apply female-only filter
 */
export function applyGenderFilter(query: any, femaleOnly: boolean) {
  if (femaleOnly) {
    return query.eq('is_female', true)
  }
  return query
}

/**
 * Apply availability filter
 */
export function applyAvailabilityFilter(query: any) {
  return query.eq('is_available', true)
}

/**
 * Apply date availability filter
 * Note: This would typically query the availability table
 */
export function applyDateFilter(query: any, date: string) {
  if (date) {
    // In a real implementation, this would join with availability table
    // For now, we'll just ensure they're marked as available
    return query.eq('is_available', true)
  }
  return query
}

/**
 * Apply price range filter
 */
export function applyPriceRangeFilter(
  query: any,
  priceRange?: { min?: number; max?: number }
) {
  if (priceRange) {
    if (priceRange.min !== undefined) {
      query = query.gte('hourly_rate', priceRange.min)
    }
    if (priceRange.max !== undefined) {
      query = query.lte('hourly_rate', priceRange.max)
    }
  }
  return query
}

/**
 * Apply sorting to query
 */
export function applySorting(query: any, sortBy: SortOption) {
  switch (sortBy) {
    case 'rating':
      return query
        .order('average_rating', { ascending: false, nullsLast: true })
        .order('total_reviews', { ascending: false, nullsLast: true })

    case 'reviews':
      return query
        .order('total_reviews', { ascending: false, nullsLast: true })
        .order('average_rating', { ascending: false, nullsLast: true })

    case 'experience':
      return query
        .order('years_experience', { ascending: false, nullsLast: true })
        .order('total_reviews', { ascending: false, nullsLast: true })

    case 'recent':
      return query
        .order('created_at', { ascending: false, nullsLast: true })

    case 'available':
      return query
        .order('is_available', { ascending: false })
        .order('average_rating', { ascending: false, nullsLast: true })

    case 'price_low':
      return query
        .order('hourly_rate', { ascending: true, nullsLast: true })
        .order('average_rating', { ascending: false, nullsLast: true })

    case 'price_high':
      return query
        .order('hourly_rate', { ascending: false, nullsLast: true })
        .order('average_rating', { ascending: false, nullsLast: true })

    case 'response_time':
      // This would order by fastest response time first
      return query
        .order('average_rating', { ascending: false, nullsLast: true })
        .order('total_reviews', { ascending: false, nullsLast: true })

    case 'closest':
      // This would require geo-distance calculation
      // For now, fall back to rating sort
      return query
        .order('average_rating', { ascending: false, nullsLast: true })
        .order('total_reviews', { ascending: false, nullsLast: true })

    default:
      return query
        .order('average_rating', { ascending: false, nullsLast: true })
        .order('total_reviews', { ascending: false, nullsLast: true })
  }
}

/**
 * Apply pagination to query
 */
export function applyPagination(
  query: any,
  offset: number = 0,
  limit: number = 50
) {
  return query.range(offset, offset + limit - 1)
}

/**
 * Build complete photographer query with all filters and sorting
 */
export function buildPhotographersQuery(
  supabase: SupabaseClient,
  params: PhotographersQueryParams,
  offset: number = 0,
  limit: number = 50
) {
  const { filters, sortBy } = params

  // Start with base query
  let query = supabase
    .from('photographer_preview_profiles')
    .select(BASE_PHOTOGRAPHER_FIELDS)

  // Apply all filters
  query = applyAvailabilityFilter(query)
  query = applyRatingFilter(query, filters.rating)
  query = applyTierFilter(query, filters.tier)
  query = applySpecialtiesFilter(query, filters.specialties)
  query = applyLanguagesFilter(query, filters.languages)
  query = applyLocationFilter(query, filters.zip)
  query = applyStyleFilter(query, filters.photographyStyle)
  query = applyGenderFilter(query, filters.femaleOnly)
  query = applyDateFilter(query, filters.date)
  query = applyPriceRangeFilter(query, filters.priceRange)

  // Apply sorting
  query = applySorting(query, sortBy)

  // Apply pagination
  query = applyPagination(query, offset, limit)

  return query
}

/**
 * Build photographer count query (for total results)
 */
export function buildPhotographersCountQuery(
  supabase: SupabaseClient,
  params: PhotographersQueryParams
) {
  const { filters } = params

  let query = supabase
    .from('photographer_preview_profiles')
    .select('id', { count: 'exact', head: true })

  // Apply same filters as main query (except sorting and pagination)
  query = applyAvailabilityFilter(query)
  query = applyRatingFilter(query, filters.rating)
  query = applyTierFilter(query, filters.tier)
  query = applySpecialtiesFilter(query, filters.specialties)
  query = applyLanguagesFilter(query, filters.languages)
  query = applyLocationFilter(query, filters.zip)
  query = applyStyleFilter(query, filters.photographyStyle)
  query = applyGenderFilter(query, filters.femaleOnly)
  query = applyDateFilter(query, filters.date)
  query = applyPriceRangeFilter(query, filters.priceRange)

  return query
}

/**
 * Build featured photographers query
 */
export function buildFeaturedPhotographersQuery(
  supabase: SupabaseClient,
  limit: number = 10
) {
  return supabase
    .from('photographer_preview_profiles')
    .select(BASE_PHOTOGRAPHER_FIELDS)
    .eq('is_available', true)
    .eq('is_verified', true)
    .gte('average_rating', 4.5)
    .gte('total_reviews', 10)
    .order('average_rating', { ascending: false })
    .order('total_reviews', { ascending: false })
    .limit(limit)
}

/**
 * Build photographer details query (for individual photographer page)
 */
export function buildPhotographerDetailsQuery(
  supabase: SupabaseClient,
  photographerId: string
) {
  return supabase
    .from('photographer_preview_profiles')
    .select(EXTENDED_PHOTOGRAPHER_FIELDS)
    .eq('id', photographerId)
    .single()
}

/**
 * Build nearby photographers query (requires location)
 */
export function buildNearbyPhotographersQuery(
  supabase: SupabaseClient,
  city: string,
  state: string,
  limit: number = 20
) {
  return supabase
    .from('photographer_preview_profiles')
    .select(BASE_PHOTOGRAPHER_FIELDS)
    .eq('is_available', true)
    .or(`location_city.ilike.%${city}%,location_state.ilike.%${state}%`)
    .order('average_rating', { ascending: false })
    .limit(limit)
}

/**
 * Validate and sanitize filter values
 */
export function sanitizeFilters(filters: FilterState): FilterState {
  return {
    zip: filters.zip?.trim()?.slice(0, 50) || '',
    date: filters.date || '',
    rating: Math.max(0, Math.min(5, filters.rating || 0)),
    tier: filters.tier || 'all',
    specialties: filters.specialties?.slice(0, 10) || [],
    languages: filters.languages?.slice(0, 10) || [],
    photographyStyle: filters.photographyStyle || 'all',
    femaleOnly: Boolean(filters.femaleOnly),
    priceRange: filters.priceRange ? {
      min: filters.priceRange.min ? Math.max(0, filters.priceRange.min) : undefined,
      max: filters.priceRange.max ? Math.max(0, filters.priceRange.max) : undefined
    } : undefined
  }
}

/**
 * Get filter summary for debugging/analytics
 */
export function getFilterSummary(filters: FilterState) {
  const activeFilters = []

  if (filters.zip) activeFilters.push(`location: ${filters.zip}`)
  if (filters.date) activeFilters.push(`date: ${filters.date}`)
  if (filters.rating > 0) activeFilters.push(`rating: ${filters.rating}+`)
  if (filters.tier !== 'all') activeFilters.push(`tier: ${filters.tier}`)
  if (filters.specialties.length > 0) activeFilters.push(`specialties: ${filters.specialties.join(', ')}`)
  if (filters.languages.length > 0) activeFilters.push(`languages: ${filters.languages.join(', ')}`)
  if (filters.photographyStyle !== 'all') activeFilters.push(`style: ${filters.photographyStyle}`)
  if (filters.femaleOnly) activeFilters.push('female only')
  if (filters.priceRange) {
    const { min, max } = filters.priceRange
    if (min && max) activeFilters.push(`price: $${min}-$${max}`)
    else if (min) activeFilters.push(`price: $${min}+`)
    else if (max) activeFilters.push(`price: up to $${max}`)
  }

  return {
    activeCount: activeFilters.length,
    summary: activeFilters.join(', ') || 'no filters',
    isEmpty: activeFilters.length === 0
  }
}

/**
 * Export utility functions for testing
 */
export const queryBuilderUtils = {
  applyRatingFilter,
  applyTierFilter,
  applySpecialtiesFilter,
  applyLanguagesFilter,
  applyLocationFilter,
  applyStyleFilter,
  applyGenderFilter,
  applyAvailabilityFilter,
  applyDateFilter,
  applyPriceRangeFilter,
  applySorting,
  applyPagination,
  sanitizeFilters,
  getFilterSummary
}

export default {
  buildPhotographersQuery,
  buildPhotographersCountQuery,
  buildFeaturedPhotographersQuery,
  buildPhotographerDetailsQuery,
  buildNearbyPhotographersQuery,
  ...queryBuilderUtils
}