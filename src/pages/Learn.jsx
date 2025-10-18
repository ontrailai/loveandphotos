import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Users, Award, Camera, Lightbulb, Target } from 'lucide-react'
import PageHero from '@/components/marketing/PageHero'

const Learn = () => {
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

  const stats = [
    { number: '2,500+', label: 'Active Photographers' },
    { number: '95%', label: 'Success Rate' },
    { number: '50+', label: 'Training Topics' },
    { number: '24/7', label: 'Support Available' }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHero
        title="Learn how to succeed with Love & Photos"
        subtitle="Comprehensive training and resources to help photographers build thriving businesses on our platform. From technical skills to client management, we've got you covered."
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

      {/* Guides & Resources Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Training Guides & Resources</h2>
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

      {/* Support Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link
                to="/resources"
                className="inline-flex items-center justify-center px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition"
              >
                Browse Resources
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Your Photography Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join our community of professional photographers and start building your successful business today.
          </p>
          <Link
            to="/talent/apply"
            className="inline-flex items-center justify-center px-8 py-3 bg-background text-primary font-semibold rounded-lg hover:bg-muted transition"
          >
            Apply to Join
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Learn