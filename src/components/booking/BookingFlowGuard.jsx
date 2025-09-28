/**
 * BookingFlowGuard Component
 * Route protection for booking wizard steps
 * Ensures users can only access steps they have prerequisites for
 */

import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBookingFlow } from '@contexts/BookingFlowContext'

const BookingFlowGuard = ({
  children,
  requiredStep,
  fallbackPath = null
}) => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const {
    bookingFlow,
    canAccessStep,
    initializeBookingFlow,
    BOOKING_STEPS
  } = useBookingFlow()

  useEffect(() => {
    // If no photographer ID, redirect to browse
    if (!photographerId) {
      navigate('/browse', { replace: true })
      return
    }

    // Initialize booking flow if not already done for this photographer
    if (bookingFlow.photographerId !== photographerId) {
      initializeBookingFlow(photographerId)
    }

    // Check if user can access the required step
    if (!canAccessStep(requiredStep)) {
      // Find the earliest step that can be accessed
      let redirectStep = 'schedule'

      for (const step of BOOKING_STEPS) {
        if (canAccessStep(step.id)) {
          redirectStep = step.id
        } else {
          break
        }
      }

      // Construct redirect path
      let redirectPath

      if (fallbackPath) {
        redirectPath = fallbackPath.replace(':photographerId', photographerId)
      } else if (redirectStep === 'schedule') {
        // Redirect to photographer profile for schedule step
        redirectPath = `/photographer/${photographerId}`
      } else {
        // Redirect to the appropriate booking wizard step
        redirectPath = `/booking/${photographerId}/${redirectStep}`
      }

      console.log(`BookingFlowGuard: Redirecting from ${requiredStep} to ${redirectPath}`)
      navigate(redirectPath, { replace: true })
      return
    }
  }, [
    photographerId,
    requiredStep,
    canAccessStep,
    navigate,
    bookingFlow.photographerId,
    initializeBookingFlow,
    BOOKING_STEPS,
    fallbackPath
  ])

  // Only render children if access is granted
  if (!photographerId || bookingFlow.photographerId !== photographerId || !canAccessStep(requiredStep)) {
    return null
  }

  return children
}

export default BookingFlowGuard