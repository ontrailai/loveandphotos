/**
 * Badge Component
 * Status indicators and labels
 */

import { clsx } from 'clsx'

const variants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blush-100 text-blush-800',
  secondary: 'bg-sage-100 text-sage-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  bronze: 'bg-gradient-to-r from-orange-100 to-amber-100 text-amber-900',
  silver: 'bg-gradient-to-r from-gray-100 to-slate-100 text-slate-900',
  gold: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-900',
  platinum: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

const Badge = ({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  dot = false,
  ...props
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5" />
      )}
      {children}
    </span>
  )
}

export default Badge
