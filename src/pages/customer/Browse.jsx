/**
 * Browse Component
 * Search and filter photographers
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  SearchIcon, 
  MapPinIcon, 
  FilterIcon,
  CalendarIcon,
  DollarSignIcon,
  StarIcon,
  ChevronDownIcon,
  XIcon,
  CameraIcon,
  VideoIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  GridIcon,
  ListIcon,
  LockIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import LNPChoiceBadge from '@components/ui/LNPChoiceBadge'
import PhotographerMetricBadges from '@components/photographer/PhotographerMetricBadges'
import SafeAvatar from '@components/shared/SafeAvatar'
import SafeImage from '@components/shared/SafeImage'
import ImageErrorBoundary from '@components/shared/ImageErrorBoundary'
import RatingStars from '@components/shared/RatingStars'
import { supabasePublic } from '@lib/supabase'
import { fetchPhotographerTrustMetrics } from '@utils/batchSupabaseQueries'
import { useAuth } from '@contexts/AuthContext'
import { clsx } from 'clsx'
import { normalizeLocationQuery, getCanonicalQueryParam } from '@lib/utils/normalizeLocationQuery'
import { resolveZipToCity } from '@lib/server/resolveZipToCity'

// Array of real people profile images - guaranteed to load, professional headshots
const profileImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1559941342-cb5c204b11bf?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1583994009785-37ec30bf9342?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1542190891-2093d38760f2?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1590031905406-f18a426d772d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
]

// Array of portfolio images for photographers - add w=600 for faster loading
const portfolioImages = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600',
  'https://images.unsplash.com/photo-1525673812761-4e0d45adc0cc?w=600',
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=600',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600',
  'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600',
  'https://images.unsplash.com/photo-1513279922550-250c2129b13a?w=600',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600'
]

const Browse = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { profile } = useAuth()
  
  // Determine if pricing should be shown
  const shouldShowPricing = profile?.role === 'admin' || profile?.role === 'photographer'
  
  const [photographers, setPhotographers] = useState([])
  const [allPhotographers, setAllPhotographers] = useState([])
  const [displayCount, setDisplayCount] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    zip: searchParams.get('q') || searchParams.get('search') || searchParams.get('zip') || '',
    date: '',
    rating: 0,
    tier: 'all',
    specialties: [],
    languages: [],
    photographyStyle: 'all', // 'all', 'candid', 'posed'
    femaleOnly: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('rating') // New sort state

  const specialtyOptions = [
    'Wedding', 'Portrait', 'Event', 'Corporate', 
    'Family', 'Newborn', 'Fashion', 'Real Estate'
  ]

  const languageOptions = [
    'English', 'Spanish', 'French', 'Chinese', 
    'Korean', 'Japanese', 'Hindi', 'Arabic'
  ]

  const photographyStyleOptions = [
    { value: 'all', label: 'Everything', description: 'All photography styles' },
    { value: 'candid', label: 'Candid', description: 'Natural, unposed moments' },
    { value: 'posed', label: 'Posed', description: 'Traditional, directed shots' }
  ]

  // Price ranges removed - pricing no longer shown to public users
  
  // Sort options focused on quality and relevance
  const sortOptions = [
    { value: 'rating', label: 'Top Rated' },
    { value: 'reviews', label: 'Most Reviewed' },
    { value: 'experience', label: 'Most Experienced' },
    { value: 'recent', label: 'Recently Joined' },
    { value: 'available', label: 'Available Soon' }
  ]

  useEffect(() => {
    loadPhotographers()
  }, [filters, sortBy])

  useEffect(() => {
    // When display count changes, update displayed photographers
    if (allPhotographers.length > 0) {
      setPhotographers(allPhotographers.slice(0, displayCount))
    }
  }, [displayCount, allPhotographers])

  const loadPhotographers = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Loading photographers from Supabase...')

      // Check if Supabase is configured
      const supabaseClient = supabasePublic

      if (!supabaseClient || !import.meta.env.VITE_SUPABASE_URL) {
        console.error('Supabase not configured properly')
        throw new Error('Database configuration error. Please check environment variables.')
      }

      // Fetch photographers with proper error handling
      const { data: photographers, error } = await supabaseClient
        .from('photographer_preview_profiles')
        .select('id, display_name, portfolio_images, bio, specialties, hourly_rate, location_city, location_state, average_rating, is_verified, is_available, is_love_and_photos_choice, user_id')
        .eq('is_available', true)
        .limit(1000)

      console.log('Query result:', {
        success: !error,
        count: photographers?.length || 0,
        error: error?.message
      })
      
      if (error) {
        console.error('Full query failed:', error)
        throw new Error('Failed to fetch photographers')
      }
      
      if (photographers && photographers.length > 0) {
        console.log(`Successfully loaded ${photographers.length} real photographers`)
        
        // Fetch trust metrics for photographers that have user_id
        // Use batched queries to prevent oversized URL errors (net::ERR_FAILED)
        const userIds = photographers.filter(p => p.user_id).map(p => p.user_id)
        let trustMetrics = {}

        if (userIds.length > 0) {
          console.log(`Fetching trust metrics for ${userIds.length} photographers using batched queries`)

          try {
            const { data: metricsData, error, hadPartialFailure } = await fetchPhotographerTrustMetrics(supabaseClient, userIds)

            if (error) {
              console.warn('Trust metrics query had issues:', error)
              // Continue with empty metrics rather than blocking the page
            }

            if (hadPartialFailure) {
              console.warn('Some trust metrics batches failed, but continuing with available data')
            }

            if (metricsData && metricsData.length > 0) {
              console.log(`Successfully retrieved trust metrics for ${metricsData.length} photographers`)

              // Process the batched results
              trustMetrics = metricsData.reduce((acc, metric) => {
                acc[metric.user_id] = metric
                return acc
              }, {})
            }

          } catch (batchError) {
            console.error('Failed to fetch trust metrics in batches:', batchError)
            // Continue without trust metrics rather than blocking the entire page
            // This ensures the photographer grid still loads even if metrics fail
            trustMetrics = {}
          }
        }
        
        // Transform the real data to match expected format
        const transformedProfiles = photographers.map((profile, index) => {
          const fallbackUrl = profileImages[index % profileImages.length]
          const metrics = trustMetrics[profile.user_id] || {}

          return {
            id: profile.id,
            user_id: profile.user_id || profile.id,
            bio: profile.bio || `Professional photographer with years of experience`,
            specialties: Array.isArray(profile.specialties) ? profile.specialties : ['Wedding', 'Portrait'],
            languages: ['English'],
            years_experience: 5 + (index % 10),
            hourly_rate: profile.hourly_rate || (150 + (index * 25)),
            location_city: profile.location_city || 'New York',
            location_state: profile.location_state || 'NY',
            is_available: profile.is_available !== false,
            is_public: true,
            average_rating: profile.average_rating || (4.2 + (index % 8) * 0.1),
            total_reviews: 10 + (index * 3),
            total_bookings: 5 + (index * 2),
            users: {
              full_name: profile.display_name || `Photographer ${index + 1}`,
              avatar_url: profile.portfolio_images && profile.portfolio_images.length > 0 ? profile.portfolio_images[0] : fallbackUrl
            },
            pay_tiers: {
              name: profile.is_verified ? 'Professional' : 'Standard',
              hourly_rate: profile.hourly_rate || (150 + (index * 25)),
              badge_color: profile.is_verified ? 'gold' : 'silver'
            },
            portfolio_items: [
              { image_url: portfolioImages[index % portfolioImages.length] },
              { image_url: portfolioImages[(index + 5) % portfolioImages.length] },
              { image_url: portfolioImages[(index + 10) % portfolioImages.length] }
            ],
            // Trust metrics from photographers table
            acceptance_rate: metrics.acceptance_rate,
            avg_response_time_minutes: metrics.avg_response_time_minutes,
            has_minimum_data: metrics.has_minimum_data || false,
            manual_override_acceptance_rate: metrics.manual_override_acceptance_rate,
            manual_override_response_time: metrics.manual_override_response_time
          }
        })
        
        console.log('Data transformed, applying filters...')
        
        // Apply filters to real data
        let filtered = transformedProfiles
        
        if (filters.rating > 0) {
          filtered = filtered.filter(p => p.average_rating >= filters.rating)
        }
        
        // Price filtering removed - pricing no longer shown to public users
        
        if (filters.specialties.length > 0) {
          filtered = filtered.filter(p => 
            filters.specialties.some(specialty => 
              p.specialties.includes(specialty)
            )
          )
        }
        
        if (filters.languages.length > 0) {
          filtered = filtered.filter(p => 
            filters.languages.some(language => 
              p.languages.includes(language)
            )
          )
        }
        
        // Filter by photography style
        if (filters.photographyStyle !== 'all') {
          filtered = filtered.filter(p => {
            const styles = p.photography_style || ['candid', 'posed']
            return styles.includes(filters.photographyStyle)
          })
        }
        
        // Filter for female photographers only
        if (filters.femaleOnly) {
          filtered = filtered.filter(p => p.is_female === true)
        }
        
        if (filters.zip) {
          const rawQ = filters.zip
          const normalized = normalizeLocationQuery(rawQ)
          let cityKey = ''

          if (normalized.kind === 'zip' && normalized.zip) {
            // Try to resolve ZIP to city
            const resolved = await resolveZipToCity(supabaseClient, normalized.zip)
            if (resolved) {
              cityKey = resolved.city.toLowerCase()
            } else {
              // Unknown ZIP - show empty results with friendly message
              console.log(`Unknown ZIP: ${normalized.zip}`)
              filtered = []
              setError(`We don't recognize that ZIP code yet. Please try entering the city name instead.`)
              setAllPhotographers([])
              setPhotographers([])
              setLoading(false)
              return
            }
          } else if (normalized.kind === 'city' && normalized.city) {
            cityKey = normalized.city.toLowerCase()
          }

          if (cityKey) {
            console.log(`Filtering by city: ${cityKey}`)
            filtered = filtered.filter(p =>
              p.location_city?.toLowerCase().includes(cityKey) ||
              p.location_state?.toLowerCase().includes(cityKey)
            )
          }

          // Log for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('Search normalization:', {
              rawQ,
              normalized,
              resolvedCity: cityKey,
              returned: filtered.length
            })
          }
        }
        
        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
          switch(sortBy) {
            case 'rating':
              return (b.average_rating || 0) - (a.average_rating || 0)
            case 'reviews':
              return (b.total_reviews || 0) - (a.total_reviews || 0)
            case 'experience':
              return (b.years_experience || 0) - (a.years_experience || 0)
            case 'recent':
              // Assuming we have a created_at field or can use ID for recency
              return new Date(b.created_at || 0) - new Date(a.created_at || 0)
            case 'available':
              // Prioritize available photographers
              return (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0)
            default:
              return 0
          }
        })
        
        console.log(`Applied filters and sorting, ${sorted.length} photographers remaining`)
        setAllPhotographers(sorted)
        setPhotographers(sorted.slice(0, displayCount))
        return
      }
      
      console.log('No data found, falling back to mock data')
      throw new Error('No photographers found in database')
      
    } catch (err) {
      console.error('Error loading photographers:', err)
      setError(err.message || 'Failed to load photographers. Please try again.')
      // Don't use mock data - just show the error
      setAllPhotographers([])
      setPhotographers([])
    } finally {
      // CRITICAL: Always set loading to false
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleSpecialty = (specialty) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const toggleLanguage = (language) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const clearFilters = () => {
    setFilters({
      zip: '',
      date: '',
      rating: 0,
      tier: 'all',
      specialties: [],
      languages: [],
      photographyStyle: 'all',
      femaleOnly: false
    })
    setDisplayCount(50) // Reset display count
  }

  const activeFilterCount = 
    filters.specialties.length + 
    filters.languages.length + 
    (filters.rating > 0 ? 1 : 0) +
    (filters.tier !== 'all' ? 1 : 0) +
    (filters.photographyStyle !== 'all' ? 1 : 0) +
    (filters.femaleOnly ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dusty-400" />
                  <input
                    type="text"
                    placeholder="ZIP code or city"
                    value={filters.zip}
                    onChange={(e) => handleFilterChange('zip', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dusty-400" />
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button variant="outline" onClick={() => loadPhotographers()}>
                  <SearchIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Filter & View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <FilterIcon className="w-5 h-5 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-2 rounded transition',
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                  )}
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'p-2 rounded transition',
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                  )}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={clsx(
            'lg:block lg:w-64',
            showFilters ? 'block' : 'hidden'
          )}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-dusty-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Price Range removed - pricing no longer shown to public users */}

              {/* Rating */}
              <div className="mb-6">
                <label className="text-sm font-medium text-dusty-700 mb-3 block">
                  Minimum Rating
                </label>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <label
                      key={rating}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={filters.rating === rating}
                        onChange={() => handleFilterChange('rating', rating)}
                        className="mr-3"
                      />
                      <RatingStars rating={rating} size="sm" />
                      <span className="ml-2 text-sm text-dusty-600">& up</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tier */}
              <div className="mb-6">
                <label className="text-sm font-medium text-dusty-700 mb-3 block">
                  Photographer Tier
                </label>
                <div className="space-y-2">
                  {['all', 'bronze', 'silver', 'gold', 'platinum'].map(tier => (
                    <label
                      key={tier}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                    >
                      <input
                        type="radio"
                        name="tier"
                        value={tier}
                        checked={filters.tier === tier}
                        onChange={() => handleFilterChange('tier', tier)}
                        className="mr-3"
                      />
                      {tier === 'all' ? (
                        <span className="text-sm text-dusty-700">All Tiers</span>
                      ) : (
                        <Badge variant={tier} size="sm">
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <label className="text-sm font-medium text-dusty-700 mb-3 block">
                  Specialties
                </label>
                <div className="space-y-2">
                  {specialtyOptions.map(specialty => (
                    <label
                      key={specialty}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.specialties.includes(specialty)}
                        onChange={() => toggleSpecialty(specialty)}
                        className="mr-3"
                      />
                      <span className="text-sm text-dusty-700">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <label className="text-sm font-medium text-dusty-700 mb-3 block">
                  Languages
                </label>
                <div className="space-y-2">
                  {languageOptions.map(language => (
                    <label
                      key={language}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.languages.includes(language)}
                        onChange={() => toggleLanguage(language)}
                        className="mr-3"
                      />
                      <span className="text-sm text-dusty-700">{language}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Photography Style */}
              <div className="space-y-3">
                <h4 className="font-medium text-dusty-900">Photography Style</h4>
                <div 
                  role="radiogroup" 
                  aria-label="Photography Style"
                  className="space-y-2"
                >
                  {photographyStyleOptions.map(style => (
                    <label
                      key={style.value}
                      className="flex items-start cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded group"
                    >
                      <input
                        type="radio"
                        name="photography-style"
                        value={style.value}
                        checked={filters.photographyStyle === style.value}
                        onChange={() => handleFilterChange('photographyStyle', style.value)}
                        className="mt-0.5 mr-3"
                        aria-describedby={`style-desc-${style.value}`}
                      />
                      <div>
                        <span className="text-sm font-medium text-dusty-700 group-hover:text-dusty-900">
                          {style.label}
                        </span>
                        <p 
                          id={`style-desc-${style.value}`}
                          className="text-xs text-dusty-500 mt-0.5"
                        >
                          {style.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Female Photographers Only */}
              <div className="space-y-3">
                <h4 className="font-medium text-dusty-900">Photographer Preference</h4>
                <label
                  className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                  role="switch"
                  aria-checked={filters.femaleOnly}
                >
                  <input
                    type="checkbox"
                    checked={filters.femaleOnly}
                    onChange={(e) => handleFilterChange('femaleOnly', e.target.checked)}
                    className="mr-3"
                    aria-label="Show only female photographers"
                  />
                  <div>
                    <span className="text-sm font-medium text-dusty-700">
                      Female Photographers Only
                    </span>
                    <p className="text-xs text-dusty-500 mt-0.5">
                      Filter to show only female photographers
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-dusty-900">
                {loading ? 'Loading...' : `${allPhotographers.length} Photographers Available`}
              </h2>
              
              {/* Sort and View Controls */}
              <div className="flex items-center gap-4">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm text-dusty-600">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Sort photographers by"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      'p-2 transition-colors',
                      viewMode === 'grid' 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-white text-dusty-600 hover:bg-gray-50'
                    )}
                    aria-label="Grid view"
                  >
                    <GridIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      'p-2 transition-colors',
                      viewMode === 'list' 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-white text-dusty-600 hover:bg-gray-50'
                    )}
                    aria-label="List view"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <XIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800 mb-1">
                      Could not load photographers
                    </h3>
                    <p className="text-sm text-red-700">{error}</p>
                    <Button
                      onClick={() => loadPhotographers()}
                      size="sm"
                      variant="secondary"
                      className="mt-3"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Photographer Grid/List */}
            {loading ? (
              <div className={clsx(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : photographers.length === 0 ? (
              <Card className="text-center py-12">
                <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-dusty-900 mb-2">
                  No photographers found
                </h3>
                <p className="text-dusty-600 mb-4">
                  {filters.femaleOnly && filters.photographyStyle !== 'all' 
                    ? `No female photographers found with ${filters.photographyStyle} style. Try adjusting your preferences.`
                    : filters.femaleOnly 
                    ? 'No female photographers found in this area. Try expanding your search.'
                    : filters.photographyStyle !== 'all'
                    ? `No photographers found with ${filters.photographyStyle} style. Try selecting "Everything" to see all styles.`
                    : 'Try adjusting your filters or search criteria'}
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </Card>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {photographers.map((photographer) => (
                  <Card
                    key={photographer.id}
                    hover
                    className="cursor-pointer overflow-hidden group"
                    onClick={() => navigate(`/photographer/${photographer.id}${filters.date ? `?date=${filters.date}` : ''}`)}
                  >
                    {/* Portfolio Preview */}
                    <ImageErrorBoundary>
                      <div className="aspect-w-16 aspect-h-12 -m-6 mb-4">
                        <SafeImage
                          src={photographer.portfolio_items?.[0]?.image_url}
                          alt={photographer.users?.full_name || 'Photographer portfolio'}
                          fallbackType="portfolio"
                          className="w-full h-48"
                          imgClassName="group-hover:scale-105 transition-transform duration-300"
                          objectFit="cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    </ImageErrorBoundary>

                    <div className="px-6 pb-6">
                      {/* Photographer Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <SafeAvatar
                            src={photographer.users?.avatar_url}
                            name={photographer.users?.full_name || `Photographer ${photographer.id}`}
                            size="sm"
                          />
                          <div>
                            <h3 className="font-semibold text-dusty-900 flex items-center gap-2">
                              {photographer.users?.full_name?.split(' ')[0] || 'Photographer'}
                              {photographer.is_love_and_photos_choice && (
                                <LNPChoiceBadge size="small" />
                              )}
                            </h3>
                            <p className="text-sm text-dusty-600">
                              {photographer.specialties?.[0] || 'All Events'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={photographer.pay_tiers?.name?.toLowerCase() || 'default'} 
                          size="sm"
                        >
                          {photographer.pay_tiers?.name || 'Bronze'}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="mb-3">
                        <div className="flex items-center gap-1">
                          <RatingStars 
                            rating={photographer.average_rating || 0} 
                            size="sm" 
                            showNumber 
                          />
                          <span className="text-xs text-dusty-600 whitespace-nowrap">
                            ({photographer.total_reviews || 0})
                          </span>
                        </div>
                      </div>

                      {/* Price & Features */}
                      <div className="flex items-center justify-between">
                        {shouldShowPricing ? (
                          <span className="text-lg font-semibold text-dusty-900">
                            ${photographer.pay_tiers?.hourly_rate || 150}/hr
                          </span>
                        ) : (
                          <button
                            onClick={() => navigate('/login')}
                            className="flex items-center text-sm text-dusty-500 hover:text-primary-600"
                            aria-label="Sign in to view pricing"
                          >
                            <LockIcon className="w-3 h-3 mr-1" />
                            <span>View Pricing</span>
                          </button>
                        )}
                        <div className="flex items-center space-x-2">
                          {photographer.is_verified && (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" title="Verified" />
                          )}
                          {photographer.equipment_list?.includes('video') && (
                            <VideoIcon className="w-5 h-5 text-dusty-400" title="Video available" />
                          )}
                        </div>
                      </div>

                      {/* Trust Metrics Badges */}
                      <PhotographerMetricBadges 
                        photographer={photographer} 
                        className="mt-3"
                        size="small"
                      />

                      {/* Languages */}
                      {photographer.languages?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {photographer.languages.slice(0, 3).map(lang => (
                            <span
                              key={lang}
                              className="text-xs px-2 py-1 bg-gray-100 text-dusty-600 rounded-full"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {photographers.map((photographer) => (
                  <Card
                    key={photographer.id}
                    hover
                    className="cursor-pointer"
                    onClick={() => navigate(`/photographer/${photographer.id}${filters.date ? `?date=${filters.date}` : ''}`)}
                    padding={false}
                  >
                    <div className="flex">
                      {/* Image */}
                      <ImageErrorBoundary>
                        <div className="w-48 h-36 flex-shrink-0">
                          <SafeImage
                            src={photographer.portfolio_items?.[0]?.image_url}
                            alt={photographer.users?.full_name || 'Photographer portfolio'}
                            fallbackType="portfolio"
                            className="w-full h-full rounded-l-xl overflow-hidden"
                            objectFit="cover"
                          />
                        </div>
                      </ImageErrorBoundary>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <SafeAvatar
                              src={photographer.users?.avatar_url}
                              name={photographer.users?.full_name || `Photographer ${photographer.id}`}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-dusty-900">
                                  {photographer.users?.full_name?.split(' ')[0] || 'Photographer'}
                                </h3>
                                {photographer.is_love_and_photos_choice && (
                                  <LNPChoiceBadge size="small" />
                                )}
                                <Badge 
                                  variant={photographer.pay_tiers?.name?.toLowerCase() || 'default'} 
                                  size="sm"
                                >
                                  {photographer.pay_tiers?.name || 'Bronze'}
                                </Badge>
                                {photographer.is_verified && (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                              <p className="text-dusty-600">
                                {photographer.bio?.substring(0, 100) || 'Professional photographer'}...
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {shouldShowPricing ? (
                              <p className="text-xl font-bold text-dusty-900">
                                ${photographer.pay_tiers?.hourly_rate || 150}/hr
                              </p>
                            ) : (
                              <button
                                onClick={() => navigate('/login')}
                                className="flex items-center text-sm text-dusty-500 hover:text-primary-600 ml-auto mb-2"
                                aria-label="Sign in to view pricing"
                              >
                                <LockIcon className="w-3 h-3 mr-1" />
                                <span>View Pricing</span>
                              </button>
                            )}
                            <RatingStars 
                              rating={photographer.average_rating || 0} 
                              size="sm" 
                              showNumber 
                            />
                          </div>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-dusty-600">
                          <span className="flex items-center">
                            <CameraIcon className="w-4 h-4 mr-1" />
                            {photographer.specialties?.join(', ') || 'All Events'}
                          </span>
                          <span className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {photographer.languages?.join(', ') || 'English'}
                          </span>
                        </div>

                        {/* Trust Metrics Badges */}
                        <PhotographerMetricBadges 
                          photographer={photographer} 
                          className="mt-3"
                          size="small"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {photographers.length > 0 && photographers.length < allPhotographers.length && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    const newCount = displayCount + 50
                    setDisplayCount(newCount)
                    setPhotographers(allPhotographers.slice(0, newCount))
                  }}
                >
                  Load More Photographers ({photographers.length} of {allPhotographers.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Browse
