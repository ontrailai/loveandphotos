import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">LoveP</h3>
            <p className="text-gray-400 text-sm">
              Connecting clients with talented photographers and videographers for unforgettable events.
            </p>
          </div>

          {/* For Customers */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">For Customers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-gray-400 hover:text-white text-sm transition">
                  Find Photographers
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-400 hover:text-white text-sm transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white text-sm transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Photographers */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">For Photographers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/join" className="text-gray-400 hover:text-white text-sm transition">
                  Join as Photographer
                </Link>
              </li>
              <li>
                <Link to="/photographer-resources" className="text-gray-400 hover:text-white text-sm transition">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/photographer-faq" className="text-gray-400 hover:text-white text-sm transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} LoveP Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
