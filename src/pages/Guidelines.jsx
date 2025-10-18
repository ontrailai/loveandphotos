import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, Award, Camera, Lightbulb, Target, Video, FileText, Download, TrendingUp } from 'lucide-react'
import PageHero from '@/components/marketing/PageHero'

const Guidelines = () => {
  const guides = [
    {
      icon: Camera,
      title: 'Photography Fundamentals',
      description: 'Master composition, lighting, and technical skills that set professional photographers apart.',
      status: 'Coming Soon'
    },
    {
      icon: Users,
      title: 'Client Communication',
      description: 'Learn how to build rapport, manage expectations, and deliver exceptional customer service.',
      status: 'Coming Soon'
    },
    {
      icon: Target,
      title: 'Marketing Your Services',
      description: 'Discover strategies for building your brand, attracting clients, and growing your business.',
      status: 'Coming Soon'
    },
    {
      icon: Award,
      title: 'Portfolio Development',
      description: 'Create a compelling portfolio that showcases your unique style and attracts ideal clients.',
      status: 'Coming Soon'
    },
    {
      icon: Lightbulb,
      title: 'Business Best Practices',
      description: 'Navigate contracts, pricing, and professional workflows for sustainable success.',
      status: 'Coming Soon'
    },
    {
      icon: BookOpen,
      title: 'Platform Optimization',
      description: 'Learn how to maximize your visibility and bookings on the Love & Photos platform.',
      status: 'Coming Soon'
    }
  ]

  const resources = [
    {
      category: 'Getting Started',
      icon: BookOpen,
      items: [
        {
          title: 'Photographer Onboarding Guide',
          description: 'Everything you need to know to get started on Love & Photos',
          type: 'Guide',
          link: '#'
        },
        {
          title: 'Profile Optimization Tips',
          description: 'How to create a profile that attracts more clients',
          type: 'Article',
          link: '#'
        },
        {
          title: 'Platform Walkthrough Video',
          description: '10-minute video tour of all platform features',
          type: 'Video',
          link: '#'
        }
      ]
    },
    {
      category: 'Business Growth',
      icon: TrendingUp,
      items: [
        {
          title: 'Pricing Your Photography Services',
          description: 'Strategic guide to setting competitive rates',
          type: 'Guide',
          link: '#'
        },
        {
          title: 'Marketing Your Photography Business',
          description: 'Proven strategies to attract more clients',
          type: 'E-book',
          link: '#'
        },
        {
          title: 'Client Communication Templates',
          description: 'Professional email templates for every situation',
          type: 'Templates',
          link: '#'
        }
      ]
    },
    {
      category: 'Technical Resources',
      icon: FileText,
      items: [
        {
          title: 'Photography Contract Templates',
          description: 'Legally vetted contracts for different event types',
          type: 'Templates',
          link: '#'
        },
        {
          title: 'Model Release Forms',
          description: 'Protect yourself with proper documentation',
          type: 'Forms',
          link: '#'
        },
        {
          title: 'Tax Guide for Photographers',
          description: 'Understanding taxes as a freelance photographer',
          type: 'Guide',
          link: '#'
        }
      ]
    },
    {
      category: 'Skills Development',
      icon: Video,
      items: [
        {
          title: 'Mastering Event Photography',
          description: 'Advanced techniques for capturing perfect moments',
          type: 'Course',
          link: '#'
        },
        {
          title: 'Post-Processing Workflow',
          description: 'Efficient editing techniques for batch processing',
          type: 'Video Series',
          link: '#'
        },
        {
          title: 'Client Posing Guide',
          description: 'Natural posing techniques for any body type',
          type: 'Guide',
          link: '#'
        }
      ]
    }
  ]

  const quickLinks = [
    { title: 'Platform Policies', description: 'Understanding our terms and guidelines' },
    { title: 'Insurance Requirements', description: 'What coverage you need and why' },
    { title: 'Payment Processing', description: 'How payments work on our platform' },
    { title: 'Review Guidelines', description: 'Best practices for managing reviews' }
  ]

  const stats = [
    { number: '2,500+', label: 'Active Photographers' },
    { number: '95%', label: 'Success Rate' },
    { number: '50+', label: 'Training Topics' },
    { number: '24/7', label: 'Support Available' }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHero
        title="Guidelines for Photographers"
        subtitle="Comprehensive training, guides, and resources to help you build a thriving photography business on our platform. From technical skills to client management, business growth, and beyond."
      />

      {/* Stats Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Guides Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Training Guides</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive training library covers everything you need to know to succeed as a professional photographer on our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide, index) => {
              const Icon = guide.icon
              return (
                <div key={index} className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {guide.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{guide.title}</h3>
                  <p className="text-muted-foreground mb-4">{guide.description}</p>
                  <button className="text-primary font-medium text-sm hover:text-primary-600 transition-colors" disabled>
                    Learn More →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Downloadable Resources</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Access ready-to-use guides, templates, and tools to streamline your photography business.
            </p>
          </div>

          {resources.map((category, categoryIndex) => {
            const Icon = category.icon
            return (
              <div key={categoryIndex} className="mb-16">
                <div className="flex items-center mb-8">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mr-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{category.category}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <span className="inline-block px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                          {item.type}
                        </span>
                        <Download className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {item.description}
                      </p>
                      <a
                        href={item.link}
                        className="text-primary-600 font-semibold hover:text-primary-700"
                      >
                        Access Resource →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <div key={index} className="bg-card rounded-lg p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-2">{link.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
                <a href="#" className="text-sm text-primary-600 font-semibold hover:text-primary-700">
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="h-12 w-12 text-primary-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Join Our Photographer Community
          </h2>
          <p className="text-muted-foreground mb-8">
            Connect with fellow photographers, share experiences, get advice, and grow together.
            Our community forum is a supportive space for professional development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
            >
              Join Community Forum
            </a>
            <a
              href="#"
              className="px-6 py-3 bg-card text-muted-foreground font-semibold rounded-lg hover:bg-muted transition border border-border"
            >
              View Success Stories
            </a>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Need Additional Support?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team is here to help you succeed. Get personalized guidance and support throughout your photographer journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
              >
                Contact Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Stay Updated with Photography Tips
          </h2>
          <p className="text-primary-100 mb-8">
            Get weekly tips, industry insights, and platform updates delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-foreground bg-card"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-card text-primary-600 font-semibold rounded-lg hover:bg-muted transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Ready to Start Your Photography Business?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our community of professional photographers and start building your successful business today.
          </p>
          <Link
            to="/talent/apply"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            Apply to Join
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Guidelines
