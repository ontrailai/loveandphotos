'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, Globe, Menu, X, ChevronDown, User } from 'lucide-react'
import { useAuth } from '@contexts/AuthContext'
import Button from '@components/ui/Button'
import { LanguageCurrencyDialog } from '@components/ui/language-currency-dialog'
import { Portal } from '@components/ui/Portal'

const navItems = [
  { name: 'Home', href: '/', icon: <Home size={16} /> },
  {
    name: 'Book Now',
    href: '/photographers',
    submenu: [
      { name: 'Find Photographers', href: '/photographers', description: 'Search by ZIP, style, or date' },
      { name: 'How It Works', href: '/how-it-works', description: 'Booking, payment & timelines' },
      { name: 'Pricing', href: '/pricing', description: 'Simple packages & add-ons' }
    ]
  },
  {
    name: 'Join',
    href: '/talent',
    submenu: [
      { name: 'Become a Photographer', href: '/talent', description: 'Apply & see pay tiers' },
      { name: 'Resources', href: '/resources', description: 'Training & guidelines' }
    ]
  },
  { name: 'About', href: '/about', icon: <User size={16} /> },
  { name: 'Contact', href: '/contact' }
]

// Hover-enabled Dropdown Component with Portal support
function Dropdown({ trigger, children, isOpen, onToggle }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const hoverTimeoutRef = useRef(null)
  const triggerRef = useRef(null)

  // Show dropdown on hover or keyboard focus/click
  const shouldShow = isHovered || isOpen || isFocused

  // Calculate dropdown position relative to viewport
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap (mt-1)
        left: rect.left + window.scrollX
      })
    }
  }

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsHovered(true)
    updatePosition()
  }

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 100) // Small delay to prevent flickering when moving between trigger and dropdown
  }

  const handleToggle = (e) => {
    updatePosition()
    onToggle(e)
  }

  // Update position on scroll and resize
  useEffect(() => {
    if (shouldShow) {
      updatePosition()
      const handleScroll = () => updatePosition()
      const handleResize = () => updatePosition()

      window.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [shouldShow])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        onClick={handleToggle}
        onFocus={() => {
          setIsFocused(true)
          updatePosition()
        }}
        onBlur={() => setIsFocused(false)}
        className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
        aria-expanded={shouldShow}
        aria-haspopup="true"
      >
        {trigger}
        <ChevronDown size={16} className="ml-1" />
      </button>
      {shouldShow && (
        <Portal>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] w-80 rounded-md border bg-white p-4 shadow-lg"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
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

// Mobile Sheet Component
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed right-0 top-0 z-[9999] h-full w-80 bg-white shadow-lg"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </>
  )
}

export function CleanNavbar({ className = '' }) {
  const { user, signOut } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

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
          ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm'
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
                    {item.submenu.map((sub, j) => (
                      <Link
                        key={j}
                        to={sub.href}
                        className="block rounded-md p-3 no-underline transition-colors hover:bg-gray-50"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <div className="text-sm font-medium leading-none">{sub.name}</div>
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
                      className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
              >
                <Globe size={18} />
              </button>
            </LanguageCurrencyDialog>
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      <User size={16} className="mr-1" />
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
                  <Link to="/signup">
                    <Button variant="primary" size="sm" className="bg-brand hover:bg-brand/90 text-white">Get Started</Button>
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
                    {item.submenu.map((sub, j) => (
                      <Link
                        key={j}
                        to={sub.href}
                        className="block text-sm hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {sub.name}
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
                <Link to="/dashboard">
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start">
                    <User size={16} className="mr-2" />
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
                <Link to="/signup">
                  <Button variant="primary" className="w-full bg-brand hover:bg-brand/90 text-white">
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