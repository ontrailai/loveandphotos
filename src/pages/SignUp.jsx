/**
 * SignUp Component
 * Registration page with role selection
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useForm } from 'react-hook-form'
import {
  CameraIcon,
  UserIcon,
  MailIcon,
  LockIcon,
  PhoneIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  BriefcaseIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import PhoneInput from '@components/forms/PhoneInput'
import Card from '@components/ui/Card'
import BrandLogo from '@components/BrandLogo'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const SignUp = () => {
  const { signUp, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'customer')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)

  // Check if user is already a photographer
  const isPhotographer = profile?.role === 'photographer' || user?.user_metadata?.role === 'photographer'

  // Redirect if already logged in
  useEffect(() => {
    // Only redirect if we have a user AND profile loaded
    if (user && profile) {
      console.log('User is already logged in, redirecting from signup...')
      if (profile.role === 'photographer') {
        navigate('/dashboard/photographer')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, profile, navigate])

  // Defensive guard: redirect existing photographers who manually hit /signup?role=photographer
  useEffect(() => {
    const preselectedRole = searchParams.get('role')
    if (user && profile && isPhotographer && preselectedRole === 'photographer') {
      console.log('Photographer attempting to access photographer signup, redirecting to dashboard...')
      navigate('/dashboard/photographer')
    }
  }, [user, profile, isPhotographer, searchParams, navigate])

  // Show spinner only while checking auth AND user exists
  // This prevents infinite spinner for non-logged-in users
  if (authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)

    try {
      const result = await signUp(data.email, data.password, {
        role: selectedRole,
        fullName: data.fullName,
        phone: data.phone
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

  const roleOptions = [
    {
      id: 'customer',
      title: 'I need a photographer',
      description: 'Book talented photographers for your events',
      icon: <SparklesIcon className="w-6 h-6" />,
      benefits: [
        'Browse verified photographers',
        'Instant booking & scheduling',
        'Secure payment protection',
        'Satisfaction guarantee'
      ]
    },
    {
      id: 'photographer',
      title: 'I am a photographer',
      description: 'Join our network and grow your business',
      icon: <CameraIcon className="w-6 h-6" />,
      benefits: [
        'Set your own rates',
        'Flexible scheduling',
        'Automated payments',
        'Marketing support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Link to="/">
                <BrandLogo size="lg" variant="icon" showText={false} />
              </Link>
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {step === 1 ? 'Choose your path' : 'Create your account'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {step === 1 ? 'How would you like to use Love & Photos?' : 'Join thousands of happy users'}
            </p>
          </div>

          {step === 1 ? (
            // Step 1: Role Selection
            <div className="space-y-4">
              {roleOptions.map((option) => (
                <Card
                  key={option.id}
                  className={clsx(
                    'cursor-pointer transition-all duration-200',
                    selectedRole === option.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:shadow-md bg-card'
                  )}
                  onClick={() => setSelectedRole(option.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={clsx(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      selectedRole === option.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {option.description}
                      </p>
                      <ul className="space-y-1">
                        {option.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-muted-foreground">
                            <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {selectedRole === option.id && (
                      <CheckIcon className="w-6 h-6 text-primary flex-shrink-0" />
                    )}
                  </div>
                </Card>
              ))}

              <Button
                onClick={() => setStep(2)}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            // Step 2: Account Details
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
                <Input
                  label="Full Name"
                  icon={<UserIcon className="w-5 h-5 text-muted-foreground" />}
                  {...register('fullName', {
                    required: 'Full name is required'
                  })}
                  error={errors.fullName?.message}
                />

                <Input
                  label="Email Address"
                  type="email"
                  icon={<MailIcon className="w-5 h-5 text-muted-foreground" />}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.email?.message}
                />

                <PhoneInput
                  label="Phone Number"
                  icon={<PhoneIcon className="w-5 h-5 text-muted-foreground" />}
                  {...register('phone', {
                    required: 'Phone number is required',
                    validate: value => {
                      const digits = value.replace(/\D/g, '');
                      return digits.length === 10 || 'Enter a valid 10-digit phone number';
                    }
                  })}
                  placeholder="(555) 123-4567"
                  error={errors.phone?.message}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    icon={<LockIcon className="w-5 h-5 text-muted-foreground" />}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must include uppercase, lowercase, and number'
                      }
                    })}
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showPassword ? "text" : "password"}
                    icon={<LockIcon className="w-5 h-5 text-muted-foreground" />}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    error={errors.confirmPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Selected Role Display */}
              <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                    {selectedRole === 'photographer' ? <CameraIcon className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Signing up as</p>
                    <p className="font-semibold text-foreground">
                      {selectedRole === 'photographer' ? 'Photographer' : 'Customer'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  Change
                </button>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  {...register('terms', {
                    required: 'You must accept the terms and conditions'
                  })}
                  className="mt-1 h-4 w-4 text-primary border-border rounded focus:ring-primary"
                />
                <label className="ml-2 text-sm text-muted-foreground">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:text-primary/80">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary hover:text-primary/80">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600">{errors.terms.message}</p>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  Create Account
                </Button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  ← Back to role selection
                </button>
              </div>
            </form>
          )}
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
        {/* Keep only the subtle overlay for image depth - no text */}
      </div>
    </div>
  )
}

export default SignUp