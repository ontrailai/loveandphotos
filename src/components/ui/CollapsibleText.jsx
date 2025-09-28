/**
 * CollapsibleText Component
 * Expandable text with "Read more/less" functionality
 * Supports smooth animations and full accessibility
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { clsx } from 'clsx'

const CollapsibleText = ({
  children,
  maxLength = 150,
  className = '',
  expandText = 'Read more',
  collapseText = 'Read less',
  expandOnDesktop = false, // If true, starts expanded on larger screens
  animationDuration = 300,
  showIcon = true,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [shouldCollapse, setShouldCollapse] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState('auto')

  // Check if we need to enable responsiveness
  useEffect(() => {
    if (expandOnDesktop) {
      const handleResize = () => {
        const isDesktop = window.innerWidth >= 1024 // lg breakpoint
        setIsExpanded(isDesktop)
      }

      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [expandOnDesktop])

  // Determine if text should be collapsible
  useEffect(() => {
    if (typeof children === 'string') {
      setShouldCollapse(children.length > maxLength)
    } else {
      // For React elements, always allow collapsing
      setShouldCollapse(true)
    }
  }, [children, maxLength])

  // Handle height animation
  useEffect(() => {
    if (contentRef.current) {
      if (isExpanded) {
        setContentHeight(`${contentRef.current.scrollHeight}px`)
      } else {
        setContentHeight('auto')
      }
    }
  }, [isExpanded])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExpanded()
    }
  }

  if (!shouldCollapse) {
    // If text is short enough, render normally without collapse functionality
    return (
      <div className={className} {...props}>
        {children}
      </div>
    )
  }

  // Determine display content
  let displayContent = children
  if (typeof children === 'string' && !isExpanded) {
    displayContent = children.slice(0, maxLength) + (children.length > maxLength ? '...' : '')
  }

  return (
    <div className={clsx('relative', className)} {...props}>
      {/* Content container with height animation */}
      <div
        ref={contentRef}
        className={clsx(
          'transition-all ease-in-out overflow-hidden',
          {
            'max-h-none': isExpanded,
            'max-h-20': !isExpanded && typeof children !== 'string'
          }
        )}
        style={{
          transitionDuration: `${animationDuration}ms`,
          height: isExpanded && contentHeight !== 'auto' ? contentHeight : 'auto'
        }}
      >
        <div className="leading-relaxed">
          {typeof children === 'string' ? (
            <span>{displayContent}</span>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className={clsx(
          'mt-2 inline-flex items-center text-sm font-medium transition-colors duration-200',
          'text-primary-600 hover:text-primary-700 focus:text-primary-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-1 py-0.5',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-expanded={isExpanded}
        aria-controls="collapsible-content"
      >
        <span className="mr-1">
          {isExpanded ? collapseText : expandText}
        </span>
        {showIcon && (
          isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 transition-transform duration-200" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
          )
        )}
      </button>

      {/* Screen reader helper text */}
      <span className="sr-only" aria-live="polite">
        {isExpanded ? 'Content expanded' : 'Content collapsed'}
      </span>
    </div>
  )
}

export default CollapsibleText