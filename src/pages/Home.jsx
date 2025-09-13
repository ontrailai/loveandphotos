/**
 * HomePage Component
 * Main landing page with hero, features, and testimonials
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import Logo, { LogoMinimal, LogoMonogram } from '@components/Logo'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import RatingStars from '@components/shared/RatingStars'
import { supabase } from '@lib/supabase'
import { useFullZipDatabase } from '@/hooks/useFullZipDatabase'

const Home = () => {
  const navigate = useNavigate()
  const [searchZip, setSearchZip] = useState('')
  const [featuredPhotographers, setFeaturedPhotographers] = useState([])
  const [loading, setLoading] = useState(true)
  const [zipSuggestions, setZipSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const { searchZipCodes, isReady } = useFullZipDatabase()

  useEffect(() => {
    loadFeaturedPhotographers()
  }, [])

  const loadFeaturedPhotographers = async () => {
    try {
      console.log('Loading featured photographers...')
      setLoading(true)
      
      // Try to load real data from photographer_preview_profiles
      console.log('Attempting to fetch featured photographers from database...')
      
      const { data: photographers, error } = await supabase
        .from('photographer_preview_profiles')
        .select('id, display_name, image_url, average_rating, hourly_rate, is_verified, specialties')
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
            avatar_url: profile.image_url && profile.image_url.startsWith('http') ? profile.image_url : fallbackImages[index]
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
      <section className="relative pt-16 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush-50 via-white to-sage-50" />
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-dusty-900 mb-6">
              Your Perfect
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blush-500 to-sage-500"> Moment</span>
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
                  className="bg-blush-600 hover:bg-blush-700 text-white rounded-full p-3 transition-colors"
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
                <HeartIcon className="w-5 h-5 text-blush-500 fill-blush-500" />
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-dusty-900 mb-4">
              Why Choose Love & Photos
            </h2>
            <p className="text-lg text-dusty-600 max-w-2xl mx-auto">
              We make finding and booking the perfect photographer simple, safe, and delightful
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blush-400 to-sage-400 rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-dusty-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-dusty-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Photographers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-dusty-900 mb-4">
              Featured Photographers
            </h2>
            <p className="text-lg text-dusty-600">
              Top-rated professionals ready to capture your moments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </Card>
              ))
            ) : (
              featuredPhotographers.map((photographer) => (
                <Card 
                  key={photographer.id} 
                  hover 
                  className="cursor-pointer"
                  onClick={() => navigate(`/photographer/${photographer.id}`)}
                >
                  <div className="aspect-w-16 aspect-h-12 mb-4">
                    <img 
                      src={photographer.users?.avatar_url || `https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400`}
                      alt={photographer.users?.full_name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-dusty-900">
                        {photographer.users?.full_name || 'Photographer'}
                      </h3>
                      <p className="text-sm text-dusty-600">
                        {photographer.specialties?.join(', ') || 'All Events'}
                      </p>
                    </div>
                    <Badge variant={photographer.pay_tiers?.name.toLowerCase() || 'default'} size="sm">
                      {photographer.pay_tiers?.name || 'Bronze'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <RatingStars rating={photographer.average_rating || 0} size="sm" />
                    <span className="text-sm font-medium text-dusty-700">
                      ${photographer.pay_tiers?.hourly_rate || 150}/hr
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/photographers">
              <Button size="lg" className="group">
                View All Photographers
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-blush-50 to-sage-50">
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
                <div className="absolute -top-4 -right-4 text-6xl text-blush-200 font-serif">
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
              <Button size="lg" className="bg-blush-500 text-white hover:bg-blush-600 shadow-lg">
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
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <LogoMonogram className="w-10 h-10" />
                <span className="text-2xl font-display font-bold text-dusty-900">Love & Photos</span>
              </Link>
              <p className="text-dusty-600 text-sm">
                Connecting moments with the perfect lens since 2024
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-dusty-900 mb-4">For Clients</h4>
              <ul className="space-y-2">
                <li><Link to="/photographers" className="text-dusty-600 hover:text-dusty-900 text-sm">Find Photographers</Link></li>
                <li><Link to="/how-it-works" className="text-dusty-600 hover:text-dusty-900 text-sm">How It Works</Link></li>
                <li><Link to="/pricing" className="text-dusty-600 hover:text-dusty-900 text-sm">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-dusty-900 mb-4">For Photographers</h4>
              <ul className="space-y-2">
                <li><Link to="/signup?role=photographer" className="text-dusty-600 hover:text-dusty-900 text-sm">Join as Photographer</Link></li>
                <li><Link to="/resources" className="text-dusty-600 hover:text-dusty-900 text-sm">Resources</Link></li>
                <li><Link to="/faq" className="text-dusty-600 hover:text-dusty-900 text-sm">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-dusty-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-dusty-600 hover:text-dusty-900 text-sm">About</Link></li>
                <li><Link to="/contact" className="text-dusty-600 hover:text-dusty-900 text-sm">Contact</Link></li>
                <li><Link to="/terms" className="text-dusty-600 hover:text-dusty-900 text-sm">Terms</Link></li>
                <li><Link to="/privacy" className="text-dusty-600 hover:text-dusty-900 text-sm">Privacy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-dusty-500 text-sm">
              Copyright 2025. Love & Photos. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
