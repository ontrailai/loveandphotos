import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase, db } from '@lib/supabase'
import PhotoUploader from '@components/talent/PhotoUploader'
import ProfilePictureUpload from '@components/talent/ProfilePictureUpload'
import { Award, TrendingUp, Star, CheckCircle, AlertCircle, Trash2, AlertTriangle, ShieldAlert, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { isProfileComplete, validateVisibilityToggle, getProfileCompletenessMessage } from '@utils/profileCompleteness'

const styleOptions = [
  'Candid',
  'Posed',
  'Editorial',
  'Moody',
  'Bright & Airy',
  'Documentary',
  'Fine Art',
  'Lifestyle',
  'Vintage',
  'Modern'
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const ProfilePage = () => {
  const { user, profile, photographerProfile, fetchUserData } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    experience_years: 0,
    gender: '',
    style_tags: [],
    is_public: true, // Profile visibility toggle
    portfolio_images: [],
    address_line1: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    available_dates: [],
    visible_in_search: false
  })
  const [stats, setStats] = useState({
    acceptance_rate: 87,
    avg_rating: 4.9,
    total_bookings: 0,
    response_time_hours: 2
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const autoSaveTimeoutRef = useRef(null)
  const photoSectionRef = useRef(null)

  // Helper function to validate bio meets minimum requirements (500 chars OR 100 words)
  const isBioValid = (bio) => {
    if (!bio) return false
    const charCount = bio.length
    const wordCount = bio.trim().split(/\s+/).filter(w => w.length > 0).length
    return charCount >= 500 || wordCount >= 100
  }

  useEffect(() => {
    loadProfileData()
  }, [photographerProfile?.id]) // Only depend on ID to prevent infinite loop from object recreation

  // Redirect if not a photographer
  useEffect(() => {
    if (!photographerProfile && !loading && user) {
      toast.error('You must be a photographer to access this page')
      navigate('/dashboard')
    }
  }, [photographerProfile, loading, user, navigate])

  const loadProfileData = async () => {
    console.log('[ProfilePage] loadProfileData called, photographerProfile:', photographerProfile)

    if (!photographerProfile) {
      console.log('[ProfilePage] No photographerProfile available yet')
      setLoading(false)
      return
    }

    try {
      console.log('[ProfilePage] Setting form data from photographerProfile:', {
        bio: photographerProfile.bio?.length || 0,
        experience_years: photographerProfile.experience_years,
        gender: photographerProfile.gender,
        style_tags: photographerProfile.style_tags?.length || 0,
        portfolio_images: photographerProfile.portfolio_images?.length || 0
      })

      setFormData({
        bio: photographerProfile.bio || '',
        experience_years: photographerProfile.experience_years || 0,
        gender: photographerProfile.gender || '',
        style_tags: photographerProfile.style_tags || [],
        is_public: photographerProfile.is_public !== undefined ? photographerProfile.is_public : true,
        portfolio_images: photographerProfile.portfolio_images || [],
        available_dates: photographerProfile.available_dates || [],
        visible_in_search: photographerProfile.visible_in_search || false,
        address_line1: photographerProfile.address_line1 || '',
        city: photographerProfile.city || '',
        state: photographerProfile.state || '',
        zip_code: photographerProfile.zip_code || '',
        country: photographerProfile.country || 'USA'
      })

      // Load real stats
      setStats({
        acceptance_rate: 87, // Mock for now
        avg_rating: photographerProfile.average_rating || 4.9,
        total_bookings: photographerProfile.completed_jobs_count || 0,
        response_time_hours: photographerProfile.response_time_hours || 2
      })

      // Auto-scroll to photo section if profile incomplete and from overview
      const from = searchParams.get('from')
      if (from === 'overview' && !photographerProfile.portfolio_images?.length) {
        setTimeout(() => {
          photoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      }

      console.log('[ProfilePage] ✅ Form data loaded successfully')
    } catch (error) {
      console.error('[ProfilePage] ❌ Error loading profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate profile completeness using useMemo to prevent infinite loops
  const profileCompletenessValue = useMemo(() => {
    if (!user || !formData) return null
    const completeness = isProfileComplete(formData, user)
    console.log('[ProfilePage] Profile completeness:', completeness)
    return completeness
  }, [
    formData.bio,
    formData.gender,
    formData.experience_years,
    JSON.stringify(formData.style_tags),
    JSON.stringify(formData.portfolio_images),
    formData.zip_code,
    formData.city,
    formData.state,
    user?.id
  ])

  const autoSaveProfile = async (updates) => {
    if (!user) {
      console.warn('[ProfilePage] Auto-save skipped: No user logged in')
      return
    }

    // Prevent concurrent auto-saves
    if (autoSaving) {
      console.warn('[ProfilePage] Auto-save skipped: Already saving')
      return
    }

    const startTime = performance.now()
    setAutoSaving(true)

    try {
      // Validate and sanitize update data
      const sanitizedUpdates = {}
      for (const [key, value] of Object.entries(updates)) {
        // Handle arrays
        if (key === 'style_tags' || key === 'portfolio_images') {
          sanitizedUpdates[key] = Array.isArray(value) ? value : []
        }
        // Handle booleans
        else if (key === 'is_public') {
          sanitizedUpdates[key] = Boolean(value)
        }
        // Handle numbers
        else if (key === 'experience_years') {
          sanitizedUpdates[key] = value ? parseInt(value) : 0
        }
        // Handle strings
        else {
          sanitizedUpdates[key] = value || null
        }
      }

      // Calculate if profile will be complete after this update
      const updatedFormData = { ...formData, ...updates }
      const willBeComplete =
        isBioValid(updatedFormData.bio) &&
        updatedFormData.gender?.length > 0 &&
        updatedFormData.experience_years > 0 &&
        Array.isArray(updatedFormData.style_tags) && updatedFormData.style_tags.length > 0 &&
        Array.isArray(updatedFormData.portfolio_images) && updatedFormData.portfolio_images.length >= 10 &&
        updatedFormData.zip_code?.length === 5 &&
        updatedFormData.city?.length > 0 &&
        updatedFormData.state?.length > 0

      sanitizedUpdates.profile_complete = willBeComplete

      // Note: visible_in_search is a generated column (= is_public), cannot be set manually

      console.log('[ProfilePage] Auto-saving:', Object.keys(sanitizedUpdates))

      // Update photographers table
      const { error } = await supabase
        .from('photographers')
        .upsert({
          user_id: user.id,
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('[ProfilePage] ❌ Auto-save Supabase error:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }

      // CRITICAL: Also sync to photographer_preview_profiles for search visibility
      const previewUpdates = {}
      if (sanitizedUpdates.bio) previewUpdates.bio = sanitizedUpdates.bio
      if (sanitizedUpdates.style_tags) previewUpdates.specialties = sanitizedUpdates.style_tags
      if (sanitizedUpdates.portfolio_images) previewUpdates.portfolio_images = sanitizedUpdates.portfolio_images
      if (sanitizedUpdates.city) previewUpdates.location_city = sanitizedUpdates.city
      if (sanitizedUpdates.state) previewUpdates.location_state = sanitizedUpdates.state
      if (sanitizedUpdates.zip_code) previewUpdates.location_zip = sanitizedUpdates.zip_code
      if (sanitizedUpdates.experience_years) previewUpdates.years_experience = sanitizedUpdates.experience_years
      if (sanitizedUpdates.is_public !== undefined) previewUpdates.is_available = sanitizedUpdates.is_public

      // Only sync if we have updates for the preview table
      if (Object.keys(previewUpdates).length > 0) {
        try {
          // Add 5-second timeout to prevent infinite hang
          const syncWithTimeout = Promise.race([
            supabase
              .from('photographer_preview_profiles')
              .update({
                ...previewUpdates,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Preview sync timeout after 5s')), 5000)
            )
          ])

          const { error: previewError } = await syncWithTimeout

          if (previewError) {
            console.warn('[ProfilePage] ⚠️ Preview profile sync error:', previewError)
            // Don't throw - photographers table is primary source of truth
          } else {
            console.log('[ProfilePage] ✅ Synced to preview profile:', Object.keys(previewUpdates))
          }
        } catch (syncError) {
          console.error('[ProfilePage] ❌ Preview sync failed (non-fatal):', syncError.message)
          // Continue - don't block profile save for preview sync failure
        }
      }

      const endTime = performance.now()
      console.log(`[ProfilePage] ✅ Auto-save completed in ${(endTime - startTime).toFixed(2)}ms`)

      // Show completion toast if profile just became complete
      const wasComplete = profileCompletenessValue?.isComplete || false
      if (willBeComplete && !wasComplete) {
        toast.success('🎉 Profile Complete! You can now receive bookings.', { duration: 5000, icon: '✅' })
      }
    } catch (error) {
      console.error('[ProfilePage] ❌ Auto-save error:', error)
      // Only show error toast if it's not a "profile not found" issue
      if (error.message !== 'Profile not found') {
        toast.error('Failed to auto-save changes. Please try manually saving.')
      }
    } finally {
      setAutoSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Auto-save with debounce
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const updates = { [name]: name === 'experience_years' ? parseInt(newValue) : newValue }
      autoSaveProfile(updates)
    }, 1000)
  }

  const handleStyleTagToggle = (tag) => {
    const newStyleTags = formData.style_tags.includes(tag)
      ? formData.style_tags.filter(t => t !== tag)
      : [...formData.style_tags, tag]

    setFormData(prev => ({
      ...prev,
      style_tags: newStyleTags
    }))

    // Auto-save immediately for tag toggles
    autoSaveProfile({ style_tags: newStyleTags })
  }

  const handlePhotosChange = (newPhotos) => {
    setFormData(prev => ({
      ...prev,
      portfolio_images: newPhotos
    }))

    // Auto-save photos immediately
    autoSaveProfile({ portfolio_images: newPhotos })
  }

  const handleVisibilityToggle = () => {
    const newValue = !formData.is_public

    // If trying to make public, validate completeness
    if (newValue === true) {
      const validation = validateVisibilityToggle(formData, user)
      if (!validation.canToggle) {
        toast.error(validation.error, {
          duration: 5000,
          icon: '⚠️'
        })
        // Show what's missing in detail
        if (validation.missingFields.length > 0) {
          setTimeout(() => {
            toast.error(`Missing: ${validation.missingFields.join(', ')}`, {
              duration: 7000
            })
          }, 200)
        }
        return // Prevent toggle
      }
    }

    console.log('[ProfilePage] 👁️ Visibility toggle:', newValue ? 'Public' : 'Private')

    setFormData(prev => ({
      ...prev,
      is_public: newValue
    }))

    // Auto-save visibility immediately with toast confirmation
    autoSaveProfile({ is_public: newValue }).then(() => {
      toast.success(
        newValue
          ? '✅ Profile is now Public - visible in search results'
          : '🔒 Profile is now Private - hidden from search results',
        { duration: 3000 }
      )
    })
  }

  const validateZipCode = (zip) => {
    return /^\d{5}$/.test(zip)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate ZIP code if provided
    if (formData.zip_code && !validateZipCode(formData.zip_code)) {
      toast.error('ZIP code must be 5 digits')
      return
    }

    const startTime = performance.now()
    const savingToast = toast.loading('Saving profile...')
    setSaving(true)

    try {
      // Calculate if profile is complete (including location requirements)
      const isComplete =
        isBioValid(formData.bio) &&
        formData.gender?.length > 0 &&
        formData.experience_years > 0 &&
        Array.isArray(formData.style_tags) && formData.style_tags.length > 0 &&
        Array.isArray(formData.portfolio_images) && formData.portfolio_images.length >= 10 &&
        formData.zip_code?.length === 5 &&
        formData.city?.length > 0 &&
        formData.state?.length > 0

      // Prepare update data with type validation
      const updateData = {
        bio: formData.bio || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : 0,
        gender: formData.gender || null,
        style_tags: Array.isArray(formData.style_tags) ? formData.style_tags : [],
        portfolio_images: Array.isArray(formData.portfolio_images) ? formData.portfolio_images : [],
        address_line1: formData.address_line1 || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country || 'USA',
        profile_complete: isComplete,
        // Note: visible_in_search is a generated column (= is_public), cannot be set manually
        updated_at: new Date().toISOString()
      }

      console.log('[ProfilePage] Saving profile changes')
      console.log('[ProfilePage] Update data:', {
        ...updateData,
        portfolio_images: `Array(${updateData.portfolio_images.length})`,
        style_tags: updateData.style_tags,
        profile_complete: isComplete
      })

      const { error } = await supabase
        .from('photographers')
        .upsert({
          user_id: user.id,
          ...updateData
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })

      if (error) {
        console.error('[ProfilePage] ❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      const endTime = performance.now()
      console.log(`[ProfilePage] ✅ Profile saved successfully in ${(endTime - startTime).toFixed(2)}ms`)

      // Refresh AuthContext to load updated photographer profile
      console.log('[ProfilePage] 🔄 Refreshing user data after save...')
      if (user) {
        try {
          // Add timeout to prevent infinite loading if fetchUserData hangs
          const fetchPromise = fetchUserData(user)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('fetchUserData timeout')), 8000)
          )

          await Promise.race([fetchPromise, timeoutPromise])
          console.log('[ProfilePage] ✅ User data refreshed successfully')
        } catch (fetchError) {
          // Don't block the save success if refresh fails
          console.warn('[ProfilePage] ⚠️ Failed to refresh user data, but save was successful:', fetchError.message)
        }
      }

      // Show appropriate success message
      if (isComplete && !profileIsComplete) {
        toast.success('🎉 Profile Complete! You can now receive bookings.', { id: savingToast, duration: 5000, icon: '✅' })
      } else {
        toast.success('Profile updated successfully', { id: savingToast })
      }
    } catch (error) {
      console.error('[ProfilePage] ❌ Error updating profile:', error)

      // Provide user-friendly error messages
      let errorMessage = 'Failed to update profile'

      if (error.message === 'Profile not found. Please contact support.') {
        errorMessage = error.message
      } else if (error.code === '23505') {
        errorMessage = 'Duplicate entry detected. Please check your data.'
      } else if (error.code === '23503') {
        errorMessage = 'Invalid reference. Please refresh and try again.'
      } else if (error.code === '42501') {
        errorMessage = 'Permission denied. Please log out and log back in.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }

      toast.error(errorMessage, { id: savingToast, duration: 5000 })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUploadSuccess = async (avatarUrl) => {
    console.log('[ProfilePage] Avatar upload successful:', avatarUrl)
    // Refresh user data to get updated avatar_url
    if (user) {
      await fetchUserData(user)
    }
  }

  const handleDeleteProfile = async () => {
    if (!user?.id) {
      toast.error('User not found')
      return
    }

    setDeleting(true)
    const deletingToast = toast.loading('Deleting your profile...')

    try {
      const result = await db.photographers.deleteProfile(user.id)

      if (result.success) {
        toast.success(result.message, { id: deletingToast })

        // Sign out and redirect to homepage
        setTimeout(() => {
          navigate('/')
          window.location.reload() // Force full reload to clear all state
        }, 1500)
      } else {
        toast.error(result.message, { id: deletingToast, duration: 5000 })
        setShowDeleteConfirm(false)
        setDeleting(false)
      }
    } catch (error) {
      console.error('[ProfilePage] Delete profile error:', error)
      toast.error('Failed to delete profile. Please try again.', { id: deletingToast })
      setShowDeleteConfirm(false)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    )
  }

  // Calculate profile completion with detailed field tracking (includes location)
  const profileCompletion = {
    bio: isBioValid(formData.bio),
    gender: formData.gender?.length > 0,
    experience_years: formData.experience_years > 0,
    style_tags: Array.isArray(formData.style_tags) && formData.style_tags.length > 0,
    portfolio_images: Array.isArray(formData.portfolio_images) && formData.portfolio_images.length >= 10,
    location: formData.zip_code?.length === 5 && formData.city?.length > 0 && formData.state?.length > 0
  }

  const completedFields = Object.values(profileCompletion).filter(Boolean).length
  const totalFields = Object.keys(profileCompletion).length
  const completionPercentage = Math.round((completedFields / totalFields) * 100)
  const profileIsComplete = completedFields === totalFields
  const isProfileIncomplete = !profileIsComplete

  return (
    <div className="space-y-6">
      {/* Header with Auto-Save Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your photographer profile and showcase your work
          </p>
        </div>
        {autoSaving && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600 mr-2" />
            Saving...
          </div>
        )}
      </div>

      {/* Dynamic Profile Completion Tracker */}
      {!profileIsComplete && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-sm" role="alert" aria-live="polite">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                Complete Your Profile ({completedFields}/{totalFields} complete)
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                A complete profile helps clients find and book you. Fill in all sections below to start receiving bookings.
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-yellow-200 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 h-3 rounded-full transition-all duration-500 ease-in-out shadow-sm"
                  style={{ width: `${completionPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={completionPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Profile completion: ${completionPercentage}%`}
                />
              </div>

              {/* Detailed Checklist */}
              <ul className="space-y-2 text-sm">
                <li className={`flex items-start ${profileCompletion.bio ? 'text-green-700' : 'text-yellow-800'}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">
                    {profileCompletion.bio ? '✅' : '⬜'}
                  </span>
                  <span>
                    {profileCompletion.bio
                      ? `Bio complete (${formData.bio?.length} characters, ${formData.bio?.trim().split(/\s+/).filter(w => w.length > 0).length} words)`
                      : `Write a bio (at least 500 characters OR 100 words${formData.bio?.length ? `, currently ${formData.bio.length} characters, ${formData.bio.trim().split(/\s+/).filter(w => w.length > 0).length} words` : ''})`
                    }
                  </span>
                </li>

                <li className={`flex items-start ${profileCompletion.gender ? 'text-green-700' : 'text-yellow-800'}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">
                    {profileCompletion.gender ? '✅' : '⬜'}
                  </span>
                  <span>
                    {profileCompletion.gender ? 'Gender selected' : 'Select your gender'}
                  </span>
                </li>

                <li className={`flex items-start ${profileCompletion.experience_years ? 'text-green-700' : 'text-yellow-800'}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">
                    {profileCompletion.experience_years ? '✅' : '⬜'}
                  </span>
                  <span>
                    {profileCompletion.experience_years
                      ? `Experience: ${formData.experience_years} years`
                      : 'Enter years of experience (must be > 0)'
                    }
                  </span>
                </li>

                <li className={`flex items-start ${profileCompletion.style_tags ? 'text-green-700' : 'text-yellow-800'}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">
                    {profileCompletion.style_tags ? '✅' : '⬜'}
                  </span>
                  <span>
                    {profileCompletion.style_tags
                      ? `${formData.style_tags?.length} photography style${formData.style_tags?.length !== 1 ? 's' : ''} selected`
                      : 'Choose at least one photography style'
                    }
                  </span>
                </li>

                <li className={`flex items-start ${profileCompletion.portfolio_images ? 'text-green-700' : 'text-yellow-800'}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">
                    {profileCompletion.portfolio_images ? '✅' : '⬜'}
                  </span>
                  <span>
                    {profileCompletion.portfolio_images
                      ? `${formData.portfolio_images?.length} portfolio photos uploaded`
                      : `Upload at least 10 portfolio photos${formData.portfolio_images?.length ? ` (currently ${formData.portfolio_images.length})` : ''}`
                    }
                  </span>
                </li>

                <li className={`flex items-start ${profileCompletion.location ? 'text-green-700' : 'text-yellow-800'}`}>
                  <span className="mr-2 mt-0.5 flex-shrink-0">
                    {profileCompletion.location ? '✅' : '⬜'}
                  </span>
                  <span>
                    {profileCompletion.location
                      ? `Location: ${formData.city}, ${formData.state} ${formData.zip_code}`
                      : 'Complete location (city, state, ZIP code required for search)'
                    }
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Performance Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-600" aria-hidden="true" />
          Performance Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.acceptance_rate}%</div>
            <div className="text-xs text-gray-600 mt-1">Acceptance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 flex items-center justify-center">
              <Star className="w-5 h-5 mr-1 fill-current" aria-hidden="true" />
              {stats.avg_rating}
            </div>
            <div className="text-xs text-gray-600 mt-1">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total_bookings}</div>
            <div className="text-xs text-gray-600 mt-1">Total Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.response_time_hours}h</div>
            <div className="text-xs text-gray-600 mt-1">Avg Response Time</div>
          </div>
        </div>
      </div>

      {/* LnP Choice Badge */}
      {photographerProfile?.lnp_choice && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center">
            <Award className="w-6 h-6 text-primary-600 mr-3" aria-hidden="true" />
            <div>
              <div className="font-semibold text-primary-900">LnP Choice</div>
              <div className="text-sm text-primary-700">
                You're recognized as a top-tier photographer on our platform
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>

          {/* Profile Visibility Toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${formData.is_public ? 'text-green-700' : 'text-gray-500'}`}>
              {formData.is_public ? 'Public' : 'Private'}
            </span>
            <button
              type="button"
              onClick={handleVisibilityToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                formData.is_public ? 'bg-green-600' : 'bg-gray-300'
              }`}
              aria-label={formData.is_public ? 'Profile is public' : 'Profile is private'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_public ? 'translate-x-6' : 'translate-x-1'
                }`}
              >
                {formData.is_public ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Profile Completeness Indicator */}
        {profileCompletenessValue && !profileCompletenessValue.isComplete && (
          <div className="p-4 rounded-md bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 mb-2">
                  Complete your profile to appear in search ({profileCompletenessValue.completionPercentage}% complete)
                </p>
                <div className="space-y-1 text-sm text-amber-800">
                  <p className="font-medium">Missing requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    {profileCompletenessValue.missingFields.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Visibility Explanation */}
        <div className={`p-3 rounded-md text-sm ${
          formData.visible_in_search
            ? 'bg-green-50 border border-green-200'
            : formData.is_public
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          {formData.visible_in_search ? (
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">✅ Visible in Client Search</p>
                <p className="text-green-700 mt-1">
                  Your profile is public and you have availability set. Clients can find you when searching for photographers.
                </p>
              </div>
            </div>
          ) : formData.is_public ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">⚠️ Not Visible in Search</p>
                <p className="text-amber-700 mt-1">
                  Your profile is public, but you need to set your availability to appear in client searches.{' '}
                  <a href="/talent/dashboard/availability" className="underline font-medium">
                    Set availability now →
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <EyeOff className="w-4 h-4 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Your profile is hidden from clients</p>
                <p className="text-gray-700 mt-1">Your profile will not appear in search results. You cannot receive new bookings while private.</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Picture Upload */}
        {user && (
          <div className="border-t pt-6 mt-6">
            <ProfilePictureUpload
              userId={user.id}
              currentAvatarUrl={profile?.avatar_url}
              onUploadSuccess={handleAvatarUploadSuccess}
            />
          </div>
        )}

        {/* Portfolio Photos */}
        <div ref={photoSectionRef}>
          <PhotoUploader
            userId={user.id}
            existingPhotos={formData.portfolio_images}
            onPhotosChange={handlePhotosChange}
            maxPhotos={50}
            minPhotos={10}
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            About / Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={6}
            value={formData.bio}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              formData.bio && (formData.bio.length >= 500 || formData.bio.trim().split(/\s+/).filter(w => w.length > 0).length >= 100)
                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                : formData.bio && formData.bio.length > 0
                ? 'border-amber-300 focus:ring-amber-500 focus:border-amber-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }`}
            placeholder="Tell clients about yourself, your photography style, and what makes you unique..."
            aria-describedby="bio-description bio-validation"
          />

          {/* Character and Word Count */}
          <div className="mt-2 flex items-center justify-between text-sm">
            <div className="flex gap-4">
              <span className={`${
                formData.bio?.length >= 500 ? 'text-green-600 font-medium' : 'text-gray-600'
              }`}>
                {formData.bio?.length || 0} / 500 characters
              </span>
              <span className={`${
                formData.bio?.trim().split(/\s+/).filter(w => w.length > 0).length >= 100 ? 'text-green-600 font-medium' : 'text-gray-600'
              }`}>
                {formData.bio?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} / 100 words
              </span>
            </div>
            {formData.bio && (formData.bio.length >= 500 || formData.bio.trim().split(/\s+/).filter(w => w.length > 0).length >= 100) && (
              <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Requirement met
              </span>
            )}
          </div>

          {/* Validation Message */}
          {formData.bio && formData.bio.length > 0 && formData.bio.length < 500 && formData.bio.trim().split(/\s+/).filter(w => w.length > 0).length < 100 && (
            <p id="bio-validation" className="mt-1 text-sm text-amber-600 flex items-start gap-1">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Your bio must be at least 500 characters OR 100 words to complete your profile.</span>
            </p>
          )}

          <p id="bio-description" className="mt-1 text-xs text-gray-500">
            This will be shown on your public profile
          </p>
        </div>

        {/* Experience */}
        <div>
          <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            id="experience_years"
            name="experience_years"
            min="0"
            max="50"
            value={formData.experience_years}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            aria-label="Years of experience"
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            aria-label="Select gender"
          >
            <option value="">Select...</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        {/* Location Section */}
        <div className="col-span-2 border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
          <p className="text-sm text-gray-600 mb-6">
            Your location helps clients find photographers in their area. ZIP code is used for accurate matching.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-2">
                📍 Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                value={formData.address_line1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="123 Main Street"
                aria-label="Address line 1"
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                🏙 City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="New York"
                aria-label="City"
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                🌎 State <span className="text-red-500">*</span>
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                aria-label="Select state"
              >
                <option value="">Select State...</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* ZIP Code */}
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                🧾 ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                maxLength="5"
                pattern="\d{5}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="10001"
                aria-label="ZIP code"
              />
              <p className="mt-1 text-xs text-gray-500">5-digit US ZIP code</p>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                📌 Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="USA"
                aria-label="Country"
              />
            </div>
          </div>
        </div>

        {/* Style Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photography Style Tags
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {styleOptions.map(style => (
              <button
                key={style}
                type="button"
                onClick={() => handleStyleTagToggle(style)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  formData.style_tags.includes(style)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={formData.style_tags.includes(style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Danger Zone - Delete Profile */}
        <div className="mt-12 pt-8 border-t-2 border-red-200">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ShieldAlert className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Permanently delete your photographer profile. This action cannot be undone. All your profile data, portfolio images, and availability will be permanently removed.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-4 py-2 border-2 border-red-600 text-sm font-semibold rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Delete My Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Delete Your Profile?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Are you sure you want to permanently delete your photographer profile? This action cannot be undone.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Warning:</strong> This will delete:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc space-y-1">
                    <li>Your profile information</li>
                    <li>All portfolio images</li>
                    <li>Your availability calendar</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete My Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage