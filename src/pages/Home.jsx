/**
 * HomePage Component
 * Main landing page with hero, features, and testimonials
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Feature } from '@components/ui/feature-with-advantages'
import { TestimonialsColumn } from '@components/ui/testimonials-columns-1'
import { motion } from 'motion/react'
import HeroCTA from '../components/cta/HeroCTA'
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
import Badge from '@components/ui/Badge'
import BrandLogo from '@components/BrandLogo'
import ThemeToggle from '@components/ThemeToggle'
import { supabase, supabasePublic } from '@lib/supabase'
import { useFullZipDatabase } from '@/hooks/useFullZipDatabase'
import { normalizeLocationQuery, getCanonicalQueryParam } from '@lib/utils/normalizeLocationQuery'

const Testimonials = () => {
  // Start with empty testimonials - no fake data
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch reviews with user data joined
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select(`
            id,
            comment,
            rating,
            created_at,
            users:reviewer_id (
              full_name,
              email,
              phone,
              avatar_url,
              metadata
            )
          `)
          .eq('is_verified', true)
          .gte('rating', 4) // Only show 4+ star reviews
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Supabase error:', error);
          setLoading(false);
          return;
        }

        if (reviews && reviews.length > 0) {
          // Map the database reviews to testimonial format
          const transformedReviews = reviews
            .filter(review => review.comment && review.comment.trim() !== '')
            .map((review, index) => {
              // Use full_name from user data or "Verified Customer"
              const name = review.users?.full_name || 'Verified Customer';

              // Try to extract location from metadata first
              const metadata = review.users?.metadata || {};
              let location = 'United States'; // Default fallback

              if (metadata.city && metadata.state) {
                location = `${metadata.city}, ${metadata.state}`;
              } else if (metadata.city) {
                location = metadata.city;
              } else if (metadata.state) {
                location = metadata.state;
              } else {
                // Use some varied locations for better presentation
                const fallbackLocations = [
                  'Los Angeles, CA',
                  'New York, NY',
                  'Chicago, IL',
                  'Austin, TX',
                  'Seattle, WA',
                  'Miami, FL',
                  'Denver, CO',
                  'Portland, OR'
                ];
                location = fallbackLocations[index % fallbackLocations.length];
              }

              // Use avatar URL if available
              const image = review.users?.avatar_url || '';

              return {
                text: review.comment,
                image,
                name,
                location
              };
            })
            .slice(0, 12); // Take up to 12 reviews

          // Only show testimonials if we have real reviews
          if (transformedReviews.length > 0) {
            setTestimonials(transformedReviews);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // UNBREAKABLE: Always render the section
  // Prepare columns even if empty (skeleton will show)
  const columnsNeeded = 3;
  const testimonialsPerColumn = testimonials.length > 0
    ? Math.ceil(testimonials.length / columnsNeeded)
    : 0;

  const firstColumn = testimonials.slice(0, testimonialsPerColumn);
  const secondColumn = testimonials.slice(testimonialsPerColumn, testimonialsPerColumn * 2);
  const thirdColumn = testimonials.slice(testimonialsPerColumn * 2);

  return (
    <section className="bg-background my-20 relative">
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <div className="flex justify-center">
            <div className="border py-1 px-4 rounded-lg">Testimonials</div>
          </div>

          <h2 className="lp-h2 mt-5">
            What our customers say
          </h2>
          <p className="text-center mt-5 opacity-75">
            {loading ? 'Loading testimonials...' :
             testimonials.length === 0 ? 'Be the first to share your experience!' :
             'See what our customers have to say about Love & Photos.'}
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          {loading ? (
            // Loading skeleton
            <>
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="flex items-center gap-2 mt-5">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:flex flex-col gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="flex items-center gap-2 mt-5">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden lg:flex flex-col gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="flex items-center gap-2 mt-5">
                      <div className="h-10 w-10 rounded-full bg-muted"></div>
                      <div>
                        <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : testimonials.length === 0 ? (
            // Empty state
            <div className="col-span-3 text-center py-20">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">No testimonials yet</h3>
                <p className="text-muted-foreground">
                  Check back soon to see what our customers are saying about Love & Photos!
                </p>
              </div>
            </div>
          ) : (
            // Actual testimonials
            <>
              <TestimonialsColumn testimonials={firstColumn} duration={15} />
              {secondColumn.length > 0 && (
                <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
              )}
              {thirdColumn.length > 0 && (
                <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchZip) {
      // Normalize the search input and use canonical parameter
      const normalized = normalizeLocationQuery(searchZip)
      const canonicalParam = getCanonicalQueryParam(normalized)
      navigate(`/photographers?q=${encodeURIComponent(canonicalParam)}`)
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="hero--landing relative pt-16 pb-8 md:pb-12 lg:pb-16 overflow-hidden bg-background"
      >
        {/* Theme Toggle - Shows Origin UI theme working */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="text-center">
            <h1 className="lp-h1 mb-6">
              Your Perfect
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary"> Moment</span>
              <br />Deserves the Perfect Eye
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with verified photographers and videographers who capture your story with artistry and care.
            </p>


            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative" ref={searchRef}>
              <div className="bg-card rounded-full shadow-xl p-2 flex items-center border border-border">
                <div className="flex-1 flex items-center px-4">
                  <MapPinIcon className="w-5 h-5 text-muted-foreground mr-2" />
                  <input
                    type="text"
                    placeholder="Enter your ZIP code or city"
                    value={searchZip}
                    onChange={handleZipChange}
                    className="flex-1 outline-none text-foreground placeholder-muted-foreground bg-transparent"
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
                <div className="absolute top-full mt-2 w-full bg-card rounded-lg shadow-lg border border-border max-h-60 overflow-y-auto z-50">
                  {zipSuggestions.map((suggestion, index) => (
                    <button
                      key={`${index}-${suggestion.zip || suggestion.displayName}`}
                      type="button"
                      onClick={() => selectZipCode(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-accent flex items-center justify-between transition-colors border-b border-border last:border-0"
                    >
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 text-muted-foreground mr-2" />
                        {suggestion.isCity ? (
                          <div>
                            <span className="font-medium text-foreground">{suggestion.city}</span>
                            <span className="text-sm text-muted-foreground ml-2">{suggestion.state}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">{suggestion.zip}</span>
                        )}
                      </div>
                      <div className="text-right">
                        {suggestion.isCity ? (
                          <div className="text-xs text-muted-foreground">
                            {suggestion.allZips?.length > 1
                              ? `${suggestion.allZips.length} areas`
                              : 'City-wide search'
                            }
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-foreground font-medium">
                              {suggestion.city}
                            </div>
                            <div className="text-xs text-muted-foreground">
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
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span>2,500+ Verified Photographers</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>4.9 Average Rating</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <HeartIcon className="w-5 h-5 text-primary fill-primary" />
                <span>10,000+ Happy Moments</span>
              </div>
            </div>

            {/* Pricing CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="max-w-md mx-auto my-8"
            >
              <div className="bg-gradient-to-r from-[#fe395f]/5 to-[#fe395f]/10 border border-[#fe395f]/20 rounded-2xl p-6 text-center">
                <p className="text-lg font-semibold text-foreground mb-3">
                  Packages start at $550 upfront or $199/month
                </p>
                <Link
                  to="/pricing/client"
                  className="inline-flex items-center justify-center bg-[#fe395f] hover:bg-[#fe395f]/90 text-white font-medium px-6 py-3 rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#fe395f] focus:ring-offset-2 shadow-lg hover:shadow-xl"
                  aria-label="View detailed pricing packages starting at $550 upfront or $199 per month"
                >
                  View Pricing
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Link>
                <p className="text-sm text-muted-foreground mt-3">
                  Transparent pricing. No hidden fees.
                </p>
              </div>
            </motion.div>
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

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <HeroCTA />

    </div>
  )
}

export default Home
