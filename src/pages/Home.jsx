/**
 * HomePage Component
 * Main landing page with hero, features, and testimonials
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  SearchIcon, 
  MapPinIcon, 
  CalendarIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  CameraIcon,
  HeartIcon,
  ShieldCheckIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import Badge from '@components/ui/Badge'
import RatingStars from '@components/shared/RatingStars'
import { supabase } from '@lib/supabase'

const Home = () => {
  const navigate = useNavigate()
  const [searchZip, setSearchZip] = useState('')
  const [featuredPhotographers, setFeaturedPhotographers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedPhotographers()
  }, [])

  const loadFeaturedPhotographers = async () => {
    try {
      const { data, error } = await supabase
        .from('photographers')
        .select(`
          *,
          users!inner(full_name, avatar_url),
          pay_tiers(name, hourly_rate, badge_color)
        `)
        .eq('is_public', true)
        .eq('is_verified', true)
        .order('average_rating', { ascending: false })
        .limit(3)

      if (!error && data) {
        setFeaturedPhotographers(data)
      }
    } catch (error) {
      console.error('Error loading photographers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchZip) {
      navigate(`/browse?zip=${searchZip}`)
    }
  }

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
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <CameraIcon className="w-8 h-8 text-blush-500" />
                <span className="text-2xl font-display font-bold text-dusty-900">LoveP</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/about" className="text-dusty-600 hover:text-dusty-900 transition">
                About
              </Link>
              <Link to="/browse" className="text-dusty-600 hover:text-dusty-900 transition">
                Find Photographers
              </Link>
              <Link to="/pricing" className="text-dusty-600 hover:text-dusty-900 transition">
                Pricing
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush-50 via-white to-sage-50" />
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
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
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-full shadow-xl p-2 flex items-center">
                <div className="flex-1 flex items-center px-4">
                  <MapPinIcon className="w-5 h-5 text-dusty-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Enter your ZIP code"
                    value={searchZip}
                    onChange={(e) => setSearchZip(e.target.value)}
                    className="flex-1 outline-none text-dusty-900 placeholder-dusty-400"
                  />
                </div>
                <Button type="submit" className="rounded-full px-8">
                  <SearchIcon className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
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
                src="https://images.unsplash.com/photo-1606216265861-0cb39fc7db7a?w=400" 
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
              Why Choose LoveP
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
            <Link to="/browse">
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
              <Button size="lg" className="bg-white text-dusty-900 hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link to="/browse">
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
                <CameraIcon className="w-8 h-8 text-blush-500" />
                <span className="text-2xl font-display font-bold text-dusty-900">LoveP</span>
              </Link>
              <p className="text-dusty-600 text-sm">
                Connecting moments with the perfect lens since 2024
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-dusty-900 mb-4">For Clients</h4>
              <ul className="space-y-2">
                <li><Link to="/browse" className="text-dusty-600 hover:text-dusty-900 text-sm">Find Photographers</Link></li>
                <li><Link to="/how-it-works" className="text-dusty-600 hover:text-dusty-900 text-sm">How It Works</Link></li>
                <li><Link to="/pricing" className="text-dusty-600 hover:text-dusty-900 text-sm">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-dusty-900 mb-4">For Photographers</h4>
              <ul className="space-y-2">
                <li><Link to="/signup?role=photographer" className="text-dusty-600 hover:text-dusty-900 text-sm">Join as Pro</Link></li>
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
              © 2024 LoveP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
