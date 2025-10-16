/**
 * Geolocation Distance Calculator
 * Haversine formula for calculating distances between latitude/longitude coordinates
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate (origin)
 * @param coord2 - Second coordinate (destination)
 * @returns Distance in miles
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 3959 // Earth's radius in miles (use 6371 for kilometers)

  const lat1 = toRadians(coord1.latitude)
  const lat2 = toRadians(coord2.latitude)
  const deltaLat = toRadians(coord2.latitude - coord1.latitude)
  const deltaLon = toRadians(coord2.longitude - coord1.longitude)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Filter items by distance from origin point
 * @param items - Array of items with location data
 * @param origin - Origin coordinates
 * @param radiusMiles - Maximum distance in miles
 * @param getCoords - Function to extract coordinates from items
 * @returns Filtered items within radius, sorted by distance
 */
export function filterByDistance<T>(
  items: T[],
  origin: Coordinates,
  radiusMiles: number,
  getCoords: (item: T) => Coordinates | null
): T[] {
  return items
    .map(item => ({
      item,
      coords: getCoords(item),
      distance: null as number | null
    }))
    .filter(({ coords }) => coords !== null)
    .map(({ item, coords }) => ({
      item,
      distance: calculateDistance(origin, coords!)
    }))
    .filter(({ distance }) => distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
    .map(({ item }) => item)
}

/**
 * Geocode a ZIP code using Zippopotam.us API
 * @param zipCode - 5-digit US ZIP code
 * @returns Coordinates or null if not found
 */
export async function geocodeZipCode(zipCode: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`)
    if (!response.ok) return null

    const data = await response.json()
    return {
      latitude: parseFloat(data.places[0].latitude),
      longitude: parseFloat(data.places[0].longitude)
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Parse photographer location data to coordinates
 * Handles various data formats from database
 */
export function parsePhotographerCoordinates(photographer: any): Coordinates | null {
  // Try direct lat/lng fields
  if (photographer.latitude && photographer.longitude) {
    return {
      latitude: parseFloat(photographer.latitude),
      longitude: parseFloat(photographer.longitude)
    }
  }

  // Try location object
  if (photographer.location?.latitude && photographer.location?.longitude) {
    return {
      latitude: parseFloat(photographer.location.latitude),
      longitude: parseFloat(photographer.location.longitude)
    }
  }

  return null
}
