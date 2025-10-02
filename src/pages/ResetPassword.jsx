import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { LockIcon, EyeIcon, EyeOffIcon, CheckCircle2 } from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import BrandLogo from '@components/BrandLogo'
import toast from 'react-hot-toast'
import { supabase } from '@lib/supabase'

const ResetPassword = () => {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const password = watch('password')

  // Check if we have a valid recovery token
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error checking session:', error)
          toast.error('Invalid or expired reset link')
          setValidToken(false)
        } else if (session) {
          // Valid session means we came from a valid reset email link
          setValidToken(true)
        } else {
          toast.error('Invalid or expired reset link')
          setValidToken(false)
        }
      } catch (error) {
        console.error('Error checking token:', error)
        toast.error('Something went wrong. Please try again.')
        setValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkSession()
  }, [])

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(data.password)

      if (result.success) {
        setResetSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Link to="/">
                <BrandLogo size="lg" variant="icon" showText={false} />
              </Link>
            </div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-muted-foreground mb-6">
              This password reset link has expired or is invalid.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Please request a new password reset link to continue.
            </p>
            <div className="space-y-3">
              <Link to="/forgot-password">
                <Button className="w-full">
                  Request New Link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Link to="/">
                <BrandLogo size="lg" variant="icon" showText={false} />
              </Link>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-muted-foreground mb-6">
              Your password has been updated successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Redirecting you to login...
            </p>
            <Link to="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Link to="/">
              <BrandLogo size="lg" variant="icon" showText={false} />
            </Link>
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Reset Your Password
          </h2>
          <p className="mt-2 text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-4">
            <div className="relative">
              <Input
                label="New Password"
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
                    message: 'Password must contain uppercase, lowercase, and number'
                  }
                })}
                error={errors.password?.message}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
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
                type={showConfirmPassword ? "text" : "password"}
                icon={<LockIcon className="w-5 h-5 text-muted-foreground" />}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                error={errors.confirmPassword?.message}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 pt-2">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Reset Password
            </Button>

            <Link to="/login" className="block">
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
                size="lg"
                type="button"
              >
                Back to Login
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
