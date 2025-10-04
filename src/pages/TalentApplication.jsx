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
    cross_service_offer: '', // Dropdown
    background_description: '', // Textarea

    // Videographer-specific additional question
    has_drone: '', // videographer only

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
      key: 'cross_service_offer',
      label: `Do you also offer ${oppServiceType} services?`,
      type: 'select',
      options: ['No', 'Yes'],
      required: true
    },
    ...(selectedRole === 'videographer' ? [{
      key: 'has_drone',
      label: 'Do you have a drone?',
      type: 'radio',
      required: false
    }] : []),
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
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
      const applicationData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
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
          cross_service_offer: formData.cross_service_offer,
          background_description: formData.background_description,

          // Videographer-specific additional question
          ...(selectedRole === 'videographer' && {
            has_drone: formData.has_drone
          })
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
        phone: formData.phone
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
        message: "Congratulations! Your application has been approved. You now have access to the Talent Portal."
      })
      setStep('result')

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/talent/dashboard')
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
              <RoleIcon className={`w-8 h-8 text-${roleColor}-600`} />
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
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="John Doe"
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
                  />
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

              {/* Terms and Conditions */}
              <div className="border-t pt-6">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="terms_agreement"
                    checked={formData.terms_agreement}
                    onChange={handleInputChange}
                    required
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I agree to{' '}
                    <a href="/terms" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
                      terms & conditions
                    </a>{' '}
                    provided by the company. By providing my phone number and email, I agree to receive text messages and emails from the company regarding services, vetting, and potential job opportunities.{' '}
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
                      cross_service_offer: '',
                      background_description: '',
                      has_drone: '',
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
                  className={`flex-1 px-6 py-3 bg-${roleColor}-600 text-white rounded-lg hover:bg-${roleColor}-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
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
