import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQ = () => {
  const [openItems, setOpenItems] = useState({})

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const faqCategories = [
    {
      title: 'For Clients',
      items: [
        {
          question: 'How do I book a photographer?',
          answer: 'Simply browse our photographer listings, view their portfolios and availability, then send a booking request with your event details. Once the photographer accepts, you can securely pay through our platform.'
        },
        {
          question: 'What if I need to cancel my booking?',
          answer: 'Cancellation policies vary by photographer and are clearly stated on their profile. Generally, cancellations made 48+ hours in advance receive a full refund, while last-minute cancellations may incur fees.'
        },
        {
          question: 'How do I receive my photos?',
          answer: 'After your event, photographers typically deliver edited photos within 2-4 weeks via a secure online gallery. You\'ll receive high-resolution downloads and can order prints if desired.'
        },
        {
          question: 'Are the photographers insured?',
          answer: 'Yes, all photographers on our platform are required to have professional liability insurance. We verify this during the onboarding process for your peace of mind.'
        },
        {
          question: 'Can I request specific shots or styles?',
          answer: 'Absolutely! You can discuss your vision, shot list, and style preferences directly with your photographer before the event. They\'ll work with you to capture exactly what you envision.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, and ACH bank transfers. All payments are processed securely through our encrypted payment system.'
        }
      ]
    },
    {
      title: 'For Photographers',
      items: [
        {
          question: 'How do I join Love & Photos?',
          answer: 'Click "Join as Photographer" and complete our application. We\'ll review your portfolio, verify your credentials and insurance, then onboard you with training materials to get started.'
        },
        {
          question: 'What are the tier requirements?',
          answer: 'Bronze: Entry level, no minimum jobs. Silver: 10+ completed jobs, 4.5+ rating. Gold: 25+ jobs, 4.7+ rating. Platinum: 50+ jobs, 4.9+ rating, by invitation only.'
        },
        {
          question: 'How do I get paid?',
          answer: 'Payments are released 24 hours after event completion. We deduct our 20% platform fee and transfer the remainder to your bank account within 2-3 business days.'
        },
        {
          question: 'Can I set my own prices?',
          answer: 'Yes! You have complete control over your pricing. Your tier sets a minimum hourly rate, but you can charge more based on your experience and market demand.'
        },
        {
          question: 'What support do you provide?',
          answer: 'We offer 24/7 customer support, educational resources, marketing tools, and a photographer community forum. Higher tiers receive priority support and dedicated account management.'
        },
        {
          question: 'How do I improve my visibility?',
          answer: 'Complete your profile fully, maintain high ratings, respond quickly to inquiries, and upgrade your tier for better placement. We also offer promotional opportunities for active photographers.'
        }
      ]
    },
    {
      title: 'Platform & Policies',
      items: [
        {
          question: 'Is Love & Photos available in my area?',
          answer: 'We currently operate in 50+ major cities across the United States. Check our coverage map or enter your zip code when browsing to see photographers in your area.'
        },
        {
          question: 'How do you vet photographers?',
          answer: 'All photographers undergo portfolio review, credential verification, insurance confirmation, and background checks. We also monitor ongoing performance through client reviews and ratings.'
        },
        {
          question: 'What happens if there\'s a dispute?',
          answer: 'Our support team mediates any disputes between clients and photographers. We review all evidence, apply our policies fairly, and work toward a resolution that protects both parties.'
        },
        {
          question: 'How does the review system work?',
          answer: 'After each event, clients can rate photographers on professionalism, quality, communication, and value. Reviews are permanent and help maintain our quality standards.'
        },
        {
          question: 'What\'s your privacy policy?',
          answer: 'We take privacy seriously. Personal information is encrypted, never sold to third parties, and only shared as necessary for booking and payment processing. See our full privacy policy for details.'
        },
        {
          question: 'Do you offer business accounts?',
          answer: 'Yes! We have corporate accounts for businesses needing regular photography services. Contact our sales team for volume pricing and dedicated account management.'
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-blush-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about Love & Photos. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const globalIndex = `${categoryIndex}-${itemIndex}`
                  const isOpen = openItems[globalIndex]
                  
                  return (
                    <div 
                      key={itemIndex} 
                      className="bg-gray-50 rounded-lg overflow-hidden"
                    >
                      <button
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition"
                        onClick={() => toggleItem(globalIndex)}
                      >
                        <span className="font-semibold text-gray-900">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-8">
            Our support team is here to help. Reach out anytime and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@loveandphotos.com" 
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition border border-gray-200"
            >
              Email Support
            </a>
            <a 
              href="/contact" 
              className="px-6 py-3 bg-blush-600 text-white font-semibold rounded-lg hover:bg-blush-700 transition"
            >
              Contact Form
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FAQ