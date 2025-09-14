import { Link } from 'react-router-dom'
import { ArrowRight, Camera, Users, Award, Heart } from 'lucide-react'
import PageHero from '@/components/marketing/PageHero'

const About = () => {
  const stats = [
    { number: '10,000+', label: 'Happy Clients' },
    { number: '500+', label: 'Professional Photographers' },
    { number: '50+', label: 'Cities Covered' },
    { number: '98%', label: 'Satisfaction Rate' }
  ]

  const values = [
    {
      icon: Camera,
      title: 'Quality First',
      description: 'We partner only with vetted, professional photographers who consistently deliver exceptional work.'
    },
    {
      icon: Users,
      title: 'Perfect Matches',
      description: 'Our smart matching system connects you with photographers who fit your style, budget, and vision.'
    },
    {
      icon: Award,
      title: 'Trust & Safety',
      description: 'Every photographer is background-checked and insured, giving you peace of mind for your special day.'
    },
    {
      icon: Heart,
      title: 'Memorable Experiences',
      description: 'We believe great photography is about more than just pictures—it\'s about creating lasting memories.'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHero
        title="About Love & Photos"
        subtitle="We're on a mission to make professional photography accessible and delightful for everyone, connecting talented photographers with clients who value their craft."
      />

      {/* Our Story Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Love & Photos was born from a simple observation: finding the right photographer 
                  for your special moments shouldn't be stressful or time-consuming.
                </p>
                <p>
                  Founded in 2024, we set out to create a platform that makes it easy to discover, 
                  book, and work with talented photographers in your area. Whether it's a wedding, 
                  corporate event, or family portrait session, we believe everyone deserves access 
                  to quality photography that captures their unique story.
                </p>
                <p>
                  Today, we're proud to serve thousands of clients across the country, helping them 
                  preserve their most precious memories through the lens of skilled photographers.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600" 
                alt="Photographer at work" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

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

      {/* Our Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Capture Your Moments?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of happy clients who've found their perfect photographer match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="inline-flex items-center justify-center px-8 py-3 bg-background text-primary font-semibold rounded-lg hover:bg-muted transition"
            >
              Find a Photographer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/signup?role=photographer" 
              className="inline-flex items-center justify-center px-8 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 transition"
            >
              Join as Photographer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About