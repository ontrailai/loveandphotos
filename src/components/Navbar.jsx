import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import Button from '@components/ui/Button'
import BrandLogo from '@components/BrandLogo'
import { useState } from 'react'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const result = await signOut()
    if (!result.success) {
      console.error('Sign out failed:', result.error)
    }
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
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
                  to="/dashboard" 
                  className="text-dusty-600 hover:text-dusty-900 transition"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/photographers" 
                  className="text-dusty-600 hover:text-dusty-900 transition"
                >
                  Browse
                </Link>
                <Link 
                  to="/profile" 
                  className="text-dusty-600 hover:text-dusty-900 transition"
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
                  className="text-dusty-600 hover:text-dusty-900 transition"
                >
                  Find Photographers
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">
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
            <span className="text-dusty-600">{mobileMenuOpen ? 'X' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {user ? (
              <div className="space-y-2">
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-2 text-dusty-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/photographers" 
                  className="block px-4 py-2 text-dusty-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse
                </Link>
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-dusty-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-dusty-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link 
                  to="/photographers" 
                  className="block px-4 py-2 text-dusty-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Photographers
                </Link>
                <Link 
                  to="/login" 
                  className="block px-4 py-2 text-dusty-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="block px-4 py-2 text-dusty-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
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
