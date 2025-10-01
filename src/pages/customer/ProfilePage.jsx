import { useState, useEffect } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { User, Mail, Phone, Calendar, Heart, Save, X } from 'lucide-react'
import Button from '@components/ui/Button'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, profile, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    wedding_date: '',
    partner_name: '',
    preferences: ''
  })

  // Validation errors
  const [errors, setErrors] = useState({})

  // Initialize form with current user data
  useEffect(() => {
    if (user && profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        wedding_date: profile.metadata?.wedding_date || '',
        partner_name: profile.metadata?.partner_name || '',
        preferences: profile.metadata?.preferences || ''
      })
    }
  }, [user, profile])

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Phone validation (basic US format)
  const validatePhone = (phone) => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[\d\s\-\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  // Form validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone format (10+ digits required)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  // Handle cancel
  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      full_name: profile.full_name || '',
      email: user.email || '',
      phone: profile.phone || '',
      wedding_date: profile.metadata?.wedding_date || '',
      partner_name: profile.metadata?.partner_name || '',
      preferences: profile.metadata?.preferences || ''
    })
    setErrors({})
    setHasChanges(false)
    setIsEditing(false)
  }

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    setIsSaving(true)

    try {
      // Check if email changed
      const emailChanged = formData.email !== user.email

      // Update email in auth.users if changed
      if (emailChanged) {
        console.log('Updating email via auth.updateUser...')
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email
        })

        if (authError) {
          console.error('❌ Auth email update error:', authError)
          throw new Error(`Failed to update email: ${authError.message}`)
        }
        console.log('✅ Email updated in auth.users')
      }

      // Update profile in users table
      console.log('Updating profile in users table...', {
        user_id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        metadata: {
          wedding_date: formData.wedding_date,
          partner_name: formData.partner_name,
          preferences: formData.preferences
        }
      })

      const { data: updatedData, error: profileError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          metadata: {
            ...(profile?.metadata || {}),
            wedding_date: formData.wedding_date || null,
            partner_name: formData.partner_name || null,
            preferences: formData.preferences || null
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()

      if (profileError) {
        console.error('❌ Profile update error:', profileError)
        throw new Error(`Failed to update profile: ${profileError.message}`)
      }

      console.log('✅ Profile updated in database:', updatedData)

      toast.success(emailChanged
        ? '✅ Profile updated! Check your new email for confirmation.'
        : '✅ Profile updated successfully!'
      )

      setHasChanges(false)
      setIsEditing(false)

      // Trigger a re-fetch of user data in AuthContext
      // This will update the local profile state
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('❌ Save error:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>

        {/* Profile Form Card */}
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </h2>

            {!isEditing && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className={`w-full px-4 py-2 border ${
                      errors.full_name ? 'border-red-500' : 'border-border'
                    } rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="Enter your full name"
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
                  )}
                </div>
              ) : (
                <p className="text-foreground">{profile?.full_name || 'Not provided'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address <span className="text-red-500">*</span>
                </div>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-4 py-2 border ${
                      errors.email ? 'border-red-500' : 'border-border'
                    } rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                  {formData.email !== user?.email && (
                    <p className="text-amber-600 text-sm mt-1">
                      ⚠️ Changing your email will require re-confirmation
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground">{user?.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number
                </div>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-4 py-2 border ${
                      errors.phone ? 'border-red-500' : 'border-border'
                    } rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-foreground">{profile?.phone || 'Not provided'}</p>
              )}
            </div>

            {/* Wedding Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Wedding Date (Optional)
                </div>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.wedding_date}
                  onChange={(e) => handleChange('wedding_date', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              ) : (
                <p className="text-foreground">
                  {profile?.metadata?.wedding_date ? formatDate(profile.metadata.wedding_date) : 'Not set'}
                </p>
              )}
            </div>

            {/* Partner Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Partner Name (Optional)
                </div>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.partner_name}
                  onChange={(e) => handleChange('partner_name', e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter partner's name"
                />
              ) : (
                <p className="text-foreground">
                  {profile?.metadata?.partner_name || 'Not provided'}
                </p>
              )}
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Photography Preferences (Optional)
              </label>
              {isEditing ? (
                <textarea
                  value={formData.preferences}
                  onChange={(e) => handleChange('preferences', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Tell us about your photography style preferences, special requests, or any details we should know..."
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">
                  {profile?.metadata?.preferences || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 mt-8 pt-6 border-t border-border">
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Information</h3>
          <div className="flex items-center text-sm text-foreground">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            Member since {formatDate(user?.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
