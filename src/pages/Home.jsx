/**
 * HomePage Component
 * Main landing page with hero, features, and testimonials
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Footer } from '../components/ui/footer-section'
import { Feature } from '@components/ui/feature-with-advantages'
import { FeaturedPhotographersSection } from '@components/ui/featured-photographers'
import {
  SearchIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  HeartIcon,
  ShieldCheckIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import RatingStars from '@components/shared/RatingStars'
import BrandLogo from '@components/BrandLogo'
import { supabase } from '@lib/supabase'
import { useFullZipDatabase } from '@/hooks/useFullZipDatabase'

const Home = () => {
  const navigate = useNavigate()
  const [searchZip, setSearchZip] = useState('')
  const [zipSuggestions, setZipSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const heroRef = useRef(null)
  const { searchZipCodes, isReady } = useFullZipDatabase()

  // Hero background verification hook (development only)
  useEffect(() => {
    if (heroRef.current && process.env.NODE_ENV === 'development') {
      const element = heroRef.current
      const computedStyles = window.getComputedStyle(element)

      console.log('🎯 HERO BACKGROUND VERIFICATION:')
      console.log('  backgroundColor:', computedStyles.backgroundColor)
      console.log('  backgroundImage:', computedStyles.backgroundImage)
      console.log('  background:', computedStyles.background)
      console.log('  Expected: backgroundColor = "rgb(255, 255, 255)" or "white"')
      console.log('  Expected: backgroundImage = "none"')

      const isWhite = computedStyles.backgroundColor === 'rgb(255, 255, 255)' ||
                     computedStyles.backgroundColor === 'white'
      const hasNoImage = computedStyles.backgroundImage === 'none'

      if (isWhite && hasNoImage) {
        console.log('✅ SUCCESS: Hero background is pure white!')
      } else {
        console.log('❌ ISSUE: Hero background is not pure white:')
        console.log('  - White bg:', isWhite)
        console.log('  - No image:', hasNoImage)
      }
    }
  }, [])

  const loadFeaturedPhotographers = async () => {
    try {
      console.log('Loading featured photographers...')
      setLoading(true)
      
      // Try to load real data from photographer_preview_profiles
      console.log('Attempting to fetch featured photographers from database...')
      
      const { data: photographers, error } = await supabase
        .from('photographer_preview_profiles')
        .select('id, display_name, portfolio_images, average_rating, hourly_rate, is_verified, specialties')
        .eq('is_available', true)
        .order('average_rating', { ascending: false })
        .limit(3)
      
      console.log('Featured photographers query result:', { photographers, error })
      
      if (!error && photographers && photographers.length > 0) {
        console.log(`Found ${photographers.length} real featured photographers`)
        
        // Fallback images for featured photographers
        const fallbackImages = [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
        ]
        
        const transformed = photographers.map((profile, index) => ({
          id: profile.id,
          average_rating: profile.average_rating || 4.5,
          users: {
            full_name: profile.display_name || `Featured Photographer ${index + 1}`,
            avatar_url: profile.portfolio_images && profile.portfolio_images.length > 0 ? profile.portfolio_images[0] : fallbackImages[index]
          },
          pay_tiers: {
            name: profile.is_verified ? 'Professional' : 'Standard',
            hourly_rate: profile.hourly_rate || 150,
            badge_color: profile.is_verified ? 'bg-yellow-500' : 'bg-gray-500'
          },
          specialties: profile.specialties ? profile.specialties.split(',').map(s => s.trim()) : ['Wedding', 'Portrait']
        }))
        
        console.log('Featured photographers transformed:', transformed)
        setFeaturedPhotographers(transformed)
        return
      }
      
      console.log('Database query failed or no data, using fallback...')
      throw new Error('No featured photographers found')
      
    } catch (error) {
      console.error('Error loading real featured photographers:', error)
      console.log('Using fallback mock featured photographers')
      
      // Fallback mock data
      const mockData = [
        {
          id: 1,
          average_rating: 4.9,
          users: { full_name: 'Sarah Johnson', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80' },
          pay_tiers: { name: 'Professional', hourly_rate: 200, badge_color: 'bg-yellow-500' },
          specialties: ['Wedding', 'Portrait']
        },
        {
          id: 2,
          average_rating: 4.8,
          users: { full_name: 'Michael Chen', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80' },
          pay_tiers: { name: 'Expert', hourly_rate: 250, badge_color: 'bg-purple-500' },
          specialties: ['Event', 'Corporate']
        },
        {
          id: 3,
          average_rating: 4.7,
          users: { full_name: 'Emily Rodriguez', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80' },
          pay_tiers: { name: 'Professional', hourly_rate: 175, badge_color: 'bg-yellow-500' },
          specialties: ['Family', 'Newborn']
        }
      ]
      setFeaturedPhotographers(mockData)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchZip) {
      navigate(`/photographers?zip=${searchZip}`)
    }
  }

  const handleZipChange = async (e) => {
    const value = e.target.value
    setSearchZip(value)
    
    if (value.length > 0 && isReady) {
      // Search the full database
      const suggestions = await searchZipCodes(value)
      setZipSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setZipSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectZipCode = (suggestion) => {
    if (suggestion.isCity) {
      // If it's a city, use the city name for search
      setSearchZip(suggestion.displayName)
    } else {
      // If it's a zip code, use the zip
      setSearchZip(suggestion.zip)
    }
    setShowSuggestions(false)
    setZipSuggestions([])
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const testimonials = [
    {
      id: 1,
      name: 'Sarah & Michael Chen',
      event: 'Wedding',
      rating: 5,
      comment: 'Our photographer captured every magical moment perfectly. The attention to detail was incredible!',
      image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400'
    },
    {
      id: 2,
      name: 'Emily Rodriguez',
      event: 'Corporate Event',
      rating: 5,
      comment: 'Professional, creative, and delivered beyond our expectations. Highly recommend!',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
    },
    {
      id: 3,
      name: 'James & Lisa Park',
      event: 'Engagement',
      rating: 5,
      comment: 'The photos are absolutely stunning. We couldn\'t be happier with our choice!',
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400'
    }
  ]

  const features = [
    {
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      title: 'Verified Professionals',
      description: 'All photographers are vetted, insured, and trained to our high standards'
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: 'Perfect Match Guarantee',
      description: 'Our AI-powered quiz ensures you get paired with your ideal photographer'
    },
    {
      icon: <CalendarIcon className="w-6 h-6" />,
      title: 'Flexible Scheduling',
      description: 'Book instantly with transparent availability and fair pricing'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="hero--landing relative pt-16 pb-8 md:pb-12 lg:pb-16 overflow-hidden !bg-white !bg-none before:!content-none after:!content-none"
        style={{ backgroundColor: '#ffffff', backgroundImage: 'none' }}
      >
        {/* Background removed - solid white background applied to section */}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-dusty-900 mb-6">
              Your Perfect
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sage-500"> Moment</span>
              <br />Deserves the Perfect Eye
            </h1>
            <p className="text-xl text-dusty-600 mb-8 max-w-2xl mx-auto">
              Connect with verified photographers and videographers who capture your story with artistry and care.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative" ref={searchRef}>
              <div className="bg-white rounded-full shadow-xl p-2 flex items-center">
                <div className="flex-1 flex items-center px-4">
                  <MapPinIcon className="w-5 h-5 text-dusty-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Enter your ZIP code or city"
                    value={searchZip}
                    onChange={handleZipChange}
                    className="flex-1 outline-none text-dusty-900 placeholder-dusty-400"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-600 text-primary-foreground rounded-full p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Search"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
                  {zipSuggestions.map((suggestion, index) => (
                    <button
                      key={`${index}-${suggestion.zip || suggestion.displayName}`}
                      type="button"
                      onClick={() => selectZipCode(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 text-dusty-400 mr-2" />
                        {suggestion.isCity ? (
                          <div>
                            <span className="font-medium text-dusty-900">{suggestion.city}</span>
                            <span className="text-sm text-dusty-600 ml-2">{suggestion.state}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-dusty-900">{suggestion.zip}</span>
                        )}
                      </div>
                      <div className="text-right">
                        {suggestion.isCity ? (
                          <div className="text-xs text-dusty-500">
                            {suggestion.allZips?.length > 1 
                              ? `${suggestion.allZips.length} areas`
                              : 'City-wide search'
                            }
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-dusty-800 font-medium">
                              {suggestion.city}
                            </div>
                            <div className="text-xs text-dusty-500">
                              {suggestion.stateName || suggestion.state}
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-12">
              <div className="flex items-center space-x-2 text-dusty-600">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>2,500+ Verified Photographers</span>
              </div>
              <div className="flex items-center space-x-2 text-dusty-600">
                <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>4.9 Average Rating</span>
              </div>
              <div className="flex items-center space-x-2 text-dusty-600">
                <HeartIcon className="w-5 h-5 text-primary fill-primary" />
                <span>10,000+ Happy Moments</span>
              </div>
            </div>
          </div>

          {/* Hero Image Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-1 space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400" 
                alt="Wedding" 
                className="rounded-2xl w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
              <img 
                src="https://images.unsplash.com/photo-1519741497674-611481863552?w=400" 
                alt="Wedding couple" 
                className="rounded-2xl w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="col-span-1 space-y-4 pt-8">
              <img 
                src="https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400" 
                alt="Portrait" 
                className="rounded-2xl w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
              <img 
                src="https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400" 
                alt="Family" 
                className="rounded-2xl w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="col-span-1 space-y-4">
              <img 
                src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400" 
                alt="Event" 
                className="rounded-2xl w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
              <img 
                src="https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400" 
                alt="Newborn" 
                className="rounded-2xl w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="col-span-1 space-y-4 pt-8">
              <img 
                src="https://images.unsplash.com/photo-1549294413-26f195200c16?w=400" 
                alt="Corporate" 
                className="rounded-2xl w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
              <img 
                src="https://images.unsplash.com/photo-1529636798458-92182e662485?w=400" 
                alt="Birthday" 
                className="rounded-2xl w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Feature />

      {/* Featured Photographers */}
      <FeaturedPhotographersSection />

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-dusty-900 mb-4">
              Love Stories from Our Clients
            </h2>
            <p className="text-lg text-dusty-600">
              Real moments, real memories, real testimonials
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative">
                <div className="absolute -top-4 -right-4 text-6xl text-primary-200 font-serif">
                  "
                </div>
                <div className="relative">
                  <div className="mb-4">
                    <img 
                      src={testimonial.image}
                      alt={testimonial.event}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <RatingStars rating={testimonial.rating} size="sm" className="mb-3" />
                  <p className="text-dusty-600 italic mb-4">
                    {testimonial.comment}
                  </p>
                  <div>
                    <p className="font-semibold text-dusty-900">{testimonial.name}</p>
                    <p className="text-sm text-dusty-500">{testimonial.event}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dusty-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-4">
            Ready to Capture Your Perfect Moment?
          </h2>
          <p className="text-xl text-dusty-300 mb-8">
            Join thousands of happy clients who found their perfect photographer match
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="shadow-lg">
                Get Started Free
              </Button>
            </Link>
            <Link to="/photographers">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Browse Photographers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Home
