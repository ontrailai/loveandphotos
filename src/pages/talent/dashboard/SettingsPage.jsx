import { useState } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import {
  Mail,
  Lock,
  Bell,
  HelpCircle,
  User,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

const SettingsPage = () => {
  const { user, profile, photographerProfile, updateProfile } = useAuth()

  // Email Update State
  const [emailData, setEmailData] = useState({
    newEmail: '',
    loading: false
  })

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    loading: false
  })

  // Notification Preferences State
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: photographerProfile?.email_notifications ?? true,
    bookingAlerts: photographerProfile?.booking_alerts ?? true,
    marketingEmails: photographerProfile?.marketing_emails ?? false,
    loading: false
  })

  // Password Strength Calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 15
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20
    if (/\d/.test(password)) strength += 20
    if (/[^a-zA-Z\d]/.test(password)) strength += 20

    if (strength <= 40) return { strength, label: 'Weak', color: 'bg-red-500' }
    if (strength <= 70) return { strength, label: 'Fair', color: 'bg-yellow-500' }
    if (strength <= 90) return { strength, label: 'Good', color: 'bg-blue-500' }
    return { strength: 100, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  // Email validation
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Handle Email Update
  const handleEmailUpdate = async (e) => {
    e.preventDefault()

    if (!emailData.newEmail) {
      toast.error('Please enter a new email address')
      return
    }

    if (!isValidEmail(emailData.newEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (emailData.newEmail === user.email) {
      toast.error('New email must be different from current email')
      return
    }

    setEmailData(prev => ({ ...prev, loading: true }))

    try {
      console.log('[SettingsPage] Updating email from', user.email, 'to:', emailData.newEmail)

      // Step 1: Update email in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        email: emailData.newEmail
      })

      if (authError) {
        console.error('[SettingsPage] Auth update error:', authError)

        // Handle specific Supabase errors
        if (authError.message?.includes('already registered')) {
          throw new Error('This email is already in use by another account')
        }
        if (authError.message?.includes('Email rate limit exceeded')) {
          throw new Error('Too many email change attempts. Please try again later.')
        }

        throw authError
      }

      console.log('[SettingsPage] Auth email update successful:', authData)

      // Step 2: Update email in users table to keep in sync
      // Note: Supabase sends a confirmation email. The email won't change until confirmed.
      // We update the users table proactively, but auth.users.email is the source of truth
      const { error: dbError } = await supabase
        .from('users')
        .update({
          email: emailData.newEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (dbError) {
        console.error('[SettingsPage] Users table update error:', dbError)
        // Don't throw - auth update was successful, this is just for consistency
        console.warn('[SettingsPage] Email updated in auth but not in users table')
      } else {
        console.log('[SettingsPage] Users table updated successfully')
      }

      // Success! Supabase will send confirmation email to the new address
      toast.success(
        'Email update initiated! Please check your new email address for a confirmation link. Your email will be updated once you confirm.',
        { duration: 6000 }
      )

      setEmailData({ newEmail: '', loading: false })
    } catch (error) {
      console.error('[SettingsPage] Email update error:', error)

      // Provide user-friendly error messages
      const errorMessage = error.message || 'Failed to update email. Please try again.'
      toast.error(errorMessage, { duration: 5000 })

      setEmailData(prev => ({ ...prev, loading: false }))
    }
  }

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setPasswordData(prev => ({ ...prev, loading: true }))

    try {
      console.log('[SettingsPage] Updating password...')

      // Update password using Supabase Auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        console.error('[SettingsPage] Supabase error:', updateError)
        throw updateError
      }

      console.log('[SettingsPage] Password update successful:', data)

      toast.success('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
        loading: false
      })
    } catch (error) {
      console.error('[SettingsPage] Password change error:', error)
      toast.error(error.message || 'Failed to update password')
      setPasswordData(prev => ({ ...prev, loading: false }))
    }
  }

  // Handle Notification Preferences Update
  const handleNotificationUpdate = async () => {
    setNotificationPrefs(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase
        .from('photographers')
        .update({
          email_notifications: notificationPrefs.emailNotifications,
          booking_alerts: notificationPrefs.bookingAlerts,
          marketing_emails: notificationPrefs.marketingEmails,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Notification preferences updated')
      setNotificationPrefs(prev => ({ ...prev, loading: false }))
    } catch (error) {
      console.error('[SettingsPage] Notification update error:', error)
      toast.error('Failed to update notification preferences')
      setNotificationPrefs(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 bg-primary-100 rounded-lg mr-4">
            <User className="w-8 h-8 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your account preferences and security settings
            </p>
          </div>
        </div>
      </div>

      {/* Email Update Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Mail className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Email Address</h2>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Current Email</p>
          <p className="text-base font-medium text-gray-900">{user?.email}</p>
        </div>

        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-2">
              New Email Address
            </label>
            <input
              type="email"
              id="newEmail"
              value={emailData.newEmail}
              onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your.new.email@example.com"
              disabled={emailData.loading}
            />
          </div>

          <button
            type="submit"
            disabled={emailData.loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {emailData.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Email
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              You'll receive a confirmation email at your new address. Your email won't change until you confirm it.
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Lock className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={passwordData.showCurrent ? 'text' : 'password'}
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter current password"
                disabled={passwordData.loading}
              />
              <button
                type="button"
                onClick={() => setPasswordData(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordData.showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={passwordData.showNew ? 'text' : 'password'}
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter new password"
                disabled={passwordData.loading}
              />
              <button
                type="button"
                onClick={() => setPasswordData(prev => ({ ...prev, showNew: !prev.showNew }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordData.showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {passwordData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password Strength</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.label === 'Weak' ? 'text-red-600' :
                    passwordStrength.label === 'Fair' ? 'text-yellow-600' :
                    passwordStrength.label === 'Good' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={passwordData.showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Confirm new password"
                disabled={passwordData.loading}
              />
              <button
                type="button"
                onClick={() => setPasswordData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {passwordData.showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {passwordData.confirmPassword && (
              <div className="mt-2 flex items-center text-sm">
                {passwordData.newPassword === passwordData.confirmPassword ? (
                  <>
                    <Check className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordData.loading}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordData.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Password Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
                <li>Include at least one special character</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Bell className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-xs text-gray-600 mt-1">
                Receive general updates and announcements via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.emailNotifications}
                onChange={(e) => setNotificationPrefs(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="sr-only peer"
                disabled={notificationPrefs.loading}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Booking Alerts</h3>
              <p className="text-xs text-gray-600 mt-1">
                Get notified about new bookings, changes, and cancellations
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.bookingAlerts}
                onChange={(e) => setNotificationPrefs(prev => ({ ...prev, bookingAlerts: e.target.checked }))}
                className="sr-only peer"
                disabled={notificationPrefs.loading}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
              <p className="text-xs text-gray-600 mt-1">
                Receive promotional content, tips, and special offers
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationPrefs.marketingEmails}
                onChange={(e) => setNotificationPrefs(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                className="sr-only peer"
                disabled={notificationPrefs.loading}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        <button
          onClick={handleNotificationUpdate}
          disabled={notificationPrefs.loading}
          className="mt-6 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {notificationPrefs.loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {/* Support Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <HelpCircle className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Need Help?</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Our support team is here to help with any questions or issues you may have.
        </p>

        <a
          href="mailto:support@loveandphotos.com?subject=Support Request from Talent Dashboard"
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Mail className="w-4 h-4 mr-2" />
          Contact Support
        </a>
      </div>
    </div>
  )
}

export default SettingsPage