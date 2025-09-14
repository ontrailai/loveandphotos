/**
 * BrandLogo Component
 * Official Love & Photos brand logo with accessibility features
 */

import { useState } from 'react'
import { clsx } from 'clsx'

const BrandLogo = ({
  className = '',
  size = 'md',
  variant = 'full', // 'full' | 'icon' | 'text'
  theme = 'auto', // 'light' | 'dark' | 'auto'
  showText = true,
  alt = 'Love & Photos logo',
  ariaLabel = 'Love & Photos',
  focusable = false,
  lazy = true,
  onClick = null,
  href = null
}) => {
  const [imageError, setImageError] = useState(false)

  // Size presets - adjusted for better visibility
  const sizes = {
    xs: { logo: 'h-8 w-8', text: 'text-sm' },
    sm: { logo: 'h-10 w-10', text: 'text-base' },
    md: { logo: 'h-12 w-12', text: 'text-lg' },
    lg: { logo: 'h-40 w-40', text: 'text-2xl' },  // Increased to h-40 (160px) for navbar
    xl: { logo: 'h-48 w-48', text: 'text-3xl' },
    '2xl': { logo: 'h-56 w-56', text: 'text-4xl' }
  }

  const currentSize = sizes[size] || sizes.md

  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
  }

  const logoElement = (
    <>
      {/* Primary SVG logo */}
      {!imageError ? (
        <img
          src="/branding/logo.svg"
          alt={alt}
          className={clsx(
            currentSize.logo,
            'object-contain',
            variant === 'icon' && 'mr-0',
            variant !== 'icon' && showText && 'mr-3'
          )}
          onError={handleImageError}
          loading={lazy ? 'lazy' : 'eager'}
          aria-label={ariaLabel}
          {...(focusable === false && { tabIndex: -1 })}
        />
      ) : (
        // PNG fallback
        <img
          src="/branding/logo.png"
          alt={alt}
          className={clsx(
            currentSize.logo,
            'object-contain',
            variant === 'icon' && 'mr-0',
            variant !== 'icon' && showText && 'mr-3'
          )}
          loading={lazy ? 'lazy' : 'eager'}
          aria-label={ariaLabel}
          {...(focusable === false && { tabIndex: -1 })}
        />
      )}

      {/* Brand text */}
      {variant !== 'icon' && showText && (
        <span className={clsx(
          'font-display font-semibold',
          currentSize.text,
          theme === 'light' && 'text-dusty-900',
          theme === 'dark' && 'text-white',
          theme === 'auto' && 'text-dusty-900 dark:text-white'
        )}>
          Love & Photos
        </span>
      )}
    </>
  )

  const containerClasses = clsx(
    'inline-flex items-center',
    onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
    className
  )

  // Return as link if href provided
  if (href) {
    return (
      <a
        href={href}
        className={containerClasses}
        aria-label={`${ariaLabel} - Go to homepage`}
      >
        {logoElement}
      </a>
    )
  }

  // Return as button if onClick provided
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={containerClasses}
        aria-label={ariaLabel}
        type="button"
      >
        {logoElement}
      </button>
    )
  }

  // Return as div for static display
  return (
    <div className={containerClasses} aria-label={ariaLabel}>
      {logoElement}
    </div>
  )
}

// Compact version for constrained spaces
export const BrandLogoCompact = (props) => (
  <BrandLogo {...props} variant="icon" showText={false} />
)

// Text-only version
export const BrandLogoText = ({ className = '', size = 'md', theme = 'auto' }) => {
  const sizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  }

  return (
    <span className={clsx(
      'font-display font-semibold',
      sizes[size] || sizes.md,
      theme === 'light' && 'text-dusty-900',
      theme === 'dark' && 'text-white',
      theme === 'auto' && 'text-dusty-900 dark:text-white',
      className
    )}>
      Love & Photos
    </span>
  )
}

export default BrandLogo