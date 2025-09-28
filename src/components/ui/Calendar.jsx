/**
 * Calendar Component - Simple DayPicker with project styling
 * Accessible calendar with keyboard navigation and Love & Photos design
 */

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { clsx } from "clsx"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = "single",
  disablePastDates = true,
  selected,
  onSelect,
  ...props
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const disabled = disablePastDates ? { before: today } : undefined

  return (
    <DayPicker
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      disabled={disabled}
      showOutsideDays={showOutsideDays}
      className={clsx("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-dusty-900",
        nav: "space-x-1 flex items-center",
        nav_button: clsx(
          "h-7 w-7 bg-transparent p-0 text-dusty-400 hover:text-dusty-900",
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "transition-colors hover:bg-dusty-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          "disabled:pointer-events-none disabled:opacity-50"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-dusty-600 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: clsx(
          "h-9 w-9 text-center text-sm p-0 relative",
          "focus-within:relative focus-within:z-20"
        ),
        day: clsx(
          "h-9 w-9 p-0 font-normal",
          "inline-flex items-center justify-center rounded-md text-sm",
          "transition-colors hover:bg-dusty-100 hover:text-dusty-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        ),
        day_selected: "bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-500 focus:text-white",
        day_today: "bg-dusty-100 text-dusty-900 font-semibold",
        day_outside: "text-dusty-400 opacity-50",
        day_disabled: "text-dusty-300 opacity-30 cursor-not-allowed",
        day_range_middle: "bg-dusty-100 text-dusty-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
export default Calendar