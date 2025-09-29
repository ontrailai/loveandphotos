/**
 * SearchBar Component
 * Enhanced location and date search with glassmorphism effects and 3D animations
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MapPinIcon, CalendarIcon, SearchIcon, XIcon } from 'lucide-react'
import Button from '@components/ui/Button'
import DatePicker from '@components/photographers/DatePicker'
import { setDateInUrl, getDateFromUrl } from '../date-utils'
import { clsx } from 'clsx'
import type { SearchBarProps } from '@utils/photographers/types'

export function SearchBar({
  value,
  date,
  onValueChange,
  onDateChange,
  onSubmit,
  isLoading = false,
  placeholder = "ZIP code or city",
  className
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  // Remove showCalendar state - DatePicker handles its own open state
  const [localValue, setLocalValue] = useState(value) // Local state for immediate UI updates
  const inputRef = useRef<HTMLInputElement>(null)
  // Remove dateInputRef - DatePicker handles its own refs
  const containerRef = useRef<HTMLDivElement>(null)
  // Remove calendarRef - DatePicker handles its own refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)


  // Sync local value with prop value when it changes externally
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounced effect to call onValueChange
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Only debounce if localValue is different from the prop value
    if (localValue !== value) {
      debounceTimeoutRef.current = setTimeout(() => {
        onValueChange(localValue)
      }, 300) // 300ms debounce
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [localValue, value, onValueChange])

  // Mock autocomplete suggestions (in real app, would fetch from API)
  const suggestions = React.useMemo(() => {
    if (!localValue || localValue.length < 2) return []

    const mockCities = [
      'New York, NY',
      'Los Angeles, CA',
      'Chicago, IL',
      'Houston, TX',
      'Phoenix, AZ',
      'Philadelphia, PA',
      'San Antonio, TX',
      'San Diego, CA',
      'Dallas, TX',
      'San Jose, CA',
      'Austin, TX',
      'Jacksonville, FL',
      'Fort Worth, TX',
      'Columbus, OH',
      'Charlotte, NC',
      'San Francisco, CA',
      'Indianapolis, IN',
      'Seattle, WA',
      'Denver, CO',
      'Washington, DC',
      'Boston, MA',
      'Nashville, TN',
      'Oklahoma City, OK',
      'Las Vegas, NV',
      'Portland, OR',
      'Memphis, TN',
      'Louisville, KY',
      'Baltimore, MD',
      'Milwaukee, WI',
      'Albuquerque, NM'
    ]

    return mockCities
      .filter(city =>
        city.toLowerCase().includes(localValue.toLowerCase()) ||
        city.toLowerCase().startsWith(localValue.toLowerCase())
      )
      .slice(0, 5)
  }, [localValue])

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    setActiveField(null)
    setIsExpanded(false)
    onSubmit()
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion) // Update local state immediately
    setShowSuggestions(false)
    setActiveField(null)
    inputRef.current?.blur()
  }

  // Handle field focus
  const handleFieldFocus = (field: string) => {
    setActiveField(field)
    setIsExpanded(true)
    setIsFocused(true)
    if (field === 'location') {
      setShowSuggestions(suggestions.length > 0)
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setIsFocused(false)
      if (activeField !== 'date') {
        setShowSuggestions(false)
        setActiveField(null)
        setIsExpanded(false)
      }
    }, 150)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue) // Update local state immediately for responsive UI
    setShowSuggestions(newValue.length >= 2)
  }

  // Handle clear input
  const handleClearInput = () => {
    setLocalValue('') // Clear local state immediately
    inputRef.current?.focus()
  }

  // Handle date change with URL sync
  const handleDatePickerChange = useCallback((isoDate: string | null) => {
    const dateValue = isoDate || ''
    onDateChange(dateValue)
    setDateInUrl(isoDate)
  }, [onDateChange])

  // Handle clear date
  const handleClearDate = useCallback(() => {
    onDateChange('')
    setDateInUrl(null)
  }, [onDateChange])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveField(null)
      setIsExpanded(false)
      inputRef.current?.blur()
    }
  }

  // Handle popular search click
  const handlePopularSearchClick = (city: string) => {
    onValueChange(city)
    onSubmit()
  }

  // Initialize date from URL on component mount
  useEffect(() => {
    const urlDate = getDateFromUrl()
    if (urlDate && urlDate !== date) {
      onDateChange(urlDate)
    }
  }, [])

  // Listen for URL changes from other sources
  useEffect(() => {
    const handleUrlDateChange = (event: CustomEvent) => {
      const { date: urlDate } = event.detail
      const dateValue = urlDate || ''
      if (dateValue !== date) {
        onDateChange(dateValue)
      }
    }

    window.addEventListener('dateUrlChanged', handleUrlDateChange as EventListener)
    return () => window.removeEventListener('dateUrlChanged', handleUrlDateChange as EventListener)
  }, [date, onDateChange])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setActiveField(null)
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={clsx('relative w-full', className)}>
      {/* Background Container */}
      <div className="relative w-full">
        {/* Simple Background */}
        <div className="absolute inset-0 bg-white rounded-3xl border border-gray-200 shadow-sm" />


        {/* Form Content */}
        <div className="relative z-10 p-6">
          <form onSubmit={handleSubmit} className="w-full">
            <motion.div
              className="flex flex-col lg:flex-row gap-4 items-center"
              layout
              transition={{ duration: 0.3 }}
            >
              {/* Location Input */}
              <motion.div
                className="flex-1 relative w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <div
                    className={clsx(
                      'absolute left-4 top-1/2 transform -translate-y-1/2',
                      activeField === 'location' ? 'text-[#FF4D6D]' : 'text-gray-400'
                    )}
                  >
                    <MapPinIcon className="w-5 h-5" />
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={localValue}
                    onChange={handleInputChange}
                    onFocus={() => handleFieldFocus('location')}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={clsx(
                      'w-full pl-12 pr-10 py-4 bg-white border border-gray-300 rounded-2xl',
                      'text-gray-900 placeholder-gray-500 font-medium text-base',
                      'focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/50 focus:border-[#FF4D6D]/50',
                      'transition-all duration-300',
                      activeField === 'location' && 'ring-2 ring-[#FF4D6D]/50 border-[#FF4D6D]/50'
                    )}
                    aria-label="Search location"
                    aria-expanded={showSuggestions}
                    aria-haspopup="listbox"
                    autoComplete="off"
                  />

                  {/* Active field glow effect */}
                  {activeField === 'location' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF4D6D]/20 to-purple-500/20 -z-10 blur-xl"
                    />
                  )}

                  {localValue && (
                    <motion.button
                      type="button"
                      onClick={handleClearInput}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/20"
                      aria-label="Clear location"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <XIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {/* Enhanced Autocomplete Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 z-50 mt-3"
                    >
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
                        <ul role="listbox" className="py-2">
                          {suggestions.map((suggestion, index) => (
                            <motion.li
                              key={suggestion}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <button
                                type="button"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={clsx(
                                  'w-full text-left px-4 py-3 hover:bg-[#FF4D6D]/10',
                                  'flex items-center transition-all duration-200',
                                  'focus:outline-none focus:bg-[#FF4D6D]/10 group'
                                )}
                                role="option"
                                aria-selected={false}
                              >
                                <MapPinIcon className="w-4 h-4 text-[#FF4D6D] mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="text-gray-900 font-medium truncate group-hover:text-[#FF4D6D] transition-colors">
                                  {suggestion}
                                </span>
                              </button>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Date Picker */}
              <motion.div
                className="relative min-w-[180px]"
                whileHover={{ scale: 1.02 }}
              >
                <DatePicker
                  value={date}
                  onChange={handleDatePickerChange}
                  onClear={handleClearDate}
                  placeholder="Select event date"
                  className="w-full"
                />
              </motion.div>

              {/* Enhanced Search Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={clsx(
                  'px-8 py-4 bg-gradient-to-r from-[#FF4D6D] to-[#FF6B8A] text-white font-semibold rounded-2xl',
                  'shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2',
                  'min-w-[140px] justify-center relative overflow-hidden',
                  'focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                whileHover={{
                  scale: isLoading ? 1 : 1.05
                }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                aria-label="Search photographers"
              >
                {/* Button shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <SearchIcon className="w-5 h-5" />
                  </motion.div>
                )}
                <span className="hidden sm:inline relative z-10">Search</span>
              </motion.button>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SearchBar