import { useEffect } from 'react'
import { motion } from 'motion/react'
import { 
  Camera,
  Package,
  Calendar,
  Heart,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@components/ui/Button'

export default function Guide() {
  // Set page title
  useEffect(() => {
    document.title = 'How It Works - Love & Photos'
    return () => {
      document.title = 'Love & Photos'
    }
  }, [])

  const steps = [
    {
      step: 1,
      icon: Camera,
      title: "Choose Your Photographer",
      description: "Browse our curated network of photographers and find the perfect fit based on style, availability, and vibe."
    },
    {
      step: 2,
      icon: Package,
      title: "Pick a Package",
      description: "Select the photo or video package that fits your event and budget. Monthly plans available."
    },
    {
      step: 3,
      icon: Calendar,
      iconExtra: Heart,
      title: "Book & Personalize",
      description: "Lock in your date and complete our fun personalization quiz to make your shoot unforgettable."
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fe395f]/10 via-[#fe395f]/5 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-[#fe395f] to-[#ff7a9a] bg-clip-text text-transparent">
              How Booking Works
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to book your perfect photographer on Love & Photos
            </p>
          </motion.div>

          {/* 3-Step Process Section */}
          <section 
            className="relative"
            role="region"
            aria-labelledby="booking-steps-heading"
          >
            <h2 id="booking-steps-heading" className="sr-only">Three step booking process</h2>
            
            {/* Steps Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon
                const IconExtra = step.iconExtra
                
                return (
                  <motion.li
                    key={step.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ 
                      delay: index * 0.2,
                      duration: 0.5,
                      ease: "easeOut"
                    }}
                  >
                    <article className="relative h-full group">
                      {/* Card Container */}
                      <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                        {/* Gradient Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#fe395f]/20 to-[#ff9aba]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Content */}
                        <div className="relative p-8">
                          {/* Step Number */}
                          <div className="absolute top-6 right-6 text-5xl font-bold text-[#fe395f]/10" aria-hidden="true">
                            {step.step}
                          </div>
                          
                          {/* Icon Container */}
                          <div className="relative mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#fe395f] to-[#ff7a9a] rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                              {IconExtra ? (
                                <div className="relative">
                                  <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                                  <IconExtra className="absolute -top-1 -right-1 w-4 h-4 text-white" aria-hidden="true" />
                                </div>
                              ) : (
                                <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                              )}
                            </div>
                          </div>
                          
                          {/* Text Content */}
                          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                            Step {step.step}: {step.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                        
                        {/* Bottom Accent Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fe395f] to-[#ff9aba] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                      </div>
                    </article>
                  </motion.li>
                )
              })}
            </ul>

            {/* CTA Section */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link to="/photographers">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-[#fe395f] to-[#ff7a9a] hover:from-[#fe395f]/90 hover:to-[#ff7a9a]/90 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  aria-label="Start booking a photographer"
                >
                  Start Booking
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </motion.div>
          </section>
        </div>
      </section>

    </div>
  )
}