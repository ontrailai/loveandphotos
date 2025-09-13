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
  VideoIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import Avatar from '@components/shared/Avatar'
import RatingStars from '@components/shared/RatingStars'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'

const PhotographerProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [photographer, setPhotographer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

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
          average_rating: preview.average_rating || 4.5,
          total_reviews: preview.total_reviews || 0,
          total_bookings: preview.total_bookings || 0,
          response_time_hours: 24,
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
          navigate('/browse')
        }
      }
    } catch (error) {
      console.error('Error loading photographer:', error)
      toast.error('Failed to load photographer profile')
      navigate('/browse')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500"></div>
      </div>
    )
  }

  if (!photographer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-dusty-900 mb-2">Photographer not found</h2>
          <Button onClick={() => navigate('/browse')}>
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
            onClick={() => navigate('/browse')}
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
                    selectedImage === index ? 'border-blush-500' : 'border-transparent'
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
                <h1 className="text-2xl font-semibold text-dusty-900">
                  {photographer.users?.full_name}
                </h1>
                <p className="text-dusty-600">
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
              </div>
            </Card>

            {/* Pricing Card */}
            <Card>
              <h3 className="font-semibold text-dusty-900 mb-4">Pricing</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-dusty-600">
                    <DollarSignIcon className="w-4 h-4 mr-2" />
                    Hourly Rate
                  </span>
                  <span className="font-semibold text-dusty-900">
                    ${photographer.hourly_rate}/hr
                  </span>
                </div>
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