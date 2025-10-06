import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, db } from '@lib/supabase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [photographerProfile, setPhotographerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const isMountedRef = useRef(true)
  const fetchInProgressRef = useRef(false)

  // Fetch user profile and photographer data if applicable
  const fetchUserData = useCallback(async (user) => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log('[AuthContext] ⏭️  Skipping concurrent fetch - already in progress')
      return null
    }

    fetchInProgressRef.current = true
    // Check if component is still mounted before proceeding
    if (!isMountedRef.current) {
      console.log('[AuthContext] Component unmounted, skipping fetch')
      fetchInProgressRef.current = false
      return null
    }
    try {
      console.log('[AuthContext] Fetching user data for:', user.id)

      // Get user profile with timeout and fallback
      console.log('[AuthContext] 🔍 Fetching user profile...')
      let userProfile = null

      try {
        // Try db.users.getProfile with 15s timeout (increased from 5s to handle slow queries)
        console.log('[AuthContext] 🔍 Starting Promise.race with 15s timeout...')
        const profilePromise = db.users.getProfile(user.id)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 15000)
        )
        userProfile = await Promise.race([profilePromise, timeoutPromise])
        console.log('[AuthContext] ✅ Profile fetched successfully via db.users.getProfile')
      } catch (timeoutError) {
        console.warn('[AuthContext] ⏱️ Profile fetch timed out or failed, trying direct query:', timeoutError.message)

        // Fallback: Direct Supabase query with timeout
        try {
          const fallbackPromise = supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

          const fallbackTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Fallback query timeout')), 10000)
          )

          const { data, error } = await Promise.race([fallbackPromise, fallbackTimeout])

          if (!error && data) {
            userProfile = data
            console.log('[AuthContext] ✅ Fetched profile via fallback query')
          } else if (!data) {
            // Profile doesn't exist in database - this is OK for new users
            console.log('[AuthContext] No existing profile found, will create new one')
            userProfile = null
          } else {
            console.warn('[AuthContext] Fallback query failed:', error)
            userProfile = null
          }
        } catch (fallbackError) {
          console.error('[AuthContext] ❌ Fallback query also timed out:', fallbackError.message)
          // Don't create a new profile on timeout - just use cached data and retry later
          console.warn('[AuthContext] Using cached profile data, will retry on next auth state change')
          return null
        }
      }

      console.log('[AuthContext] User profile:', userProfile)

      // If profile doesn't exist, create it
      if (!userProfile) {
        console.log('[AuthContext] Creating new user profile')

        try {
          // Check if user has an accepted talent application to determine role
          let userRole = user.user_metadata?.role || 'customer'

          try {
            console.log('[AuthContext] Checking for accepted talent application...')
            const { data: talentApp } = await supabase
              .from('talent_applications')
              .select('id, is_accepted')
              .eq('is_accepted', true)
              .or(`user_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle()

            if (talentApp) {
              console.log('[AuthContext] ✅ Found accepted talent application, setting role to photographer')
              userRole = 'photographer'
            } else {
              console.log('[AuthContext] No accepted talent application found, using role:', userRole)
            }
          } catch (appError) {
            console.warn('[AuthContext] Failed to check talent applications:', appError.message)
          }

          // Add timeout to profile creation to prevent infinite hang
          const createPromise = supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              role: userRole,
              full_name: user.user_metadata?.full_name || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select()
            .single()

          const createTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile creation timeout')), 5000)
          )

          const { data, error } = await Promise.race([createPromise, createTimeout])

          if (!error && data) {
            userProfile = data
            console.log('[AuthContext] ✅ Created user profile:', userProfile)
          } else {
            console.error('[AuthContext] ❌ Error creating profile:', error)
          }
        } catch (createError) {
          console.error('[AuthContext] ⏱️ Profile creation timed out or failed:', createError.message)
        }
      } else {
        // Profile exists - check if email needs to be synced from auth.users
        if (userProfile.email !== user.email) {
          console.log('[AuthContext] Email mismatch detected, syncing:', {
            profileEmail: userProfile.email,
            authEmail: user.email
          })

          const { data: updatedProfile, error: syncError } = await supabase
            .from('users')
            .update({
              email: user.email,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

          if (!syncError && updatedProfile) {
            userProfile = updatedProfile
            console.log('[AuthContext] ✅ Email synced successfully to users table')
          } else {
            console.error('[AuthContext] ❌ Failed to sync email:', syncError)
          }
        }
      }

      setProfile(userProfile)

      // If photographer, get photographer profile
      if (userProfile?.role === 'photographer') {
        console.log('[AuthContext] Fetching photographer profile')
        const photographerData = await db.photographers.getProfile(user.id)
        console.log('[AuthContext] Photographer profile:', photographerData)
        setPhotographerProfile(photographerData)
      }

      console.log('[AuthContext] User data fetch complete')
      return userProfile
    } catch (error) {
      console.error('[AuthContext] Error fetching user data:', error)
      // Don't show error toast on initial load
      return null
    } finally {
      // Reset fetch flag to allow future fetches
      fetchInProgressRef.current = false
    }
  }, []) // Empty dependency array since it only uses parameters

  useEffect(() => {
    // Set mounted ref
    isMountedRef.current = true
    let sessionTimeoutId = null
    let authRecoveryHandled = false

    // Check active session with improved Chrome compatibility
    const checkSession = async () => {
      try {
        console.log('[AuthContext] 🔍 Checking session...')
        console.log('[AuthContext] 🔍 localStorage auth token present:', !!localStorage.getItem('sb-ldxscjxoakqrmkgqwwhr-auth-token'))

        // Set a safety timeout to prevent infinite loading (4 seconds)
        sessionTimeoutId = setTimeout(() => {
          if (!authRecoveryHandled) {
            console.warn('[AuthContext] ⚠️ Session recovery timeout (4s), setting loading to false')
            authRecoveryHandled = true
            setLoading(false)
          }
        }, 4000)

        // Use getSession() first - this reads from localStorage synchronously in most cases
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[AuthContext] Session retrieval error:', sessionError)
          authRecoveryHandled = true
          clearTimeout(sessionTimeoutId)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('[AuthContext] ✅ Session found for user:', session.user.id)
          console.log('[AuthContext] 📊 Session expires at:', new Date(session.expires_at * 1000).toLocaleString())

          authRecoveryHandled = true
          clearTimeout(sessionTimeoutId)

          setUser(session.user)
          await fetchUserData(session.user)
          console.log('[AuthContext] ✅ User data fetch completed, profile should be set')
        } else {
          console.log('[AuthContext] ℹ️ No active session from getSession()')

          // Chrome sometimes needs a moment for localStorage to hydrate
          // Wait 100ms and try once more before giving up
          await new Promise(resolve => setTimeout(resolve, 100))

          const { data: { session: retrySession } } = await supabase.auth.getSession()

          if (retrySession?.user) {
            console.log('[AuthContext] ✅ Session found on retry for user:', retrySession.user.id)
            authRecoveryHandled = true
            clearTimeout(sessionTimeoutId)

            setUser(retrySession.user)
            await fetchUserData(retrySession.user)
          } else {
            console.log('[AuthContext] ℹ️ No active session after retry')
            authRecoveryHandled = true
            clearTimeout(sessionTimeoutId)
          }
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Session check error:', error)
        authRecoveryHandled = true
        if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
      } finally {
        if (!authRecoveryHandled) {
          authRecoveryHandled = true
          if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
        }
        console.log('[AuthContext] 🏁 Setting loading to false')
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes - this handles delayed session recovery in Chrome
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] 🔔 Auth state changed:', event, 'session present:', !!session)

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] 🔐 SIGNED_IN event, user:', session.user.id)
          setUser(session.user)
          await fetchUserData(session.user)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] 🚪 SIGNED_OUT event')
          setUser(null)
          setProfile(null)
          setPhotographerProfile(null)
          setLoading(false)
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('[AuthContext] 🔄 USER_UPDATED event')
          setUser(session.user)
          await fetchUserData(session.user)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('[AuthContext] 🔄 TOKEN_REFRESHED event')
          // Token refresh shouldn't change user data, but ensure we have it loaded
          if (!user) {
            setUser(session.user)
            await fetchUserData(session.user)
          }
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('[AuthContext] 🎬 INITIAL_SESSION event (Chrome delayed recovery)')
          // This event fires when Chrome finally recovers the session from storage
          setUser(session.user)
          await fetchUserData(session.user)
          setLoading(false)
        }
      }
    )

    return () => {
      isMountedRef.current = false
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId)
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - checkSession and fetchUserData are stable

  // Sign up function
  const signUp = async (email, password, userData = {}) => {
    try {
      const { role = 'customer', fullName, phone } = userData

      // First create the auth user without any metadata that might cause issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      // Check if user was created successfully
      if (!data?.user) {
        throw new Error('Failed to create user account')
      }

      // If email confirmation is disabled, sign in automatically
      // If identities array exists and has length > 0, user is confirmed
      const isConfirmed = data.user.identities && data.user.identities.length > 0

      // Create or update profile after signup
      if (data?.user) {
        // First, ensure the user record exists in public.users
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            phone,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (upsertError) {
          console.error('Error creating user profile:', upsertError)
        }

        // If photographer or videographer, initialize photographer profile with required fields
        if (role === 'photographer') {
          console.log('[AuthContext] 📸 Creating photographer profile for:', data.user.id)

          // Create record in photographers table
          const { data: photographerData, error: photographerError } = await supabase
            .from('photographers')
            .upsert({
              user_id: data.user.id,
              is_public: true,  // CRITICAL: Must be true to appear in search
              profile_complete: false,  // Will be set to true after profile completion
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
            .select()

          if (photographerError) {
            console.error('[AuthContext] ❌ Error creating photographer profile:', photographerError)
          } else {
            console.log('[AuthContext] ✅ Photographer profile created successfully:', photographerData)
          }

          // CRITICAL: Also create record in photographer_preview_profiles for search visibility
          const { data: previewData, error: previewError } = await supabase
            .from('photographer_preview_profiles')
            .upsert({
              user_id: data.user.id,
              display_name: fullName || 'New Photographer',
              contact_email: email,
              contact_phone: phone || null,
              bio: null,  // Will be filled during profile completion
              specialties: [],  // Will be filled during profile completion
              location_city: 'Unknown',  // Will be updated during profile completion
              location_state: 'Unknown',  // Will be updated during profile completion
              is_available: true,  // CRITICAL: Must be true to appear in search
              is_verified: false,
              portfolio_images: [],  // Will be filled during profile completion
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
            .select()

          if (previewError) {
            console.error('[AuthContext] ❌ Error creating preview profile:', previewError)
          } else {
            console.log('[AuthContext] ✅ Preview profile created successfully:', previewData)
          }
        }
      }

      // If user is confirmed, sign them in automatically
      if (isConfirmed) {
        // Auto sign-in after successful signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) {
          console.warn('Auto sign-in failed:', signInError)
          toast.success('Account created! Please sign in.')
        } else {
          toast.success('Account created and signed in successfully!')
          // Set user state
          if (signInData?.user) {
            setUser(signInData.user)
            await fetchUserData(signInData.user)
          }
        }
      } else {
        toast.success('Please check your email to confirm your account')
      }
      
      return { success: true, user: data.user, isConfirmed }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
      return { success: false, error: error.message }
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    try {
      console.log('[AuthContext] Starting sign in for:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('[AuthContext] Auth error:', error)
        throw error
      }

      if (!data.user) {
        throw new Error('No user data returned from authentication')
      }

      console.log('[AuthContext] Auth successful, user ID:', data.user.id)

      // Set user immediately
      setUser(data.user)

      // Fetch and set user profile data before navigation
      try {
        console.log('[AuthContext] Fetching user profile...')

        // Add timeout to profile fetch (5 seconds max)
        const fetchWithTimeout = Promise.race([
          fetchUserData(data.user),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          )
        ])

        const userProfile = await fetchWithTimeout

        console.log('[AuthContext] Profile fetched:', userProfile)

        if (!userProfile) {
          console.error('[AuthContext] No profile returned')
          throw new Error('Failed to load user profile')
        }

        // Set profile state
        setProfile(userProfile)

        // If photographer, fetch photographer profile
        if (userProfile.role === 'photographer') {
          console.log('[AuthContext] Fetching photographer profile...')

          const photoFetchWithTimeout = Promise.race([
            db.photographers.getProfile(data.user.id),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Photographer profile timeout')), 3000)
            )
          ])

          try {
            const photographerData = await photoFetchWithTimeout
            setPhotographerProfile(photographerData)
            console.log('[AuthContext] Photographer profile loaded')
          } catch (photoError) {
            console.warn('[AuthContext] Photographer profile fetch failed:', photoError)
            // Continue anyway - photographer profile is optional for initial login
          }
        }

        // Show success message
        toast.success('Welcome back!')

        // Navigate based on role immediately (no setTimeout)
        console.log('[AuthContext] Navigating to dashboard for role:', userProfile.role)

        if (userProfile.role === 'photographer') {
          navigate('/talent/dashboard', { replace: true })
        } else if (userProfile.role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }

        return { success: true, user: data.user, profile: userProfile }
      } catch (profileError) {
        console.error('[AuthContext] Profile fetch error:', profileError)

        // Show error but still try to navigate
        toast.error('Welcome back! Loading profile...')

        // Fallback navigation after short delay to allow error message to show
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 500)

        return { success: true, user: data.user, profileError: profileError.message }
      }
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error)

      // Provide user-friendly error messages
      let errorMessage = 'Invalid credentials'

      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before signing in'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null)
      setProfile(null)
      setPhotographerProfile(null)
      
      // Clear localStorage session data
      localStorage.removeItem('lovep-auth')
      localStorage.removeItem('sb-ldxscjxoakqrmkgqwwhr-auth-token')
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      // Even if there's an error, we've cleared local state
      if (error) {
        console.warn('Supabase signout warning:', error)
        // Don't throw - we still want to clear local state and redirect
      }
      
      toast.success('Signed out successfully')
      
      // Use setTimeout to ensure state updates are processed before navigation
      setTimeout(() => {
        navigate('/')
      }, 100)
      
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      // Even on error, clear local state
      setUser(null)
      setProfile(null)
      setPhotographerProfile(null)
      
      // Clear localStorage session data
      localStorage.removeItem('lovep-auth')
      localStorage.removeItem('sb-ldxscjxoakqrmkgqwwhr-auth-token')
      
      // Still navigate away
      setTimeout(() => {
        navigate('/')
      }, 100)
      
      toast.error('Sign out completed with errors')
      return { success: false, error: error.message }
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      toast.success('Password reset email sent! Check your inbox.')
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error(error.message || 'Failed to send reset email')
      return { success: false, error: error.message }
    }
  }

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully')
      return { success: true }
    } catch (error) {
      console.error('Update password error:', error)
      toast.error(error.message || 'Failed to update password')
      return { success: false, error: error.message }
    }
  }

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('Not authenticated')

      const updatedProfile = await db.users.updateProfile(user.id, updates)
      setProfile(updatedProfile)

      // If photographer-specific updates
      if (profile?.role === 'photographer' && updates.photographer) {
        const photographerUpdates = await db.photographers.updateProfile(
          photographerProfile.id,
          updates.photographer
        )
        setPhotographerProfile(photographerUpdates)
      }

      toast.success('Profile updated successfully')
      return { success: true, profile: updatedProfile }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.message }
    }
  }

  // Check if user has completed onboarding
  const checkOnboardingStatus = () => {
    if (!profile) return null
    
    if (profile.role === 'photographer') {
      return photographerProfile?.onboarding_completed || false
    }
    
    // Customers don't need onboarding
    return true
  }

  // Helper to check user role
  const hasRole = (role) => {
    return profile?.role === role
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!profile
  }

  const value = {
    user,
    profile,
    photographerProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    fetchUserData,
    checkOnboardingStatus,
    hasRole,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Protected route wrapper
export const ProtectedRoute = ({ children, requireRole = null, requireOnboarding = false }) => {
  const { user, profile, photographerProfile, loading, hasRole, checkOnboardingStatus } = useAuth()
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)
  const [forceRender, setForceRender] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    console.log('[ProtectedRoute] State:', { loading, hasUser: !!user, hasProfile: !!profile, role: profile?.role, requireRole, forceRender })

    // Set a 5-second timeout to force render if loading takes too long
    if (loading && !timeoutRef.current) {
      console.log('[ProtectedRoute] ⏱️ Starting 5s timeout for loading state')
      timeoutRef.current = setTimeout(() => {
        console.warn('[ProtectedRoute] ⚠️ Loading timeout exceeded (5s), forcing render')
        setForceRender(true)
      }, 5000)
    }

    // Clear timeout when loading completes
    if (!loading && timeoutRef.current) {
      console.log('[ProtectedRoute] ✅ Loading complete, clearing timeout')
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Reset navigation flag when dependencies change
    if (loading) {
      hasNavigatedRef.current = false
    }

    if ((!loading || forceRender) && !hasNavigatedRef.current) {
      // Check authentication - only check for user, not profile
      // Profile might still be loading
      if (!user) {
        console.log('[ProtectedRoute] No user, redirecting to login')
        hasNavigatedRef.current = true
        navigate('/login')
        return
      }

      // Check role requirement (only if profile is loaded)
      if (requireRole && profile && !hasRole(requireRole)) {
        // Admin can access everything
        if (profile.role === 'admin') {
          console.log('[ProtectedRoute] Admin access granted')
          return
        }
        // Redirect to forbidden page for role mismatches
        console.log('[ProtectedRoute] Role mismatch, redirecting to forbidden')
        hasNavigatedRef.current = true
        navigate('/forbidden')
        return
      }

      // Check onboarding requirement
      if (requireOnboarding && !checkOnboardingStatus()) {
        if (hasRole('photographer')) {
          console.log('[ProtectedRoute] Photographer onboarding required')
          hasNavigatedRef.current = true
          navigate('/onboarding/photographer')
        }
      }

      console.log('[ProtectedRoute] Access granted, rendering children')
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [user, profile, loading, requireRole, requireOnboarding, navigate, hasRole, checkOnboardingStatus, forceRender])

  if (loading && !forceRender) {
    console.log('[ProtectedRoute] Loading state active, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  console.log('[ProtectedRoute] Rendering children')
  return children
}
