/**
 * SafeAvatar Component
 * Enhanced avatar with smart fallbacks and error handling
 */

import { useState, useCallback, useMemo } from 'react'
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

// Generate consistent color based on name
const getColorFromName = (name) => {
  if (!name) return 'from-gray-400 to-gray-500'

  const colors = [
    'from-primary-400 to-primary-500',
    'from-sage-400 to-sage-500',
    'from-dusty-400 to-dusty-500',
    'from-purple-400 to-purple-500',
    'from-blue-400 to-blue-500',
    'from-green-400 to-green-500',
    'from-yellow-400 to-yellow-500',
    'from-pink-400 to-pink-500',
    'from-indigo-400 to-indigo-500',
    'from-teal-400 to-teal-500'
  ]

  // Generate consistent index from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
const getInitials = (name) => {
  if (!name) return ''

  const cleanName = name.trim()
  const parts = cleanName.split(/\s+/)

  if (parts.length === 1) {
    // Single word - take first two letters
    return cleanName.slice(0, 2).toUpperCase()
  } else {
    // Multiple words - take first letter of first two words
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase()
  }
}

// Validate image URL
const isValidImageUrl = (url) => {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    // Check for common avatar/profile image patterns
    const validPatterns = [
      'avatar',
      'profile',
      'user',
      'photo',
      'gravatar',
      'githubusercontent',
      'googleusercontent',
      'supabase'
    ]

    const urlString = urlObj.toString().toLowerCase()
    return validPatterns.some(pattern => urlString.includes(pattern)) ||
           /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(urlString)
  } catch {
    // Relative path or invalid URL
    return url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')
  }
}

const SafeAvatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  badge = null,
  badgeColor = 'green',
  showFallbackIcon = true,
  forceInitials = false,
  ...props
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Determine what to display
  const validSrc = useMemo(() => {
    if (!src || imageError || forceInitials) return null
    return isValidImageUrl(src) ? src : null
  }, [src, imageError, forceInitials])

  const initials = useMemo(() => getInitials(name), [name])
  const bgColor = useMemo(() => getColorFromName(name), [name])

  // Handle image load error
  const handleImageError = useCallback((e) => {
    console.warn(`Avatar image failed to load: ${src}`, {
      name,
      alt,
      error: e
    })
    setImageError(true)
    setImageLoading(false)
  }, [src, name, alt])

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
  }, [])

  const badgeColors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500'
  }

  return (
    <div className={clsx('relative inline-block', className)}>
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center overflow-hidden',
          'transition-all duration-200',
          !validSrc && `bg-gradient-to-br ${bgColor}`,
          validSrc && 'bg-gray-200',
          sizes[size]
        )}
        {...props}
      >
        {validSrc ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
              src={validSrc}
              alt={alt || name}
              className={clsx(
                "w-full h-full object-cover",
                imageLoading && "opacity-0",
                !imageLoading && "opacity-100 transition-opacity duration-200"
              )}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : initials ? (
          <span className="font-medium text-white select-none">
            {initials}
          </span>
        ) : showFallbackIcon ? (
          <UserIcon className="w-1/2 h-1/2 text-white opacity-90" />
        ) : null}
      </div>

      {badge && (
        <div className={clsx(
          "absolute -bottom-1 -right-1 rounded-full border-2 border-white",
          typeof badge === 'boolean' ? clsx('w-3 h-3', badgeColors[badgeColor]) : '',
        )}>
          {typeof badge !== 'boolean' && badge}
        </div>
      )}
    </div>
  )
}

export default SafeAvatar