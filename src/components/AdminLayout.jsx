import { Outlet, Navigate } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'
import { Footer } from './ui/footer-section'
import { useAuth } from '@contexts/AuthContext'

const AdminLayout = ({ children }) => {
  const { profile, loading } = useAuth()

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  // Only allow admin users
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CleanNavbar />
      <main className="relative pt-16 md:pt-20 flex-1">
        {/* Admin-specific banner */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-4 text-center text-sm">
          <span className="font-medium">Admin Panel</span>
          <span className="ml-3 text-xs opacity-90">Full system access</span>
        </div>
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  )
}

export default AdminLayout