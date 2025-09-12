import { Link } from 'react-router-dom'
import { BookOpen, Video, FileText, Download, Users, TrendingUp } from 'lucide-react'

const Resources = () => {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-blush-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Photographer Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to succeed as a professional photographer on Love & Photos. 
            From business guides to technical resources.
          </p>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {resources.map((category, categoryIndex) => {
            const Icon = category.icon
            return (
              <div key={categoryIndex} className="mb-16">
                <div className="flex items-center mb-8">
                  <div className="flex items-center justify-center w-12 h-12 bg-blush-100 rounded-lg mr-4">
                    <Icon className="h-6 w-6 text-blush-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.category}</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          {item.type}
                        </span>
                        <Download className="h-5 w-5 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {item.description}
                      </p>
                      <a 
                        href={item.link} 
                        className="text-blush-600 font-semibold hover:text-blush-700"
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <div key={index} className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{link.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                <a href="#" className="text-sm text-blush-600 font-semibold hover:text-blush-700">
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="h-12 w-12 text-blush-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Join Our Photographer Community
          </h2>
          <p className="text-gray-600 mb-8">
            Connect with fellow photographers, share experiences, get advice, and grow together. 
            Our community forum is a supportive space for professional development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#" 
              className="px-6 py-3 bg-blush-600 text-white font-semibold rounded-lg hover:bg-blush-700 transition"
            >
              Join Community Forum
            </a>
            <a 
              href="#" 
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition border border-gray-200"
            >
              View Success Stories
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blush-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Stay Updated with Photography Tips
          </h2>
          <p className="text-blush-100 mb-8">
            Get weekly tips, industry insights, and platform updates delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button 
              type="submit" 
              className="px-6 py-3 bg-white text-blush-600 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default Resources