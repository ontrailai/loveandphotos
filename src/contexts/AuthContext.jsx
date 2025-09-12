import { createContext, useContext, useEffect, useState } from 'react'
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

  // Fetch user profile and photographer data if applicable
  const fetchUserData = async (user) => {
    try {
      // Get user profile - first try to fetch it
      let userProfile = await db.users.getProfile(user.id)
      
      // If profile doesn't exist, create it
      if (!userProfile) {
        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'customer',
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })
          .select()
          .single()
        
        if (!error && data) {
          userProfile = data
        }
      }
      
      setProfile(userProfile)

      // If photographer, get photographer profile
      if (userProfile?.role === 'photographer') {
        const photographerData = await db.photographers.getProfile(user.id)
        setPhotographerProfile(photographerData)
      }

      return userProfile
    } catch (error) {
      console.error('Error fetching user data:', error)
      // Don't show error toast on initial load
      return null
    }
  }

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserData(session.user)
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchUserData(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setPhotographerProfile(null)
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user)
          await fetchUserData(session.user)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

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

        // If photographer, initialize photographer profile
        if (role === 'photographer') {
          await supabase
            .from('photographers')
            .upsert({ 
              user_id: data.user.id,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Auth error:', error)
        throw error
      }

      if (data.user) {
        // Set user immediately
        setUser(data.user)
        
        // Fetch and set user profile data before navigation
        try {
          const userProfile = await fetchUserData(data.user)
          
          // Make sure profile is set
          if (userProfile) {
            setProfile(userProfile)
            
            // If photographer, set photographer profile too
            if (userProfile.role === 'photographer') {
              const photographerData = await db.photographers.getProfile(data.user.id)
              setPhotographerProfile(photographerData)
            }
          }
          
          // Show success message
          toast.success('Welcome back!')
          
          // Navigate based on role after everything is loaded
          setTimeout(() => {
            if (userProfile?.role === 'photographer') {
              navigate('/dashboard/photographer')
            } else {
              navigate('/dashboard')
            }
          }, 100) // Small delay to ensure state updates
        } catch (profileError) {
          console.error('Error fetching profile:', profileError)
          toast.success('Welcome back!')
          // Still navigate to dashboard even if profile fetch fails
          setTimeout(() => {
            navigate('/dashboard')
          }, 100)
        }
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign in error:', error)
      const errorMessage = error.message || 'Invalid credentials'
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
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      toast.success('Password reset email sent')
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

  useEffect(() => {
    if (!loading) {
      // Check authentication
      if (!user || !profile) {
        navigate('/login')
        return
      }

      // Check role requirement
      if (requireRole && !hasRole(requireRole)) {
        toast.error('You do not have permission to access this page')
        navigate('/dashboard')
        return
      }

      // Check onboarding requirement
      if (requireOnboarding && !checkOnboardingStatus()) {
        if (hasRole('photographer')) {
          navigate('/onboarding/photographer')
        }
      }
    }
  }, [user, profile, loading, requireRole, requireOnboarding])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return children
}
