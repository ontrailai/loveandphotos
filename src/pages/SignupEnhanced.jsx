/**
 * Enhanced Signup Page
 * Signup with advanced real-time validation
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { Eye, EyeOff, Camera, Check, X, UserIcon, MailIcon, PhoneIcon, LockIcon, SparklesIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import BasicInput from '@components/ui/BasicInput'
import Label from '@components/ui/Label'
import BrandLogo from '@components/BrandLogo'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const SignupEnhanced = () => {
  const { signUp, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('customer')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      console.log('User is already logged in, redirecting...')
      if (profile.role === 'photographer') {
        navigate('/dashboard/photographer')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, profile, navigate])

  if (authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500"></div>
      </div>
    )
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      return { isValid: false, message: 'Email is required' }
    }
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Please enter a valid email address' }
    }
    return { isValid: true, message: '' }
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/
    if (!phone) {
      return { isValid: false, message: 'Phone number is required' }
    }
    if (!phoneRegex.test(phone)) {
      return { isValid: false, message: 'Enter a valid 10-digit phone number' }
    }
    return { isValid: true, message: '' }
  }

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const isValid = Object.values(requirements).every(req => req)
    const message = isValid ? '' : 'Password must meet all requirements'

    return { isValid, message, requirements }
  }

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return { isValid: false, message: 'Please confirm your password' }
    }
    if (password !== confirmPassword) {
      return { isValid: false, message: 'Passwords do not match' }
    }
    return { isValid: true, message: '' }
  }

  const validateFullName = (name) => {
    if (!name) {
      return { isValid: false, message: 'Full name is required' }
    }
    if (name.length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters' }
    }
    return { isValid: true, message: '' }
  }

  const getValidationState = () => {
    return {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword)
    }
  }

  const validation = getValidationState()
  const isFormValid = Object.values(validation).every(v => v.isValid) && termsAccepted

  const handleBasicInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setFocusedField(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid) return

    setLoading(true)

    try {
      const result = await signUp(formData.email, formData.password, {
        role: selectedRole,
        fullName: formData.fullName,
        phone: formData.phone
      })

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          toast.success('Please check your email to confirm your account')
        } else {
          navigate(selectedRole === 'photographer' ? '/onboarding/photographer' : '/dashboard')
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const RequirementItem = ({ met, text }) => (
    <div className={cn(
      "flex items-center gap-2 text-xs transition-colors",
      met ? "text-green-600" : "text-dusty-500"
    )}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  )

  const getFieldClassName = (field, validation) => {
    if (!touched[field] && !formData[field]) return ''
    if (formData[field] && !validation.isValid) return 'border-red-500 focus:ring-red-500'
    if (formData[field] && validation.isValid) return 'border-green-500 focus:ring-green-500'
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-sage-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <BrandLogo href="/" size="xl" variant="full" className="mb-6" />
            <h2 className="text-3xl font-display font-bold text-dusty-900">
              Create your account
            </h2>
            <p className="mt-2 text-dusty-600">
              Enhanced signup with real-time validation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border-2 transition-all",
                  selectedRole === 'customer'
                    ? "border-blush-500 bg-blush-50 text-blush-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <SparklesIcon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">I need a photographer</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('photographer')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border-2 transition-all",
                  selectedRole === 'photographer'
                    ? "border-blush-500 bg-blush-50 text-blush-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Camera className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">I am a photographer</div>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-dusty-700">
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusty-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <BasicInput
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleBasicInputChange('fullName', e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => handleBlur('fullName')}
                    className={cn(
                      "pl-10",
                      getFieldClassName('fullName', validation.fullName)
                    )}
                    placeholder="Enter your full name"
                  />
                  {formData.fullName && validation.fullName.isValid && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {touched.fullName && !validation.fullName.isValid && (
                  <p className="text-sm text-red-500">{validation.fullName.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-dusty-700">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusty-400">
                    <MailIcon className="w-5 h-5" />
                  </div>
                  <BasicInput
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleBasicInputChange('email', e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => handleBlur('email')}
                    className={cn(
                      "pl-10",
                      getFieldClassName('email', validation.email)
                    )}
                    placeholder="you@example.com"
                  />
                  {formData.email && validation.email.isValid && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {touched.email && !validation.email.isValid && (
                  <p className="text-sm text-red-500">{validation.email.message}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-dusty-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusty-400">
                    <PhoneIcon className="w-5 h-5" />
                  </div>
                  <BasicInput
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleBasicInputChange('phone', e.target.value)}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => handleBlur('phone')}
                    className={cn(
                      "pl-10",
                      getFieldClassName('phone', validation.phone)
                    )}
                    placeholder="1234567890"
                  />
                  {formData.phone && validation.phone.isValid && (
                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {touched.phone && !validation.phone.isValid && (
                  <p className="text-sm text-red-500">{validation.phone.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-dusty-700">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusty-400">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <BasicInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleBasicInputChange('password', e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => handleBlur('password')}
                    className={cn(
                      "pl-10 pr-10",
                      getFieldClassName('password', validation.password)
                    )}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dusty-400 hover:text-dusty-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {(focusedField === 'password' || formData.password) && (
                  <div className="bg-sage-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-dusty-600 mb-2">Password Requirements:</p>
                    <RequirementItem met={validation.password.requirements.length} text="At least 8 characters" />
                    <RequirementItem met={validation.password.requirements.uppercase} text="One uppercase letter" />
                    <RequirementItem met={validation.password.requirements.lowercase} text="One lowercase letter" />
                    <RequirementItem met={validation.password.requirements.number} text="One number" />
                    <RequirementItem met={validation.password.requirements.special} text="One special character" />
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-dusty-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dusty-400">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <BasicInput
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleBasicInputChange('confirmPassword', e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={cn(
                      "pl-10 pr-10",
                      getFieldClassName('confirmPassword', validation.confirmPassword)
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dusty-400 hover:text-dusty-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {formData.confirmPassword && validation.confirmPassword.isValid && (
                    <Check className="absolute right-10 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {touched.confirmPassword && !validation.confirmPassword.isValid && (
                  <p className="text-sm text-red-500">{validation.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blush-600 border-gray-300 rounded focus:ring-blush-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-dusty-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blush-600 hover:text-blush-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blush-600 hover:text-blush-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-dusty-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blush-600 hover:text-blush-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200"
            alt="Photography"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dusty-900/50 to-transparent" />
        </div>
        <div className="relative flex items-end p-12">
          <div className="text-white">
            <h3 className="text-3xl font-display font-bold mb-2">
              Enhanced Signup Experience
            </h3>
            <p className="text-lg text-white/80">
              Real-time validation • Password strength • Smart fields
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupEnhanced