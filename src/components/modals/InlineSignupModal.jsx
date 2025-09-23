import { useState } from 'react'
import { X, Mail, Lock, User, Phone, Check } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import { useGuestBooking } from '@contexts/GuestBookingContext'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import toast from 'react-hot-toast'

const InlineSignupModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  bookingData,
  photographer 
}) => {
  const { signUp, signIn } = useAuth()
  const { clearPendingBooking } = useGuestBooking()
  const [mode, setMode] = useState('signup') // 'signup' or 'login'
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    email: bookingData?.email || '',
    password: '',
    confirmPassword: '',
    fullName: bookingData?.name || '',
    phone: bookingData?.phone || ''
  })
  
  const [errors, setErrors] = useState({})
  
  if (!isOpen) return null
  
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
        // Create account
        result = await signUp(formData.email, formData.password, {
          fullName: formData.fullName,
          phone: formData.phone,
          role: 'customer'
        })
        
        if (result.success) {
          // Clear the pending booking from localStorage as it will be migrated
          clearPendingBooking()
          toast.success('Account created successfully!')
          
          // Call onSuccess to continue with booking
          if (onSuccess) {
            await onSuccess(result.user)
          }
        }
      } else {
        // Sign in existing user
        result = await signIn(formData.email, formData.password)
        
        if (result.success) {
          // Clear the pending booking from localStorage
          clearPendingBooking()
          
          // Call onSuccess to continue with booking
          if (onSuccess) {
            await onSuccess(result.user)
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      <Card 
        className="max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 id="signup-modal-title" className="text-2xl font-semibold text-dusty-900">
                {mode === 'signup' ? 'Create Your Account' : 'Sign In to Continue'}
              </h2>
              <p className="text-sm text-dusty-600 mt-1">
                {mode === 'signup' 
                  ? 'Create an account to complete your booking'
                  : 'Sign in to complete your booking'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-dusty-600" />
            </button>
          </div>
          
          {/* Booking Summary */}
          {photographer && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-primary-900 mb-1">
                Booking with {photographer.users?.full_name}
              </p>
              <p className="text-xs text-primary-700">
                {bookingData?.eventDate} • {bookingData?.packageTitle}
              </p>
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
                disabled={loading}
                required
              />
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
                  required
                />
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
            
            {/* Benefits of creating account */}
            {mode === 'signup' && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-dusty-600">
                <p className="font-medium mb-1">Why create an account?</p>
                <ul className="space-y-1">
                  <li>• Track your booking status</li>
                  <li>• Message your photographer</li>
                  <li>• Access photos after the event</li>
                  <li>• Save favorite photographers</li>
                </ul>
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading 
                ? 'Processing...' 
                : mode === 'signup' 
                  ? 'Create Account & Continue'
                  : 'Sign In & Continue'
              }
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
        </div>
      </Card>
    </div>
  )
}

export default InlineSignupModal