import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  MapPinIcon,
  StarIcon,
  LockIcon,
  ImageOffIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import LNPChoiceBadge from '@components/ui/LNPChoiceBadge'
import PhotographerMetricBadges from '@components/photographer/PhotographerMetricBadges'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import PhotographerStatsCard from '@components/photographer/PhotographerStatsCard'
import BookingSidebar from '@components/booking/BookingSidebar'
import { supabasePublic } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import toast from 'react-hot-toast'

const PhotographerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const [photographer, setPhotographer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageErrors, setImageErrors] = useState({})

  // Parse initial date from URL parameter
  const initialDate = searchParams.get('date') ? new Date(searchParams.get('date')) : null

  // Determine if pricing should be shown
  const shouldShowPricing = profile?.role === 'admin' || profile?.role === 'photographer'

  useEffect(() => {
    loadPhotographer()
  }, [id])

  const loadPhotographer = async () => {
    if (!id) {
      console.error('[PhotographerProfile] No photographer ID provided')
      setLoadError(true)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setLoadError(false)

      console.log('[PhotographerProfile] Loading photographer:', id)

      // Query photographers table
      const { data, error } = await supabasePublic
        .from('photographers')
        .select(`
          id,
          user_id,
          bio,
          style_tags,
          languages,
          experience_years,
          city,
          state,
          zip_code,
          is_public,
          visible_in_search,
          is_verified,
          lnp_choice,
          average_rating,
          total_reviews,
          portfolio_images,
          gender,
          acceptance_rate,
          avg_response_time_minutes,
          has_minimum_data,
          manual_override_acceptance_rate,
          manual_override_response_time,
          completed_jobs_count
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('[PhotographerProfile] Query error:', error)
        setLoadError(true)
        toast.error('Photographer not found')
        return
      }

      if (!data) {
        console.error('[PhotographerProfile] No data returned')
        setLoadError(true)
        toast.error('Photographer not found')
        return
      }

      console.log('[PhotographerProfile] Loaded photographer data:', data)

      // Fetch user data separately if user_id exists
      let userData = null
      if (data.user_id) {
        const { data: user, error: userError } = await supabasePublic
          .from('users')
          .select('full_name, email, phone, avatar_url')
          .eq('id', data.user_id)
          .single()

        if (!userError && user) {
          userData = user
          console.log('[PhotographerProfile] Loaded user data:', userData)
        } else {
          console.warn('[PhotographerProfile] Could not load user data:', userError)
        }
      }

      // Transform data to expected format with null handling
      const transformed = {
        id: data.id,
        user_id: data.user_id,
        bio: data.bio || 'Professional photographer with years of experience.',
        specialties: Array.isArray(data.style_tags) && data.style_tags.length > 0
          ? data.style_tags
          : ['Photography'],
        languages: Array.isArray(data.languages) && data.languages.length > 0
          ? data.languages
          : ['English'],
        years_experience: data.experience_years || 0,
        location_city: data.city || '',
        location_state: data.state || '',
        location_zip: data.zip_code || '',
        is_public: data.is_public !== false,
        visible_in_search: data.visible_in_search !== false,
        is_verified: data.is_verified || false,
        is_love_and_photos_choice: data.lnp_choice || false,
        average_rating: data.average_rating || 0,
        total_reviews: data.total_reviews || 0,
        total_bookings: data.completed_jobs_count || 0,
        gender: data.gender || null,
        // Response time from avg_response_time_minutes or default to 24 hours
        response_time_hours: data.avg_response_time_minutes
          ? Math.round(data.avg_response_time_minutes / 60)
          : 24,
        // Trust metrics
        acceptance_rate: data.acceptance_rate,
        avg_response_time_minutes: data.avg_response_time_minutes,
        has_minimum_data: data.has_minimum_data || false,
        manual_override_acceptance_rate: data.manual_override_acceptance_rate,
        manual_override_response_time: data.manual_override_response_time,
        // User info with fallbacks
        users: {
          full_name: userData?.full_name || 'Photographer',
          email: userData?.email || '',
          phone: userData?.phone || '',
          avatar_url: userData?.avatar_url || null
        },
        // Portfolio images with validation
        portfolio_images: Array.isArray(data.portfolio_images) && data.portfolio_images.length > 0
          ? data.portfolio_images
          : []
      }

      setPhotographer(transformed)

    } catch (error) {
      console.error('[PhotographerProfile] Error loading photographer:', error)
      setLoadError(true)
      toast.error('Failed to load photographer profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle image load errors
  const handleImageError = (index) => {
    console.warn(`[PhotographerProfile] Image failed to load at index ${index}`)
    setImageErrors(prev => ({ ...prev, [index]: true }))
  }

  // Get location display string
  const getLocationDisplay = () => {
    const parts = []
    if (photographer?.location_city) parts.push(photographer.location_city)
    if (photographer?.location_state) parts.push(photographer.location_state)
    return parts.length > 0 ? parts.join(', ') : 'Location not specified'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dusty-600">Loading photographer profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError || !photographer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-semibold text-dusty-900 mb-2">Photographer Not Found</h2>
          <p className="text-dusty-600 mb-6">
            The photographer you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => navigate('/photographers')}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  // Get valid portfolio images (filter out errored ones)
  const validPortfolioImages = photographer.portfolio_images.filter(
    (_, index) => !imageErrors[index]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/photographers')}
            className="flex items-center text-dusty-600 hover:text-dusty-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Browse
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portfolio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Gallery */}
            {validPortfolioImages.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="aspect-w-16 aspect-h-10 bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={validPortfolioImages[selectedImage] || validPortfolioImages[0]}
                    alt={`${photographer.users?.full_name} - Portfolio Image ${selectedImage + 1}`}
                    className="w-full h-[400px] sm:h-[500px] object-cover"
                    loading="lazy"
                    onError={() => handleImageError(selectedImage)}
                  />
                </div>

                {/* Thumbnail Gallery */}
                {validPortfolioImages.length > 1 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {validPortfolioImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`
                          aspect-square rounded-lg overflow-hidden border-2 transition-all
                          ${selectedImage === index
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-transparent hover:border-gray-300'
                          }
                        `}
                      >
                        <img
                          src={image}
                          alt={`${photographer.users?.full_name} - Portfolio Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(index)}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-w-16 aspect-h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageOffIcon className="w-16 h-16 mx-auto mb-2" />
                  <p>No portfolio images available</p>
                </div>
              </div>
            )}

            {/* About Section */}
            <Card>
              <h2 className="text-xl font-semibold text-dusty-900 mb-4">About</h2>
              <p className="text-dusty-600 whitespace-pre-wrap">
                {photographer.bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                {/* Specialties */}
                {photographer.specialties && photographer.specialties.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-dusty-900 mb-3">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {photographer.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" size="sm">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {photographer.languages && photographer.languages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-dusty-900 mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {photographer.languages.map((language, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Photographer Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <div className="text-center">
                <Avatar
                  src={photographer.users?.avatar_url}
                  name={photographer.users?.full_name}
                  size="xl"
                  className="mx-auto mb-4"
                />
                <h1 className="text-2xl font-semibold text-dusty-900 flex items-center justify-center gap-2 flex-wrap">
                  {photographer.users?.full_name}
                  {photographer.is_love_and_photos_choice && (
                    <LNPChoiceBadge size="default" />
                  )}
                </h1>

                {/* Location */}
                <div className="flex items-center justify-center mt-2 text-dusty-600">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <p>{getLocationDisplay()}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center mt-3">
                  <RatingStars
                    rating={photographer.average_rating || 0}
                    showNumber
                  />
                  <span className="ml-2 text-sm text-dusty-600">
                    ({photographer.total_reviews || 0} {photographer.total_reviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>

                {/* Verified Badge */}
                {photographer.is_verified && (
                  <div className="flex items-center justify-center mt-3 text-green-600">
                    <CheckCircleIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">Verified Professional</span>
                  </div>
                )}

                {/* Performance Metrics Badges */}
                <PhotographerMetricBadges
                  photographer={photographer}
                  className="mt-4 justify-center"
                  size="default"
                />
              </div>
            </Card>

            {/* Details Card */}
            <Card>
              <h3 className="font-semibold text-dusty-900 mb-4">Details</h3>
              <div className="space-y-3">
                {/* Response Time */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-dusty-600">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Response Time
                  </span>
                  <span className="text-dusty-900 font-medium">
                    ~{photographer.response_time_hours || 24} {photographer.response_time_hours === 1 ? 'hour' : 'hours'}
                  </span>
                </div>

                {/* Experience */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-dusty-600">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Experience
                  </span>
                  <span className="text-dusty-900 font-medium">
                    {photographer.years_experience > 0
                      ? `${photographer.years_experience} ${photographer.years_experience === 1 ? 'year' : 'years'}`
                      : 'New photographer'
                    }
                  </span>
                </div>

                {/* Pricing - Only for admins/photographers */}
                {shouldShowPricing ? (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="flex items-center text-dusty-600">
                      <DollarSignIcon className="w-4 h-4 mr-2" />
                      Rate Information
                    </span>
                    <span className="text-dusty-900 font-medium">
                      Contact for rates
                    </span>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg mt-3">
                    <div className="flex items-center text-dusty-600 mb-2">
                      <LockIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Pricing Information</span>
                    </div>
                    <p className="text-xs text-dusty-500">
                      Contact photographer for pricing details or{' '}
                      <button
                        onClick={() => navigate('/login')}
                        className="text-primary-600 hover:text-primary-700 underline font-medium"
                        aria-label="Sign in to view pricing"
                      >
                        sign in as a professional
                      </button>{' '}
                      to view rates.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Performance Stats - Only show for photographers with user_id and minimum data */}
            {photographer.user_id && photographer.has_minimum_data && (
              <PhotographerStatsCard photographerUserId={photographer.user_id} />
            )}

            {/* Booking Sidebar */}
            <BookingSidebar
              photographer={photographer}
              initialDate={initialDate}
            />

            {/* Stats Card */}
            <Card>
              <h3 className="font-semibold text-dusty-900 mb-4">Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-dusty-600">Total Bookings</span>
                  <span className="font-medium text-dusty-900">
                    {photographer.total_bookings || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dusty-600">Member Since</span>
                  <span className="font-medium text-dusty-900">
                    {new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotographerProfile
