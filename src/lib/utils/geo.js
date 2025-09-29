/**
 * Geographic utilities for ZIP code resolution
 *
 * Provides frontend ZIP-to-city conversion using the zipcodes npm library
 */

import zipdb from 'zipcodes'

const ZIP_RE = /^\d{5}$/

export function isZip(v) {
  return !!v && ZIP_RE.test(v.trim())
}

export function resolveCityFromZip(zip) {
  const z = zip.trim()

  if (!isZip(z)) {
    return null
  }

  try {
    const info = zipdb.lookup(z)
    if (!info || !info.city) {
      return null
    }

    return {
      city: info.city,
      state: info.state || ''
    }
  } catch (error) {
    console.warn('Error resolving ZIP code:', z, error)
    return null
  }
}