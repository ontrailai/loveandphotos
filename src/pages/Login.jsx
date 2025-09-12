import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { 
  CameraIcon, 
  MailIcon, 
  LockIcon,
  ArrowRightIcon
} from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import toast from 'react-hot-toast'

const Login = () => {
  const { signIn, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  
  // Redirect if already logged in
  useEffect(() => {
    // Only redirect if we have a user AND profile loaded
    if (user && profile) {
      console.log('User is already logged in, redirecting...')
      if (profile.role === 'photographer') {
        navigate('/dashboard/photographer')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, profile, navigate])
  
  // Show spinner only while checking auth AND user exists
  // This prevents infinite spinner for non-logged-in users
  if (authLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blush-500"></div>
      </div>
    )
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    
    try {
      const result = await signIn(data.email, data.password)
      
      // The signIn function handles navigation and returns result
      if (!result.success) {
        console.error('Login failed:', result.error)
        // Only set loading to false if login failed
        setLoading(false)
      }
      // If successful, don't set loading to false since we're navigating away
    } catch (error) {
      console.error('Login error:', error)
      // Only set loading to false on error
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-sage-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <CameraIcon className="w-10 h-10 text-blush-500" />
              <span className="text-3xl font-display font-bold text-dusty-900">Love & Photos</span>
            </Link>
            <h2 className="text-3xl font-display font-bold text-dusty-900">
              Welcome back
            </h2>
            <p className="mt-2 text-dusty-600">
              Sign in to continue to your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6 space-y-4">
              <Input
                label="Email Address"
                type="email"
                icon={<MailIcon className="w-5 h-5 text-dusty-400" />}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                type="password"
                icon={<LockIcon className="w-5 h-5 text-dusty-400" />}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                error={errors.password?.message}
                placeholder="••••••••"
              />
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blush-600 focus:ring-blush-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-dusty-600">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blush-600 hover:text-blush-700"
              >
                Forgot password?
              </Link>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-sm text-dusty-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blush-600 hover:text-blush-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200"
            alt="Wedding photography"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dusty-900/50 to-transparent" />
        </div>
        <div className="relative flex items-center p-12">
          <div className="text-white">
            <h3 className="text-3xl font-display font-bold mb-2">
              Capture life's precious moments
            </h3>
            <p className="text-lg text-white/80">
              Connect with talented photographers who bring your vision to life
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
