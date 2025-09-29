/**
 * Enhanced DatePicker Component - Magic UI Design with Calendar Grid
 * Desktop: Popover anchored to input | Mobile: Bottom sheet (full-bleed)
 * Features: Calendar grid layout, quick picks, availability dots, URL sync, accessibility
 */

import React, { useState, useRef, useEffect, useCallback, createContext, useContext, useId } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { cn } from '@/lib/utils'
import Button from '@components/ui/Button'
import {
  formatDisplayDate,
  parseISODate,
  clampDate,
  getCalendarNavigationLabel,
  isSameDay,
  getFirstDayOfMonth,
  formatDateForA11y
} from './date-utils'

// Hook for click outside functionality
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  mouseEvent: 'mousedown' | 'mouseup' = 'mousedown'
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      const target = event.target;

      if (!el || !target || el.contains(target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener(mouseEvent, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, mouseEvent]);
}

// Hook for mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Types and Context
interface DatePickerContextValue {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  availability: Record<string, 'high' | 'med' | 'low' | 'unknown'>;
}

interface DatePickerProps {
  value?: string // ISO date string YYYY-MM-DD
  onChange: (isoDate: string | null) => void
  onClear?: () => void
  availability?: Record<string, 'high' | 'med' | 'low' | 'unknown'>
  placeholder?: string
  className?: string
  disabled?: boolean
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

function useDatePickerContext() {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error('useDatePickerContext must be used within DatePickerProvider');
  }
  return context;
}

// Calendar Grid Component
function CalendarGrid() {
  const { selectedDate, setSelectedDate, currentMonth, availability } = useDatePickerContext();

  const today = new Date();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    const clampedDate = clampDate(date);
    setSelectedDate(clampedDate);
  };

  const handleKeyDown = (event: React.KeyboardEvent, day: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDateClick(day);
    }
  };

  const renderAvailabilityDot = (date: Date) => {
    if (!availability) return null;

    const dateKey = date.toISOString().split('T')[0];
    const level = availability[dateKey];
    if (!level) return null;

    const colors = {
      high: 'bg-green-500',
      med: 'bg-yellow-500',
      low: 'bg-red-500',
      unknown: 'bg-gray-400'
    };

    return (
      <div
        className={cn('absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full', colors[level])}
        title={`${level === 'med' ? 'Medium' : level} availability`}
        aria-label={`${level === 'med' ? 'Medium' : level} availability`}
      />
    );
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const isSelected = selectedDate && isSameDay(selectedDate, date);
      const isToday = isSameDay(today, date);
      const hasAvailability = availability && availability[dateString];
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <motion.button
          key={day}
          onClick={() => handleDateClick(day)}
          onKeyDown={(e) => handleKeyDown(e, day)}
          disabled={isPast}
          className={cn(
            'relative h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200',
            'hover:bg-gray-100 hover:text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-[#FF4D6D] focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isSelected && 'bg-[#FF4D6D] text-white hover:bg-[#FF4D6D]/90',
            isToday && !isSelected && 'bg-gray-100 text-gray-900 font-bold'
          )}
          whileHover={!isPast ? { scale: 1.05 } : {}}
          whileTap={!isPast ? { scale: 0.95 } : {}}
          aria-label={formatDateForA11y(date)}
        >
          {day}
          {hasAvailability && !isSelected && renderAvailabilityDot(date)}
        </motion.button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      <motion.div
        className="grid grid-cols-7 gap-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderCalendarDays()}
      </motion.div>
    </div>
  );
}

// Calendar Header Component
function CalendarHeader() {
  const { currentMonth, setCurrentMonth } = useDatePickerContext();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {getCalendarNavigationLabel(currentMonth)}
      </h2>
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


// Desktop Popover Content
function DesktopCalendarContent() {
  const { availability } = useDatePickerContext();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-80 p-4 bg-white border border-gray-200 rounded-2xl shadow-xl"
    >
      <CalendarHeader />
      <CalendarGrid />

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
    </motion.div>
  );
}

// Mobile Bottom Sheet Content
function MobileCalendarContent() {
  const { setIsOpen, availability } = useDatePickerContext();

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Select Date</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Done
        </Button>
      </div>

      {/* Sheet handle */}
      <div className="flex justify-center pb-4">
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>

      <CalendarHeader />
      <CalendarGrid />

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
    </motion.div>
  );
}

// Main Enhanced Date Picker Component
export function DatePicker({
  value,
  onChange,
  onClear,
  availability = {},
  placeholder = 'Select date',
  className,
  disabled = false
}: DatePickerProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    value ? parseISODate(value) || null : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const uniqueId = useId();

  const selectedDate = internalSelectedDate;

  // Sync with prop changes
  useEffect(() => {
    const newDate = value ? parseISODate(value) || null : null;
    setInternalSelectedDate(newDate);
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    setInternalSelectedDate(date);
    if (date) {
      onChange(date.toISOString().split('T')[0]);
    } else {
      onChange(null);
      onClear?.();
    }
    if (!isMobile) {
      setIsOpen(false);
    }
  };

  // Click outside handler for desktop
  useClickOutside(contentRef, () => {
    if (!isMobile) {
      setIsOpen(false);
    }
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const contextValue: DatePickerContextValue = {
    selectedDate,
    setSelectedDate: handleDateChange,
    currentMonth,
    setCurrentMonth,
    isOpen,
    setIsOpen,
    availability
  };

  const formatDate = (date: Date) => {
    return formatDisplayDate(date);
  };

  return (
    <DatePickerContext.Provider value={contextValue}>
      <MotionConfig transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}>
        <div className={cn('relative', className)}>
          {/* Trigger Button */}
          <motion.button
            ref={triggerRef}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3',
              'bg-white border border-gray-300 rounded-2xl',
              'text-left text-gray-900 font-medium',
              'focus:outline-none focus:ring-2 focus:ring-[#FF4D6D]/50 focus:border-[#FF4D6D]/50',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isOpen && 'ring-2 ring-[#FF4D6D]/50 border-[#FF4D6D]/50'
            )}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            aria-expanded={isOpen}
            aria-controls={`calendar-content-${uniqueId}`}
            aria-label="Select date"
          >
            <div className="flex items-center gap-3">
              <CalendarIcon className={cn(
                'w-5 h-5',
                isOpen ? 'text-[#FF4D6D]' : 'text-gray-400'
              )} />
              <span className={selectedDate ? 'text-gray-900' : 'text-gray-500'}>
                {selectedDate ? formatDate(selectedDate) : placeholder}
              </span>
            </div>
          </motion.button>

          {/* Desktop Popover */}
          {!isMobile && (
            <AnimatePresence>
              {isOpen && (
                <div
                  ref={contentRef}
                  id={`calendar-content-${uniqueId}`}
                  className="absolute top-full left-0 z-50 mt-2"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Calendar"
                >
                  <DesktopCalendarContent />
                </div>
              )}
            </AnimatePresence>
          )}

          {/* Mobile Bottom Sheet */}
          {isMobile && (
            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/50"
                    onClick={() => setIsOpen(false)}
                  />
                  {/* Bottom Sheet */}
                  <MobileCalendarContent />
                </>
              )}
            </AnimatePresence>
          )}
        </div>
      </MotionConfig>
    </DatePickerContext.Provider>
  );
}

export default DatePicker