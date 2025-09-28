/**
 * Date Utilities for DatePicker Component
 * Format/parse MM/DD/YYYY, URL sync, quick picks, date clamping
 */

// Date formatting and parsing
export function formatDisplayDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

export function parseISODate(isoString: string): Date | undefined {
  try {
    const date = new Date(isoString + 'T00:00:00.000Z')
    return isNaN(date.getTime()) ? undefined : date
  } catch {
    return undefined
  }
}

export function parseDateString(dateString: string): Date | undefined {
  // Handle MM/DD/YYYY format
  const mmddyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateString.trim())
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return isNaN(date.getTime()) ? undefined : date
  }

  // Handle ISO format
  return parseISODate(dateString)
}

// Date clamping (min: today, max: +18 months)
export function clampDate(date: Date): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + 18)

  if (date < today) return today
  if (date > maxDate) return maxDate
  return date
}

// Quick pick date calculations
export function getQuickPickDates() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // This weekend (next Saturday)
  const thisWeekend = new Date(today)
  const daysUntilSaturday = (6 - today.getDay()) % 7
  thisWeekend.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday))

  // Next month (1st of next month)
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(1)

  return {
    thisWeekend: clampDate(thisWeekend),
    nextMonth: clampDate(nextMonth)
  }
}

// URL parameter utilities
export function getDateFromUrl(): string | null {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  const dateParam = urlParams.get('date')

  if (!dateParam) return null

  // Validate the date parameter is in YYYY-MM-DD format
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!isoDateRegex.test(dateParam)) return null

  // Validate it's a real date
  const date = parseISODate(dateParam)
  if (!date) return null

  return dateParam
}

export function setDateInUrl(isoDate: string | null): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  if (isoDate) {
    url.searchParams.set('date', isoDate)
  } else {
    url.searchParams.delete('date')
  }

  // Update URL without triggering a page reload
  window.history.pushState({}, '', url.toString())

  // Dispatch a custom event for components that need to react to URL changes
  window.dispatchEvent(new CustomEvent('dateUrlChanged', {
    detail: { date: isoDate }
  }))
}

// Date validation utilities
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

export function isDateInRange(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + 18)

  return date >= today && date <= maxDate
}

// Format date for input[type="date"] value
export function toInputDateValue(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Convert input[type="date"] value to Date
export function fromInputDateValue(value: string): Date | undefined {
  if (!value) return undefined
  return parseISODate(value)
}

// Flexible date range utilities (for ±1 week feature)
export function getFlexibleDateRange(centerDate: Date): { start: Date; end: Date } {
  const start = new Date(centerDate)
  start.setDate(start.getDate() - 7)

  const end = new Date(centerDate)
  end.setDate(end.getDate() + 7)

  return {
    start: clampDate(start),
    end: clampDate(end)
  }
}

// Check if date is weekend
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

// Get next/previous month for navigation
export function getAdjacentMonth(date: Date, direction: 'next' | 'prev'): Date {
  const newDate = new Date(date)
  if (direction === 'next') {
    newDate.setMonth(newDate.getMonth() + 1)
  } else {
    newDate.setMonth(newDate.getMonth() - 1)
  }
  return newDate
}

// Format date for accessibility (screen readers)
export function formatDateForA11y(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}

// Calendar navigation utilities
export function getCalendarNavigationLabel(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    year: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}

// Check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Get first day of month for calendar display
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Get last day of month for calendar display
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}