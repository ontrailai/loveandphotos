import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'
import { Footer } from './ui/footer-section'
import { useAuth } from '@contexts/AuthContext'
import { useEffect } from 'react'
import ChatAssistant from './ui/ChatAssistant'

const ClientLayout = ({ children }) => {
  const { profile, loading } = useAuth()
  const location = useLocation()

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  // Allow photographers to view public profiles (their own or others)
  const isViewingPublicProfile = location.pathname.startsWith('/photographer/')

  console.log('[ClientLayout] Current pathname:', location.pathname)
  console.log('[ClientLayout] isViewingPublicProfile:', isViewingPublicProfile)
  console.log('[ClientLayout] profile.role:', profile?.role)
  console.log('[ClientLayout] Will redirect?', profile && profile.role === 'photographer' && !isViewingPublicProfile)

  // Block talent users from accessing client-only pages (unless admin or viewing public profiles)
  if (profile && profile.role === 'photographer' && !isViewingPublicProfile) {
    console.log('[ClientLayout] REDIRECTING to /talent/dashboard')
    return <Navigate to="/talent/dashboard" replace />
  }

  console.log('[ClientLayout] Allowing access to:', location.pathname)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CleanNavbar />
      <main className="relative pt-16 md:pt-20 flex-1">
        {children || <Outlet />}
      </main>
      <Footer />
      <ChatAssistant />
    </div>
  )
}

export default ClientLayout