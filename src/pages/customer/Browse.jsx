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
  ListIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import { supabase } from '@lib/supabase'
import { clsx } from 'clsx'

const Browse = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [photographers, setPhotographers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    zip: searchParams.get('zip') || '',
    date: '',
    priceRange: 'all',
    rating: 0,
    tier: 'all',
    specialties: [],
    languages: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  const specialtyOptions = [
    'Wedding', 'Portrait', 'Event', 'Corporate', 
    'Family', 'Newborn', 'Fashion', 'Real Estate'
  ]

  const languageOptions = [
    'English', 'Spanish', 'French', 'Chinese', 
    'Korean', 'Japanese', 'Hindi', 'Arabic'
  ]

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-150', label: 'Under $150/hr' },
    { value: '150-300', label: '$150-$300/hr' },
    { value: '300-500', label: '$300-$500/hr' },
    { value: '500+', label: '$500+/hr' }
  ]

  useEffect(() => {
    loadPhotographers()
  }, [filters])

  const loadPhotographers = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('photographers')
        .select(`
          *,
          users!inner(full_name, avatar_url),
          pay_tiers(name, hourly_rate, badge_color),
          portfolio_items(image_url)
        `)
        .eq('is_public', true)
        .limit(20)

      // Apply filters
      if (filters.rating > 0) {
        query = query.gte('average_rating', filters.rating)
      }

      if (filters.tier !== 'all') {
        query = query.eq('pay_tiers.name', filters.tier)
      }

      if (filters.specialties.length > 0) {
        query = query.contains('specialties', filters.specialties)
      }

      if (filters.languages.length > 0) {
        query = query.contains('languages', filters.languages)
      }

      // Sort
      query = query.order('average_rating', { ascending: false })

      const { data, error } = await query

      if (!error && data) {
        setPhotographers(data)
      }
    } catch (error) {
      console.error('Error loading photographers:', error)
    } finally {
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
      priceRange: 'all',
      rating: 0,
      tier: 'all',
      specialties: [],
      languages: []
    })
  }

  const activeFilterCount = 
    filters.specialties.length + 
    filters.languages.length + 
    (filters.rating > 0 ? 1 : 0) +
    (filters.tier !== 'all' ? 1 : 0) +
    (filters.priceRange !== 'all' ? 1 : 0)

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
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blush-500"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dusty-400" />
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blush-500"
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
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-blush-500 text-white text-xs rounded-full flex items-center justify-center">
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
                    className="text-sm text-blush-600 hover:text-blush-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="text-sm font-medium text-dusty-700 mb-3 block">
                  Price Range
                </label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blush-500"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-dusty-900">
                {loading ? 'Loading...' : `${photographers.length} Photographers Found`}
              </h2>
            </div>

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
                  Try adjusting your filters or search criteria
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
                    onClick={() => navigate(`/photographer/${photographer.id}`)}
                  >
                    {/* Portfolio Preview */}
                    <div className="aspect-w-16 aspect-h-12 -m-6 mb-4">
                      <img
                        src={
                          photographer.portfolio_items?.[0]?.image_url ||
                          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600'
                        }
                        alt={photographer.users?.full_name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="px-6 pb-6">
                      {/* Photographer Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={photographer.users?.avatar_url}
                            name={photographer.users?.full_name}
                            size="sm"
                          />
                          <div>
                            <h3 className="font-semibold text-dusty-900">
                              {photographer.users?.full_name || 'Photographer'}
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
                      <div className="flex items-center justify-between mb-3">
                        <RatingStars 
                          rating={photographer.average_rating || 0} 
                          size="sm" 
                          showNumber 
                        />
                        <span className="text-sm text-dusty-600">
                          {photographer.total_reviews || 0} reviews
                        </span>
                      </div>

                      {/* Price & Features */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-dusty-900">
                          ${photographer.pay_tiers?.hourly_rate || 150}/hr
                        </span>
                        <div className="flex items-center space-x-2">
                          {photographer.is_verified && (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" title="Verified" />
                          )}
                          {photographer.equipment_list?.includes('video') && (
                            <VideoIcon className="w-5 h-5 text-dusty-400" title="Video available" />
                          )}
                        </div>
                      </div>

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
                    onClick={() => navigate(`/photographer/${photographer.id}`)}
                    padding={false}
                  >
                    <div className="flex">
                      {/* Image */}
                      <div className="w-48 h-36 flex-shrink-0">
                        <img
                          src={
                            photographer.portfolio_items?.[0]?.image_url ||
                            'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400'
                          }
                          alt={photographer.users?.full_name}
                          className="w-full h-full object-cover rounded-l-xl"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <Avatar
                              src={photographer.users?.avatar_url}
                              name={photographer.users?.full_name}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-dusty-900">
                                  {photographer.users?.full_name || 'Photographer'}
                                </h3>
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
                            <p className="text-xl font-bold text-dusty-900">
                              ${photographer.pay_tiers?.hourly_rate || 150}/hr
                            </p>
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
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {photographer.response_time_hours || 24}hr response
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {photographers.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg">
                  Load More Photographers
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
