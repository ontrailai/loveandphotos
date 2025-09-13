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
  'https://images.unsplash.com/photo-1552750085-1cbc45a53c52?w=600',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600'
]

const Browse = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [photographers, setPhotographers] = useState([])
  const [allPhotographers, setAllPhotographers] = useState([])
  const [displayCount, setDisplayCount] = useState(50)
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

  useEffect(() => {
    // When display count changes, update displayed photographers
    if (allPhotographers.length > 0) {
      setPhotographers(allPhotographers.slice(0, displayCount))
    }
  }, [displayCount, allPhotographers])

  const loadPhotographers = async () => {
    try {
      setLoading(true)
      console.log('Loading photographers...')
      
      // Use mock data temporarily to fix the page
      console.log('Using mock photographer data')
      const mockProfiles = []
      
      // Generate 1200 mock photographers with variety
      for (let i = 0; i < 1200; i++) {
        const fallbackUrl = profileImages[i % profileImages.length]
        mockProfiles.push({
          id: i + 1,
          user_id: i + 1,
          bio: `Professional photographer with ${5 + (i % 10)} years of experience`,
          specialties: [['Wedding', 'Portrait'], ['Event', 'Corporate'], ['Family', 'Newborn'], ['Fashion', 'Commercial']][i % 4],
          languages: ['English'],
          years_experience: 5 + (i % 10),
          hourly_rate: 150 + (i * 25),
          location_city: [
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 
            'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
            'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit',
            'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
            'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs',
            'Raleigh', 'Miami', 'Virginia Beach', 'Omaha', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington'
          ][i % 48],
          location_state: [
            'NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA',
            'TX', 'CA', 'TX', 'FL', 'TX', 'OH', 'NC', 'CA',
            'IN', 'WA', 'CO', 'DC', 'MA', 'TX', 'TN', 'MI',
            'OK', 'OR', 'NV', 'TN', 'KY', 'MD', 'WI', 'NM',
            'AZ', 'CA', 'CA', 'AZ', 'MO', 'GA', 'CA', 'CO',
            'NC', 'FL', 'VA', 'NE', 'CA', 'MN', 'OK', 'TX'
          ][i % 48],
          is_available: true,
          is_public: true,
          average_rating: 4.2 + (i % 8) * 0.1,
          total_reviews: 10 + (i * 3),
          total_bookings: 5 + (i * 2),
          users: {
            full_name: [
              'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Williams', 'Chris Brown', 'Amanda Davis', 'Ryan Taylor',
              'Ashley Garcia', 'James Wilson', 'Maria Martinez', 'Daniel Anderson', 'Lisa Thompson', 'Robert White', 'Jennifer Lopez', 'Mark Davis',
              'Nicole Johnson', 'Steven Miller', 'Rachel Green', 'Kevin Jones', 'Lauren Smith', 'Brandon Lee', 'Stephanie Clark', 'Anthony Moore',
              'Michelle Taylor', 'Thomas White', 'Samantha Brown', 'Christopher Wilson', 'Kimberly Davis', 'Matthew Garcia', 'Brittany Martinez', 'Joshua Anderson',
              'Rebecca Thompson', 'Andrew Johnson', 'Catherine Miller', 'Tyler Jones', 'Vanessa Smith', 'Jonathan Lee', 'Diana Clark', 'Ryan Moore',
              'Alexis Taylor', 'Nicholas White', 'Jasmine Brown', 'Benjamin Wilson', 'Taylor Davis', 'Jacob Garcia', 'Megan Martinez', 'Alexander Anderson'
            ][i % 48],
            avatar_url: fallbackUrl
          },
          pay_tiers: {
            name: (i % 3 === 0) ? 'Professional' : 'Standard',
            hourly_rate: 150 + (i * 25),
            badge_color: (i % 3 === 0) ? 'gold' : 'silver'
          },
          portfolio_items: [
            { image_url: portfolioImages[i % portfolioImages.length] },
            { image_url: portfolioImages[(i + 5) % portfolioImages.length] },
            { image_url: portfolioImages[(i + 10) % portfolioImages.length] }
          ]
        })
      }
      
      console.log('Generated', mockProfiles.length, 'mock profiles')
      
      // Apply filters to mock data
      let filtered = mockProfiles
        
        if (filters.rating > 0) {
          filtered = filtered.filter(p => p.average_rating >= filters.rating)
        }
        
        if (filters.priceRange !== 'all') {
          const [min, max] = filters.priceRange.split('-').map(v => v === '500+' ? 9999 : parseInt(v))
          filtered = filtered.filter(p => {
            const rate = p.hourly_rate
            if (max === 9999) return rate >= 500
            return rate >= min && rate <= (max || 9999)
          })
        }
        
        if (filters.specialties.length > 0) {
          filtered = filtered.filter(p => 
            filters.specialties.some(s => 
              p.specialties.some(ps => ps.toLowerCase().includes(s.toLowerCase()))
            )
          )
        }
        
        if (filters.languages.length > 0) {
          filtered = filtered.filter(p =>
            filters.languages.some(l => p.languages.includes(l))
          )
        }
        
        if (filters.zip) {
          // Filter by location (city or state)
          const searchTerm = filters.zip.toLowerCase()
          filtered = filtered.filter(p => 
            p.location_city?.toLowerCase().includes(searchTerm) ||
            p.location_state?.toLowerCase().includes(searchTerm)
          )
        }
        
      console.log('Setting photographers:', filtered.length, 'photographers')
      setAllPhotographers(filtered)
      setPhotographers(filtered.slice(0, displayCount))
      
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
    setDisplayCount(50) // Reset display count
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
                {loading ? 'Loading...' : `${allPhotographers.length} Photographers Available`}
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
                              {photographer.users?.full_name?.split(' ')[0] || 'Photographer'}
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
                                  {photographer.users?.full_name?.split(' ')[0] || 'Photographer'}
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
