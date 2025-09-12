import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'

const Pricing = () => {
  const photographerTiers = [
    {
      name: 'Bronze',
      price: '$150',
      unit: '/hour',
      color: 'border-amber-600',
      badge: 'bg-amber-100 text-amber-800',
      features: [
        'Basic marketplace listing',
        'Standard support',
        'Accept online bookings',
        'Basic analytics',
        '20% platform fee'
      ],
      notIncluded: [
        'Priority listing',
        'Featured badge',
        'Advanced analytics',
        'Custom branding'
      ]
    },
    {
      name: 'Silver',
      price: '$225',
      unit: '/hour',
      color: 'border-gray-400',
      badge: 'bg-gray-100 text-gray-800',
      popular: true,
      features: [
        'Priority marketplace listing',
        'Enhanced support',
        'Accept online bookings',
        'Featured photographer badge',
        'Advanced analytics',
        '20% platform fee',
        'Promotional opportunities'
      ],
      notIncluded: [
        'Top listing placement',
        'Custom branding'
      ]
    },
    {
      name: 'Gold',
      price: '$350',
      unit: '/hour',
      color: 'border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
      features: [
        'Top marketplace listing',
        'Premium support',
        'Accept online bookings',
        'Gold photographer badge',
        'Full analytics dashboard',
        '20% platform fee',
        'Priority promotional opportunities',
        'Quarterly business reviews'
      ],
      notIncluded: [
        'Custom branding'
      ]
    },
    {
      name: 'Platinum',
      price: '$500+',
      unit: '/hour',
      color: 'border-purple-600',
      badge: 'bg-purple-100 text-purple-800',
      features: [
        'VIP marketplace placement',
        'Dedicated account manager',
        'Accept online bookings',
        'Platinum photographer badge',
        'Full analytics with insights',
        '20% platform fee',
        'Exclusive promotional opportunities',
        'Monthly business reviews',
        'Custom branding options',
        'Priority customer referrals'
      ],
      notIncluded: []
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-blush-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            For clients, browsing and booking is completely free. 
            For photographers, choose a tier that matches your expertise and goals.
          </p>
        </div>
      </section>

      {/* Client Pricing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blush-500 to-blush-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">For Clients</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-5xl font-bold mb-4">$0</h3>
                <p className="text-2xl mb-6">No fees, ever.</p>
                <p className="text-blush-100">
                  Browse, book, and pay photographers directly through our platform 
                  without any additional fees or hidden charges.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-semibold mb-4">What's Included:</h4>
                <ul className="space-y-2">
                  {[
                    'Unlimited browsing and searching',
                    'Direct messaging with photographers',
                    'Secure payment processing',
                    'Booking management tools',
                    'Review and rating system',
                    'Customer support'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Link 
              to="/browse" 
              className="mt-8 inline-block bg-white text-blush-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Start Browsing Free
            </Link>
          </div>
        </div>
      </section>

      {/* Photographer Pricing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            For Photographers
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choose a tier based on your experience and the level of exposure you want. 
            All tiers include our core platform features.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {photographerTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-lg shadow-lg border-2 ${tier.color} relative ${
                  tier.popular ? 'transform scale-105' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blush-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 ${tier.badge}`}>
                    {tier.name}
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600">{tier.unit}</span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                    {tier.notIncluded.map((feature, idx) => (
                      <div key={idx} className="flex items-start opacity-50">
                        <X className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    to="/signup?role=photographer" 
                    className={`block text-center px-4 py-2 rounded-lg font-semibold transition ${
                      tier.popular 
                        ? 'bg-blush-600 text-white hover:bg-blush-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              All photographer tiers require a minimum number of completed jobs to qualify.
            </p>
            <Link 
              to="/photographer-faq" 
              className="text-blush-600 font-semibold hover:text-blush-700"
            >
              Learn more about tier requirements →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Pricing FAQs
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                How does the platform fee work?
              </h3>
              <p className="text-gray-600">
                We charge photographers a 20% platform fee on each booking. This covers payment processing, 
                customer support, marketing, and platform maintenance.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my tier later?
              </h3>
              <p className="text-gray-600">
                Yes! As you complete more jobs and build your reputation, you can upgrade to higher tiers. 
                Tier changes are reviewed monthly based on your performance metrics.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Are there any hidden fees for clients?
              </h3>
              <p className="text-gray-600">
                No. Clients pay only the photographer's listed price. There are no booking fees, 
                service charges, or any other hidden costs.
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link 
              to="/faq" 
              className="text-blush-600 font-semibold hover:text-blush-700"
            >
              View all FAQs →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Pricing