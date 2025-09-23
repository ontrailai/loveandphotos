import { Outlet, Navigate } from 'react-router-dom'
import { CleanNavbar } from './ui/clean-navbar'
import { Footer } from './ui/footer-section'
import { useAuth } from '@contexts/AuthContext'
import { useEffect } from 'react'
import ChatAssistant from './ui/ChatAssistant'

const ClientLayout = ({ children }) => {
  const { profile, loading } = useAuth()

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }

  // Block talent users from accessing client-only pages (unless admin)
  if (profile && profile.role === 'photographer') {
    return <Navigate to="/dashboard/photographer" replace />
  }

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