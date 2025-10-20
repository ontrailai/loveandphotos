import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@lib/supabase'
import { useAuth } from '@contexts/AuthContext'
import { Camera, Video, AlertCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const TalentApplication = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [step, setStep] = useState('role-selection') // role-selection, application-form, result
  const [selectedRole, setSelectedRole] = useState(null) // 'photographer' or 'videographer'
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { accepted: boolean, message: string }

  // Form data - Matches original Love & Photos application forms
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',

    // Critical Eligibility Questions (all must be "yes" to pass)
    reliable_transportation: '',
    willing_40_hourly: '',
    age_18_plus: '',
    comfortable_solo: '',
    inclusive_mindset: '',
    professional_grade_camera: '', // Separate visible question

    // Videographer-specific critical question
    has_audio_gear: '', // videographer only

    // Additional Required Questions
    experience_years: '', // Number input
    referral_name: '', // Text input
    instagram_handle: '', // Text input
    background_description: '', // Textarea

    // Terms Agreement
    terms_agreement: false
  })

  // Photographer critical eligibility questions (ALL must be "yes" to pass)
  const photographerQuestions = [
    { key: 'age_18_plus', label: 'Are you at least 18 years of age?' },
    { key: 'reliable_transportation', label: 'Do you have reliable transportation?' },
    { key: 'willing_40_hourly', label: 'Are you willing to work for $40 per hour?' },
    { key: 'professional_grade_camera', label: 'Is your camera professional-grade? (No smartphones, androids, etc. allowed)' },
    { key: 'comfortable_solo', label: 'Are you comfortable shooting weddings SOLO (without an assistant)?' },
    { key: 'inclusive_mindset', label: 'Are you open to photographing weddings of all backgrounds, including different races, religions, and orientations?' }
  ]

  // Videographer critical eligibility questions (ALL must be "yes" to pass)
  const videographerQuestions = [
    { key: 'age_18_plus', label: 'Are you at least 18 years of age?' },
    { key: 'reliable_transportation', label: 'Do you have reliable transportation?' },
    { key: 'willing_40_hourly', label: 'Are you willing to work for $40 per hour?' },
    { key: 'has_audio_gear', label: 'Do you have gear to record sound?' },
    { key: 'comfortable_solo', label: 'Are you comfortable filming weddings SOLO (without an assistant)?' },
    { key: 'inclusive_mindset', label: 'Are you open to filming weddings of all backgrounds, including different races, religions, and orientations?' }
  ]

  // Additional required questions (same for both roles, with role-specific language)
  const serviceType = selectedRole === 'photographer' ? 'photography' : 'videography'
  const oppServiceType = selectedRole === 'photographer' ? 'videography' : 'photography'

  const additionalQuestions = [
    {
      key: 'experience_years',
      label: `How many years of experience do you have in wedding ${serviceType}?`,
      type: 'number',
      placeholder: 'e.g., 3',
      required: true
    },
    {
      key: 'referral_name',
      label: 'Did someone refer you? We\'d love to know who!',
      type: 'text',
      placeholder: 'Enter referrer name or leave blank',
      required: false
    },
    {
      key: 'instagram_handle',
      label: 'Do you have Instagram?',
      type: 'text',
      placeholder: '@yourhandle or leave blank',
      required: false
    },
    {
      key: 'background_description',
      label: 'We\'d love to get to know you better! Feel free to share anything that helps us learn more about your background and experience.',
      type: 'textarea',
      placeholder: `Tell us about yourself, your style, what makes you passionate about wedding ${serviceType}...`,
      required: false
    }
  ]

  const currentQuestions = selectedRole === 'photographer' ? photographerQuestions : videographerQuestions

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setStep('application-form')
  }

  // Format phone number as user types: (123) 456-7890
  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '')

    // Limit to 10 digits (US phone number)
    const limitedNumber = phoneNumber.slice(0, 10)

    // Format based on length
    if (limitedNumber.length === 0) return ''
    if (limitedNumber.length <= 3) return `(${limitedNumber}`
    if (limitedNumber.length <= 6) {
      return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3)}`
    }
    return `(${limitedNumber.slice(0, 3)}) ${limitedNumber.slice(3, 6)}-${limitedNumber.slice(6)}`
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    // Special handling for phone number to format as user types
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value)
      setFormData(prev => ({
        ...prev,
        phone: formattedPhone
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateEligibility = () => {
    // For videographers: 6 critical questions must all be "yes"
    // For photographers: 6 critical questions must all be "yes"
    const requiredQuestions = selectedRole === 'photographer'
      ? ['reliable_transportation', 'willing_40_hourly', 'age_18_plus', 'professional_grade_camera', 'comfortable_solo', 'inclusive_mindset']
      : ['age_18_plus', 'reliable_transportation', 'willing_40_hourly', 'has_audio_gear', 'comfortable_solo', 'inclusive_mindset']

    for (const question of requiredQuestions) {
      if (formData[question] !== 'yes') {
        return {
          passed: false,
          failedQuestion: currentQuestions.find(q => q.key === question)?.label || 'Unknown requirement'
        }
      }
    }

    return { passed: true }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate basic form fields
      if (!formData.full_name || !formData.email || !formData.password) {
        toast.error('Please fill in all required fields')
        setSubmitting(false)
        return
      }

      // Validate first and last name
      const nameParts = formData.full_name.trim().split(/\s+/)
      if (nameParts.length < 2) {
        toast.error('Please enter both first and last name')
        setSubmitting(false)
        return
      }

      // Validate terms acceptance
      if (!formData.terms_agreement) {
        toast.error('Please accept the Terms and Conditions')
        setSubmitting(false)
        return
      }

      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        setSubmitting(false)
        return
      }

      // Validate password strength
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        setSubmitting(false)
        return
      }

      // Check if email already has an accepted application
      const { data: existingApp, error: checkError } = await supabase
        .from('talent_applications')
        .select('id, is_accepted, email')
        .eq('email', formData.email)
        .eq('is_accepted', true)
        .maybeSingle()

      if (checkError) {
        console.error('[TalentApplication] Error checking existing application:', checkError)
      }

      if (existingApp) {
        toast.error('You already have an accepted application. Please log in to access your dashboard.')
        setSubmitting(false)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
        return
      }

      // Check eligibility
      const eligibilityResult = validateEligibility()

      // Prepare application data
      // Strip formatting from phone number for database storage
      const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null

      const applicationData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: cleanPhone,
        role: selectedRole,
        answers: {
          // Critical eligibility questions (shared)
          reliable_transportation: formData.reliable_transportation,
          willing_40_hourly: formData.willing_40_hourly,
          age_18_plus: formData.age_18_plus,
          professional_grade_camera: formData.professional_grade_camera,
          comfortable_solo: formData.comfortable_solo,
          inclusive_mindset: formData.inclusive_mindset,

          // Videographer-specific critical question
          ...(selectedRole === 'videographer' && {
            has_audio_gear: formData.has_audio_gear
          }),

          // Additional questions (all roles)
          experience_years: formData.experience_years,
          referral_name: formData.referral_name,
          instagram_handle: formData.instagram_handle,
          background_description: formData.background_description,

        },
        is_accepted: eligibilityResult.passed,
        rejection_reason: eligibilityResult.passed ? null : `Failed requirement: ${eligibilityResult.failedQuestion}`,
        submitted_at: new Date().toISOString(),
        ip_address: null, // Could capture from request if available
        user_agent: navigator.userAgent
      }

      // Save application to Supabase (always save, even if rejected)
      const { data: application, error: appError } = await supabase
        .from('talent_applications')
        .insert([applicationData])

      if (appError) {
        console.error('[TalentApplication] Error saving application:', appError)
        toast.error('Failed to submit application. Please try again.')
        setSubmitting(false)
        return
      }

      console.log('[TalentApplication] Application saved successfully')

      // If REJECTED, show rejection screen immediately
      if (!eligibilityResult.passed) {
        setResult({
          accepted: false,
          message: "We're currently only accepting talent who meet all professional requirements listed. Feel free to apply again in the future when you meet these criteria."
        })
        setStep('result')
        setSubmitting(false)
        return
      }

      // If ACCEPTED, create user account and redirect to dashboard
      console.log('[TalentApplication] Application accepted, creating account...')

      const signupResult = await signUp(formData.email, formData.password, {
        role: 'photographer', // Both roles use 'photographer' role
        fullName: formData.full_name,
        phone: cleanPhone, // Use cleaned phone number without formatting
        isVideographer: selectedRole === 'videographer' // Set flag for videographers
      })

      if (!signupResult.success) {
        toast.error(signupResult.error || 'Failed to create account')
        setSubmitting(false)
        return
      }

      // Link application to user account
      if (signupResult.user) {
        const { error: updateError } = await supabase
          .from('talent_applications')
          .update({ user_id: signupResult.user.id })
          .eq('email', formData.email)
          .is('user_id', null)
          .order('submitted_at', { ascending: false })
          .limit(1)

        if (updateError) {
          console.error('[TalentApplication] Failed to link application to user:', updateError)
        }
      }

      // Show success screen
      setResult({
        accepted: true,
        message: "Congratulations! Your application has been approved. Please complete the required training to access the Talent Portal."
      })
      setStep('result')
      setSubmitting(false) // IMPORTANT: Stop loading state

      // Redirect to training page (required for all new photographers/videographers)
      setTimeout(() => {
        navigate('/talent/training', { replace: true })
      }, 2000)

    } catch (error) {
      console.error('[TalentApplication] Submission error:', error)
      toast.error('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  // Role Selection Screen
  if (step === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Love & Photos</h1>
            <p className="text-lg text-gray-600">Select your specialty to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Photographer Card */}
            <button
              onClick={() => handleRoleSelect('photographer')}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-primary-500 group"
            >
              <div className="flex items-center justify-between mb-4">
                <Camera className="w-12 h-12 text-primary-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                  Photography
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Photographer</h2>
              <p className="text-gray-600 mb-4">
                Capture beautiful moments at weddings and special events. Work independently with professional equipment.
              </p>
              <div className="text-primary-600 font-semibold flex items-center">
                Apply as Photographer
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Videographer Card */}
            <button
              onClick={() => handleRoleSelect('videographer')}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-rose-500 group"
            >
              <div className="flex items-center justify-between mb-4">
                <Video className="w-12 h-12 text-rose-600 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                  Videography
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Videographer</h2>
              <p className="text-gray-600 mb-4">
                Create cinematic wedding videos with professional audio and video equipment. Solo filming experience required.
              </p>
              <div className="text-rose-600 font-semibold flex items-center">
                Apply as Videographer
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Application Form
  if (step === 'application-form') {
    const roleColor = selectedRole === 'photographer' ? 'primary' : 'rose'
    const RoleIcon = selectedRole === 'photographer' ? Camera : Video

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <RoleIcon className={selectedRole === 'photographer' ? 'w-8 h-8 text-primary-600' : 'w-8 h-8 text-rose-600'} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">{selectedRole} Application</h1>
                <p className="text-gray-600 text-sm">Complete all fields to apply</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First and Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    pattern="\(\d{3}\) \d{3}-\d{4}"
                  />
                  {formData.phone && formData.phone.length > 0 && formData.phone.length < 14 && (
                    <p className="mt-1 text-sm text-amber-600">
                      Enter a complete 10-digit phone number
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {/* Eligibility Questions */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">Important: All questions below must be answered "Yes" to qualify</p>
                    <p>These requirements ensure you can deliver professional service to our clients.</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">Professional Requirements</h3>

                {currentQuestions.map((question, index) => (
                  <div key={question.key} className="border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      {index + 1}. {question.label} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={question.key}
                          value="yes"
                          checked={formData[question.key] === 'yes'}
                          onChange={handleInputChange}
                          required
                          className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={question.key}
                          value="no"
                          checked={formData[question.key] === 'no'}
                          onChange={handleInputChange}
                          required
                          className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Questions (for all roles) */}
              {additionalQuestions.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>

                  {additionalQuestions.map((question, index) => (
                    <div key={question.key} className="border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        {question.label} {question.required && <span className="text-red-500">*</span>}
                      </label>

                      {question.type === 'number' && (
                        <input
                          type="number"
                          name={question.key}
                          value={formData[question.key]}
                          onChange={handleInputChange}
                          placeholder={question.placeholder}
                          required={question.required}
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}

                      {question.type === 'radio' && (
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={question.key}
                              value="yes"
                              checked={formData[question.key] === 'yes'}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name={question.key}
                              value="no"
                              checked={formData[question.key] === 'no'}
                              onChange={handleInputChange}
                              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      )}

                      {question.type === 'text' && (
                        <input
                          type="text"
                          name={question.key}
                          value={formData[question.key]}
                          onChange={handleInputChange}
                          placeholder={question.placeholder}
                          required={question.required}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}

                      {question.type === 'select' && (
                        <select
                          name={question.key}
                          value={formData[question.key]}
                          onChange={handleInputChange}
                          required={question.required}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Select an option</option>
                          {question.options.map(option => (
                            <option key={option} value={option.toLowerCase()}>{option}</option>
                          ))}
                        </select>
                      )}

                      {question.type === 'textarea' && (
                        <textarea
                          name={question.key}
                          value={formData[question.key]}
                          onChange={handleInputChange}
                          placeholder={question.placeholder}
                          required={question.required}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Talent Terms of Service */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Talent Terms of Service</h3>
                <p className="text-sm text-gray-600">
                  Please read the complete terms below. You must scroll through and accept these terms to continue.
                </p>

                {/* Scrollable TOS Container */}
                <div className="border border-gray-300 rounded-lg p-4 h-96 overflow-y-scroll bg-gray-50 text-sm leading-relaxed">
                  <div className="prose prose-sm max-w-none">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Love & Photos LLC</h2>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Talent Terms of Service</h3>
                    <p className="text-xs text-gray-600 mb-4">Effective October 1, 2025</p>

                    <p className="mb-4">
                      By creating a profile, accepting an assignment, or otherwise engaging with Love & Photos LLC ("Studio" or "Company"), you acknowledge that you have read, understood, and agreed to these Talent Terms of Service. These Terms may be updated at any time without notice, and it is your responsibility to review them regularly for updates. Continued engagement after updates constitutes acceptance of the revised Terms.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-3">Quick Summary / Key Requirements</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li><strong>Confirmation:</strong> Accept or reject assignments within 24 hours. Failure to confirm will result in removal from the talent system if not booked out of your calendar availability.</li>
                      <li><strong>Pre-event Contact:</strong> Contact the couple at least 1 month prior via phone or internal chat to introduce yourself and confirm final details.</li>
                      <li><strong>Event Coverage & Upload:</strong> Perform full coverage of the event and upload all media within 72 hours. Begin uploads early; 100GB may take ~24 hours.</li>
                      <li><strong>Photography:</strong> Minimum of 100 photos per contracted hour. Deliver in RAW and JPEG, full color, unwatermarked. Do not go below 1/250 second shutter speed.</li>
                      <li><strong>Videography:</strong> Record full ceremony and all speeches at 1080p or higher, in ready-to-use format. Drone footage required if allowed.</li>
                      <li><strong>Overtime:</strong> Extra coverage billed at $300/hour; obtain signed acknowledgment from the couple.</li>
                      <li><strong>Professional Conduct:</strong> Arrive on time, dress appropriately, no smoking/vaping/gum in view of clients, no alcohol or drugs, remain focused, do not use your phone during the event, no personal marketing, no arguing with clients/vendors/guests.</li>
                      <li><strong>Breaks & Meals:</strong> For events over 4 hours, one vendor meal and one 20-minute break.</li>
                      <li><strong>Payment:</strong> Processed via ACH/QuickBooks within 14 business days of completed deliverables and submitted job form.</li>
                      <li><strong>No-show couple:</strong> If the couple does not appear on the day of the event and the contractor is present, contractor will be paid 20% of their regular day rate. Notify the Studio immediately.</li>
                      <li><strong>Contact Support:</strong> Reach out to the Studio at support@lp.loveandphotos.com or text +1 323-701-1705.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">1. Independent Contractor Status</h4>
                    <p className="mb-4">
                      You are an independent contractor, not an employee of the Studio. You are responsible for your own taxes, insurance, and benefits. You provide and maintain your own equipment and backups. Nothing in these Terms creates an employer-employee, joint-venture, or agency relationship.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">2. Scope of Services</h4>
                    <p className="font-semibold mb-1">Assignment Acceptance</p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li>You must confirm or reject a job within 24 hours of assignment notification.</li>
                      <li>If you reject a job that was within your calendar availability, you may be removed from the talent system.</li>
                    </ul>
                    <p className="font-semibold mb-1">Coverage Responsibilities</p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li>Confirm all shoot details (date and city/state) immediately upon accepting.</li>
                      <li>Contact the couple at least 1 month before the wedding via phone or internal chat to introduce yourself and confirm final details.</li>
                      <li>Perform full coverage of the wedding as scheduled.</li>
                      <li>After the event, upload all media (photos, videos, audio, etc.) to the Studio's portal within 72 hours. Begin uploads early; large files may take ~24 hours.</li>
                    </ul>
                    <p className="font-semibold mb-1">Subcontracting</p>
                    <p className="mb-4">
                      Contractors may not subcontract, delegate, or assign any portion of their duties or assignments to another individual or entity without prior written approval from the Studio. Any unauthorized subcontracting is grounds for immediate termination and forfeiture of payment.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">3. Technical Standards</h4>
                    <p className="font-semibold mb-1">Photography</p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li>Minimum 100 high-quality photos per contracted hour. Capture all key moments evenly across the event.</li>
                      <li>Deliver both RAW and JPEG formats, in full color, unwatermarked. Black-and-white, filtered, or watermarked images do not meet standards.</li>
                      <li>DSLR or mirrorless professional cameras only; smartphones or consumer devices are not acceptable.</li>
                      <li><strong>Shutter Speed:</strong> Do not go below 1/250 second; slower speeds will result in motion blur. Adjust ISO or aperture as needed to maintain proper exposure.</li>
                      <li>RAW files must be retained for at least 30 days post-event.</li>
                    </ul>
                    <p className="font-semibold mb-1">Videography</p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li>Deliver ready-to-use video at 1080p or higher in MP4/MOV format. RAW/log/flat formats are not accepted unless requested.</li>
                      <li>Record the full ceremony and all speeches with clean audio, keeping the camera on a tripod and continuously recording without stopping.</li>
                      <li>Drone footage is required if permitted by venue and law; follow all safety regulations.</li>
                      <li>Professional-grade video equipment is required; consumer devices are not acceptable.</li>
                    </ul>
                    <p className="font-semibold mb-1">Equipment Failure & Backup Responsibility</p>
                    <p className="mb-4">
                      Contractors are required to bring and maintain backup cameras, lenses, batteries, memory cards, and audio equipment as applicable. The Contractor is fully responsible for coverage lost due to equipment malfunction, user error, or failure to prepare adequate backups.
                    </p>
                    <p className="font-semibold mb-1">Upload Timeline</p>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>Begin uploads as soon as possible; 100GB may take ~24 hours.</li>
                      <li>All media must be uploaded within 72 hours of the event. Delays may result in deductions per the Penalty Schedule.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">4. Overtime</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>If the couple requests extra coverage, inform them that it is billed at $300/hour.</li>
                      <li>Obtain written or electronic consent only from the couple before recording extra hours.</li>
                      <li>Document all extra hours in the job form. Couples must acknowledge overtime here: <a href="https://loveandphotos.com/overtime" className="text-primary-600 underline">Overtime Acknowledgment</a>.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">5. Fees, Invoicing & Payment</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>Contractors are paid based on actual hours worked; half-hour increments allowed.</li>
                      <li><strong>Tiered Pay:</strong>
                        <ul className="list-disc pl-6 mt-1">
                          <li>Tier 1: $40/hr — 0–20 weddings</li>
                          <li>Tier 2: $45/hr — 21–50 weddings</li>
                          <li>Tier 3: $50/hr — 51+ weddings</li>
                        </ul>
                      </li>
                      <li>Payment is processed via ACH/QuickBooks within 14 business days after delivery of all media and job form submission.</li>
                      <li>Late or incomplete submissions may incur deductions.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">6. Travel & Mileage</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>Travel fees/stipends are only provided if explicitly agreed in writing.</li>
                      <li>No automatic reimbursement for travel unless authorized.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">7. Media Ownership & Usage</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>Love & Photos LLC owns all copyrights and exclusive rights to delivered media.</li>
                      <li>The Studio may use any photos, videos, or other media for marketing, promotion, social media, website content, advertising, or any other purpose without additional compensation to the Contractor.</li>
                      <li>Contractors may use media for personal portfolios, websites, and social media after 30 days post-event, with credit to Love & Photos.</li>
                      <li>Contractors may not sell, license, transfer, or otherwise provide captured media to any third party without written consent from the Studio.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">8. Professional Appearance and Conduct</h4>
                    <p className="font-semibold mb-1">Appearance</p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li>Business casual or formal attire appropriate for weddings. Neutral colors recommended.</li>
                      <li>No tennis shoes, sandals, shorts, bright/neon colors, or casual T-shirts.</li>
                      <li>Maintain neat grooming and polished presentation.</li>
                    </ul>
                    <p className="font-semibold mb-1">Behavior</p>
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      <li>Arrive on time; do not leave early without authorization.</li>
                      <li>No smoking, vaping, or chewing gum in view of clients or guests.</li>
                      <li>No alcohol or drugs before or during the event.</li>
                      <li>Do not use your phone for personal reasons during the event.</li>
                      <li>Remain attentive and professional at all times.</li>
                      <li>Do not promote personal business or distribute marketing materials.</li>
                      <li>Avoid arguments with clients, guests, vendors, or other staff.</li>
                      <li>Sitting for extended periods is only allowed during designated breaks.</li>
                    </ul>
                    <p className="font-semibold mb-1">Breaks & Meals</p>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>For events over four hours, contractors are entitled to one vendor meal and one 20-minute break.</li>
                      <li>No break or meal is granted for events under four hours.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">9. Confidentiality & Non-Disclosure</h4>
                    <p className="mb-4">
                      Contractor agrees to keep all information related to the Studio, its clients, pricing, contracts, communications, and business operations strictly confidential. Such information may not be disclosed, shared, or used for any purpose outside of assignments with the Studio without prior written consent.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">10. Non-Solicitation & Non-Interference</h4>
                    <p className="mb-4">
                      Contractor agrees not to solicit, contract directly, or attempt to provide photography, videography, or related services to any Studio client for a period of twenty-four (24) months following completion of the last assignment for that client. Contractor also agrees not to solicit, recruit, or attempt to hire away Studio employees, contractors, or talent during the same period.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">11. Communication</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>Use only email or text for Studio communication: support@lp.loveandphotos.com, +1 323-701-1705.</li>
                      <li>Phone calls only for emergencies during the event day.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">12. Cancellation</h4>
                    <p className="font-semibold mb-1">Contractor Cancellation</p>
                    <p className="mb-2">Notify the Studio immediately if unable to fulfill an assignment. May result in blacklisting.</p>
                    <p className="font-semibold mb-1">Studio Cancellation</p>
                    <p className="mb-2">Studio will notify promptly; no payment or stipend owed if cancelled.</p>
                    <p className="font-semibold mb-1">No-show couple</p>
                    <p className="mb-4">
                      If the couple does not appear on the day of the event and the contractor is present, contractor will be paid 20% of what they would have been paid that day. Notify the Studio immediately.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">13. Amendments & Updates</h4>
                    <p className="mb-4">
                      The Studio may update these Terms at any time without notice. It is the Contractor's responsibility to review Terms regularly for updates. Continued engagement constitutes acceptance of any changes.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">14. Penalty Schedule</h4>
                    <table className="w-full border-collapse border border-gray-300 my-4">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border border-gray-300 px-3 py-2 text-left">Violation</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Deduction / Consequence</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-gray-300 px-3 py-2">Late Upload (&gt;3 days)</td><td className="border border-gray-300 px-3 py-2">1 day = $25, 2 days = $50, 3 days = $75, 4 days = $100, 5+ days = $200</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Under-delivery (photos &lt;100/hr)</td><td className="border border-gray-300 px-3 py-2">$25–$100 depending on severity</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Missing RAW or JPEG files</td><td className="border border-gray-300 px-3 py-2">$75–full payment withheld</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Incorrect video format</td><td className="border border-gray-300 px-3 py-2">$50–$150 depending on issue</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Video &lt;1080p</td><td className="border border-gray-300 px-3 py-2">$50–$150 depending on issue</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Corrupted/incomplete files</td><td className="border border-gray-300 px-3 py-2">$75–$150 case-by-case</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Extreme unprofessional conduct</td><td className="border border-gray-300 px-3 py-2">$200 + blacklisted</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">Event tardiness</td><td className="border border-gray-300 px-3 py-2">Up to 15 min = $25, 15–30 min = $50, &gt;30 min = $150</td></tr>
                        <tr><td className="border border-gray-300 px-3 py-2">No-show / lack of notice</td><td className="border border-gray-300 px-3 py-2">100% payment withheld + blacklisted</td></tr>
                      </tbody>
                    </table>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">15. Insurance, Liability & Indemnification</h4>
                    <ul className="list-disc pl-6 space-y-1 mb-4">
                      <li>Contractors are responsible for their own insurance coverage, including liability and equipment insurance.</li>
                      <li>Love & Photos LLC is not liable for any injuries, damages, loss, theft, or accidents that occur to the Contractor, their equipment, or personal property, on or off-site.</li>
                      <li>Contractors indemnify and hold harmless Love & Photos LLC for claims arising from negligence, misconduct, or breach of these Terms.</li>
                      <li>Studio liability is strictly limited to fees actually paid for the Assignment.</li>
                    </ul>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">16. Misrepresentation of Skills & Equipment</h4>
                    <p className="mb-4">
                      Contractors represent that they possess the skills, experience, and professional-grade equipment necessary to perform the assignment. Any misrepresentation that results in client dissatisfaction, incomplete coverage, or damages to the Studio may result in withheld payment and liability for damages.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">17. Termination of Relationship</h4>
                    <p className="mb-4">
                      The Studio reserves the right, at its sole discretion, to suspend or permanently remove a Contractor from the talent system at any time, with or without cause. This includes, but is not limited to, breaches of these Terms, failure to meet professional standards, conduct that harms the Studio's reputation, clients, or business interests, or for any other reason the Studio deems appropriate.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">18. Force Majeure</h4>
                    <p className="mb-4">
                      Neither party shall be liable for failure to perform obligations due to acts of God, natural disasters, pandemics, government restrictions, transportation failures, or other causes beyond reasonable control. Contractors must immediately notify the Studio of such events. Unless otherwise authorized, no payment is owed to Contractor under these circumstances.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">19. Compliance with Law</h4>
                    <p className="mb-4">
                      Contractor agrees to comply with all local, state, and federal laws and regulations, including but not limited to FAA drone regulations, copyright laws, venue requirements, and safety rules. Failure to comply is grounds for withheld payment and termination.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">20. Collection of Damages</h4>
                    <p className="mb-4">
                      If Contractor's actions result in financial loss to the Studio, including client refunds, reshoots, or reputational harm, the Studio reserves the right to deduct such amounts from unpaid invoices or to pursue reimbursement through legal means.
                    </p>

                    <h4 className="font-bold text-gray-900 mt-6 mb-2">21. Governing Law & Dispute Resolution</h4>
                    <p className="mb-4">
                      Governed by California law. Mediation and arbitration in San Diego County, CA, per JAMS rules.
                    </p>

                    <p className="mt-6 font-semibold">
                      By creating a profile, accepting an assignment, or otherwise engaging with Love & Photos LLC, you acknowledge that you have read, understood, and agreed to these Talent Terms of Service. Continued engagement constitutes acceptance of all provisions above.
                    </p>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="terms_agreement"
                    checked={formData.terms_agreement}
                    onChange={handleInputChange}
                    required
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1 flex-shrink-0"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I have read and agree to the Talent Terms of Service above. By providing my phone number and email, I agree to receive text messages and emails from Love & Photos LLC regarding services, vetting, and job opportunities.{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('role-selection')
                    setSelectedRole(null)
                    setFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                      password: '',
                      confirmPassword: '',
                      reliable_transportation: '',
                      willing_40_hourly: '',
                      age_18_plus: '',
                      comfortable_solo: '',
                      inclusive_mindset: '',
                      professional_grade_camera: '',
                      has_audio_gear: '',
                      experience_years: '',
                      referral_name: '',
                      instagram_handle: '',
                      background_description: '',
                      terms_agreement: false
                    })
                  }}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={selectedRole === 'photographer'
                    ? 'flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                    : 'flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  }
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Submitting Application...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Result Screen (Acceptance or Rejection)
  if (step === 'result' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {result.accepted ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Approved!</h2>
              <p className="text-gray-600 mb-6">{result.message}</p>
              <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Approved</h2>
              <p className="text-gray-600 mb-6">{result.message}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default TalentApplication
