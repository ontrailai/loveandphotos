/**
 * URL State Management Hook
 * Provides bidirectional sync between component state and URL parameters
 * Enables deep-linking and browser navigation support
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import type {
  FilterState,
  SortOption,
  ViewMode,
  URLParams,
  UseUrlStateReturn
} from '@utils/photographers/types'
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  URLParamsSchema,
  FilterStateSchema,
  isValidSortOption,
  isValidViewMode,
  isValidPayTier,
  isValidSpecialty,
  isValidLanguage
} from '@utils/photographers/types'

// Debounce delay for URL updates (prevents history pollution)
const URL_UPDATE_DELAY = 300

// Maximum URL length to prevent browser issues
const MAX_URL_LENGTH = 2000

/**
 * Parse CSV string to array with validation
 */
function parseCSVWithValidation<T>(
  value: string | null,
  validator: (item: string) => item is T
): T[] {
  if (!value) return []
  return value
    .split(',')
    .map(s => s.trim())
    .filter(validator)
}

/**
 * Convert array to CSV string
 */
function arrayToCSV(array: readonly string[]): string {
  return array.join(',')
}

/**
 * Parse URL parameters to FilterState
 */
function parseURLToFilters(params: URLSearchParams): FilterState {
  try {
    const rawParams = Object.fromEntries(params.entries())
    const validated = URLParamsSchema.parse(rawParams)

    return {
      zip: validated.q || validated.zip || '',
      date: validated.date || '',
      tier: validated.tier === 'all' ? 'all' : (isValidPayTier(validated.tier || '') ? validated.tier : 'all'),
      specialties: [],
      languages: parseCSVWithValidation(validated.languages, isValidLanguage),
      photographyStyle: validated.style || 'all',
      femaleOnly: validated.female || false,
      priceRange: (validated.price_min || validated.price_max) ? {
        min: validated.price_min,
        max: validated.price_max
      } : undefined
    }
  } catch (error) {
    console.warn('Failed to parse URL parameters:', error)
    return DEFAULT_FILTERS
  }
}

/**
 * Convert FilterState to URL parameters
 */
function filtersToURLParams(
  filters: FilterState,
  sortBy: SortOption,
  viewMode: ViewMode
): URLSearchParams {
  const params = new URLSearchParams()

  // Search query
  if (filters.zip) {
    params.set('zip', filters.zip)
  }

  // Date
  if (filters.date) {
    params.set('date', filters.date)
  }

  // Tier
  if (filters.tier !== 'all') {
    params.set('tier', filters.tier)
  }


  // Languages
  if (filters.languages.length > 0) {
    params.set('languages', arrayToCSV(filters.languages))
  }

  // Photography style
  if (filters.photographyStyle !== 'all') {
    params.set('style', filters.photographyStyle)
  }

  // Female only
  if (filters.femaleOnly) {
    params.set('female', 'true')
  }

  // Price range
  if (filters.priceRange?.min) {
    params.set('price_min', filters.priceRange.min.toString())
  }
  if (filters.priceRange?.max) {
    params.set('price_max', filters.priceRange.max.toString())
  }

  // Sort
  if (sortBy !== DEFAULT_SORT) {
    params.set('sort', sortBy)
  }

  // View mode
  if (viewMode !== DEFAULT_VIEW) {
    params.set('view', viewMode)
  }

  return params
}

/**
 * Validate URL length and truncate if necessary
 */
function validateURLLength(params: URLSearchParams, baseUrl: string): URLSearchParams {
  const testUrl = `${baseUrl}?${params.toString()}`

  if (testUrl.length <= MAX_URL_LENGTH) {
    return params
  }

  console.warn(`URL too long (${testUrl.length} chars), truncating parameters`)

  // Priority order for keeping parameters (most important first)
  const priorityOrder = [
    'zip', 'date', 'tier', 'sort', 'view',
    'languages', 'style', 'female'
  ]

  const truncatedParams = new URLSearchParams()

  for (const key of priorityOrder) {
    if (params.has(key)) {
      truncatedParams.set(key, params.get(key)!)

      const testTruncatedUrl = `${baseUrl}?${truncatedParams.toString()}`
      if (testTruncatedUrl.length > MAX_URL_LENGTH) {
        truncatedParams.delete(key)
        break
      }
    }
  }

  return truncatedParams
}

/**
 * Custom hook for URL state management
 */
