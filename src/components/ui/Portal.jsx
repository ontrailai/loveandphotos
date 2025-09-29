/**
 * Portal Component
 * Renders children at the document root level to avoid stacking context issues
 */

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

/**
 * Portal wrapper component that renders children at document root
 * Used for dropdowns, modals, and other overlays that need to escape stacking contexts
 */
export function Portal({ children, container }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  const portalRoot = container || document.body

  return createPortal(children, portalRoot)
}

/**
 * Hook to get a portal container element
 * Creates a portal root div if it doesn't exist
 */
export function usePortalRoot(id = 'portal-root') {
  const [portalRoot, setPortalRoot] = useState(null)

  useEffect(() => {
    let root = document.getElementById(id)

    if (!root) {
      root = document.createElement('div')
      root.id = id
      root.style.position = 'relative'
      root.style.zIndex = '9999'
      document.body.appendChild(root)
    }

    setPortalRoot(root)

    return () => {
      // Don't remove the root on cleanup, keep it for other portals
    }
  }, [id])

  return portalRoot
}