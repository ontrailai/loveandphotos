import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import Button from '@components/ui/Button'
import Logo, { LogoMinimal, LogoMonogram } from '@components/Logo'
import { useState } from 'react'

const Navbar = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="transform transition-transform group-hover:scale-110">
                {/* Option 1: Modern camera with heart (default) */}
                {/* <Logo className="w-10 h-10" /> */}
                
                {/* Option 2: Minimalist overlapping circles */}
                {/* <LogoMinimal className="w-10 h-10" /> */}
                
                {/* Option 3: L&P Monogram */}
                <LogoMonogram className="w-10 h-10" />
              </div>
              <span className="text-2xl font-display font-bold text-dusty-900">Love & Photos</span>
            </Link>
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
                  to="/browse" 
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
                  to="/browse" 
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
                  to="/browse" 
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
                  to="/browse" 
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
