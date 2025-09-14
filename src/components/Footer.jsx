import { Link } from 'react-router-dom'
import BrandLogo from '@components/BrandLogo'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 lg:gap-x-12 gap-y-6 items-start">
          {/* Company */}
          <div className="min-w-[180px] space-y-2">
            <BrandLogo
              href="/"
              size="lg"
              variant="icon"
              theme="dark"
              className="mb-4"
              alt="Love & Photos"
              ariaLabel="Love & Photos - Go to homepage"
            />
            <p className="text-gray-400 text-sm">
              Connecting moments with the perfect lens since 2024
            </p>
          </div>

          {/* For Customers */}
          <div className="min-w-[180px] space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">For Customers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-gray-400 hover:text-white text-sm transition">
                  Book
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-gray-400 hover:text-white text-sm transition">
                  Guide
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
          <div className="min-w-[180px] space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">For Photographers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/join" className="text-gray-400 hover:text-white text-sm transition">
                  Join
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
          <div className="min-w-[180px] space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">
            Copyright 2025. Love & Photos. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
