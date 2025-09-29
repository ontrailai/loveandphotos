/**
 * Dialog Component
 * Custom modal dialog matching project styling
 */

import React, { useEffect } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'

/**
 * Dialog Root Component
 */
export function Dialog({ children, open, onOpenChange }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-lg bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

/**
 * Dialog Content Component
 */
export function DialogContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Dialog Header Component
 */
export function DialogHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Dialog Title Component
 */
export function DialogTitle({ children, className = '' }) {
  return (
    <h2 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  )
}

/**
 * Dialog Description Component
 */
export function DialogDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  )
}

/**
 * Dialog Close Button Component
 */
export function DialogClose({ onClose, className = '' }) {
  return (
    <button
      onClick={onClose}
      className={`absolute right-4 top-4 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 ${className}`}
      aria-label="Close dialog"
    >
      <X size={16} />
    </button>
  )
}

/**
 * Dialog Trigger Component
 */
export function DialogTrigger({ children, asChild, onClick }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e)
        onClick?.(e)
      }
    })
  }

  return (
    <button onClick={onClick}>
      {children}
    </button>
  )
}