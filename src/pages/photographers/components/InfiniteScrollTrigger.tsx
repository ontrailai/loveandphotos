/**
 * InfiniteScrollTrigger Component
 * Invisible trigger element for infinite scroll using IntersectionObserver
 */

import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { clsx } from 'clsx'

interface InfiniteScrollTriggerProps {
  onIntersect: () => void
  isLoading?: boolean
  rootMargin?: string
  threshold?: number
  className?: string
}

/**
 * InfiniteScrollTrigger component
 */
export function InfiniteScrollTrigger({
  onIntersect,
  isLoading = false,
  rootMargin = '100px',
  threshold = 0.1,
  className
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    const currentTrigger = triggerRef.current

    if (!currentTrigger || isLoading) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          onIntersect()
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(currentTrigger)

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger)
      }
    }
  }, [onIntersect, isLoading, rootMargin, threshold])

  // Reset the trigger when loading completes
  useEffect(() => {
    if (!isLoading) {
      hasTriggeredRef.current = false
    }
  }, [isLoading])

  return (
    <div
      ref={triggerRef}
      className={clsx('flex items-center justify-center py-8', className)}
    >
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex flex-col items-center space-y-3"
        >
          {/* Loading spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-[#FF4D6D]/30 border-t-[#FF4D6D] rounded-full"
          />

          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-500 font-medium"
          >
            Loading more photographers...
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default InfiniteScrollTrigger