export function useUrlState(): UseUrlStateReturn {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<string>('')

  // Parse current URL parameters
  const params = useMemo(() => {
    const rawParams = Object.fromEntries(searchParams.entries())
    return URLParamsSchema.parse(rawParams)
  }, [searchParams])

  // Extract current state from URL
  const filters = useMemo(() => parseURLToFilters(searchParams), [searchParams])

  const sortBy = useMemo((): SortOption => {
    return isValidSortOption(params.sort) ? params.sort : DEFAULT_SORT
  }, [params.sort])

  const viewMode = useMemo((): ViewMode => {
    return isValidViewMode(params.view) ? params.view : DEFAULT_VIEW
  }, [params.view])

  // Debounced URL update function
  const updateURL = useCallback((
    newFilters: FilterState,
    newSortBy: SortOption,
    newViewMode: ViewMode,
    immediate: boolean = false
  ) => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    const updateFn = () => {
      const newParams = filtersToURLParams(newFilters, newSortBy, newViewMode)
      const validatedParams = validateURLLength(newParams, location.pathname)
      const newParamsString = validatedParams.toString()

      // Avoid unnecessary updates
      if (newParamsString !== lastUpdateRef.current) {
        lastUpdateRef.current = newParamsString
        setSearchParams(validatedParams, { replace: true })
      }
    }

    if (immediate) {
      updateFn()
    } else {
      updateTimeoutRef.current = setTimeout(updateFn, URL_UPDATE_DELAY)
    }
  }, [location.pathname, setSearchParams])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const mergedFilters = { ...filters, ...newFilters }

    // Validate merged filters
    try {
      const validatedFilters = FilterStateSchema.parse(mergedFilters)
      updateURL(validatedFilters, sortBy, viewMode)
    } catch (error) {
      console.error('Invalid filter state:', error)
    }
  }, [filters, sortBy, viewMode, updateURL])

  // Update sort
  const updateSort = useCallback((newSort: SortOption) => {
    updateURL(filters, newSort, viewMode)
  }, [filters, viewMode, updateURL])

  // Update view mode
  const updateView = useCallback((newView: ViewMode) => {
    updateURL(filters, sortBy, newView)
  }, [filters, sortBy, updateURL])

  // Clear all filters
  const clearFilters = useCallback(() => {
    updateURL(DEFAULT_FILTERS, DEFAULT_SORT, viewMode, true)
  }, [viewMode, updateURL])

  // Build search URL for sharing/navigation
  const buildSearchUrl = useCallback((customParams: Partial<URLParams>) => {
    const currentParams = filtersToURLParams(filters, sortBy, viewMode)

    // Override with custom parameters
    Object.entries(customParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        currentParams.set(key, value.toString())
      }
    })

    const validatedParams = validateURLLength(currentParams, location.pathname)
    return `${location.pathname}?${validatedParams.toString()}`
  }, [filters, sortBy, viewMode, location.pathname])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Initialize last update ref
  useEffect(() => {
    lastUpdateRef.current = searchParams.toString()
  }, [searchParams])

  return {
    params,
    filters,
    sortBy,
    viewMode,
    updateFilters,
    updateSort,
    updateView,
    clearFilters,
    buildSearchUrl
  }
}

/**
 * Utility hook for deep-linking support
 */
export function useDeepLink() {
  const { filters, sortBy, viewMode, buildSearchUrl } = useUrlState()

  const createShareableLink = useCallback(() => {
    return buildSearchUrl({})
  }, [buildSearchUrl])

  const createFilterLink = useCallback((overrides: Partial<FilterState>) => {
    const mergedFilters = { ...filters, ...overrides }
    const params = filtersToURLParams(mergedFilters, sortBy, viewMode)
    return `${window.location.pathname}?${params.toString()}`
  }, [filters, sortBy, viewMode])

  const isDefaultState = useMemo(() => {
    return (
      JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS) &&
      sortBy === DEFAULT_SORT &&
      viewMode === DEFAULT_VIEW
    )
  }, [filters, sortBy, viewMode])

  return {
    createShareableLink,
    createFilterLink,
    isDefaultState,
    currentFilters: filters,
    currentSort: sortBy,
    currentView: viewMode
  }
}

/**
 * Analytics hook for URL state tracking
 */
export function useUrlStateAnalytics() {
  const { filters, sortBy, viewMode } = useUrlState()
  const location = useLocation()

  const trackFilterUsage = useCallback(() => {
    // Count active filters
    const activeFilters = {
      hasLocation: !!filters.zip,
      hasDate: !!filters.date,
      hasTier: filters.tier !== 'all',
      hasLanguages: filters.languages.length > 0,
      hasStyle: filters.photographyStyle !== 'all',
      hasFemaleOnly: filters.femaleOnly,
      hasPriceRange: !!filters.priceRange
    }

    const totalActiveFilters = Object.values(activeFilters).filter(Boolean).length

    // Analytics data
    return {
      url: location.pathname + location.search,
      activeFilters,
      totalActiveFilters,
      sortBy,
      viewMode,
      timestamp: Date.now()
    }
  }, [filters, sortBy, viewMode, location])

  return { trackFilterUsage }
}

export default useUrlState