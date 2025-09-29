/**
 * Date utility functions for photographers page
 */

import { format } from 'date-fns'

export const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d, yyyy')
}

export const formatTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'h:mm a')
}

export const formatDateTime = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(dateObj)} at ${formatTime(dateObj)}`
}

export const isToday = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return dateObj.toDateString() === today.toDateString()
}

export const isTomorrow = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return dateObj.toDateString() === tomorrow.toDateString()
}

export const getDayName = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isToday(dateObj)) return 'Today'
  if (isTomorrow(dateObj)) return 'Tomorrow'
  return format(dateObj, 'EEEE')
}

export const setDateInUrl = (isoDate: string | null) => {
  const url = new URL(window.location.href)

  if (isoDate) {
    url.searchParams.set('date', isoDate)
  } else {
    url.searchParams.delete('date')
  }

  window.history.pushState({}, '', url.toString())

  // Dispatch custom event for other components
  window.dispatchEvent(new CustomEvent('dateUrlChanged', { detail: { date: isoDate } }))
}

export const getDateFromUrl = () => {
  const url = new URL(window.location.href)
  return url.searchParams.get('date') || ''
}