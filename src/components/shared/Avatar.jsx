/**
 * Avatar Component
 * User avatar with fallback initials
 */

import { clsx } from 'clsx'
import { UserIcon } from 'lucide-react'

const sizes = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
}

const Avatar = ({ 
  src, 
  alt = '', 
  name = '', 
  size = 'md',
  className = '',
  badge,
  ...props 
}) => {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        className={clsx(
          'relative rounded-full bg-gradient-to-br from-blush-400 to-sage-400',
          'flex items-center justify-center overflow-hidden',
          sizes[size]
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || name}
            className="w-full h-full object-cover"
          />
        ) : name ? (
          <span className="font-medium text-white">
            {getInitials(name)}
          </span>
        ) : (
          <UserIcon className="w-1/2 h-1/2 text-white" />
        )}
      </div>
      {badge && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  )
}

export default Avatar
