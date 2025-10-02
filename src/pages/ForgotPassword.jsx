import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { MailIcon, ArrowLeftIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import BrandLogo from '@components/BrandLogo'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)

    try {
      const result = await resetPassword(data.email)

      if (result.success) {
        setEmailSent(true)
      } else {
        toast.error(result.error || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
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
              <MailIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Check Your Email
            </h2>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <strong>{getValues('email')}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Login
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
            Forgot Password?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Send Reset Link
            </Button>

            <Link to="/login" className="block">
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
                size="lg"
                type="button"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
