/**
 * TypeScript Types for Photographers Browse Page
 * Based on Supabase database schema and existing Browse.jsx implementation
 */

import { z } from 'zod'
import type { Database } from '../../../supabase/database.types'

// Extract types from Supabase schema
export type DbPhotographer = Database['public']['Tables']['photographers']['Row']
export type DbPhotographerPreview = Database['public']['Tables']['photographer_preview_profiles']['Row']
export type DbUser = Database['public']['Tables']['users']['Row']
export type DbPayTier = Database['public']['Tables']['pay_tiers']['Row']
export type DbPortfolioItem = Database['public']['Tables']['portfolio_items']['Row']
export type DbReview = Database['public']['Tables']['reviews']['Row']

// Photographer specialties based on existing Browse.jsx
export const SPECIALTIES = [
  'Wedding',
  'Portrait',
  'Event',
  'Corporate',
  'Family',
  'Newborn',
  'Fashion',
  'Real Estate'
] as const

export type Specialty = typeof SPECIALTIES[number]

// Languages based on existing Browse.jsx
export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Chinese',
  'Korean',
  'Japanese',
  'Hindi',
  'Arabic'
] as const

export type Language = typeof LANGUAGES[number]

// Pay tiers
export const PAY_TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const
export type PayTier = typeof PAY_TIERS[number]

// Photography styles
export const PHOTOGRAPHY_STYLES = ['all', 'candid', 'posed'] as const
export type PhotographyStyle = typeof PHOTOGRAPHY_STYLES[number]

// Sort options
export const SORT_OPTIONS = [
  'rating',
  'reviews',
  'experience',
  'recent',
  'available',
  'closest',
  'response_time',
  'price_low',
  'price_high'
] as const

export type SortOption = typeof SORT_OPTIONS[number]

// View modes
export const VIEW_MODES = ['grid', 'list'] as const
export type ViewMode = typeof VIEW_MODES[number]

// Availability levels for AvailabilityChip
export const AVAILABILITY_LEVELS = ['high', 'medium', 'low', 'unknown'] as const
export type AvailabilityLevel = typeof AVAILABILITY_LEVELS[number]

// Zod schemas for validation
export const SpecialtySchema = z.enum(SPECIALTIES)
export const LanguageSchema = z.enum(LANGUAGES)
export const PayTierSchema = z.enum(PAY_TIERS)
export const PhotographyStyleSchema = z.enum(PHOTOGRAPHY_STYLES)
export const SortOptionSchema = z.enum(SORT_OPTIONS)
export const ViewModeSchema = z.enum(VIEW_MODES)
export const AvailabilityLevelSchema = z.enum(AVAILABILITY_LEVELS)

