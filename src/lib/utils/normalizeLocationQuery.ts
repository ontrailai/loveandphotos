/**
 * Location Query Normalization Utility
 *
 * Handles normalization of user input for location searches:
 * - "San Diego, CA" → { kind: 'city', city: 'San Diego' }
 * - "Los Angeles, California, USA" → { kind: 'city', city: 'Los Angeles' }
 * - "94103" → { kind: 'city', city: 'San Francisco', state: 'CA', originalZip: '94103' }
 */

import { isZip, resolveCityFromZip } from './geo'

export interface LocationQueryResult {
  kind: 'city' | 'zip'
  city?: string
  zip?: string
  state?: string
  originalZip?: string
  raw: string
}

export function normalizeLocationQuery(input: string): LocationQueryResult {
  if (!input) {
    return { kind: 'city', city: '', raw: input }
  }

  // Trim and normalize whitespace
  const cleaned = input.trim().replace(/\s+/g, ' ')

  // Check if input looks like a 5-digit ZIP code
  if (isZip(cleaned)) {
    // Try to resolve ZIP to city using frontend library
    const cityInfo = resolveCityFromZip(cleaned)
    if (cityInfo) {
      return {
        kind: 'city', // Convert ZIP to city for frontend URL
        city: cityInfo.city,
        state: cityInfo.state,
        originalZip: cleaned,
        raw: input
      }
    } else {
      // ZIP not found in library, fallback to original behavior
      return {
        kind: 'zip',
        zip: cleaned,
        raw: input
      }
    }
  }

  // For city-based queries, extract the first comma segment
  // "San Diego, CA" → "San Diego"
  // "Los Angeles, California, USA" → "Los Angeles"
  const cityParts = cleaned.split(',').map(part => part.trim())
  const city = cityParts[0] || cleaned

  // Remove common country suffixes if present
  const cleanedCity = city
    .replace(/,?\s*(USA|United States|US)$/i, '')
    .trim()

  return {
    kind: 'city',
    city: cleanedCity,
    raw: input
  }
}

/**
 * Generate a canonical query parameter for URLs
 * Used to create consistent URLs while preserving display value
 *
 * When ZIP is resolved to city, use the city name for cleaner URLs
 */
export function getCanonicalQueryParam(normalized: LocationQueryResult): string {
  switch (normalized.kind) {
    case 'zip':
      return normalized.zip || ''
    case 'city':
      // Use the resolved city name (even if originally a ZIP)
      return normalized.city || ''
    default:
      return normalized.raw || ''
  }
}