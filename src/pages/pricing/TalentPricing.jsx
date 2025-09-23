import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Shield, DollarSign, TrendingUp, Users, Star, Clock, Award, Info } from 'lucide-react'
import PageHero from '@/components/marketing/PageHero'
import TalentPayTiers from '@/components/TalentPayTiers'
import { useAuth } from '@/contexts/AuthContext'

const TalentPricing = () => {
  const { user, profile, loading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Wait for auth to load
    if (!loading) {
      // Redirect if not logged in or not a photographer/admin
      if (!user || !profile || (profile.role !== 'photographer' && profile.role !== 'admin')) {
        setShouldRedirect(true)
      }
    }
  }, [user, profile, loading])

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  // Redirect unauthorized users
  if (shouldRedirect) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PageHero
        title="Photographer Pay Tiers"
        subtitle="Advance your career with higher earnings. See your current tier and discover upgrade paths to increase your hourly rate."
      />

      {/* Introduction Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8 mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Career Growth</h3>
                <p className="text-sm text-muted-foreground">
                  Advance through our tier system by completing more jobs and maintaining high ratings
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Higher Earnings</h3>
                <p className="text-sm text-muted-foreground">
                  Earn from $150/hour at Bronze up to $500/hour at Platinum tier
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Premium Benefits</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock priority listing, enhanced support, and exclusive opportunities
                </p>
              </div>
            </div>
          </div>

          {/* Key Information Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-primary mr-2" />
                <h4 className="font-semibold text-foreground">Secure Payments</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through our platform with guaranteed payment protection
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Clock className="w-5 h-5 text-primary mr-2" />
                <h4 className="font-semibold text-foreground">Weekly Payouts</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive your earnings every week directly to your bank account or digital wallet
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Star className="w-5 h-5 text-primary mr-2" />
                <h4 className="font-semibold text-foreground">Performance Based</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Your tier is determined by job completion count and customer satisfaction ratings
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-primary mr-2" />
                <h4 className="font-semibold text-foreground">Support Team</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Get dedicated support from our photographer success team at higher tiers
              </p>
            </div>
          </div>

          {/* Pay Tiers Component */}
          <TalentPayTiers />

          {/* How It Works */}
          <section className="mt-16 bg-muted rounded-xl p-8">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              How Pay Tiers Work
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Start at Bronze</h3>
                <p className="text-sm text-muted-foreground">
                  All new photographers start at Bronze tier earning $150/hour
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Complete Jobs</h3>
                <p className="text-sm text-muted-foreground">
                  Complete photography jobs and maintain high customer ratings
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Automatic Upgrade</h3>
                <p className="text-sm text-muted-foreground">
                  Reach job thresholds to automatically unlock higher tiers
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Earn More</h3>
                <p className="text-sm text-muted-foreground">
                  Higher tiers mean higher hourly rates and premium benefits
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {[
                {
                  q: "How are pay tiers determined?",
                  a: "Pay tiers are based on the number of jobs you've completed successfully. Higher tiers require more completed jobs and maintain minimum rating standards."
                },
                {
                  q: "When do I get upgraded to the next tier?",
                  a: "Tier upgrades happen automatically when you meet the requirements. You'll be notified via email and see the change reflected in your dashboard immediately."
                },
                {
                  q: "Can I lose my tier status?",
                  a: "Tier status is permanent once earned. However, we monitor photographer performance to ensure quality standards are maintained."
                },
                {
                  q: "How often are payments processed?",
                  a: "Earnings are paid out weekly, every Friday, directly to your registered bank account or digital wallet."
                },
                {
                  q: "Are there additional fees for higher tiers?",
                  a: "No, there are no additional fees. All tiers have the same 20% platform fee structure, you simply earn higher base rates at higher tiers."
                },
                {
                  q: "What benefits come with higher tiers?",
                  a: "Higher tiers include priority listing placement, enhanced customer support, advanced analytics, and access to exclusive opportunities and promotional campaigns."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Advance Your Photography Career?
            </h2>
            <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
              Start taking on more jobs to unlock higher pay tiers and premium benefits. 
              The more you work, the more you earn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard/photographer"
                className="inline-flex items-center justify-center bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                aria-label="Go to photographer dashboard to view your current tier and progress"
              >
                View Dashboard
              </a>
              <a
                href="/photographer/jobs"
                className="inline-flex items-center justify-center border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                aria-label="Browse available photography jobs to advance your tier"
              >
                Find New Jobs
              </a>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export default TalentPricing