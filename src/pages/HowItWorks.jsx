import { Link } from 'react-router-dom'
import { Search, Calendar, Camera, Star, Shield, CreditCard } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: 'Search & Discover',
      description: 'Browse our curated collection of professional photographers. Filter by style, location, price, and availability to find your perfect match.'
    },
    {
      icon: Star,
      title: 'Review Portfolios',
      description: 'Explore photographer portfolios, read reviews from past clients, and view pricing packages to make an informed decision.'
    },
    {
      icon: Calendar,
      title: 'Check Availability',
      description: 'View real-time availability and select your preferred date. Send a booking request with event details directly to the photographer.'
    },
    {
      icon: CreditCard,
      title: 'Secure Booking',
      description: 'Once accepted, securely pay through our platform. Your payment is protected, and the photographer is only paid after the event.'
    },
    {
      icon: Camera,
      title: 'Capture Moments',
      description: 'Meet your photographer on the event day. They\'ll capture all your special moments professionally and creatively.'
    },
    {
      icon: Shield,
      title: 'Receive & Review',
      description: 'Get your edited photos within the agreed timeframe. Download high-resolution images and share your experience with a review.'
    }
  ]

  const benefits = {
    clients: [
      'Access to vetted professional photographers',
      'Transparent pricing with no hidden fees',
      'Secure payment protection',
      'Real-time availability checking',
      'Direct communication with photographers',
      'Satisfaction guarantee'
    ],
    photographers: [
      'Reach thousands of potential clients',
      'Manage bookings efficiently',
      'Secure payment processing',
      'Build your professional portfolio',
      'Set your own rates and availability',
      'Focus on photography, not marketing'
    ]
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-blush-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How Love & Photos Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Booking a professional photographer has never been easier. 
            Follow our simple process to capture your perfect moments.
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Your Journey to Perfect Photos
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 bg-blush-600 rounded-full">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-6 left-[60px] w-[calc(100%-60px)] h-[1px] bg-gray-200" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Love & Photos?
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Clients */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Clients</h3>
              <ul className="space-y-3">
                {benefits.clients.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to="/browse" 
                className="mt-6 inline-block bg-blush-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blush-700 transition"
              >
                Find Photographers
              </Link>
            </div>

            {/* For Photographers */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Photographers</h3>
              <ul className="space-y-3">
                {benefits.photographers.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link 
                to="/signup?role=photographer" 
                className="mt-6 inline-block bg-blush-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blush-700 transition"
              >
                Join as Photographer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Still Have Questions?</h2>
          <p className="text-gray-600 mb-8">
            Check out our comprehensive FAQ section or get in touch with our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/faq" 
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              View FAQ
            </Link>
            <Link 
              to="/contact" 
              className="px-6 py-3 bg-blush-600 text-white font-semibold rounded-lg hover:bg-blush-700 transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HowItWorks