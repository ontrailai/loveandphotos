/**
 * Signup Demo Page
 * Demonstrates the enhanced signup form with real-time validation
 */

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import SignupFormEnhanced from '@components/SignupFormEnhanced'
import { CameraIcon, CheckIcon, SparklesIcon, ArrowRightIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'

const SignupDemo = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'customer')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleFormSubmit = async (formData) => {
    setLoading(true)

    try {
      const result = await signUp(formData.email, formData.password, {
        role: formData.role,
        fullName: formData.fullName,
        phone: formData.phone
      })

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          toast.success('Please check your email to confirm your account')
        } else {
          navigate(formData.role === 'photographer' ? '/onboarding/photographer' : '/dashboard')
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
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-sage-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <CameraIcon className="w-10 h-10 text-blush-500" />
              <span className="text-3xl font-display font-bold text-dusty-900">LoveP</span>
            </Link>
            <h2 className="text-3xl font-display font-bold text-dusty-900">
              {step === 1 ? 'Choose your path' : 'Create your account'}
            </h2>
            <p className="mt-2 text-dusty-600">
              {step === 1 ? 'How would you like to use LoveP?' : 'Enhanced form with real-time validation'}
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
                      ? 'ring-2 ring-blush-500 bg-blush-50'
                      : 'hover:shadow-md'
                  )}
                  onClick={() => setSelectedRole(option.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={clsx(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      selectedRole === option.id
                        ? 'bg-blush-500 text-white'
                        : 'bg-gray-100 text-dusty-600'
                    )}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-dusty-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-dusty-600 mb-3">
                        {option.description}
                      </p>
                      <ul className="space-y-1">
                        {option.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-dusty-600">
                            <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {selectedRole === option.id && (
                      <CheckIcon className="w-6 h-6 text-blush-500 flex-shrink-0" />
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

              <p className="text-center text-sm text-dusty-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blush-600 hover:text-blush-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            // Step 2: Enhanced Account Details Form
            <div className="space-y-6">
              <SignupFormEnhanced
                onSubmit={handleFormSubmit}
                loading={loading}
                selectedRole={selectedRole}
                onRoleChange={() => setStep(1)}
              />

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  required
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

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-dusty-600 hover:text-dusty-700 text-sm font-medium"
              >
                ← Back to role selection
              </button>
            </div>
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
        <div className="relative flex items-end p-12">
          <div className="text-white">
            <h3 className="text-3xl font-display font-bold mb-2">
              Enhanced Signup Experience
            </h3>
            <p className="text-lg text-white/80">
              Real-time validation • Password strength indicators • Improved UX
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupDemo