/**
 * DatePicker Component - Magic UI Popover/Sheet Date Picker
 * Desktop: Popover anchored to input
 * Mobile: Bottom sheet (full-bleed)
 * Features: Quick picks, keyboard navigation, availability dots, URL sync
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { clsx } from 'clsx'
import { formatDisplayDate, parseISODate, getQuickPickDates, clampDate } from './date-utils'

interface DatePickerProps {
  value?: string // ISO date string YYYY-MM-DD
  onChange: (isoDate: string | null) => void
  onClear?: () => void
  availability?: Record<string, 'high' | 'med' | 'low' | 'unknown'>
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  onClear,
  availability,
  placeholder = "Select date",
  className,
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? parseISODate(value) : undefined
  )

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Detect mobile for responsive behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Sync selected date with value prop
  useEffect(() => {
    setSelectedDate(value ? parseISODate(value) : undefined)
  }, [value])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle date selection
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date) return

    const clampedDate = clampDate(date)
    setSelectedDate(clampedDate)
    onChange(clampedDate.toISOString().split('T')[0])
    setIsOpen(false)
  }, [onChange])

  // Handle quick picks
  const handleQuickPick = useCallback((pick: 'weekend' | 'next-month' | 'clear') => {
    if (pick === 'clear') {
      setSelectedDate(undefined)
      onChange(null)
      onClear?.()
    } else {
      const dates = getQuickPickDates()
      const targetDate = pick === 'weekend' ? dates.thisWeekend : dates.nextMonth
      handleDateSelect(targetDate)
    }
    setIsOpen(false)
  }, [handleDateSelect, onChange, onClear])

  // Keyboard handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        triggerRef.current?.blur()
        break
    }
  }, [disabled, isOpen])

  // Render availability dot for date
  const renderAvailabilityDot = (date: Date) => {
    if (!availability) return null

    const dateKey = date.toISOString().split('T')[0]
    const level = availability[dateKey]
    if (!level) return null

    const colors = {
      high: 'bg-green-500',
      med: 'bg-yellow-500',
      low: 'bg-red-500',
      unknown: 'bg-gray-400'
    }

    return (
      <div className={clsx(
        'absolute top-1 right-1 w-1.5 h-1.5 rounded-full',
        colors[level]
      )} />
    )
  }

  // Custom day renderer with availability dots
  const customDayRender = (date: Date, modifiers: any) => (
    <div className="relative w-full h-full flex items-center justify-center">
      {date.getDate()}
      {renderAvailabilityDot(date)}
    </div>
  )

  const quickPicks = [
    { label: 'This weekend', value: 'weekend' as const },
    { label: 'Next month', value: 'next-month' as const },
    { label: 'Clear date', value: 'clear' as const }
  ]

  const displayValue = selectedDate ? formatDisplayDate(selectedDate) : ''

  // Calendar content
  const calendarContent = (
    <div className="w-full">
      {/* Quick picks */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-1 gap-2">
          {quickPicks.map((pick) => (
            <motion.button
              key={pick.value}
              onClick={() => handleQuickPick(pick.value)}
              className={clsx(
                'px-3 py-2 text-sm text-left rounded-lg transition-colors',
                pick.value === 'clear'
                  ? 'text-gray-600 hover:bg-gray-50'
                  : 'text-gray-900 hover:bg-primary-50 hover:text-primary-600'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pick.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={{ before: new Date() }}
          showOutsideDays={false}
          className="w-full"
          classNames={{
            months: "flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center mb-4",
            caption_label: "text-lg font-semibold text-gray-900",
            nav: "space-x-1 flex items-center",
            nav_button: clsx(
              "h-8 w-8 bg-transparent p-0 text-gray-400 hover:text-gray-900",
              "inline-flex items-center justify-center rounded-lg text-sm font-medium",
              "transition-colors hover:bg-gray-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              "disabled:pointer-events-none disabled:opacity-50"
            ),
            nav_button_previous: "absolute left-0",
            nav_button_next: "absolute right-0",
            table: "w-full border-collapse",
            head_row: "flex mb-2",
            head_cell: "text-gray-600 rounded-md w-9 font-medium text-sm flex-1 text-center",
            row: "flex w-full",
            cell: clsx(
              "h-9 w-9 text-center text-sm p-0 relative flex-1",
              "focus-within:relative focus-within:z-20"
            ),
            day: clsx(
              "h-9 w-full p-0 font-normal",
              "inline-flex items-center justify-center rounded-lg text-sm",
              "transition-colors hover:bg-gray-100 hover:text-gray-900",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            ),
            day_selected: "bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-500 focus:text-white",
            day_today: "bg-gray-100 text-gray-900 font-semibold",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
            IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
            Day: ({ date, ...props }) => (
              <button {...props} className={props.className}>
                {customDayRender(date, props)}
              </button>
            )
          }}
          numberOfMonths={isMobile ? 1 : 2}
        />

        {/* Availability legend */}
        {availability && Object.keys(availability).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="font-medium">Availability:</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Med</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Low</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={clsx('relative', className)}>
      {/* Trigger button */}
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between px-4 py-3',
          'bg-white border border-gray-300 rounded-2xl',
          'text-left text-gray-900 font-medium',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-primary-500/50 border-primary-500/50'
        )}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Select date"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className={clsx(
            'w-5 h-5',
            isOpen ? 'text-primary-500' : 'text-gray-400'
          )} />
          <span className={displayValue ? 'text-gray-900' : 'text-gray-500'}>
            {displayValue || placeholder}
          </span>
        </div>

        {displayValue && (
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleQuickPick('clear')
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Clear date"
          >
            <XIcon className="w-4 h-4" />
          </motion.button>
        )}
      </motion.button>

      {/* Calendar popover/sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile ? (
              /* Mobile: Bottom sheet */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => setIsOpen(false)}
              >
                <motion.div
                  ref={popoverRef}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sheet handle */}
                  <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1 bg-gray-300 rounded-full" />
                  </div>
                  {calendarContent}
                </motion.div>
              </motion.div>
            ) : (
              /* Desktop: Popover */
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 z-50 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
                style={{
                  minWidth: isMobile ? '320px' : '640px',
                  maxWidth: '90vw'
                }}
              >
                {calendarContent}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DatePicker