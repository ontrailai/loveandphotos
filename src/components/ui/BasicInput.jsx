/**
 * BasicInput Component
 * Simple input element that accepts className directly
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const BasicInput = forwardRef(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-lg border bg-white px-3 py-2.5',
        'text-dusty-900 placeholder-dusty-400',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'disabled:bg-gray-50 disabled:cursor-not-allowed',
        'border-gray-200 hover:border-gray-300',
        className
      )}
      {...props}
    />
  )
})

BasicInput.displayName = 'BasicInput'

export default BasicInput