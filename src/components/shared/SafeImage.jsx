/**
 * SafeImage Component
 * Robust image component with fallback support and error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { ImageIcon, AlertCircleIcon } from 'lucide-react'

// Default fallback images for different contexts
const FALLBACK_IMAGES = {
  portfolio: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
  cover: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80',
  default: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Cg fill="%239ca3af"%3E%3Cpath d="M200 125c-13.8 0-25 11.2-25 25s11.2 25 25 25 25-11.2 25-25-11.2-25-25-25zm0 40c-8.3 0-15-6.7-15-15s6.7-15 15-15 15 6.7 15 15-6.7 15-15 15z"/%3E%3Cpath d="M260 180H140c-5.5 0-10 4.5-10 10v60c0 5.5 4.5 10 10 10h120c5.5 0 10-4.5 10-10v-60c0-5.5-4.5-10-10-10zm0 70H140v-60h120v60z"/%3E%3C/g%3E%3C/svg%3E'
}

// Validate if URL is likely to be valid
const isValidImageUrl = (url) => {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    // Check for common image hosting domains
    const validDomains = [
      'unsplash.com',
      'images.unsplash.com',
      'supabase.co',
      'supabase.io',
      'githubusercontent.com',
      'googleusercontent.com',
      'cloudinary.com',
      'imgur.com',
      'gravatar.com'
    ]

    const isValidDomain = validDomains.some(domain => urlObj.hostname.includes(domain))
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname)
    const hasImageParam = urlObj.pathname.includes('photo') || urlObj.searchParams.has('w')

    return isValidDomain || hasImageExtension || hasImageParam
  } catch {
    // If URL parsing fails, check if it's a relative path or data URL
    return url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')
  }
}

const SafeImage = ({
  src,
  alt = '',
  fallbackType = 'default',
  fallbackSrc = null,
  className = '',
  imgClassName = '',
  onLoad = null,
  onError = null,
  loading = 'lazy',
  showErrorIcon = false,
  aspectRatio = null,
  objectFit = 'cover',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null)
  const [imageStatus, setImageStatus] = useState('loading')
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 2

  // Get appropriate fallback image
  const getFallbackImage = useCallback(() => {
    if (fallbackSrc) return fallbackSrc
    return FALLBACK_IMAGES[fallbackType] || FALLBACK_IMAGES.default
  }, [fallbackSrc, fallbackType])

  // Initialize image source
  useEffect(() => {
    if (!src) {
      setImageSrc(getFallbackImage())
      setImageStatus('fallback')
      return
    }

    // Validate URL before attempting to load
    if (!isValidImageUrl(src)) {
      console.warn(`Invalid image URL detected: ${src}`)
      setImageSrc(getFallbackImage())
      setImageStatus('fallback')
      return
    }

    setImageSrc(src)
    setImageStatus('loading')
    setRetryCount(0)
  }, [src, getFallbackImage])

  // Handle image load success
  const handleImageLoad = useCallback((e) => {
    setImageStatus('loaded')
    if (onLoad) onLoad(e)
  }, [onLoad])

  // Handle image load error
  const handleImageError = useCallback((e) => {
    console.error(`Image failed to load: ${imageSrc}`, {
      src: imageSrc,
      alt,
      retryCount,
      error: e
    })

    if (retryCount < maxRetries && imageSrc !== getFallbackImage()) {
      // Retry with a delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        setImageStatus('loading')
      }, 1000 * (retryCount + 1))
    } else {
      // Use fallback after retries exhausted
      setImageSrc(getFallbackImage())
      setImageStatus('fallback')
      if (onError) onError(e)
    }
  }, [imageSrc, alt, retryCount, maxRetries, getFallbackImage, onError])

  const containerClasses = clsx(
    'relative overflow-hidden bg-gray-100',
    className
  )

  const imageClasses = clsx(
    'w-full h-full',
    `object-${objectFit}`,
    imageStatus === 'loading' && 'animate-pulse',
    imgClassName
  )

  return (
    <div
      className={containerClasses}
      style={aspectRatio ? { aspectRatio } : undefined}
      {...props}
    >
      {imageStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <ImageIcon className="w-8 h-8 text-gray-400 animate-pulse" />
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        className={imageClasses}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={loading}
      />

      {imageStatus === 'fallback' && showErrorIcon && (
        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1">
          <AlertCircleIcon className="w-4 h-4 text-amber-500" />
        </div>
      )}
    </div>
  )
}

export default SafeImage