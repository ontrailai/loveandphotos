import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import Button from '@components/ui/Button'
import BrandLogo from '@components/BrandLogo'
import { useState } from 'react'

const Navbar = () => {
  const { user, signOut, profile, photographerProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const result = await signOut()
    if (!result.success) {
      console.error('Sign out failed:', result.error)
    }
  }

  // Helper function to get the correct dashboard route based on role and videographer status
  const getDashboardRoute = () => {
    if (profile?.role === 'photographer') {
      // Check if user is a videographer
      if (photographerProfile?.is_videographer) {
        return '/talent/dashboard/videographer'
      }
      return '/talent/dashboard'
    } else if (profile?.role === 'admin') {
      return '/admin'
    }
    return '/dashboard'
  }

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="w-full px-40 sm:px-56 lg:px-72">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <BrandLogo
              href="/"
              size="lg"
              variant="icon"
              className="hover:opacity-90 transition-opacity"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  className="text-foreground hover:text-foreground/80 transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/photographers"
                  className="text-foreground hover:text-foreground/80 transition"
                >
                  Browse
                </Link>
                <Link
                  to={getDashboardRoute()}
                  className="text-foreground hover:text-foreground/80 transition"
                >
                  Profile
                </Link>
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link 
                  to="/photographers" 
                  className="text-foreground hover:text-foreground/80 transition"
                >
                  Find Photographers
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/photographers">
                  <Button 
                    size="sm"
                    className="bg-[#fe395f] hover:bg-[#fe395f]/90 text-white border-[#fe395f] hover:border-[#fe395f]/90 focus:ring-2 focus:ring-[#fe395f] focus:ring-offset-2 transition-all duration-200"
                    aria-label="Get started by browsing photographers"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            <span className="text-foreground">{mobileMenuOpen ? 'X' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {user ? (
              <div className="space-y-2">
                <Link
                  to={getDashboardRoute()}
                  className="block px-4 py-2 text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/photographers"
                  className="block px-4 py-2 text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link
                  to={getDashboardRoute()}
                  className="block px-4 py-2 text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-foreground hover:bg-accent"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link 
                  to="/photographers" 
                  className="block px-4 py-2 text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Photographers
                </Link>
                <Link 
                  to="/login" 
                  className="block px-4 py-2 text-foreground hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/photographers" 
                  className="block px-4 py-2 bg-[#fe395f] hover:bg-[#fe395f]/90 text-white font-medium rounded-lg mx-4 text-center transition-all duration-200 focus:ring-2 focus:ring-[#fe395f] focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Get started by browsing photographers"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
