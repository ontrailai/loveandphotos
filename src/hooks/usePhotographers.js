/**
 * usePhotographers Hook
 * Handles photographer data fetching with SWR for stability and proper error handling
 */

import useSWR from 'swr'
import { supabasePublic } from '@lib/supabase'

// Fetcher function with comprehensive error handling
const photographersFetcher = async (key) => {
  const [_, filters] = key

  // Build the query
  let query = supabasePublic
    .from('photographer_preview_profiles')
    .select('*')
    .eq('is_available', true)
    .limit(1000)

  // Apply date filter if provided
  if (filters?.date) {
    // For date filtering, we'll need to join with availability table
    // This is a placeholder - actual implementation depends on your schema
    query = query.gte('next_available_date', filters.date)
  }

  // Apply location filter
  if (filters?.location) {
    const searchTerm = filters.location.toLowerCase()
    query = query.or(`location_city.ilike.%${searchTerm}%,location_state.ilike.%${searchTerm}%`)
  }

  // Apply price range filter
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    if (filters.minPrice !== undefined) {
      query = query.gte('hourly_rate', filters.minPrice)
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== 9999) {
      query = query.lte('hourly_rate', filters.maxPrice)
    }
  }

  // Apply rating filter
  if (filters?.minRating) {
    query = query.gte('average_rating', filters.minRating)
  }

  // Execute query with timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout - please try again')), 10000)
  )

  try {
    const queryPromise = query
    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    if (error) {
      console.error('Supabase query error:', error)
      throw new Error(error.message || 'Failed to load photographers')
    }

    if (!data) {
      return []
    }

    // Transform data to ensure consistency
    return data.map(transformPhotographer)

  } catch (err) {
    console.error('Fetcher error:', err)
    throw err
  }
}

// Transform photographer data to consistent format
const transformPhotographer = (profile) => {
  // Ensure specialties is always an array
  let specialties = []
  if (Array.isArray(profile.specialties)) {
    specialties = profile.specialties
  } else if (typeof profile.specialties === 'string') {
    specialties = profile.specialties.split(',').map(s => s.trim())
  } else {
    specialties = ['Wedding', 'Portrait'] // Default fallback
  }

  // Get profile image with fallback
  const getProfileImage = () => {
    if (profile.portfolio_images && profile.portfolio_images.length > 0) {
      return profile.portfolio_images[0]
    }
    // Use a stable fallback based on ID to avoid image changes
    const fallbackIndex = profile.id ?
      parseInt(profile.id.replace(/\D/g, '').slice(-2)) % 30 :
      0
    return `https://images.unsplash.com/photo-${1500000000000 + fallbackIndex}-placeholder?w=400&h=400&fit=crop&crop=face&auto=format&q=80`
  }

  return {
    id: profile.id,
    display_name: profile.display_name || 'Professional Photographer',
    bio: profile.bio || 'Experienced photographer specializing in capturing your special moments',
    specialties,
    languages: profile.languages || ['English'],
    hourly_rate: profile.hourly_rate || 150,
    location_city: profile.location_city || 'Unknown',
    location_state: profile.location_state || '',
    is_available: profile.is_available !== false,
    is_verified: profile.is_verified || false,
    average_rating: profile.average_rating || 0,
    total_reviews: profile.total_reviews || 0,
    avatar_url: getProfileImage(),
    portfolio_images: profile.portfolio_images || [],
    tier: profile.is_verified ? 'Professional' : 'Standard',
    badge_color: profile.is_verified ? 'gold' : 'silver'
  }
}

// Main hook
export const usePhotographers = (filters = {}) => {
  // Create stable cache key from filters
  const cacheKey = ['photographers', {
    date: filters.date || null,
    location: filters.zip || null,
    minPrice: filters.priceRange === 'all' ? null : parseInt(filters.priceRange.split('-')[0]) || null,
    maxPrice: filters.priceRange === 'all' ? null :
      (filters.priceRange.includes('+') ? 9999 : parseInt(filters.priceRange.split('-')[1])) || null,
    minRating: filters.rating || null,
    specialties: filters.specialties?.sort().join(',') || null,
    languages: filters.languages?.sort().join(',') || null
  }]

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    photographersFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      shouldRetryOnError: (err) => {
        // Don't retry on 4xx errors
        if (err?.code && err.code >= 400 && err.code < 500) {
          return false
        }
        return true
      },
      onError: (err) => {
        console.error('SWR error:', err)
      }
    }
  )

  // Apply client-side filters that can't be done in the query
  let filteredData = data || []

  if (filteredData.length > 0) {
    // Filter by specialties
    if (filters.specialties && filters.specialties.length > 0) {
      filteredData = filteredData.filter(p =>
        filters.specialties.some(specialty =>
          p.specialties.includes(specialty)
        )
      )
    }

    // Filter by languages
    if (filters.languages && filters.languages.length > 0) {
      filteredData = filteredData.filter(p =>
        filters.languages.some(language =>
          p.languages.includes(language)
        )
      )
    }

    // Filter by tier
    if (filters.tier && filters.tier !== 'all') {
      filteredData = filteredData.filter(p =>
        p.tier.toLowerCase() === filters.tier.toLowerCase()
      )
    }
  }

  return {
    photographers: filteredData,
    isLoading,
    error,
    isEmpty: !isLoading && !error && filteredData.length === 0,
    refresh: mutate,
    totalCount: filteredData.length
  }
}

// Export helper to preload data
export const preloadPhotographers = (filters = {}) => {
  const cacheKey = ['photographers', filters]
  return photographersFetcher(cacheKey)
}