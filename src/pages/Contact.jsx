import { useEffect, useState } from 'react'
import { Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react'
import { supabase } from '@lib/supabase'
import PageHero from '@components/marketing/PageHero'
import toast from 'react-hot-toast'

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    eventType: '',
    message: ''
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const phoneNumberDigits = value.replace(/\D/g, '')
    
    // Limit to 10 digits
    const limitedDigits = phoneNumberDigits.slice(0, 10)
    
    // Format the number as (XXX) XXX-XXXX
    if (limitedDigits.length === 0) {
      return ''
    } else if (limitedDigits.length <= 3) {
      return `(${limitedDigits}`
    } else if (limitedDigits.length <= 6) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`
    } else {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`
    }
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      phone: formatted
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Submitting form with data:', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        event_type: formData.eventType || null,
        message: formData.message
      })

      // Submit to Supabase
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone || null,
            event_type: formData.eventType || null,
            message: formData.message
          }
        ])
        .select()  // Add select to return the inserted data

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Submission successful:', data)

      // Success! Reset form
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.')
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        eventType: '',
        message: ''
      })
      
    } catch (error) {
      console.error('Error submitting form:', error)
      // More specific error messages
      if (error.message?.includes('policies')) {
        toast.error('Database configuration error. Please contact support.')
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error('Sorry, there was an error sending your message. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHero
        title="Get in Touch"
        subtitle="We'll respond within 24 hours. Tell us about your date and vision."
        align="left"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Quick Contact Info */}
          <div className="bg-card rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
              Contact Information
            </h2>
            
            <div className="space-y-6">
              {/* Phone */}
              <a
                href="tel:3237011703"
                className="flex items-start space-x-4 group hover:bg-accent p-3 rounded-lg transition-colors"
              >
                <div className="bg-primary p-3 rounded-full text-primary-foreground flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Call Us</p>
                  <p className="text-foreground font-semibold text-lg group-hover:text-primary transition-colors">
                    (323) 701-1703
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:matthew@loveandphotos.com"
                className="flex items-start space-x-4 group hover:bg-accent p-3 rounded-lg transition-colors"
              >
                <div className="bg-primary p-3 rounded-full text-primary-foreground flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Email Us</p>
                  <p className="text-foreground font-semibold text-lg group-hover:text-primary transition-colors break-all">
                    matthew@loveandphotos.com
                  </p>
                </div>
              </a>

              {/* Response Time */}
              <div className="flex items-start space-x-4 p-3">
                <div className="bg-primary p-3 rounded-full text-primary-foreground flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Response Time</p>
                  <p className="text-foreground font-semibold">
                    Within 24 hours
                  </p>
                </div>
              </div>

              {/* Service Area */}
              <div className="flex items-start space-x-4 p-3">
                <div className="bg-primary p-3 rounded-full text-primary-foreground flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Service Area</p>
                  <p className="text-foreground font-semibold">
                    Nationwide Coverage
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
              Send Us a Message
            </h2>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-muted-foreground mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-card text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-muted-foreground mb-1">
                  Event Type
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select an event type</option>
                  <option value="wedding">Wedding</option>
                  <option value="engagement">Engagement</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Tell us about your event and how we can help..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-semibold py-3 rounded-lg transform transition-all duration-200 shadow-lg ${
                  isSubmitting
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How quickly can I book a photographer?
              </h3>
              <p className="text-muted-foreground">
                We can accommodate bookings as soon as 48 hours in advance, though we recommend booking at least 2-4 weeks ahead for the best availability.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Do you travel for events?
              </h3>
              <p className="text-muted-foreground">
                Yes! Our photographers are available nationwide. Travel fees may apply for locations outside major metropolitan areas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                What's included in the packages?
              </h3>
              <p className="text-muted-foreground">
                All packages include professional editing, digital delivery, and printing rights. Video packages include drone footage when possible.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                How do I receive my photos?
              </h3>
              <p className="text-muted-foreground">
                Photos are delivered via a secure online gallery within 3 months. Rush delivery options are available for faster turnaround.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 bg-muted/50 rounded-xl p-8">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-display font-semibold text-foreground mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Don't wait to capture your special moments. Contact us today and let's create something beautiful together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:3237011703"
              className="inline-flex items-center justify-center px-6 py-3 bg-card text-primary font-semibold rounded-lg hover:bg-accent transition-colors shadow-md border"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </a>
            <a
              href="mailto:matthew@loveandphotos.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md"
            >
              <Mail className="w-5 h-5 mr-2" />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact