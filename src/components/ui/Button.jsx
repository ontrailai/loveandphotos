/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */

import { forwardRef } from 'react'
import { clsx } from 'clsx'

const variants = {
  primary: 'bg-blush-500 text-white hover:bg-blush-600 focus:ring-blush-500',
  secondary: 'bg-sage-500 text-white hover:bg-sage-600 focus:ring-sage-500',
  outline: 'border-2 border-current text-dusty-700 hover:bg-dusty-50 focus:ring-dusty-500',
  ghost: 'text-dusty-700 hover:bg-dusty-50 focus:ring-dusty-500',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
}

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  children,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200 transform active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
