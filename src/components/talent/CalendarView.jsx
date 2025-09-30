import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, isBefore, startOfToday } from 'date-fns'

const CalendarView = ({ bookedDates = [], onDateSelect, onTimeSelect, selectedDate, selectedTime, readOnly = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const today = startOfToday()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  })

  const isDateBooked = (date) => {
    return bookedDates.some(bookedDate =>
      isSameDay(new Date(bookedDate), date)
    )
  }

  const isDateSelectable = (date) => {
    // In read-only mode, only booked dates are clickable
    if (readOnly) {
      return isSameMonth(date, currentMonth) && isDateBooked(date)
    }
    // In edit mode, only future unbooked dates are selectable
    return isSameMonth(date, currentMonth) &&
           !isBefore(date, today) &&
           !isDateBooked(date)
  }

  const handleDateClick = (date) => {
    if (!isDateSelectable(date)) return
    onDateSelect(date)
  }

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isBooked = isDateBooked(day)
          const isSelectable = isDateSelectable(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDateClick(day)}
              disabled={!isSelectable}
              className={`
                aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isTodayDate && !isSelected ? 'ring-2 ring-primary-400' : ''}
                ${readOnly && isBooked ? 'bg-primary-100 text-primary-700 cursor-pointer hover:bg-primary-200' : ''}
                ${!readOnly && isBooked ? 'bg-red-100 text-red-600 cursor-not-allowed' : ''}
                ${isSelectable && !isBooked && !readOnly ? 'hover:bg-primary-50 cursor-pointer' : ''}
                ${isSelected ? 'bg-primary-600 text-white' : isBooked && readOnly ? '' : 'text-gray-900'}
                ${!isSelectable && !isBooked ? 'text-gray-400 cursor-not-allowed' : ''}
              `}
              aria-label={format(day, 'MMMM d, yyyy')}
              aria-pressed={isSelected}
              aria-disabled={!isSelectable}
            >
              {format(day, 'd')}
              {readOnly && isBooked && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full" aria-hidden="true"></span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        {!readOnly && (
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-primary-600 mr-2"></div>
            <span className="text-gray-600">Selected</span>
          </div>
        )}
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded mr-2 ${readOnly ? 'bg-primary-100 relative' : 'bg-red-100'}`}>
            {readOnly && <span className="absolute top-0 right-0 w-2 h-2 bg-primary-600 rounded-full"></span>}
          </div>
          <span className="text-gray-600">{readOnly ? 'Confirmed Booking' : 'Booked'}</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded ring-2 ring-primary-400 mr-2"></div>
          <span className="text-gray-600">Today</span>
        </div>
      </div>
    </div>
  )
}

const TimeSelector = ({ selectedTime, onTimeSelect }) => {
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-primary-600" aria-hidden="true" />
        Select Time Slot
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {timeSlots.map(time => {
          const [startHour] = time.split(':')
          const endHour = String(parseInt(startHour) + 1).padStart(2, '0')
          const timeRange = `${time} - ${endHour}:00`
          const isSelected = selectedTime?.start === time

          return (
            <button
              key={time}
              type="button"
              onClick={() => onTimeSelect({ start: time, end: `${endHour}:00` })}
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              aria-label={`Select time slot ${timeRange}`}
              aria-pressed={isSelected}
            >
              {time}
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        Each time slot is 1 hour. Select your available time.
      </p>
    </div>
  )
}

export { CalendarView, TimeSelector }