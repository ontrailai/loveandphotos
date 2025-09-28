/**
 * Calendar Component
 * Date selection with month/year navigation
 */

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import Button from './Button'

const Calendar = ({
  value,
  onChange,
  disablePastDates = true,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(value || new Date())
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate()
  }, [currentYear, currentMonth])

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay()
  }, [currentYear, currentMonth])

  const calendarDays = useMemo(() => {
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [firstDayOfMonth, daysInMonth])

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1)
    } else {
      newDate.setMonth(currentMonth + 1)
    }
    setCurrentDate(newDate)
  }

  const handleDateClick = (day) => {
    const selectedDate = new Date(currentYear, currentMonth, day)
    selectedDate.setHours(0, 0, 0, 0)

    if (disablePastDates && selectedDate < today) {
      return
    }

    onChange?.(selectedDate)
  }

  const isDateDisabled = (day) => {
    if (!disablePastDates) return false
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  const isDateSelected = (day) => {
    if (!value) return false
    const date = new Date(currentYear, currentMonth, day)
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    )
  }

  const isToday = (day) => {
    const date = new Date(currentYear, currentMonth, day)
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg p-4 shadow-sm', className)}>
      {/* Header with month/year navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-lg font-semibold text-dusty-900">
          {monthNames[currentMonth]} {currentYear}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-sm font-medium text-dusty-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="h-8" />
          }

          const disabled = isDateDisabled(day)
          const selected = isDateSelected(day)
          const todayDate = isToday(day)

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={disabled}
              className={clsx(
                'h-8 w-8 rounded-md text-sm font-medium transition-colors',
                {
                  'text-dusty-400 cursor-not-allowed opacity-50': disabled,
                  'text-dusty-900 hover:bg-dusty-100 hover:text-dusty-900 cursor-pointer': !disabled,
                  'bg-primary-500 text-white hover:bg-primary-600': selected,
                  'bg-dusty-100 text-dusty-900 font-bold': todayDate && !selected
                }
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar