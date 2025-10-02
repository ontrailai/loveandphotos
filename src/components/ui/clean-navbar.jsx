'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, Globe, Menu, X, ChevronDown, User, Users, Video, Book } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import Button from '@components/ui/Button'
import { LanguageCurrencyDialog } from '@components/ui/language-currency-dialog'
import { Portal } from '@components/ui/Portal'
import { createPortal } from 'react-dom'

const navItems = [
  { name: 'Home', href: '/', icon: <Home size={16} /> },
  {
    name: 'Book Now',
    href: '/photographers',
    submenu: [
      { name: 'Find Photographers', href: '/photographers', description: 'Search by ZIP, style, or date' },
      { name: 'Video Only', href: '/photographers/video', description: 'Professional videographers only', icon: <Video size={16} /> },
      { name: 'How to Book', href: '/how-to-book', description: '3 simple steps to book', icon: <Book size={16} /> }
    ]
  },
  {
    name: 'Join',
    // Remove href for dropdown-only items - NO MORE /talent!
    submenu: [
      { name: 'Become a Photographer', href: '/signup?role=photographer', description: 'Apply & see pay tiers' },
      { name: 'Learn', href: '/learn', description: 'Training guides & tutorials' },
      { name: 'Resources', href: '/resources', description: 'Training & guidelines' },
      { name: 'FAQ', href: '/faq', description: 'Frequently asked questions' }
    ]
  },
  { name: 'About', href: '/about', icon: <Users size={16} aria-label="About" /> }
]

// Hover-enabled Dropdown Component with robust positioning
function Dropdown({ trigger, children, isOpen, onToggle }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const hoverTimeoutRef = useRef(null)
  const buttonRef = useRef(null)
  const dropdownRef = useRef(null)

  // Show dropdown on hover or keyboard focus/click
  const shouldShow = isHovered || isOpen || isFocused

  // Calculate optimal dropdown position
  const calculatePosition = () => {
    if (!buttonRef.current) {
      return { top: 0, left: 0 }
    }

    const buttonRect = buttonRef.current.getBoundingClientRect()

    // Check if we got valid coordinates
    if (!buttonRect || buttonRect.width === 0 || buttonRect.height === 0) {
      return { top: 0, left: 0 }
    }

    const dropdownWidth = 320 // w-80 = 320px
    const dropdownHeight = 200 // Estimated height
    const offset = 8

    // Calculate position below button
    let top = buttonRect.bottom + offset
    let left = buttonRect.left

    // Viewport constraints
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Ensure dropdown doesn't go off right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 16 // 16px margin
    }

    // Ensure dropdown doesn't go off left edge
    if (left < 16) {
      left = 16
    }

    // If dropdown would go below viewport, show above button
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - offset
    }

    // Ensure dropdown doesn't go above viewport
    if (top < 16) {
      top = 16
    }

    return { top: Math.round(top), left: Math.round(left) }
  }

  // Update position when dropdown should be shown
  useEffect(() => {
    if (shouldShow) {
      // Use setTimeout to ensure the button is fully rendered
      const timer = setTimeout(() => {
        const newPosition = calculatePosition()
        setPosition(newPosition)
      }, 0)

      // Update position on scroll and resize
      const handleUpdate = () => {
        const newPosition = calculatePosition()
        setPosition(newPosition)
      }

      window.addEventListener('scroll', handleUpdate, { passive: true })
      window.addEventListener('resize', handleUpdate, { passive: true })

      return () => {
        clearTimeout(timer)
        window.removeEventListener('scroll', handleUpdate)
        window.removeEventListener('resize', handleUpdate)
      }
    }
  }, [shouldShow])

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 100)
  }

  const handleToggle = (e) => {
    onToggle(e)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors hover:opacity-70"
        aria-expanded={shouldShow}
        aria-haspopup="true"
      >
        {trigger}
        <ChevronDown size={16} className="ml-1" />
      </button>
      {shouldShow && (
        <Portal>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="z-[9999] w-80 rounded-md border bg-white p-4 shadow-lg"
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="grid gap-3">
              {children}
            </div>
          </motion.div>
        </Portal>
      )}
    </div>
  )
}