// Filter state schema
export const FilterStateSchema = z.object({
  zip: z.string().default(''),
  date: z.string().default(''),
  lnpChoiceOnly: z.boolean().default(false),
  specialties: z.array(SpecialtySchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  photographyStyle: PhotographyStyleSchema.default('all'),
  femaleOnly: z.boolean().default(false),
  priceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional()
})

export type FilterState = z.infer<typeof FilterStateSchema>

// URL parameters schema
export const URLParamsSchema = z.object({
  q: z.string().optional(), // Search query
  zip: z.string().optional(), // ZIP code or city
  date: z.string().optional(), // Selected date (YYYY-MM-DD)
  lnp_choice: z.coerce.boolean().optional(),
  specialties: z.string().optional(), // CSV string
  languages: z.string().optional(), // CSV string
  sort: SortOptionSchema.optional(),
  view: ViewModeSchema.optional(),
  style: PhotographyStyleSchema.optional(),
  female: z.coerce.boolean().optional(),
  price_min: z.coerce.number().optional(),
  price_max: z.coerce.number().optional()
})

export type URLParams = z.infer<typeof URLParamsSchema>

// Trust metrics interface (from fetchPhotographerTrustMetrics)
export interface TrustMetrics {
  user_id: string
  acceptance_rate?: number | null
  avg_response_time_minutes?: number | null
  has_minimum_data?: boolean | null
  manual_override_acceptance_rate?: boolean | null
  manual_override_response_time?: boolean | null
}

// Enhanced photographer profile for browse page
export interface PhotographerProfile {
  // Core fields
  id: string
  user_id: string

  // User information
  users: {
    full_name: string | null
    avatar_url: string | null
    email?: string
  } | null

  // Basic info
  bio: string | null
  specialties: Specialty[]
  languages: Language[]
  years_experience?: number | null

  // Location
  location_city: string | null
  location_state: string | null

  // Ratings and reviews
  average_rating: number | null
  total_reviews: number | null
  total_bookings?: number | null

  // Availability and status
  is_available: boolean | null
  is_public: boolean | null
  is_verified: boolean | null
  is_love_and_photos_choice?: boolean | null
  is_lnp_choice?: boolean | null

  // Pay tier information
  pay_tiers: {
    name: string
    hourly_rate: number
    badge_color: string | null
  } | null
  pay_tier_id?: number | null
  hourly_rate?: number | null

  // Portfolio
  portfolio_items: Array<{
    id?: string
    image_url: string
    thumbnail_url?: string | null
    title?: string | null
    category?: string | null
  }>
  portfolio_images?: string[] // For backward compatibility

  // Trust metrics
  acceptance_rate?: number | null
  avg_response_time_minutes?: number | null
  has_minimum_data?: boolean | null
  manual_override_acceptance_rate?: boolean | null
  manual_override_response_time?: boolean | null
  response_time_hours?: number | null
  booking_acceptance_rate?: number | null

  // Additional metadata
  photography_style?: PhotographyStyle[]
  equipment_list?: any // JSON field
  trust_badges?: string[]
  is_female?: boolean | null
  travel_radius_miles?: number | null

  // Computed fields
  availability_level?: AvailabilityLevel
  distance_miles?: number // If location-based search
}

// Simplified profile for lists (performance optimization)
export interface PhotographerListItem {
  id: string
  user_id: string
  name: string
  avatar_url: string | null
  specialties: Specialty[]
  average_rating: number | null
  total_reviews: number | null
  hourly_rate: number | null
  tier_name: string | null
  tier_badge_color: string | null
  is_verified: boolean | null
  is_lnp_choice: boolean | null
  location_city: string | null
  location_state: string | null
  portfolio_image: string | null
  availability_level: AvailabilityLevel
}

// Trust badge types
export interface TrustBadge {
  id: string
  label: string
  value: string | number
  type: 'count' | 'rate' | 'time' | 'text'
  variant: 'success' | 'warning' | 'info' | 'default'
  tooltip?: string
}

// API response types
export interface BatchQueryResult<T = any> {
  data: T[]
  error: string | null
  batchResults: any[]
  totalBatches: number
  successfulBatches: number
  failedBatches: number
  executionTime: number
  recordsRetrieved: number
  hadPartialFailure: boolean
  hadCompleteFailure: boolean
}

export interface PhotographersQueryParams {
  filters: FilterState
  sortBy: SortOption
  limit?: number
  offset?: number
  location?: {
    zip?: string
    city?: string
    lat?: number
    lng?: number
  }
}

export interface PhotographersQueryResult {
  data: PhotographerProfile[]
  hasMore: boolean
  nextOffset?: number
  total?: number
  error?: string | null
  isLoading: boolean
}

// Hook return types
export interface UsePhotographersBatchedReturn {
  data: PhotographerProfile[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  fetchNext: () => Promise<void>
  refetch: () => Promise<void>
  total: number
  isEmpty: boolean
}

export interface UseUrlStateReturn {
  params: URLParams
  filters: FilterState
  sortBy: SortOption
  viewMode: ViewMode
  updateFilters: (filters: Partial<FilterState>) => void
  updateSort: (sort: SortOption) => void
  updateView: (view: ViewMode) => void
  clearFilters: () => void
  buildSearchUrl: (params: Partial<URLParams>) => string
}

// Component prop types
export interface PhotographerCardProps {
  photographer: PhotographerProfile
  viewMode?: ViewMode
  showPricing?: boolean
  onClick?: () => void
  className?: string
}

export interface PhotographerRowProps {
  photographer: PhotographerProfile
  showPricing?: boolean
  onClick?: () => void
  className?: string
}

export interface FiltersPanelProps {
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
  activeFilterCount: number
  isLoading?: boolean
  isMobile?: boolean
  className?: string
}

export interface SearchBarProps {
  value: string
  date: string
  onValueChange: (value: string) => void
  onDateChange: (date: string) => void
  onSubmit: () => void
  isLoading?: boolean
  placeholder?: string
  className?: string
}

export interface SortViewToggleProps {
  sortBy: SortOption
  viewMode: ViewMode
  onSortChange: (sort: SortOption) => void
  onViewChange: (view: ViewMode) => void
  resultCount: number
  isLoading?: boolean
  className?: string
}

export interface TrustBadgesProps {
  photographer: PhotographerProfile
  size?: 'small' | 'medium' | 'large'
  maxBadges?: number
  className?: string
}

export interface AvailabilityChipProps {
  level: AvailabilityLevel
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
  className?: string
}

export interface SkeletonsProps {
  count?: number
  viewMode?: ViewMode
  className?: string
}

export interface EmptyStateProps {
  title?: string
  description?: string
  showClearFilters?: boolean
  onClearFilters?: () => void
  suggestedCities?: string[]
  className?: string
}

// Error types
export interface PhotographersError {
  type: 'network' | 'validation' | 'permission' | 'not_found' | 'server'
  message: string
  code?: string
  retryable: boolean
}

// Performance monitoring types
export interface PerformanceMetrics {
  queryTime: number
  renderTime: number
  totalTime: number
  recordCount: number
  cacheHits: number
  cacheMisses: number
}

// Accessibility types
export interface A11yLabels {
  photographer_card: (name: string) => string
  filter_button: (count: number) => string
  sort_button: (option: string) => string
  view_toggle: (mode: ViewMode) => string
  rating_stars: (rating: number) => string
  specialty_chip: (specialty: string) => string
  language_chip: (language: string) => string
}

// Constants for Magic UI integration
export const MAGIC_UI_COMPONENTS = {
  CARD_VARIANTS: ['default', 'hover', 'selected'] as const,
  CHIP_VARIANTS: ['default', 'selected', 'success', 'warning', 'error'] as const,
  SKELETON_VARIANTS: ['card', 'row', 'filter', 'text'] as const,
  ANIMATION_PRESETS: ['enter', 'exit', 'hover', 'focus'] as const
} as const

// Export all schemas for validation
export const schemas = {
  FilterStateSchema,
  URLParamsSchema,
  SpecialtySchema,
  LanguageSchema,
  PayTierSchema,
  PhotographyStyleSchema,
  SortOptionSchema,
  ViewModeSchema,
  AvailabilityLevelSchema
}

// Utility type guards
export const isValidSpecialty = (value: string): value is Specialty =>
  SPECIALTIES.includes(value as Specialty)

export const isValidLanguage = (value: string): value is Language =>
  LANGUAGES.includes(value as Language)

export const isValidPayTier = (value: string): value is PayTier =>
  PAY_TIERS.includes(value as PayTier)

export const isValidSortOption = (value: string): value is SortOption =>
  SORT_OPTIONS.includes(value as SortOption)

export const isValidViewMode = (value: string): value is ViewMode =>
  VIEW_MODES.includes(value as ViewMode)

// Default values
export const DEFAULT_FILTERS: FilterState = {
  zip: '',
  date: '',
  lnpChoiceOnly: false,
  specialties: [],
  languages: [],
  photographyStyle: 'all',
  femaleOnly: false
}

export const DEFAULT_SORT: SortOption = 'rating'
export const DEFAULT_VIEW: ViewMode = 'grid'
export const DEFAULT_BATCH_SIZE = 150
export const DEFAULT_PAGE_SIZE = 100