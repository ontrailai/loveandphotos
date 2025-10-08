import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { normalizeLocationQuery } from '@lib/utils/normalizeLocationQuery'
import { 
  SearchIcon, 
  MapPinIcon, 
  FilterIcon,
  VideoIcon,
  GridIcon,
  ListIcon,
  ChevronDownIcon,
  ArrowLeft,
  CheckCircleIcon,
  StarIcon,
  LockIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import SafeAvatar from '@components/shared/SafeAvatar'
import SafeImage from '@components/shared/SafeImage'
import ImageErrorBoundary from '@components/shared/ImageErrorBoundary'
import RatingStars from '@components/shared/RatingStars'
import PhotographerMetricBadges from '@components/photographer/PhotographerMetricBadges'

export default function VideoBrowse() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Determine if pricing should be shown
  const shouldShowPricing = user && profile

  // State
  const [photographers, setPhotographers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid')

  // Search state 
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')

  // Get initial values from URL params
  useEffect(() => {
    const location = searchParams.get('location') || ''
    const query = searchParams.get('q') || ''
    setLocationQuery(location)
    setSearchQuery(query)
  }, [searchParams])

  // Fetch video photographers
  const fetchPhotographers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query for video photographers only
      let query = supabase
        .from('photographers')
        .select(`
          *,
          users!inner(id, email, phone, full_name, avatar_url),
          portfolio_items(id, image_url, title, description),
          pay_tiers(id, name, hourly_rate)
        `)
        .eq('is_videographer', true)
        .eq('profile_complete', true)
        .eq('visible_in_search', true)

      // Apply location filter (city, state, zip_code are in photographers table)
      if (locationQuery.trim()) {
        const normalized = normalizeLocationQuery(locationQuery)
        query = query.or(`city.ilike.%${normalized}%,state.ilike.%${normalized}%,zip_code.ilike.%${normalized}%`)
      }

      // Apply search filter (full_name is in users table, bio is in photographers table)
      if (searchQuery.trim()) {
        query = query.or(`users.full_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
      }

      // Order by rating
      query = query.order('average_rating', { ascending: false })

      const { data, error } = await query
      if (error) throw error

      setPhotographers(data || [])
    } catch (error) {
      console.error('Error fetching video photographers:', error)
      setError('Failed to load video photographers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Set document title
  useEffect(() => {
    const title = locationQuery 
      ? `Video Photographers in ${locationQuery} - Love & Photos`
      : 'Video Photographers - Love & Photos'
    document.title = title
    
    return () => {
      document.title = 'Love & Photos'
    }
  }, [locationQuery])

  // Initial load
  useEffect(() => {
    fetchPhotographers()
  }, [locationQuery, searchQuery])

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault()
    const newParams = new URLSearchParams()
    if (locationQuery) newParams.set('location', locationQuery)
    if (searchQuery) newParams.set('q', searchQuery)
    setSearchParams(newParams)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link 
              to="/photographers" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
              <span>All Photographers</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <VideoIcon className="h-8 w-8 text-[#fe395f]" />
            <div>
              <h1 className="text-3xl font-bold">Video Photographers</h1>
              <p className="text-muted-foreground">
                Professional videographers specializing in capturing your special moments
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search video photographers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-[#fe395f] focus:border-transparent"
              />
            </div>
            
            <input
              type="text"
              placeholder="City, State or ZIP code"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-[#fe395f] focus:border-transparent"
            />
            
            <Button
              type="submit"
              className="bg-[#fe395f] hover:bg-[#fe395f]/90 text-white"
            >
              Search
            </Button>
          </form>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              {loading ? 'Loading...' : `${photographers.length} Video Photographer${photographers.length !== 1 ? 's' : ''} Found`}
            </h2>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <GridIcon size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <ListIcon size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="text-center py-12">
            <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Video Photographers</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPhotographers}>Try Again</Button>
          </Card>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="bg-muted h-48 rounded-lg mb-4"></div>
                <div className="bg-muted h-4 rounded mb-2"></div>
                <div className="bg-muted h-4 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && photographers.length === 0 && (
          <Card className="text-center py-12">
            <VideoIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Video Photographers Found</h3>
            <p className="text-muted-foreground mb-6">
              {locationQuery || searchQuery 
                ? 'Try adjusting your search criteria or location.'
                : 'No video photographers are currently available.'}
            </p>
            {(locationQuery || searchQuery) && (
              <Button onClick={() => { setLocationQuery(''); setSearchQuery(''); }}>
                Clear Search
              </Button>
            )}
          </Card>
        )}

        {/* Results */}
        {!loading && !error && photographers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographers.map((photographer) => (
              <Card
                key={photographer.user_id}
                hover
                className="cursor-pointer overflow-hidden group"
                onClick={() => navigate(`/photographer/${photographer.user_id}`)}
              >
                {/* Portfolio Preview */}
                <ImageErrorBoundary>
                  <div className="aspect-w-16 aspect-h-12 -m-6 mb-4">
                    <SafeImage
                      src={photographer.portfolio_items?.[0]?.image_url}
                      alt={photographer.users?.full_name || 'Video photographer portfolio'}
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
                        <h3 className="font-semibold flex items-center gap-2">
                          {photographer.users?.full_name?.split(' ')[0] || 'Photographer'}
                          <VideoIcon className="w-4 h-4 text-[#fe395f]" title="Video specialist" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Video Specialist
                        </p>
                      </div>
                    </div>
                    <Badge variant={photographer.pay_tiers?.name?.toLowerCase() || 'default'} size="sm">
                      {photographer.pay_tiers?.name || 'Bronze'}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1">
                      <RatingStars rating={photographer.average_rating || 0} size="sm" showNumber />
                      <span className="text-xs text-muted-foreground">
                        ({photographer.total_reviews || 0})
                      </span>
                    </div>
                  </div>

                  {/* Verified Badge */}
                  <div className="flex items-center justify-end">
                    {photographer.is_verified && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" title="Verified" />
                    )}
                  </div>

                  {/* Trust Metrics */}
                  <div className="mt-3">
                    <PhotographerMetricBadges 
                      photographer={photographer} 
                      className="justify-center"
                      size="sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}