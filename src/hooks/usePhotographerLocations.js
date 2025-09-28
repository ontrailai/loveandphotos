/**
 * usePhotographerLocations Hook
 * Data adapter for photographer location fetching
 * Currently returns mock data - prepared for future Supabase integration
 */

import { useState, useEffect } from 'react'
// TODO: Import useSWR and supabase for future integration
// import useSWR from 'swr'
// import { supabase } from '@lib/supabase'

// Mock data for development and testing
// TODO: Remove when Supabase integration is complete
const MOCK_LOCATIONS = [
  {
    id: 'loc-coronado-beach',
    photographerId: 'photographer-123',
    title: 'Coronado Island Beach',
    vibe: 'Beautiful beach',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&auto=format',
    badge: 'Local\'s Choice',
    description: 'Stunning beach with golden sand and perfect sunset views. This iconic San Diego location offers dramatic coastline backdrops and is perfect for romantic sessions.'
  },
  {
    id: 'loc-balboa-park',
    photographerId: 'photographer-123',
    title: 'Balboa Park Gardens',
    vibe: 'Lush greenery',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&auto=format',
    badge: 'Most Booked',
    description: 'Beautiful botanical gardens with diverse landscapes, from rose gardens to exotic plants. Multiple scenic spots within walking distance.'
  },
  {
    id: 'loc-gaslamp-quarter',
    photographerId: 'photographer-123',
    title: 'Gaslamp Quarter',
    vibe: 'Urban chic',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&auto=format',
    badge: null,
    description: 'Historic downtown district with Victorian architecture, vintage street lamps, and urban backdrops. Great for modern city vibes.'
  },
  {
    id: 'loc-sunset-cliffs',
    photographerId: 'photographer-123',
    title: 'Sunset Cliffs',
    vibe: 'Dramatic coastline',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format',
    badge: null,
    description: 'Rugged coastal cliffs with spectacular ocean views and golden hour lighting. Perfect for adventurous couples and dramatic portraits.'
  },
  {
    id: 'loc-la-jolla-cove',
    photographerId: 'photographer-123',
    title: 'La Jolla Cove',
    vibe: 'Pristine waters',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&auto=format',
    badge: 'Local\'s Choice',
    description: 'Crystal clear waters with unique rock formations and sea life. One of San Diego\'s most photographed locations with year-round beauty.'
  },
  {
    id: 'loc-liberty-station',
    photographerId: 'photographer-123',
    title: 'Liberty Public Market',
    vibe: 'Artsy industrial',
    imageUrl: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop&auto=format',
    badge: null,
    description: 'Converted naval training center with modern art installations, industrial architecture, and creative backdrops. Great for contemporary sessions.'
  }
]

// Different mock data for different photographers to simulate variety
const MOCK_LOCATIONS_ALT = [
  {
    id: 'loc-pacific-beach',
    photographerId: 'photographer-456',
    title: 'Pacific Beach Pier',
    vibe: 'Coastal vibes',
    imageUrl: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop&auto=format',
    badge: 'Most Booked',
    description: 'Classic Southern California beach scene with long pier and sandy shoreline. Perfect for casual, beachy engagement sessions.'
  },
  {
    id: 'loc-mission-trails',
    photographerId: 'photographer-456',
    title: 'Mission Trails Park',
    vibe: 'Natural hiking',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&auto=format',
    badge: 'Local\'s Choice',
    description: 'Expansive hiking trails with desert landscapes and mountain views. Great for adventurous couples who love the outdoors.'
  },
  {
    id: 'loc-old-town',
    photographerId: 'photographer-456',
    title: 'Old Town Historic Park',
    vibe: 'Historic charm',
    imageUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop&auto=format',
    badge: null,
    description: 'Authentic Mexican village atmosphere with colorful buildings and historic architecture. Rich cultural backdrop for unique sessions.'
  }
]

/**
 * Mock implementation for development
 * TODO: Replace with real Supabase integration
 */
const usePhotographerLocationsMock = (photographerId) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [photographerId])

  // Return different mock data based on photographer ID
  const locations = photographerId === 'photographer-456'
    ? MOCK_LOCATIONS_ALT
    : MOCK_LOCATIONS

  return {
    locations: isLoading ? [] : locations,
    isLoading,
    error
  }
}

/**
 * Future Supabase implementation (TODO)
 *
 * Database Schema:
 * ```sql
 * CREATE TABLE photographer_locations (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
 *   title TEXT NOT NULL,
 *   vibe TEXT, -- 1-3 word excerpt
 *   image_url TEXT,
 *   badge TEXT CHECK (badge IN ('Local''s Choice', 'Most Booked')),
 *   description TEXT, -- full description for modal
 *   is_active BOOLEAN DEFAULT true,
 *   sort_order INTEGER DEFAULT 0,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * CREATE INDEX idx_photographer_locations_active
 *   ON photographer_locations(photographer_id, is_active, sort_order);
 * ```
 */
/*
const usePhotographerLocationsSupabase = (photographerId) => {
  const { data, error, isLoading } = useSWR(
    photographerId ? ['photographer_locations', photographerId] : null,
    async () => {
      const { data, error } = await supabase
        .from('photographer_locations')
        .select('*')
        .eq('photographer_id', photographerId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000
    }
  )

  return {
    locations: data || [],
    isLoading,
    error
  }
}
*/

/**
 * Main hook export - currently using mock implementation
 * TODO: Switch to usePhotographerLocationsSupabase when ready
 */
export const usePhotographerLocations = usePhotographerLocationsMock

export default usePhotographerLocations