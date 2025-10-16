import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  MapPinIcon,
  StarIcon,
  ImageOffIcon,
  Video,
  Camera,
  Mic,
  Sun,
  Settings,
  Film,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import LNPChoiceBadge from '@components/ui/LNPChoiceBadge'
import PhotographerMetricBadges from '@components/photographer/PhotographerMetricBadges'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import BookingSidebar from '@components/booking/BookingSidebar'
import ImageLightbox from '@components/ui/ImageLightbox'
import { supabasePublic } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import toast from 'react-hot-toast'

const PhotographerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, photographerProfile } = useAuth()
  const [photographer, setPhotographer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState({})
  const [isBioExpanded, setIsBioExpanded] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Check if viewing own profile
  const isOwnProfile = photographerProfile?.id === id

  // Parse initial date from URL parameter
  const initialDate = searchParams.get('date') ? new Date(searchParams.get('date')) : null

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

      // Query photographers table with unavailable_dates for blocking
      const { data, error} = await supabasePublic
        .from('photographers')
        .select('id, user_id, bio, style_tags, languages, experience_years, city, state, zip_code, is_public, visible_in_search, is_verified, lnp_choice, is_videographer, average_rating, total_reviews, portfolio_images, gender, completed_jobs_count, unavailable_dates, gear_has_camera, gear_has_lenses, gear_has_tripod, gear_has_gimbal, gear_has_audio_recorder, gear_has_lighting')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        console.error('[PhotographerProfile] Query error:', error)
        setLoadError(true)
        toast.error(error.message || 'Profile not found')
        return
      }

      if (!data) {
        console.error('[PhotographerProfile] No data returned')
        setLoadError(true)
        toast.error('Profile not found')
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
          .maybeSingle()

        if (!userError && user) {
          userData = user
          console.log('[PhotographerProfile] Loaded user data:', userData)
        } else {
          console.warn('[PhotographerProfile] Could not load user data:', userError)
        }
      }

      // Transform data to expected format with null handling
      const isVideographer = data.is_videographer || false
      const transformed = {
        id: data.id,
        user_id: data.user_id,
        is_videographer: isVideographer,
        bio: data.bio || `Professional ${isVideographer ? 'videographer' : 'photographer'} with years of experience.`,
        specialties: Array.isArray(data.style_tags) && data.style_tags.length > 0
          ? data.style_tags
          : [isVideographer ? 'Videography' : 'Photography'],
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
        // Unavailable dates for booking enforcement (inverse availability model)
        unavailable_dates: Array.isArray(data.unavailable_dates) ? data.unavailable_dates : [],
        // User info with fallbacks
        users: {
          full_name: userData?.full_name || (isVideographer ? 'Videographer' : 'Photographer'),
          email: userData?.email || '',
          phone: userData?.phone || '',
          avatar_url: userData?.avatar_url || null
        },
        // Gear data for videographers
        gear_has_camera: data.gear_has_camera || false,
        gear_has_lenses: data.gear_has_lenses || false,
        gear_has_tripod: data.gear_has_tripod || false,
        gear_has_gimbal: data.gear_has_gimbal || false,
        gear_has_audio_recorder: data.gear_has_audio_recorder || false,
        gear_has_lighting: data.gear_has_lighting || false,
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

  // Open lightbox at specific index
  const openLightbox = (index) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  // Close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  // Navigate to different image in lightbox
  const navigateLightbox = (index) => {
    setLightboxIndex(index)
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
    const isVideographer = photographer?.is_videographer
    const title = isVideographer ? 'Videographer Not Found' : 'Photographer Not Found'
    const description = isVideographer
      ? 'The videographer you\'re looking for doesn\'t exist or is no longer available.'
      : 'The photographer you\'re looking for doesn\'t exist or is no longer available.'

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-semibold text-dusty-900 mb-2">{title}</h2>
          <p className="text-dusty-600 mb-6">
            {description}
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/photographers')}
              className="flex items-center text-dusty-600 hover:text-dusty-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Browse
            </button>

            {/* Edit Profile button - only show if viewing own profile */}
            {isOwnProfile && (
              <Button
                variant="primary"
                onClick={() => {
                  // Navigate to appropriate edit page based on videographer status
                  const editPath = photographer.is_videographer
                    ? '/talent/dashboard/videographer'
                    : '/talent/dashboard/profile'
                  navigate(editPath)
                }}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portfolio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Gallery - Only for Photographers (not Videographers) */}
            {!photographer.is_videographer && (
              <>
                {validPortfolioImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-dusty-900">Portfolio</h2>
                      <span className="text-sm text-gray-600">
                        {currentImageIndex + 1} / {validPortfolioImages.length}
                      </span>
                    </div>

                    {/* Single Full-Size Image with Navigation */}
                    <div className="relative">
                      {/* Main Image */}
                      <div
                        className="relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity shadow-lg"
                        onClick={() => openLightbox(currentImageIndex)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openLightbox(currentImageIndex)
                          }
                        }}
                        aria-label={`View portfolio image ${currentImageIndex + 1} in full screen`}
                      >
                        <img
                          src={validPortfolioImages[currentImageIndex]}
                          alt={`${photographer.users?.full_name} - Portfolio Image ${currentImageIndex + 1}`}
                          className="w-full h-auto"
                          loading="lazy"
                          onError={() => handleImageError(currentImageIndex)}
                        />
                      </div>

                      {/* Navigation Buttons */}
                      {validPortfolioImages.length > 1 && (
                        <>
                          {/* Previous Button */}
                          <button
                            onClick={() => setCurrentImageIndex(prev =>
                              prev === 0 ? validPortfolioImages.length - 1 : prev - 1
                            )}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all z-10"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-6 h-6 text-gray-800" />
                          </button>

                          {/* Next Button */}
                          <button
                            onClick={() => setCurrentImageIndex(prev =>
                              prev === validPortfolioImages.length - 1 ? 0 : prev + 1
                            )}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all z-10"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-6 h-6 text-gray-800" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Dots for Navigation */}
                    {validPortfolioImages.length > 1 && (
                      <div className="flex justify-center gap-2 pt-2">
                        {validPortfolioImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                              currentImageIndex === index
                                ? 'w-8 bg-primary-500'
                                : 'w-2 bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-w-16 aspect-h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                    <div className="text-center text-gray-400">
                      <ImageOffIcon className="w-16 h-16 mx-auto mb-2" />
                      <p>No portfolio images available</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* About Section */}
            <Card>
              <h2 className="text-xl font-semibold text-dusty-900 mb-4">About</h2>
              <p className="text-dusty-600 whitespace-pre-wrap break-words">
                {photographer.bio && photographer.bio.length > 500 && !isBioExpanded
                  ? `${photographer.bio.substring(0, 500)}...`
                  : photographer.bio}
              </p>
              {photographer.bio && photographer.bio.length > 500 && (
                <button
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="text-[#fe395f] hover:text-[#fe395f]/80 font-medium mt-2 transition-colors"
                >
                  {isBioExpanded ? 'Show less' : 'Show more'}
                </button>
              )}

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

            {/* Gear Section - Only for Videographers */}
            {photographer.is_videographer && (
              <Card>
                <h2 className="text-xl font-semibold text-dusty-900 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#fe395f]" />
                  Gear I Use
                </h2>
                {(() => {
                  const gearItems = []
                  if (photographer.gear_has_camera) gearItems.push({ label: 'Professional Camera', icon: Video })
                  if (photographer.gear_has_lenses) gearItems.push({ label: 'Quality Lenses', icon: Camera })
                  if (photographer.gear_has_tripod) gearItems.push({ label: 'Tripod', icon: Settings })
                  if (photographer.gear_has_gimbal) gearItems.push({ label: 'Gimbal/Stabilizer', icon: Film })
                  if (photographer.gear_has_audio_recorder) gearItems.push({ label: 'Audio Equipment', icon: Mic })
                  if (photographer.gear_has_lighting) gearItems.push({ label: 'Lighting Kit', icon: Sun })

                  if (gearItems.length === 0) {
                    return (
                      <p className="text-dusty-500 italic text-sm">
                        This videographer hasn't listed their gear yet
                      </p>
                    )
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {gearItems.map((item, index) => {
                        const Icon = item.icon
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 bg-dusty-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <Icon className="w-5 h-5 text-[#fe395f]" />
                            </div>
                            <span className="text-dusty-700 text-sm font-medium">
                              {item.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </Card>
            )}
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
              </div>
            </Card>

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

      {/* Image Lightbox */}
      <ImageLightbox
        images={validPortfolioImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
    </div>
  )
}

export default PhotographerProfile
