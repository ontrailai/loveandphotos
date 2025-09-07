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
      // Get user profile
      const userProfile = await db.users.getProfile(user.id)
      setProfile(userProfile)

      // If photographer, get photographer profile
      if (userProfile?.role === 'photographer') {
        const photographerData = await db.photographers.getProfile(user.id)
        setPhotographerProfile(photographerData)
      }

      return userProfile
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load profile')
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            phone
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // If email confirmation is required
      if (data?.user?.identities?.length === 0) {
        toast.success('Please check your email to confirm your account')
        return { success: true, requiresEmailConfirmation: true }
      }

      // Update profile after signup
      if (data?.user) {
        await db.users.updateProfile(data.user.id, {
          full_name: fullName,
          phone,
          role
        })

        // If photographer, initialize photographer profile
        if (role === 'photographer') {
          await supabase
            .from('photographers')
            .upsert({ user_id: data.user.id })
        }
      }

      toast.success('Account created successfully!')
      return { success: true, user: data.user }
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

      if (error) throw error

      toast.success('Welcome back!')
      
      // Redirect based on role
      if (data.user) {
        const userProfile = await fetchUserData(data.user)
        if (userProfile?.role === 'photographer') {
          navigate('/dashboard/photographer')
        } else {
          navigate('/dashboard')
        }
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Signin error:', error)
      toast.error(error.message || 'Invalid credentials')
      return { success: false, error: error.message }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setPhotographerProfile(null)
      
      toast.success('Signed out successfully')
      navigate('/login')
      
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      toast.error('Failed to sign out')
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