// Mobile Sheet Component with Portal and Safe Area Support
function MobileSheet({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Portal the mobile sheet to body to avoid transform ancestors
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/50"
        onClick={onClose}
      />
      {/* Sheet with safe area support */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className="fixed right-0 z-[100] h-full w-80 bg-white shadow-xl pt-[env(safe-area-inset-top)]"
        style={{ top: 0 }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:opacity-70"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.aside>
    </>,
    document.body
  )
}

export function CleanNavbar({ className = '' }) {
  const { user, signOut, profile } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  // Check if current user is already a photographer
  const isPhotographer = profile?.role === 'photographer' || user?.user_metadata?.role === 'photographer'

  const handleSignOut = async () => {
    const result = await signOut()
    if (!result.success) {
      console.error('Sign out failed:', result.error)
    }
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 md:backdrop-blur-md backdrop-blur-0 border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      } ${className}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/"
              className="flex items-center gap-2"
              aria-label="Love & Photos home"
            >
              <img
                src="/branding/logo.svg"
                alt="Love & Photos logo"
                className="block h-10 w-auto md:h-12"
              />
              <span className="sr-only">Love & Photos</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, i) => (
              <div key={i}>
                {item.submenu ? (
                  <Dropdown
                    trigger={
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.name}
                      </span>
                    }
                    isOpen={activeDropdown === i}
                    onToggle={(e) => {
                      e.stopPropagation()
                      setActiveDropdown(activeDropdown === i ? null : i)
                    }}
                  >
                    {item.submenu
                      .filter(sub => !(sub.name.includes('Become a Photographer') && isPhotographer))
                      .map((sub, j) => (
                      <Link
                        key={j}
                        to={sub.href}
                        className="block rounded-md p-3 no-underline transition-colors hover:opacity-70"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <div className="flex items-center gap-2 text-sm font-medium leading-none">
                          {sub.icon && sub.icon}
                          <span>{sub.name}</span>
                        </div>
                        {sub.description && (
                          <p className="line-clamp-2 text-sm leading-snug text-gray-600 mt-1">
                            {sub.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </Dropdown>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={item.href}
                      className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors hover:opacity-70"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.name}
                      </span>
                    </Link>
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <LanguageCurrencyDialog>
              <button
                aria-label="Change language and currency"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:opacity-70 transition-colors"
              >
                <Globe size={18} />
              </button>
            </LanguageCurrencyDialog>
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <Link to={profile?.role === 'photographer' ? '/talent/dashboard' : profile?.role === 'admin' ? '/admin' : '/dashboard'}>
                    <Button variant="ghost" size="sm">
                      {profile?.role === 'photographer' ? 'Talent Dashboard' : profile?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      <User size={16} className="mr-1" aria-label="Profile" />
                      Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/photographers">
                    <Button 
                      variant="primary" 
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

            {/* Mobile Menu Trigger */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <div className="space-y-4">
          {navItems.map((item, i) => (
            <div key={i}>
              {item.submenu ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    {item.submenu
                      .filter(sub => !(sub.name.includes('Become a Photographer') && isPhotographer))
                      .map((sub, j) => (
                      <Link
                        key={j}
                        to={sub.href}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {sub.icon && sub.icon}
                        <span>{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.href}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            {/* Language & Currency Selector */}
            <LanguageCurrencyDialog>
              <Button variant="ghost" className="w-full justify-start">
                <Globe size={16} className="mr-2" />
                Language & Currency
              </Button>
            </LanguageCurrencyDialog>

            {user ? (
              <>
                <Link to={profile?.role === 'photographer' ? '/talent/dashboard' : profile?.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button variant="ghost" className="w-full justify-start">
                    {profile?.role === 'photographer' ? 'Talent Dashboard' : profile?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <User size={16} className="mr-2" aria-label="Profile" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleSignOut()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
                <Link to="/photographers">
                  <Button 
                    variant="primary" 
                    className="w-full bg-[#fe395f] hover:bg-[#fe395f]/90 text-white border-[#fe395f] hover:border-[#fe395f]/90 focus:ring-2 focus:ring-[#fe395f] focus:ring-offset-2 transition-all duration-200"
                    aria-label="Get started by browsing photographers"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </MobileSheet>
    </motion.header>
  )
}