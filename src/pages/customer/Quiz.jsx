/**
 * Booking Personalization Quiz Component
 * Captures customer style preferences and must-have shots
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { 
  CameraIcon,
  SparklesIcon,
  MusicIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  HeartIcon,
  SunIcon,
  MoonIcon,
  FilmIcon,
  SmileIcon,
  UsersIcon,
  FlowerIcon,
  GlassesIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

const Quiz = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { bookingId } = useParams()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Quiz responses
  const [quizData, setQuizData] = useState({
    style: '',
    mood: '',
    shots: [],
    musicMood: '',
    specialMoments: [],
    notes: ''
  })

  const totalSteps = 5

  // Style options
  const styleOptions = [
    {
      id: 'candid',
      title: 'Candid & Natural',
      description: 'Unposed moments, genuine emotions',
      icon: <SmileIcon className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400'
    },
    {
      id: 'posed',
      title: 'Classic & Posed',
      description: 'Traditional portraits, structured shots',
      icon: <UsersIcon className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1595407753234-0ebe155ccdbd?w=400'
    },
    {
      id: 'artistic',
      title: 'Artistic & Creative',
      description: 'Unique angles, creative compositions',
      icon: <GlassesIcon className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'
    },
    {
      id: 'documentary',
      title: 'Documentary Style',
      description: 'Story-driven, journalistic approach',
      icon: <FilmIcon className="w-8 h-8" />,
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400'
    }
  ]

  // Mood options
  const moodOptions = [
    {
      id: 'bright',
      title: 'Bright & Airy',
      description: 'Light, soft, ethereal',
      icon: <SunIcon className="w-8 h-8" />,
      gradient: 'from-yellow-100 to-pink-100'
    },
    {
      id: 'moody',
      title: 'Moody & Dramatic',
      description: 'Deep shadows, rich colors',
      icon: <MoonIcon className="w-8 h-8" />,
      gradient: 'from-purple-200 to-indigo-200'
    },
    {
      id: 'vintage',
      title: 'Vintage & Timeless',
      description: 'Classic film look, muted tones',
      icon: <CameraIcon className="w-8 h-8" />,
      gradient: 'from-amber-100 to-orange-100'
    },
    {
      id: 'vibrant',
      title: 'Vibrant & Colorful',
      description: 'Bold colors, high contrast',
      icon: <SparklesIcon className="w-8 h-8" />,
      gradient: 'from-pink-100 to-blue-100'
    }
  ]

  // Must-have shots
  const shotOptions = [
    { id: 'first-look', label: 'First Look', icon: '👀' },
    { id: 'ceremony-wide', label: 'Ceremony Wide Shot', icon: '⛪' },
    { id: 'ring-exchange', label: 'Ring Exchange', icon: '💍' },
    { id: 'first-kiss', label: 'First Kiss', icon: '💋' },
    { id: 'couple-portraits', label: 'Couple Portraits', icon: '💑' },
    { id: 'family-formals', label: 'Family Formals', icon: '👨‍👩‍👧‍👦' },
    { id: 'bridal-party', label: 'Bridal Party', icon: '👯' },
    { id: 'details', label: 'Detail Shots', icon: '📸' },
    { id: 'getting-ready', label: 'Getting Ready', icon: '💄' },
    { id: 'reception-entrance', label: 'Reception Entrance', icon: '🎉' },
    { id: 'first-dance', label: 'First Dance', icon: '💃' },
    { id: 'speeches', label: 'Speeches/Toasts', icon: '🥂' },
    { id: 'cake-cutting', label: 'Cake Cutting', icon: '🎂' },
    { id: 'dancing', label: 'Dance Floor', icon: '🕺' },
    { id: 'sunset-shots', label: 'Golden Hour/Sunset', icon: '🌅' },
    { id: 'night-shots', label: 'Night Portraits', icon: '🌙' }
  ]

  // Music mood options for video
  const musicOptions = [
    {
      id: 'cinematic',
      title: 'Cinematic & Epic',
      description: 'Orchestral, dramatic, movie-like',
      icon: '🎬'
    },
    {
      id: 'romantic',
      title: 'Romantic & Soft',
      description: 'Love songs, acoustic, emotional',
      icon: '💕'
    },
    {
      id: 'upbeat',
      title: 'Upbeat & Fun',
      description: 'Happy, energetic, celebration',
      icon: '🎉'
    },
    {
      id: 'modern',
      title: 'Modern & Trendy',
      description: 'Contemporary hits, current vibes',
      icon: '🎵'
    }
  ]

  // Special moments
  const specialMomentOptions = [
    { id: 'surprise', label: 'Surprise/Special Performance', icon: '🎤' },
    { id: 'cultural', label: 'Cultural Traditions', icon: '🏮' },
    { id: 'pets', label: 'Pets Involved', icon: '🐕' },
    { id: 'fireworks', label: 'Fireworks/Sparklers', icon: '🎆' },
    { id: 'helicopter', label: 'Unique Exit (Helicopter, etc.)', icon: '🚁' },
    { id: 'elderly', label: 'Special Moments with Elderly', icon: '👵' }
  ]

  useEffect(() => {
    loadBookingDetails()
  }, [bookingId])

  const loadBookingDetails = async () => {
    if (!bookingId) {
      toast.error('No booking ID provided')
      navigate('/dashboard')
      return
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          photographers (
            users!inner (
              full_name
            )
          ),
          packages (
            title
          )
        `)
        .eq('id', bookingId)
        .eq('customer_id', user.id)
        .single()

      if (error) throw error
      
      if (!data) {
        toast.error('Booking not found')
        navigate('/dashboard')
        return
      }

      setBooking(data)
      
      // Check if quiz already completed
      if (data.personalization_data?.quizCompleted) {
        toast.info('You have already completed the style quiz')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking details')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleShot = (shotId) => {
    setQuizData(prev => ({
      ...prev,
      shots: prev.shots.includes(shotId)
        ? prev.shots.filter(s => s !== shotId)
        : [...prev.shots, shotId]
    }))
  }

  const toggleSpecialMoment = (momentId) => {
    setQuizData(prev => ({
      ...prev,
      specialMoments: prev.specialMoments.includes(momentId)
        ? prev.specialMoments.filter(m => m !== momentId)
        : [...prev.specialMoments, momentId]
    }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return quizData.style !== ''
      case 2:
        return quizData.mood !== ''
      case 3:
        return quizData.shots.length > 0
      case 4:
        return quizData.musicMood !== ''
      case 5:
        return true // Notes are optional
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      // Update booking with personalization data
      const { error } = await supabase
        .from('bookings')
        .update({
          personalization_data: {
            ...quizData,
            quizCompleted: true,
            completedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)

      if (error) throw error

      toast.success('Your style preferences have been saved!')
      
      // If payment is already complete, notify photographer
      if (booking.payment_status === 'paid') {
        // Trigger notification to photographer
        await supabase.functions.invoke('notify-photographer-quiz', {
          body: { bookingId, photographerId: booking.photographer_id }
        })
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Error saving quiz data:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-sage-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-sage-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-display font-bold text-dusty-900">
              Personalize Your Photography Experience
            </h1>
            <p className="text-dusty-600 mt-2">
              Help {booking?.photographers?.users?.full_name} capture your vision perfectly
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dusty-600">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-dusty-600">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blush-500 to-sage-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Photography Style */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-dusty-900 mb-6 text-center">
              What's your preferred photography style?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {styleOptions.map((style) => (
                <Card
                  key={style.id}
                  className={clsx(
                    'cursor-pointer transition-all overflow-hidden',
                    quizData.style === style.id 
                      ? 'ring-2 ring-blush-500 shadow-lg transform scale-105' 
                      : 'hover:shadow-md'
                  )}
                  onClick={() => setQuizData({ ...quizData, style: style.id })}
                  padding={false}
                >
                  <div className="relative h-48">
                    <img 
                      src={style.image}
                      alt={style.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      {style.icon}
                    </div>
                    {quizData.style === style.id && (
                      <div className="absolute top-4 right-4">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-dusty-900 mb-1">
                      {style.title}
                    </h3>
                    <p className="text-sm text-dusty-600">
                      {style.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Color Mood */}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-dusty-900 mb-6 text-center">
              What color mood do you envision?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {moodOptions.map((mood) => (
                <Card
                  key={mood.id}
                  className={clsx(
                    'cursor-pointer transition-all',
                    quizData.mood === mood.id 
                      ? 'ring-2 ring-blush-500 shadow-lg transform scale-105' 
                      : 'hover:shadow-md'
                  )}
                  onClick={() => setQuizData({ ...quizData, mood: mood.id })}
                >
                  <div className={clsx(
                    'h-24 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br',
                    mood.gradient
                  )}>
                    <div className="text-white">
                      {mood.icon}
                    </div>
                    {quizData.mood === mood.id && (
                      <div className="absolute top-4 right-4">
                        <CheckCircleIcon className="w-6 h-6 text-blush-500" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-dusty-900 mb-1">
                    {mood.title}
                  </h3>
                  <p className="text-sm text-dusty-600">
                    {mood.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Must-Have Shots */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-dusty-900 mb-2 text-center">
              Select your must-have shots
            </h2>
            <p className="text-dusty-600 text-center mb-6">
              Choose all the moments you definitely want captured
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {shotOptions.map((shot) => (
                <button
                  key={shot.id}
                  onClick={() => toggleShot(shot.id)}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-all text-center',
                    quizData.shots.includes(shot.id)
                      ? 'border-blush-500 bg-blush-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="text-2xl mb-1">{shot.icon}</div>
                  <p className="text-sm text-dusty-700">{shot.label}</p>
                  {quizData.shots.includes(shot.id) && (
                    <CheckCircleIcon className="w-4 h-4 text-blush-500 mx-auto mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Music Mood for Video */}
        {currentStep === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-dusty-900 mb-6 text-center">
              Video music preference
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {musicOptions.map((music) => (
                <Card
                  key={music.id}
                  className={clsx(
                    'cursor-pointer transition-all',
                    quizData.musicMood === music.id 
                      ? 'ring-2 ring-blush-500 shadow-lg' 
                      : 'hover:shadow-md'
                  )}
                  onClick={() => setQuizData({ ...quizData, musicMood: music.id })}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{music.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-dusty-900">
                        {music.title}
                      </h3>
                      <p className="text-sm text-dusty-600">
                        {music.description}
                      </p>
                    </div>
                    {quizData.musicMood === music.id && (
                      <CheckCircleIcon className="w-6 h-6 text-blush-500" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Special Notes */}
        {currentStep === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-dusty-900 mb-6 text-center">
              Any special moments or notes?
            </h2>
            
            <Card>
              <div className="space-y-6">
                {/* Special Moments */}
                <div>
                  <label className="text-sm font-medium text-dusty-700 mb-3 block">
                    Special moments to capture (optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {specialMomentOptions.map((moment) => (
                      <button
                        key={moment.id}
                        onClick={() => toggleSpecialMoment(moment.id)}
                        className={clsx(
                          'p-3 rounded-lg border text-sm transition-all',
                          quizData.specialMoments.includes(moment.id)
                            ? 'border-blush-500 bg-blush-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="mr-2">{moment.icon}</span>
                        {moment.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-sm font-medium text-dusty-700 mb-2 block">
                    Additional notes for your photographer (optional)
                  </label>
                  <textarea
                    value={quizData.notes}
                    onChange={(e) => setQuizData({ ...quizData, notes: e.target.value })}
                    placeholder="Any specific requests, family dynamics to be aware of, or other important details..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep === totalSteps ? (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!isStepValid()}
            >
              Complete Quiz
              <CheckCircleIcon className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quiz
