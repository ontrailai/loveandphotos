import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Star, Camera, Video, Heart, Sparkles, ArrowRight, Crown } from 'lucide-react'
import PageHero from '@/components/marketing/PageHero'

const ClientPricing = () => {
  const [paymentPeriod, setPaymentPeriod] = useState('upfront') // 'upfront' or 'monthly'

  const packages = [
    {
      name: 'Starter',
      description: 'Perfect for intimate gatherings and smaller celebrations',
      upfrontPrice: 550,
      monthlyPrice: 199,
      duration: '2 hours',
      coverage: 'Single photographer',
      deliverables: '50-75 edited photos',
      turnaround: '7-10 business days',
      features: [
        '2 hours of professional photography',
        'Single photographer coverage',
        '50-75 professionally edited high-resolution photos',
        'Private online gallery for sharing',
        'Personal usage rights included',
        'Basic retouching included'
      ],
      ideal: 'Engagement sessions, small parties, family portraits',
      color: 'border-blush-200',
      badge: null,
      stripePackageId: 'starter-package', // For future Stripe integration
    },
    {
      name: 'Pro',
      description: 'Most popular choice for weddings and major events',
      upfrontPrice: 1450,
      monthlyPrice: 399,
      duration: '6 hours',
      coverage: 'Lead + assistant photographer',
      deliverables: '200-300 edited photos',
      turnaround: '14-21 business days',
      features: [
        '6 hours of dual photographer coverage',
        'Lead photographer + skilled assistant',
        '200-300 professionally edited high-resolution photos',
        'Comprehensive event coverage (ceremony, reception, details)',
        'Private online gallery with download options',
        'Professional retouching and color grading',
        'USB drive with all images included',
        'Print release for personal use'
      ],
      ideal: 'Weddings, anniversaries, corporate events',
      color: 'border-primary-300',
      badge: 'Most Popular',
      highlighted: true,
      stripePackageId: 'pro-package',
    },
    {
      name: 'Luxe',
      description: 'Premium all-day coverage with complete storytelling',
      upfrontPrice: 2850,
      monthlyPrice: 749,
      duration: '10+ hours',
      coverage: '2-3 photographer team',
      deliverables: '400-600 edited photos',
      turnaround: '21-28 business days',
      features: [
        '10+ hours of multi-photographer coverage',
        'Lead photographer + 2 skilled assistants',
        '400-600 professionally edited high-resolution photos',
        'Complete day storytelling (getting ready through reception)',
        'Premium online gallery with slideshow',
        'Advanced retouching and artistic editing',
        'Custom USB drive in presentation box',
        'Print release + commercial usage rights',
        'Same-day sneak peek (5-10 photos)',
        'Priority customer support'
      ],
      ideal: 'Multi-day weddings, destination events, luxury celebrations',
      color: 'border-yellow-400',
      badge: 'Premium',
      stripePackageId: 'luxe-package',
    }
  ]

  const videoAddOns = [
    {
      name: 'Highlight Reel',
      description: '3-5 minute cinematic highlight video',
      price: 450,
      features: [
        'Professional videography during event',
        'Cinematic editing with music',
        'High-definition delivery',
        'Social media optimized versions'
      ]
    },
    {
      name: 'Full Ceremony',
      description: 'Complete ceremony recording + highlight reel',
      price: 850,
      features: [
        'Full ceremony documentation',
        'Multiple camera angles',
        'Professional audio recording',
        'Cinematic highlight reel included',
        'Raw footage provided'
      ]
    },
    {
      name: 'Complete Coverage',
      description: 'Full day video documentation',
      price: 1250,
      features: [
        'Getting ready through reception',
        'Multiple videographers',
        'Drone footage (where permitted)',
        'Documentary + cinematic styles',
        'Full ceremony + reception videos',
        'Highlight reel + social clips'
      ]
    }
  ]

  const getDisplayPrice = (pkg) => {
    if (paymentPeriod === 'monthly') {
      return `$${pkg.monthlyPrice}/month`
    }
    return `$${pkg.upfrontPrice.toLocaleString()}`
  }

  const getPaymentNote = (pkg) => {
    if (paymentPeriod === 'monthly') {
      return `3-month payment plan ($${(pkg.monthlyPrice * 3).toLocaleString()} total)`
    }
    return 'One-time payment'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PageHero
        title="Photography Packages for Your Special Day"
        subtitle="Professional photography packages designed to capture every precious moment. Choose the perfect coverage for your celebration."
      />

      {/* Payment Toggle */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-12">
            <div className="bg-muted rounded-lg p-1 flex">
              <button
                onClick={() => setPaymentPeriod('upfront')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  paymentPeriod === 'upfront'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={paymentPeriod === 'upfront'}
              >
                Pay in Full
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Save 15%
                </span>
              </button>
              <button
                onClick={() => setPaymentPeriod('monthly')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                  paymentPeriod === 'monthly'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={paymentPeriod === 'monthly'}
              >
                3-Month Plan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Packages */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`relative bg-card rounded-2xl shadow-lg border-2 ${pkg.color} ${
                  pkg.highlighted ? 'scale-105 shadow-xl' : ''
                } transition-all hover:shadow-xl`}
              >
                {/* Badge */}
                {pkg.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{pkg.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{pkg.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-foreground">
                        {getDisplayPrice(pkg)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {getPaymentNote(pkg)}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted rounded-lg p-4 mb-6">
                      <div>
                        <div className="font-semibold text-foreground">{pkg.duration}</div>
                        <div className="text-muted-foreground">Coverage</div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{pkg.deliverables}</div>
                        <div className="text-muted-foreground">Photos</div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-foreground mb-4">What's Included:</h4>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ideal For */}
                  <div className="mb-8 p-4 bg-primary/5 rounded-lg">
                    <h5 className="font-semibold text-foreground mb-2">Perfect For:</h5>
                    <p className="text-sm text-muted-foreground">{pkg.ideal}</p>
                  </div>

                  {/* CTA */}
                  <Link
                    to="/photographers"
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${
                      pkg.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }`}
                    aria-label={`Book ${pkg.name} package - ${getDisplayPrice(pkg)}`}
                  >
                    Choose {pkg.name}
                    <ArrowRight className="inline h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Add-Ons */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Video Add-Ons
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Capture your special moments in motion. Professional videography to complement your photography package.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {videoAddOns.map((addon, index) => (
              <div key={index} className="bg-card rounded-lg shadow-md border border-border p-6">
                <div className="flex items-center mb-4">
                  <Video className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-xl font-semibold text-foreground">{addon.name}</h3>
                </div>
                
                <p className="text-muted-foreground mb-4">{addon.description}</p>
                
                <div className="text-2xl font-bold text-foreground mb-4">
                  +${addon.price}
                </div>

                <ul className="space-y-2 mb-6">
                  {addon.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all">
                  Add to Package
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Package Comparison
            </h2>
            <p className="text-muted-foreground">
              Compare features across all photography packages
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-card rounded-lg shadow-md">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-6 font-semibold text-foreground">Features</th>
                  <th className="text-center p-6 font-semibold text-foreground">Starter</th>
                  <th className="text-center p-6 font-semibold text-foreground">Pro</th>
                  <th className="text-center p-6 font-semibold text-foreground">Luxe</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Coverage Duration', starter: '2 hours', pro: '6 hours', luxe: '10+ hours' },
                  { feature: 'Photographer Team', starter: '1 photographer', pro: '2 photographers', luxe: '2-3 photographers' },
                  { feature: 'Edited Photos', starter: '50-75', pro: '200-300', luxe: '400-600' },
                  { feature: 'Turnaround Time', starter: '7-10 days', pro: '14-21 days', luxe: '21-28 days' },
                  { feature: 'Online Gallery', starter: '✓', pro: '✓', luxe: '✓ Premium' },
                  { feature: 'USB Drive', starter: '—', pro: '✓', luxe: '✓ Custom' },
                  { feature: 'Print Rights', starter: 'Personal', pro: 'Personal', luxe: 'Commercial' },
                  { feature: 'Same-Day Previews', starter: '—', pro: '—', luxe: '5-10 photos' },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="p-6 font-medium text-foreground">{row.feature}</td>
                    <td className="p-6 text-center text-muted-foreground">{row.starter}</td>
                    <td className="p-6 text-center text-muted-foreground">{row.pro}</td>
                    <td className="p-6 text-center text-muted-foreground">{row.luxe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Perfect Photographer?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Browse our vetted photographers and find the perfect match for your special day.
            Every photographer in our network is experienced and professionally trained.
          </p>
          <Link
            to="/photographers"
            className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all shadow-lg"
          >
            Browse Photographers
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <div className="mt-4 text-primary-100 text-sm">
            ✓ Instant booking  ✓ Secure payments  ✓ Satisfaction guaranteed
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            {[
              {
                q: "When do I need to pay for my photography package?",
                a: "You can choose to pay in full upfront (and save 15%) or split the cost into 3 monthly payments. The first payment secures your booking, with remaining payments due before your event date."
              },
              {
                q: "What happens if I need to reschedule my event?",
                a: "We understand plans change! You can reschedule your booking up to 30 days before your event at no additional cost. For changes within 30 days, a small rescheduling fee may apply."
              },
              {
                q: "Can I customize my package?",
                a: "Absolutely! While our packages cover most needs, we're happy to customize coverage duration, add extra photographers, or include special services. Contact us for a custom quote."
              },
              {
                q: "How do I receive my photos?",
                a: "All photos are delivered through a private online gallery where you can view, download, and share your images. Higher-tier packages also include USB drives with all images."
              },
              {
                q: "Are video add-ons available for all packages?",
                a: "Yes! Our video add-ons can be combined with any photography package to create the perfect coverage for your event."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ClientPricing