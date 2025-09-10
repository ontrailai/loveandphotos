import { useEffect, useState } from 'react'
import { Phone, Mail, MessageCircle, Clock, MapPin } from 'lucide-react'
import { supabase } from '@lib/supabase'
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
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-blush-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold text-dusty-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-dusty-600 max-w-2xl mx-auto">
            We'd love to hear from you! Whether you have questions about our services or you're ready to book your perfect photographer, we're here to help.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Quick Contact Info */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
              Contact Information
            </h2>
            
            <div className="space-y-6">
              {/* Phone */}
              <a 
                href="tel:3237011703" 
                className="flex items-start space-x-4 group hover:bg-cream-50 p-3 rounded-lg transition-colors"
              >
                <div className="bg-blush-500 p-3 rounded-full text-white flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-dusty-500 text-sm mb-1">Call Us</p>
                  <p className="text-dusty-900 font-semibold text-lg group-hover:text-blush-600 transition-colors">
                    (323) 701-1703
                  </p>
                </div>
              </a>

              {/* Email */}
              <a 
                href="mailto:matthew@loveandphotos.com" 
                className="flex items-start space-x-4 group hover:bg-cream-50 p-3 rounded-lg transition-colors"
              >
                <div className="bg-blush-500 p-3 rounded-full text-white flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-dusty-500 text-sm mb-1">Email Us</p>
                  <p className="text-dusty-900 font-semibold text-lg group-hover:text-blush-600 transition-colors break-all">
                    matthew@loveandphotos.com
                  </p>
                </div>
              </a>

              {/* Response Time */}
              <div className="flex items-start space-x-4 p-3">
                <div className="bg-blush-500 p-3 rounded-full text-white flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-dusty-500 text-sm mb-1">Response Time</p>
                  <p className="text-dusty-900 font-semibold">
                    Within 24 hours
                  </p>
                </div>
              </div>

              {/* Service Area */}
              <div className="flex items-start space-x-4 p-3">
                <div className="bg-blush-500 p-3 rounded-full text-white flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-dusty-500 text-sm mb-1">Service Area</p>
                  <p className="text-dusty-900 font-semibold">
                    Nationwide Coverage
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
              Send Us a Message
            </h2>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-dusty-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent transition-colors"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-dusty-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent transition-colors"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dusty-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent transition-colors"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-dusty-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-dusty-700 mb-1">
                  Event Type
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent transition-colors"
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
                <label htmlFor="message" className="block text-sm font-medium text-dusty-700 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blush-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Tell us about your event and how we can help..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-semibold py-3 rounded-lg transform transition-all duration-200 shadow-lg ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blush-500 text-white hover:bg-blush-600 hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-dusty-900 mb-2">
                How quickly can I book a photographer?
              </h3>
              <p className="text-dusty-600">
                We can accommodate bookings as soon as 48 hours in advance, though we recommend booking at least 2-4 weeks ahead for the best availability.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-dusty-900 mb-2">
                Do you travel for events?
              </h3>
              <p className="text-dusty-600">
                Yes! Our photographers are available nationwide. Travel fees may apply for locations outside major metropolitan areas.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-dusty-900 mb-2">
                What's included in the packages?
              </h3>
              <p className="text-dusty-600">
                All packages include professional editing, digital delivery, and printing rights. Video packages include drone footage when possible.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-dusty-900 mb-2">
                How do I receive my photos?
              </h3>
              <p className="text-dusty-600">
                Photos are delivered via a secure online gallery within 3 months. Rush delivery options are available for faster turnaround.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 bg-blush-50 rounded-xl p-8">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-blush-500" />
          <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-dusty-600 mb-6 max-w-md mx-auto">
            Don't wait to capture your special moments. Contact us today and let's create something beautiful together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:3237011703"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-blush-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-md"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </a>
            <a
              href="mailto:matthew@loveandphotos.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-blush-500 text-white font-semibold rounded-lg hover:bg-blush-600 transition-all shadow-md"
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