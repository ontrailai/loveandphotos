/**
 * Input Component
 * Styled form input with label and error states
 */

import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(({
  label,
  error,
  icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-dusty-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            'block w-full rounded-lg border bg-white px-3 py-2.5',
            'text-dusty-900 placeholder-dusty-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blush-500 focus:border-transparent',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            {
              'border-gray-200 hover:border-gray-300': !error,
              'border-red-500 focus:ring-red-500': error,
              'pl-10': icon,
            },
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
