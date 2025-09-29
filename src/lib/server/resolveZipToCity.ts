/**
 * ZIP Code to City Resolver (Server-only)
 *
 * Resolves 5-digit ZIP codes to their corresponding city and state
 * for location-based photographer searches.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface ZipResolution {
  city: string
  state: string
}

/**
 * Resolves a ZIP code to its city and state using a three-tier approach:
 * 1. Exact match in zip_city table
 * 2. Fallback: infer from photographers table if any row has that zip
 * 3. Return null for unknown ZIPs (UI can show friendly message)
 */
export async function resolveZipToCity(
  supabase: SupabaseClient,
  zip: string
): Promise<ZipResolution | null> {
  if (!zip || !/^\d{5}$/.test(zip)) {
    return null
  }

  try {
    // 1) Exact match in zip_city table
    const { data: zipCityData, error: zipError } = await supabase
      .from('zip_city')
      .select('city, state')
      .eq('zip', zip)
      .maybeSingle()

    if (zipError) {
      console.error('Error querying zip_city table:', zipError)
      // Continue to fallback
    } else if (zipCityData) {
      return {
        city: zipCityData.city,
        state: zipCityData.state
      }
    }

    // 2) Fallback: infer from photographers table if any row has that zip
    const { data: photographerData, error: photographerError } = await supabase
      .from('photographer_preview_profiles')
      .select('location_city, location_state')
      .eq('location_zip', zip)
      .limit(1)
      .maybeSingle()

    if (photographerError) {
      console.error('Error querying photographers for zip fallback:', photographerError)
      return null
    }

    if (photographerData && photographerData.location_city && photographerData.location_state) {
      return {
        city: photographerData.location_city,
        state: photographerData.location_state
      }
    }

    // 3) Unknown zip - return null so UI can show friendly message
    return null

  } catch (error) {
    console.error('Error in resolveZipToCity:', error)
    return null
  }
}