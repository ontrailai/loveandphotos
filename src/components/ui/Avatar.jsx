/**
 * Avatar Component
 * Displays user profile photos with fallback
 */

import React from 'react'
import { clsx } from 'clsx'

const avatarSizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
}

const Avatar = React.forwardRef(({
  className,
  size = 'md',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'relative flex shrink-0 overflow-hidden rounded-full',
        avatarSizes[size],
        className
      )}
      {...props}
    />
  )
})
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef(({
  className,
  alt = '',
  ...props
}, ref) => {
  return (
    <img
      ref={ref}
      className={clsx('aspect-square h-full w-full object-cover', className)}
      alt={alt}
      {...props}
    />
  )
})
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'flex h-full w-full items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300',
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }