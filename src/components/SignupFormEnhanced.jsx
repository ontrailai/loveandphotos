/**
 * Enhanced Signup Form Component
 * Advanced signup form with real-time validation and password requirements
 */

import React, { useState } from 'react'
import { Eye, EyeOff, Camera, Check, X, UserIcon, MailIcon, PhoneIcon, LockIcon, SparklesIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Label from '@components/ui/Label'
import Card from '@components/ui/Card'
import { cn } from '@/lib/utils'

const SignupFormEnhanced = ({
  onSubmit,
  loading = false,
  selectedRole = 'customer',
  onRoleChange,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    password: initialData.password || '',
    confirmPassword: initialData.confirmPassword || ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [touched, setTouched] = useState({})

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
  const isFormValid = Object.values(validation).every(v => v.isValid)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setFocusedField(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    // Mark all fields as touched to show validation
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    })

    onSubmit({
      ...formData,
      role: selectedRole
    })
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
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
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
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
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
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
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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

      {/* Selected Role Display */}
      <div className="bg-sage-50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sage-500 text-white rounded-lg flex items-center justify-center">
            {selectedRole === 'photographer' ? <Camera className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm text-sage-700">Signing up as</p>
            <p className="font-semibold text-sage-900">
              {selectedRole === 'photographer' ? 'Photographer' : 'Customer'}
            </p>
          </div>
        </div>
        {onRoleChange && (
          <button
            type="button"
            onClick={onRoleChange}
            className="text-sage-600 hover:text-sage-700 text-sm font-medium"
          >
            Change
          </button>
        )}
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
    </form>
  )
}

export default SignupFormEnhanced