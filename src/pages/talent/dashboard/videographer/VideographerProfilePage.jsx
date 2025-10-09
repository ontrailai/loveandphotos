/**
 * 🎥 Videographer Profile Dashboard
 * Clean, modern UI consistent with Love & Photos design system
 * Gear-focused profile management for videographers
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { supabase, db } from '@lib/supabase'
import ProfilePictureUpload from '@components/talent/ProfilePictureUpload'
import MultiSelect from '@components/ui/MultiSelect'
import Card from '@components/ui/Card'
import {
  Video, Camera, Mic, Sun,
  CheckCircle, AlertCircle, Film,
  Settings, Save, MapPin, Globe, User, Briefcase, ArrowLeft, Home
} from 'lucide-react'
import toast from 'react-hot-toast'

const styleOptions = [
  'Cinematic',
  'Documentary Style',
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

const DEFAULT_LANGUAGES = [
  'English', 'Spanish', 'French', 'Mandarin', 'Cantonese',
  'Vietnamese', 'Hindi', 'Korean', 'Tagalog', 'Japanese',
  'Arabic', 'Portuguese', 'Russian', 'German'
]

const VideographerProfilePage = () => {
  const { user, profile, photographerProfile, fetchUserData } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    experience_years: 0,
    gender: '',
    style_tags: [],
    is_public: true,
    gear_list: [],
    city: '',
    state: '',
    zip_code: '',
    languages: []
  })
  const autoSaveTimeoutRef = useRef(null)
  const photographerIdRef = useRef(null)

  // Gear checklist with professional icons
  const GEAR_OPTIONS = [
    { id: 'camera', label: 'Professional Camera', icon: Video, description: 'DSLR, Mirrorless, or Cinema Camera' },
    { id: 'lenses', label: 'Quality Lenses', icon: Camera, description: 'Wide, Standard & Telephoto' },
    { id: 'tripod', label: 'Tripod', icon: Settings, description: 'Sturdy video tripod or fluid head' },
    { id: 'gimbal', label: 'Gimbal/Stabilizer', icon: Film, description: 'For smooth motion shots' },
    { id: 'audio', label: 'Audio Equipment', icon: Mic, description: 'Microphones & recording gear' },
    { id: 'lighting', label: 'Lighting Kit', icon: Sun, description: 'Professional lighting setup' }
  ]

  // Validate bio (500 chars or 100 words)
  const isBioValid = (bio) => {
    if (!bio) return false
    const charCount = bio.length
    const wordCount = bio.trim().split(/\s+/).filter(w => w.length > 0).length
    return charCount >= 500 || wordCount >= 100
  }

  // Calculate profile completeness (videographers do NOT need portfolio images)
  const profileCompleteness = useMemo(() => {
    const gearList = Array.isArray(formData.gear_list) ? formData.gear_list : []

    const requirements = [
      { label: 'Profile Photo', met: !!profile?.avatar_url },
      { label: 'Bio (500+ chars)', met: isBioValid(formData.bio) },
      { label: 'Gender', met: formData.gender?.length > 0 },
      { label: 'Experience Years', met: formData.experience_years > 0 },
      { label: 'Video Styles', met: formData.style_tags?.length > 0 },
      { label: 'Gear Setup (1+ items)', met: gearList.length >= 1 },
      { label: 'Location (City/State/ZIP)', met: formData.city && formData.state && formData.zip_code?.length === 5 },
      { label: 'Languages', met: formData.languages?.length > 0 }
    ]

    const metCount = requirements.filter(r => r.met).length
    const percentage = Math.round((metCount / requirements.length) * 100)
    const isComplete = metCount === requirements.length

    return { isComplete, percentage, requirements, metCount, totalCount: requirements.length }
  }, [formData, profile?.avatar_url])

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id || !photographerProfile) return

      try {
        setLoading(true)
        photographerIdRef.current = photographerProfile.id

        // Transform gear boolean fields to array
        const gearList = []
        if (photographerProfile.gear_has_camera) gearList.push('camera')
        if (photographerProfile.gear_has_lenses) gearList.push('lenses')
        if (photographerProfile.gear_has_tripod) gearList.push('tripod')
        if (photographerProfile.gear_has_gimbal) gearList.push('gimbal')
        if (photographerProfile.gear_has_audio_recorder) gearList.push('audio')
        if (photographerProfile.gear_has_lighting) gearList.push('lighting')

        setFormData({
          bio: photographerProfile.bio || '',
          experience_years: photographerProfile.experience_years || 0,
          gender: photographerProfile.gender || '',
          style_tags: photographerProfile.style_tags || [],
          is_public: photographerProfile.is_public !== false,
          gear_list: gearList,
          city: photographerProfile.city || '',
          state: photographerProfile.state || '',
          zip_code: photographerProfile.zip_code || '',
          languages: photographerProfile.languages || []
        })
      } catch (error) {
        console.error('[VideographerProfile] Error loading:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user?.id, photographerProfile])

  // Auto-save handler
  const autoSaveProfile = useCallback(async (updates) => {
    if (!photographerIdRef.current) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setAutoSaving(true)

        // Convert gear_list to individual boolean fields
        const gearUpdates = updates.gear_list ? {
          gear_has_camera: updates.gear_list.includes('camera'),
          gear_has_lenses: updates.gear_list.includes('lenses'),
          gear_has_tripod: updates.gear_list.includes('tripod'),
          gear_has_gimbal: updates.gear_list.includes('gimbal'),
          gear_has_audio_recorder: updates.gear_list.includes('audio'),
          gear_has_lighting: updates.gear_list.includes('lighting')
        } : {}

        const { gear_list, ...otherUpdates } = updates
        const finalUpdates = { ...otherUpdates, ...gearUpdates }

        const { error } = await supabase
          .from('photographers')
          .update(finalUpdates)
          .eq('id', photographerIdRef.current)

        if (error) throw error

        await fetchUserData()
      } catch (error) {
        console.error('[VideographerProfile] Auto-save failed:', error)
      } finally {
        setAutoSaving(false)
      }
    }, 1000)
  }, [fetchUserData])

  // Handle gear toggle
  const handleGearToggle = (gearId) => {
    const newGearList = formData.gear_list.includes(gearId)
      ? formData.gear_list.filter(g => g !== gearId)
      : [...formData.gear_list, gearId]

    setFormData(prev => ({ ...prev, gear_list: newGearList }))
    autoSaveProfile({ gear_list: newGearList })
  }

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    autoSaveProfile({ [field]: value })
  }

  // Manual save profile function
  const saveProfile = async () => {
    if (!photographerIdRef.current) {
      toast.error('Unable to save profile')
      return
    }

    try {
      // Convert gear_list to individual boolean fields
      const gearUpdates = {
        gear_has_camera: formData.gear_list.includes('camera'),
        gear_has_lenses: formData.gear_list.includes('lenses'),
        gear_has_tripod: formData.gear_list.includes('tripod'),
        gear_has_gimbal: formData.gear_list.includes('gimbal'),
        gear_has_audio_recorder: formData.gear_list.includes('audio'),
        gear_has_lighting: formData.gear_list.includes('lighting')
      }

      const updates = {
        bio: formData.bio,
        experience_years: formData.experience_years,
        gender: formData.gender,
        style_tags: formData.style_tags,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        languages: formData.languages,
        ...gearUpdates,
        // Automatically update profile_complete and is_public when complete
        // visible_in_search is auto-generated from is_public
        profile_complete: profileCompleteness.isComplete,
        is_public: profileCompleteness.isComplete
      }

      const { error } = await supabase
        .from('photographers')
        .update(updates)
        .eq('id', photographerIdRef.current)

      if (error) throw error

      await fetchUserData(user)
      toast.success('Profile saved successfully!')
    } catch (error) {
      console.error('[VideographerProfile] Save failed:', error)
      toast.error('Failed to save profile')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-12 h-12 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600">Loading your videographer profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back to Home button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            {/* Center: Title */}
            <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <Film className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Videographer Profile</h1>
            </div>

            {/* Right: Save status or Save button */}
            <div className="flex items-center space-x-2">
              {autoSaving ? (
                <div className="flex items-center space-x-2 text-primary-600 px-3 py-2">
                  <Save className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium">Saving...</span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setSaving(true)
                    await saveProfile()
                    setSaving(false)
                  }}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completion Banner */}
        {!profileCompleteness.isComplete && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {profileCompleteness.percentage}%
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Complete Your Profile to Start Receiving Bookings
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  You've completed {profileCompleteness.metCount} of {profileCompleteness.totalCount} required steps.
                  Once your profile is 100% complete, it will automatically be visible to clients.
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompleteness.percentage}%` }}
                  />
                </div>

                {/* Requirements Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profileCompleteness.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm">
                      {req.met ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={req.met ? 'text-gray-700' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Success Banner */}
        {profileCompleteness.isComplete && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  ✅ Profile Complete - Ready to Accept Bookings!
                </h3>
                <p className="text-gray-600 text-sm">
                  Your profile is now visible to clients. You'll start receiving booking requests soon!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Photo & Basic Info */}
            <Card>
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <ProfilePictureUpload
                    userId={user?.id}
                    currentAvatarUrl={profile?.avatar_url}
                    onUploadSuccess={async () => {
                      // Refresh profile data to update completion tracker
                      await fetchUserData(user)
                    }}
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    Upload a professional headshot to help clients connect with you
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="e.g., 5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* 🎥 Gear Checklist - Modern Card Design */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-700" />
                  <h2 className="text-xl font-semibold text-gray-900">Your Video Gear</h2>
                </div>
                <div className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                  {formData.gear_list.length} selected
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Select at least 1 gear item to complete your profile. This helps clients understand your capabilities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GEAR_OPTIONS.map((gear) => {
                  const Icon = gear.icon
                  const isSelected = formData.gear_list.includes(gear.id)

                  return (
                    <button
                      key={gear.id}
                      onClick={() => handleGearToggle(gear.id)}
                      className={`
                        relative flex items-start space-x-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected
                          ? 'bg-primary-50 border-primary-500 shadow-lg shadow-primary-100'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {gear.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          {gear.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 absolute top-4 right-4" />
                      )}
                    </button>
                  )
                })}
              </div>

              {formData.gear_list.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">No gear selected</p>
                      <p className="text-sm text-amber-700">Select at least one item to complete your profile</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* About You - Bio */}
            <Card>
              <div className="flex items-center space-x-3 mb-6">
                <Film className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">About You</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell clients about your videography experience, style, and what makes you unique. Describe your approach to capturing special moments, your creative vision, and why clients should choose you..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-sm ${formData.bio.length >= 500 ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.bio.length} / 500 characters minimum
                  </p>
                  {isBioValid(formData.bio) && (
                    <div className="flex items-center space-x-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Looks great!</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Video Styles */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <Video className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Video Styles</h2>
              </div>
              <MultiSelect
                options={styleOptions}
                value={formData.style_tags || []}
                onChange={(value) => handleChange('style_tags', value)}
                placeholder="Select your specialties..."
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-2">
                Choose the styles you specialize in
              </p>
            </Card>

            {/* Languages */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Languages</h2>
              </div>
              <MultiSelect
                options={DEFAULT_LANGUAGES}
                value={formData.languages || []}
                onChange={(value) => handleChange('languages', value)}
                placeholder="Select languages..."
                className="bg-white border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-2">
                Languages you can communicate in
              </p>
            </Card>

            {/* Location */}
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Location</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="New York"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select...</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => handleChange('zip_code', e.target.value)}
                      placeholder="10001"
                      maxLength={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideographerProfilePage
