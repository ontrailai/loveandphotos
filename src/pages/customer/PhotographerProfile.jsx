import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  GlobeIcon,
  MapPinIcon,
  StarIcon,
  UsersIcon,
  VideoIcon,
  LockIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import LNPChoiceBadge from '@components/ui/LNPChoiceBadge'
import PhotographerMetricBadges from '@components/photographer/PhotographerMetricBadges'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import PhotographerStatsCard from '@components/photographer/PhotographerStatsCard'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import toast from 'react-hot-toast'

const PhotographerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [photographer, setPhotographer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Determine if pricing should be shown
  const shouldShowPricing = profile?.role === 'admin' || profile?.role === 'photographer'

  useEffect(() => {
    loadPhotographer()
  }, [id])

  const loadPhotographer = async () => {
    try {
      setLoading(true)
      
      // Try to load from photographer_preview_profiles first
      const { data: preview, error: previewError } = await supabase
        .from('photographer_preview_profiles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!previewError && preview) {
        // Transform preview profile to match expected format
        const transformed = {
          id: preview.id,
          bio: preview.bio || 'Professional photographer specializing in capturing your special moments.',
          specialties: preview.specialties || ['Wedding', 'Portrait', 'Event'],
          languages: preview.languages || ['English'],
          years_experience: preview.years_experience || 3,
          hourly_rate: preview.hourly_rate || 150,
          location_city: preview.location_city,
          location_state: preview.location_state,
          is_available: preview.is_available,
          is_verified: preview.is_verified,
          is_love_and_photos_choice: preview.is_love_and_photos_choice || false,
          average_rating: preview.average_rating || 4.5,
          total_reviews: preview.total_reviews || 0,
          total_bookings: preview.total_bookings || 0,
          response_time_hours: 24,
          // Metrics fields (will be loaded from photographers table if exists)
          acceptance_rate: null,
          avg_response_time_minutes: null,
          has_minimum_data: false,
          manual_override_acceptance_rate: null,
          manual_override_response_time: null,
          users: {
            full_name: preview.display_name,
            email: preview.contact_email,
            phone: preview.contact_phone,
            avatar_url: `https://images.unsplash.com/photo-${1500648767791 + Math.floor(Math.random() * 100000)}-00dcc994a43e?w=400`
          },
          portfolio_images: preview.portfolio_images || [
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
            'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
            'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
            'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800'
          ]
        }
        
        // If preview has a user_id, try to fetch additional metrics from photographers table
        if (preview.user_id) {
          const { data: photographerData } = await supabase
            .from('photographers')
            .select('acceptance_rate, avg_response_time_minutes, has_minimum_data, manual_override_acceptance_rate, manual_override_response_time')
            .eq('user_id', preview.user_id)
            .single()
          
          if (photographerData) {
            transformed.acceptance_rate = photographerData.acceptance_rate
            transformed.avg_response_time_minutes = photographerData.avg_response_time_minutes
            transformed.has_minimum_data = photographerData.has_minimum_data
            transformed.manual_override_acceptance_rate = photographerData.manual_override_acceptance_rate
            transformed.manual_override_response_time = photographerData.manual_override_response_time
          }
        }
        
        setPhotographer(transformed)
      } else {
        // Fallback to original photographers table
        const { data, error } = await supabase
          .from('photographers')
          .select(`
            *,
            users!inner(full_name, email, phone, avatar_url),
            pay_tiers(name, hourly_rate, badge_color),
            portfolio_items(image_url)
          `)
          .eq('id', id)
          .single()
        
        if (!error && data) {
          setPhotographer(data)
        } else {
          toast.error('Photographer not found')
          navigate('/photographers')
        }
      }
    } catch (error) {
      console.error('Error loading photographer:', error)
      toast.error('Failed to load photographer profile')
      navigate('/photographers')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!photographer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-dusty-900 mb-2">Photographer not found</h2>
          <Button onClick={() => navigate('/photographers')}>
            Back to Browse
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/photographers')}
            className="flex items-center text-dusty-600 hover:text-dusty-900"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Browse
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portfolio */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="aspect-w-16 aspect-h-10 mb-4">
              <img
                src={photographer.portfolio_images?.[selectedImage] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800'}
                alt="Portfolio"
                className="w-full h-[500px] object-cover rounded-xl"
              />
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {(photographer.portfolio_images || []).slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-w-16 aspect-h-10 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                </button>
              ))}
            </div>

            {/* About Section */}
            <Card className="mt-8">
              <h2 className="text-xl font-semibold text-dusty-900 mb-4">About</h2>
              <p className="text-dusty-600">
                {photographer.bio}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <h3 className="font-semibold text-dusty-900 mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {photographer.specialties?.map((specialty, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-dusty-900 mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {photographer.languages?.map((language, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
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
                <h1 className="text-2xl font-semibold text-dusty-900 flex items-center justify-center gap-3">
                  {photographer.users?.full_name}
                  {photographer.is_love_and_photos_choice && (
                    <LNPChoiceBadge size="default" />
                  )}
                </h1>
                <p className="text-dusty-600 mt-2">
                  {photographer.location_city}, {photographer.location_state}
                </p>
                
                <div className="flex items-center justify-center mt-3">
                  <RatingStars 
                    rating={photographer.average_rating || 0} 
                    showNumber 
                  />
                  <span className="ml-2 text-sm text-dusty-600">
                    ({photographer.total_reviews || 0} reviews)
                  </span>
                </div>

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

            {/* Pricing Card */}
            <Card>
              <h3 className="font-semibold text-dusty-900 mb-4">
                {shouldShowPricing ? 'Pricing' : 'Details'}
              </h3>
              <div className="space-y-3">
                {shouldShowPricing ? (
                  // Show pricing for admin and photographer users
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-dusty-600">
                      <DollarSignIcon className="w-4 h-4 mr-2" />
                      Hourly Rate
                    </span>
                    <span className="font-semibold text-dusty-900">
                      ${photographer.hourly_rate}/hr
                    </span>
                  </div>
                ) : (
                  // Show login prompt for pricing access
                  <div className="bg-gray-50 p-4 rounded-lg">
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
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-dusty-600">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Response Time
                  </span>
                  <span className="text-dusty-900">
                    {photographer.response_time_hours || 24} hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-dusty-600">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Experience
                  </span>
                  <span className="text-dusty-900">
                    {photographer.years_experience} years
                  </span>
                </div>
              </div>
            </Card>

            {/* Performance Stats - Only show for claimed photographers with a user_id */}
            {photographer.users ? (
              <PhotographerStatsCard photographerId={photographer.id} />
            ) : null}

            {/* Book Now Button */}
            <Button 
              onClick={() => navigate(`/book/${photographer.id}`)}
              className="w-full"
              size="lg"
            >
              Book Now
            </Button>

            {/* Stats */}
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