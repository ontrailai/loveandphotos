import { useNavigate } from 'react-router-dom'
import { ShieldOff, Home, ArrowLeft, Camera, Users } from 'lucide-react'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import { useAuth } from '@contexts/AuthContext'

const Forbidden = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const getRedirectPath = () => {
    if (!profile) return '/login'
    
    switch (profile.role) {
      case 'photographer':
        return '/talent/dashboard'
      case 'admin':
        return '/admin'
      case 'customer':
      default:
        return '/dashboard'
    }
  }

  const getRoleLabel = () => {
    if (!profile) return 'Guest'
    
    switch (profile.role) {
      case 'photographer':
        return 'Photographer'
      case 'admin':
        return 'Admin'
      case 'customer':
      default:
        return 'Customer'
    }
  }

  const getAccessMessage = () => {
    if (!profile) {
      return 'Please sign in to access this page.'
    }
    
    switch (profile.role) {
      case 'photographer':
        return 'This page is only accessible to customers. As a photographer, you can access your dashboard and tools.'
      case 'customer':
        return 'This page is only accessible to photographers. You can browse photographers and manage your bookings.'
      default:
        return 'You don\'t have permission to access this page.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Card className="max-w-lg w-full text-center p-8">
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6"
          role="img"
          aria-label="Access denied"
        >
          <ShieldOff className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-dusty-900 mb-2">
          403 - Access Denied
        </h1>
        
        <p className="text-lg text-dusty-600 mb-2">
          Sorry, you don't have permission to view this page.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-dusty-700 mb-1">
            <strong>Your Role:</strong> {getRoleLabel()}
          </p>
          <p className="text-sm text-dusty-600">
            {getAccessMessage()}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(getRedirectPath())}
            className="w-full"
            aria-label={`Go to ${getRoleLabel()} dashboard`}
          >
            {profile?.role === 'photographer' ? (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Go to Photographer Dashboard
              </>
            ) : profile?.role === 'admin' ? (
              <>
                <ShieldOff className="w-5 h-5 mr-2" />
                Go to Admin Panel
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Go to Customer Dashboard
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="w-full"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/')}
            className="w-full"
            aria-label="Go to home page"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home Page
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-dusty-700 mb-2">
            Quick Links for {getRoleLabel()}s:
          </h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {profile?.role === 'customer' ? (
              <>
                <a href="/browse" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Browse Photographers
                </a>
                <span className="text-gray-400">•</span>
                <a href="/my-bookings" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  My Bookings
                </a>
                <span className="text-gray-400">•</span>
                <a href="/profile" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  My Profile
                </a>
              </>
            ) : profile?.role === 'photographer' ? (
              <>
                <a href="/talent/dashboard" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Dashboard
                </a>
                <span className="text-gray-400">•</span>
                <a href="/photographer/jobs" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  My Jobs
                </a>
                <span className="text-gray-400">•</span>
                <a href="/photographer/portfolio" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Portfolio
                </a>
              </>
            ) : profile?.role === 'admin' ? (
              <>
                <a href="/admin" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Admin Dashboard
                </a>
                <span className="text-gray-400">•</span>
                <a href="/admin/photographers" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Manage Photographers
                </a>
              </>
            ) : (
              <>
                <a href="/login" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Sign In
                </a>
                <span className="text-gray-400">•</span>
                <a href="/signup" className="text-sm text-primary-600 hover:text-primary-700 underline">
                  Sign Up
                </a>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Forbidden