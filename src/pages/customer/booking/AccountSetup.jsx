import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import toast from 'react-hot-toast'

const AccountSetup = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const { user, signUp, signIn } = useAuth()
  const {
    bookingFlow,
    updateAccountDetails,
    canAccessStep,
    getStepsForStepper,
    setBookingId
  } = useBookingFlow()

  const [mode, setMode] = useState('signup') // 'signup' or 'login'
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  })

  const [errors, setErrors] = useState({})
  const autoProcessAttemptedRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const ensureBookingForCustomer = useCallback(async (customerId, accountInfo = {}) => {
    if (!customerId) {
      throw new Error('Customer ID is required to create a booking')
    }

    if (bookingFlow.bookingId) {
      return bookingFlow.bookingId
    }

    const { scheduleDetails, packageDetails, locationDetails, addonsDetails } = bookingFlow

    // Schedule details are optional for now - can be added later
    // Date/time can be coordinated with photographer after booking

    // Package is optional - fallback to "Custom Package" if not provided
    const effectivePackageDetails = packageDetails && packageDetails.packagePrice
      ? packageDetails
      : {
          packageType: 'custom',
          packagePrice: 0,
          hoursBooked: 6,
          isPhotoVideo: true,
          packageTitle: 'Custom Package'
        }

    const selectedAddons = addonsDetails?.selectedAddons || []
    const packagePrice = effectivePackageDetails.packagePrice || 0
    const addonsPrice = selectedAddons.reduce(
      (sum, addon) => sum + (addon.price * (addon.qty || 1)),
      0
    )
    const totalAmount = packagePrice + addonsPrice

    const customerEmail = accountInfo.email || accountInfo.customerEmail || null
    const customerFullName = accountInfo.fullName || accountInfo.customerFullName || ''
    const customerPhone = accountInfo.phone || accountInfo.customerPhone || ''

    const payload = {
      customerId,
      photographerId,
      videographerId: bookingFlow.videographerId || null, // Include videographer ID if selected
      packageDetails: effectivePackageDetails, // Use effective package with fallback
      scheduleDetails,
      locationDetails,
      addonsDetails: {
        selectedAddons,
        totalAddonsPrice: addonsPrice // Include total addons price
      },
      totalAmount,
      accountDetails: {
        userId: customerId,
        email: customerEmail,
        fullName: customerFullName,
        phone: customerPhone
      }
    }

    console.log('📅 Creating booking with payload:', payload)

    const response = await fetch('/api/booking/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const detail = errorData.details || errorData.detail || errorData.error
      const message = errorData.message || detail || `Failed to create booking: ${response.status}`

      // Check if this is a foreign key error (user doesn't exist yet)
      // This is expected on first attempt and will be retried automatically
      const isForeignKeyError = (
        (errorData.code === 'BOOKING_CREATION_FAILED' && errorData.errorCode === '23503') ||
        (message && message.includes('bookings_customer_id_fkey')) ||
        (detail && detail.includes('bookings_customer_id_fkey'))
      )

      if (isForeignKeyError) {
        console.log('⏳ User record not ready yet, will retry automatically')
        // Throw error silently - will be retried when AuthContext refetches user
        throw new Error('USER_NOT_READY')
      }

      throw new Error(detail ? `${message} (${detail})` : message)
    }

    const result = await response.json()
    console.log('✅ Booking created successfully:', result.bookingId)

    setBookingId(result.bookingId)
    return result.bookingId
  }, [bookingFlow, photographerId, setBookingId])

  const finalizeAccountStep = useCallback(async ({
    customerId,
    email,
    fullName,
    phone
  }) => {
    if (isMountedRef.current) {
      setLoading(true)
    }
    try {
      // IMPORTANT: Create booking FIRST before marking account complete
      // This prevents race condition where guard redirects to contract before bookingId is set
      const bookingId = await ensureBookingForCustomer(customerId, {
        email,
        fullName,
        phone
      })

      // Only mark account complete AFTER booking is created and bookingId is set
      updateAccountDetails({
        isAuthenticated: true,
        userId: customerId,
        email,
        fullName,
        phone
      })

      console.log('✅ Account finalized with bookingId:', bookingId)
      navigate(`/booking/${photographerId}/contract`)
    } catch (error) {
      // Suppress USER_NOT_READY errors - expected on first attempt
      // Booking will retry automatically when user record is ready
      if (error.message === 'USER_NOT_READY') {
        console.log('⏳ Booking creation deferred, will retry when user is ready')
        return // Don't show error toast
      }

      console.error('❌ Failed to finalize account step:', error)
      toast.error(error.message || 'Unable to prepare your booking. Please try again.')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [ensureBookingForCustomer, navigate, photographerId, updateAccountDetails])

  // Get steps for the booking stepper
  const steps = getStepsForStepper()

  // If user is already authenticated, finalize the account step automatically
  useEffect(() => {
    if (!user?.id) {
      autoProcessAttemptedRef.current = false
      return
    }

    if (autoProcessAttemptedRef.current) return
    autoProcessAttemptedRef.current = true

    finalizeAccountStep({
      customerId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || ''
    })
  }, [finalizeAccountStep, user])

  // Check if email exists when user types email in signup mode
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

  const checkEmailExists = async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return

    setCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.exists && mode === 'signup') {
        setMode('login')
        toast.info('We found an account with this email. Please sign in.')
      }
    } catch (error) {
      console.error('Error checking email:', error)
    } finally {
      setCheckingEmail(false)
    }
  }

  // Debounced email check
  useEffect(() => {
    if (formData.email && mode === 'signup') {
      const timer = setTimeout(() => {
        checkEmailExists(formData.email)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [formData.email, mode])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required'
      }

      if (!formData.phone) {
        newErrors.phone = 'Phone number is required'
      } else if (formData.phone.length < 14) {
        newErrors.phone = 'Please enter a complete 10-digit phone number'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      let result

      if (mode === 'signup') {
        // Strip formatting from phone number for database storage
        const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : ''

        // Create account
        result = await signUp(formData.email, formData.password, {
          fullName: formData.fullName,
          phone: cleanPhone,
          role: 'customer'
        })

        if (result.success) {
          toast.success('Account created successfully!')

          await finalizeAccountStep({
            customerId: result.user.id,
            email: result.user.email,
            fullName: formData.fullName,
            phone: cleanPhone
          })
          return
        }
      } else {
        // Sign in existing user
        result = await signIn(formData.email, formData.password)

        if (result.success) {
          toast.success('Signed in successfully!')

          await finalizeAccountStep({
            customerId: result.user.id,
            email: result.user.email,
            fullName: result.user.user_metadata?.full_name || '',
            phone: result.user.user_metadata?.phone || ''
          })
          return
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Authentication failed')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for phone number to format as user types
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, phone: formattedPhone }))
      // Clear error for this field when user starts typing
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }))
      }
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBack = () => {
    if (canAccessStep('addons')) {
      navigate(`/booking/${photographerId}/addons`)
    }
  }

  // If user is authenticated, show loading state while auto-navigation happens
  if (user && user.id) {
    return (
      <div className="min-h-screen bg-dusty-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dusty-600">Preparing your booking…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dusty-50">
      <BookingStepper
        steps={steps}
        currentStepIndex={2} // Account is step 3 (0-indexed: 2)
      />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dusty-900 mb-2">
              {mode === 'signup' ? 'Create Your Account' : 'Sign In to Continue'}
            </h1>
            <p className="text-dusty-600">
              {mode === 'signup'
                ? 'Create an account to continue with your booking and sign the contract'
                : 'Sign in to your existing account to continue'}
            </p>
          </div>

          {/* Benefits of creating account */}
          {mode === 'signup' && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <p className="font-medium mb-2 text-primary-900">Why create an account?</p>
              <ul className="space-y-1 text-sm text-primary-700">
                <li>• Track your booking status and communicate with your photographer</li>
                <li>• Access photos and videos after your event</li>
                <li>• Save favorite photographers for future bookings</li>
                <li>• Manage payment details and booking history</li>
              </ul>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-dusty-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  icon={<User className="w-5 h-5" />}
                  error={errors.fullName}
                  disabled={loading}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dusty-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                icon={<Mail className="w-5 h-5" />}
                error={errors.email}
                disabled={loading || checkingEmail}
                required
              />
              {checkingEmail && (
                <p className="text-xs text-dusty-500 mt-1">Checking if email exists...</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-dusty-700 mb-1">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 555-5555"
                  icon={<Phone className="w-5 h-5" />}
                  error={errors.phone}
                  disabled={loading}
                  maxLength={14}
                  pattern="\(\d{3}\) \d{3}-\d{4}"
                  required
                />
                {formData.phone && formData.phone.length > 0 && formData.phone.length < 14 && (
                  <p className="mt-1 text-sm text-amber-600">
                    Enter a complete 10-digit phone number
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dusty-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                icon={<Lock className="w-5 h-5" />}
                error={errors.password}
                disabled={loading}
                required
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dusty-700 mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  icon={<Check className="w-5 h-5" />}
                  error={errors.confirmPassword}
                  disabled={loading}
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading || checkingEmail}
            >
              {loading
                ? 'Processing...'
                : mode === 'signup'
                  ? 'Create Account & Continue'
                  : 'Sign In & Continue'
              }
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Toggle between signup and login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="text-sm text-primary-600 hover:text-primary-700"
                disabled={loading}
              >
                {mode === 'signup'
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Add-Ons
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccountSetup
