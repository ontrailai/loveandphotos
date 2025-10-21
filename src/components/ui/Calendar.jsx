/**
 * Calendar Component - Simple DayPicker with project styling
 * Accessible calendar with keyboard navigation and Love & Photos design
 */

import * as React from "react"
import { DayPicker, useDayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { clsx } from "clsx"

const NavControls = ({
  className,
  style,
  previousMonth,
  nextMonth,
  onPreviousClick, // omitted via rest
  onNextClick,
  ...navProps
}) => {
  const {
    labels: { labelPrevious, labelNext },
    goToMonth,
  } = useDayPicker()

  const navClass = clsx(
    "absolute right-3 top-3 flex items-center space-x-2",
    className
  )

  const buttonClass = clsx(
    "h-7 w-7 bg-transparent p-0 text-dusty-400 hover:text-dusty-900",
    "inline-flex items-center justify-center rounded-md text-sm font-medium",
    "transition-colors hover:bg-dusty-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
    "disabled:pointer-events-none disabled:opacity-50"
  )

  const handlePrevious = (event) => {
    if (!previousMonth) return
    event.preventDefault()
    event.stopPropagation()
    goToMonth(previousMonth)
  }

  const handleNext = (event) => {
    if (!nextMonth) return
    event.preventDefault()
    event.stopPropagation()
    goToMonth(nextMonth)
  }

  return (
    <nav
      className={navClass}
      style={style}
      {...navProps}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={handlePrevious}
        disabled={!previousMonth}
        aria-label={labelPrevious(previousMonth)}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={handleNext}
        disabled={!nextMonth}
        aria-label={labelNext(nextMonth)}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

function Calendar({
  className,
  classNames = {},
  modifiersClassNames = {},
  styles = {},
  showOutsideDays = true,
  mode = "single",
  disablePastDates = true,
  disabledDates = [],
  selected,
  onSelect,
  ...props
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Combine past dates and custom disabled dates
  const disabled = []
  if (disablePastDates) {
    disabled.push({ before: today })
  }
  if (disabledDates && disabledDates.length > 0) {
    // Add individual disabled dates (photographer unavailable dates)
    disabled.push(...disabledDates)
  }

  const mergedClassNames = {
    months: "relative flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    month_caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium text-dusty-900",
    nav: "",
    month_grid: "w-full",
    weekdays: "text-dusty-600",
    weekday: "text-dusty-600 font-normal text-[0.8rem] text-center",
    week: "",
    day: "p-0 text-center align-middle focus-within:relative focus-within:z-20",
    day_button: clsx(
      "h-9 w-9 p-0 font-normal",
      "inline-flex items-center justify-center rounded-md text-sm",
      "transition-colors hover:bg-dusty-100 hover:text-dusty-900",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
      "disabled:pointer-events-none"
    ),
    ...classNames,
  }

  const mergedStyles = {
    month_grid: {
      borderCollapse: "separate",
      borderSpacing: "0.5rem 0.75rem",
    },
    ...styles,
  }

  const mergedModifiersClassNames = {
    selected:
      "[&>button]:bg-primary-500 [&>button]:font-medium [&>button:hover]:bg-primary-600 [&>button:focus-visible]:ring-2 [&>button:focus-visible]:ring-primary-500 [&>button]:text-white",
    today:
      "[&>button]:bg-dusty-100 [&>button]:text-dusty-900 [&>button]:font-semibold",
    outside:
      "text-dusty-400 [&>button]:text-dusty-400 [&>button]:opacity-50",
    disabled:
      "text-dusty-300 [&>button]:opacity-30 [&>button]:cursor-not-allowed",
    range_middle:
      "[&>button]:bg-dusty-100 [&>button]:text-dusty-900",
    hidden: "invisible",
    ...modifiersClassNames,
  }

  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      showOutsideDays={showOutsideDays}
      className={clsx("p-3", className)}
      classNames={mergedClassNames}
      styles={mergedStyles}
      modifiersClassNames={mergedModifiersClassNames}
      components={{
        Nav: NavControls,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
export default Calendar
