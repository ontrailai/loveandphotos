import { Outlet, Navigate } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'
import { Footer } from './ui/footer-section'
import { useAuth } from '@contexts/AuthContext'

const TalentLayout = ({ children }) => {
  const { profile, loading } = useAuth()

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  // Block non-talent users from accessing talent-only pages (unless admin)
  if (profile && profile.role === 'customer') {
    return <Navigate to="/dashboard" replace />
  }

  // If not logged in at all, redirect to login
  if (!profile) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CleanNavbar />
      <main className="relative pt-16 md:pt-20 flex-1">
        {/* Talent-specific banner or branding could go here */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4 text-center text-sm">
          <span className="font-medium">Photographer Dashboard</span>
          {profile?.role === 'admin' && (
            <span className="ml-3 text-xs opacity-90">(Admin Access)</span>
          )}
        </div>
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  )
}

export default TalentLayout