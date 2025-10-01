import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { Camera, Calendar, FileText, MessageCircle, User, LayoutDashboard, ArrowLeft, LogOut, Sparkles, Settings, CalendarClock } from 'lucide-react'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

const TalentDashboardLayout = () => {
  const { profile, photographerProfile, user, signOut, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Determine if user is videographer
  const isVideographer = photographerProfile?.is_videographer || false
  const talentType = isVideographer ? 'Videographer' : 'Photographer'

  console.log('[TalentDashboard] Render state:', {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    role: profile?.role,
    hasPhotographerProfile: !!photographerProfile,
    isVideographer
  })

  // Ensure photographer profile exists, create if missing
  useEffect(() => {
    const ensurePhotographerProfile = async () => {
      // Only run once when conditions are met and photographer profile is missing
      if (user && profile?.role === 'photographer' && !photographerProfile) {
        console.log('[TalentDashboard] Creating missing photographer profile for user:', user.id)
        try {
          const { supabase } = await import('@lib/supabase')
          const { error } = await supabase
            .from('photographers')
            .upsert({
              user_id: user.id,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          if (error) {
            console.error('[TalentDashboard] Error creating photographer profile:', error)
            toast.error('Failed to initialize photographer profile')
          } else {
            console.log('[TalentDashboard] Photographer profile created successfully')
            // Don't reload - let AuthContext refetch the data
            toast.success('Profile initialized successfully')
          }
        } catch (err) {
          console.error('[TalentDashboard] Failed to create photographer profile:', err)
        }
      }
    }

    ensurePhotographerProfile()
  }, [user?.id, profile?.role]) // Only depend on user ID and role to prevent infinite loops

  // Show loading spinner while auth is loading
  if (loading || !profile) {
    console.log('[TalentDashboard] Loading state, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Verify user is a photographer
  if (profile.role !== 'photographer') {
    console.log('[TalentDashboard] Not a photographer, redirecting')
    navigate('/forbidden')
    return null
  }

  const navItems = [
    { path: '/talent/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/talent/dashboard/profile', label: 'Profile', icon: User },
    { path: '/talent/dashboard/availability', label: 'Availability', icon: CalendarClock },
    { path: '/talent/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { path: '/talent/dashboard/bookings', label: 'Bookings', icon: FileText },
    { path: '/talent/dashboard/contracts', label: 'Contracts', icon: FileText },
    { path: '/talent/dashboard/messages', label: 'Messages', icon: MessageCircle },
    { path: '/talent/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (path) => {
    if (path === '/talent/dashboard') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return profile?.email?.slice(0, 2).toUpperCase() || 'U'
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/30">
      {/* Top Navigation Bar - Premium Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Camera className="w-7 h-7 text-[#fe395f]" aria-hidden="true" />
                <Sparkles className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" aria-hidden="true" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#fe395f] via-pink-600 to-rose-600 bg-clip-text text-transparent">
                {talentType} Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="flex items-center text-sm text-gray-600 hover:text-[#fe395f] transition-all duration-200 hover:scale-105"
                aria-label="Return to main site"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
                <span className="hidden sm:inline font-medium">Home</span>
              </Link>

              {photographerProfile?.is_verified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 shadow-sm">
                  ✓ Verified
                </span>
              )}

              <div className="flex items-center space-x-2.5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-full pl-1 pr-3 py-1 border border-gray-200/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fe395f] to-rose-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
                  {getInitials()}
                </div>
                <span className="hidden md:inline text-sm text-gray-700 font-semibold">{profile?.full_name || profile?.email}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-[#fe395f] hover:bg-pink-50 rounded-lg transition-all duration-200"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Premium Glass Effect */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-3 sticky top-24">
              <ul className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                          active
                            ? 'bg-gradient-to-r from-[#fe395f] to-rose-500 text-white shadow-md shadow-pink-200/50 scale-[1.02]'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:scale-[1.02] hover:shadow-sm'
                        }`}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon
                          className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                            active ? '' : 'group-hover:scale-110'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="font-medium">{item.label}</span>
                        {active && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default TalentDashboardLayout