/**
 * BookingFlowContext
 * Multi-step booking wizard state management
 * Manages schedule, package, and location details with localStorage persistence
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const BookingFlowContext = createContext({})

// Step configuration
const BOOKING_STEPS = [
  { id: 'schedule', label: 'Schedule Details', order: 0 },
  { id: 'package', label: 'Package Details', order: 1 },
  { id: 'location', label: 'Locations', order: 2 },
  { id: 'addons', label: 'Add-Ons', order: 3 }
]

// Generate or retrieve a persistent session ID
const getBookingSessionId = () => {
  let sessionId = sessionStorage.getItem('booking_session_id')
  if (!sessionId) {
    sessionId = `booking_${uuidv4()}`
    sessionStorage.setItem('booking_session_id', sessionId)
  }
  return sessionId
}

export const useBookingFlow = () => {
  const context = useContext(BookingFlowContext)
  if (!context) {
    throw new Error('useBookingFlow must be used within BookingFlowProvider')
  }
  return context
}

export const BookingFlowProvider = ({ children }) => {
  const [sessionId] = useState(getBookingSessionId)
  const [bookingFlow, setBookingFlow] = useState({
    photographerId: null,
    currentStep: 'schedule',
    completedSteps: [],

    scheduleDetails: {
      date: null,
      timeOfDay: null,
      selectedAt: null
    },

    packageDetails: {
      packageType: null, // 'monthly' | 'deposit'
      packagePrice: null, // Base package price
      hoursBooked: null, // Number of hours for the package
      isPhotoVideo: false, // Whether package includes video
      packageTitle: null, // Display title for the package
      selectedAt: null
    },

    locationDetails: {
      locationId: null,
      locationTitle: null,
      locationVibe: null,
      selectedAt: null
    },

    addonsDetails: {
      selectedAddons: [], // Array of {id, title, price, qty}
      totalAddonsPrice: 0, // Computed total of all add-ons
      selectedAt: null
    },

    validationState: {
      schedule: false,
      package: false,
      location: false,
      addons: false
    }
  })

  // Generate localStorage key for a specific photographer
  const getStorageKey = useCallback((photographerId) => {
    return `booking_flow_${photographerId}_${sessionId}`
  }, [sessionId])

  // Load existing booking flow from localStorage
  const loadBookingFlow = useCallback((photographerId) => {
    if (!photographerId) return null

    try {
      const stored = localStorage.getItem(getStorageKey(photographerId))
      if (stored) {
        const parsed = JSON.parse(stored)
        // Validate that the stored data matches current photographer
        if (parsed.photographerId === photographerId) {
          return parsed
        }
      }
    } catch (error) {
      console.error('Failed to load booking flow:', error)
    }
    return null
  }, [getStorageKey])

  // Save booking flow to localStorage
  const saveBookingFlow = useCallback((flow) => {
    if (!flow.photographerId) return

    try {
      localStorage.setItem(getStorageKey(flow.photographerId), JSON.stringify({
        ...flow,
        updatedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Failed to save booking flow:', error)
    }
  }, [getStorageKey])

  // Auto-save whenever booking flow changes
  useEffect(() => {
    if (bookingFlow.photographerId) {
      saveBookingFlow(bookingFlow)
    }
  }, [bookingFlow, saveBookingFlow])

  // Initialize booking flow for a photographer
  const initializeBookingFlow = useCallback((photographerId, initialData = {}) => {
    // Try to load existing flow first
    const existingFlow = loadBookingFlow(photographerId)

    if (existingFlow) {
      setBookingFlow(existingFlow)
      return existingFlow
    }

    // Create new flow
    const newFlow = {
      photographerId,
      currentStep: 'schedule',
      completedSteps: [],
      scheduleDetails: {
        date: initialData.date || null,
        timeOfDay: initialData.timeOfDay || null,
        selectedAt: initialData.date || initialData.timeOfDay ? new Date().toISOString() : null
      },
      packageDetails: {
        packageType: null,
        packagePrice: null,
        hoursBooked: null,
        isPhotoVideo: false,
        packageTitle: null,
        selectedAt: null
      },
      locationDetails: {
        locationId: null,
        locationTitle: null,
        locationVibe: null,
        selectedAt: null
      },
      addonsDetails: {
        selectedAddons: [],
        totalAddonsPrice: 0,
        selectedAt: null
      },
      validationState: {
        schedule: !!(initialData.date && initialData.timeOfDay),
        package: false,
        location: false,
        addons: false
      }
    }

    // If we have initial schedule data, mark schedule as completed
    if (newFlow.validationState.schedule) {
      newFlow.completedSteps = ['schedule']
      newFlow.currentStep = 'package'
    }

    setBookingFlow(newFlow)
    return newFlow
  }, [loadBookingFlow, sessionId])

  // Update schedule details
  const updateScheduleDetails = useCallback((date, timeOfDay) => {
    setBookingFlow(prev => {
      const scheduleValid = !!(date && timeOfDay)
      const newCompletedSteps = scheduleValid
        ? [...new Set([...prev.completedSteps, 'schedule'])]
        : prev.completedSteps.filter(step => step !== 'schedule')

      return {
        ...prev,
        scheduleDetails: {
          date,
          timeOfDay,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        currentStep: scheduleValid ? 'package' : 'schedule',
        validationState: {
          ...prev.validationState,
          schedule: scheduleValid
        }
      }
    })
  }, [])

  // Update package details
  const updatePackageDetails = useCallback((packageData) => {
    setBookingFlow(prev => {
      const packageValid = !!(packageData && packageData.packageType)
      const newCompletedSteps = packageValid
        ? [...new Set([...prev.completedSteps, 'package'])]
        : prev.completedSteps.filter(step => step !== 'package')

      return {
        ...prev,
        packageDetails: {
          ...packageData,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        currentStep: packageValid ? 'location' : 'package',
        validationState: {
          ...prev.validationState,
          package: packageValid
        }
      }
    })
  }, [])

  // Update location details
  const updateLocationDetails = useCallback((locationData) => {
    setBookingFlow(prev => {
      const locationValid = !!(locationData && locationData.locationId)
      const newCompletedSteps = locationValid
        ? [...new Set([...prev.completedSteps, 'location'])]
        : prev.completedSteps.filter(step => step !== 'location')

      return {
        ...prev,
        locationDetails: {
          ...locationData,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        currentStep: locationValid ? 'addons' : 'location',
        validationState: {
          ...prev.validationState,
          location: locationValid
        }
      }
    })
  }, [])

  // Update add-ons details
  const updateAddonsDetails = useCallback((addonsData) => {
    setBookingFlow(prev => {
      const selectedAddons = addonsData?.selectedAddons || []
      const totalAddonsPrice = selectedAddons.reduce((sum, addon) => sum + (addon.price * (addon.qty || 1)), 0)
      const addonsValid = true // Add-ons are optional, so always valid when visited
      const newCompletedSteps = addonsValid
        ? [...new Set([...prev.completedSteps, 'addons'])]
        : prev.completedSteps.filter(step => step !== 'addons')

      return {
        ...prev,
        addonsDetails: {
          selectedAddons,
          totalAddonsPrice,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        validationState: {
          ...prev.validationState,
          addons: addonsValid
        }
      }
    })
  }, [])

  // Check if a step can be accessed
  const canAccessStep = useCallback((stepName) => {
    const step = BOOKING_STEPS.find(s => s.id === stepName)
    if (!step) return false

    // First step (schedule) is always accessible
    if (step.order === 0) return true

    // Check if all previous steps are completed
    for (let i = 0; i < step.order; i++) {
      const prevStep = BOOKING_STEPS[i]
      if (!bookingFlow.completedSteps.includes(prevStep.id)) {
        return false
      }
    }

    return true
  }, [bookingFlow.completedSteps])

  // Navigate to a specific step (with validation)
  const goToStep = useCallback((stepName) => {
    if (!canAccessStep(stepName)) {
      console.warn(`Cannot access step "${stepName}" - prerequisites not met`)
      return false
    }

    setBookingFlow(prev => ({
      ...prev,
      currentStep: stepName
    }))
    return true
  }, [canAccessStep])

  // Get current step configuration
  const getCurrentStepConfig = useCallback(() => {
    return BOOKING_STEPS.find(step => step.id === bookingFlow.currentStep)
  }, [bookingFlow.currentStep])

  // Get steps for stepper component
  const getStepsForStepper = useCallback(() => {
    return BOOKING_STEPS.map(step => ({
      id: step.id,
      label: step.label,
      status: bookingFlow.completedSteps.includes(step.id)
        ? 'completed'
        : step.id === bookingFlow.currentStep
          ? 'current'
          : 'upcoming'
    }))
  }, [bookingFlow.completedSteps, bookingFlow.currentStep])

  // Reset booking flow
  const resetBookingFlow = useCallback((photographerId = null) => {
    const newFlow = {
      photographerId,
      currentStep: 'schedule',
      completedSteps: [],
      scheduleDetails: {
        date: null,
        timeOfDay: null,
        selectedAt: null
      },
      packageDetails: {
        packageType: null,
        packagePrice: null,
        hoursBooked: null,
        isPhotoVideo: false,
        packageTitle: null,
        selectedAt: null
      },
      locationDetails: {
        locationId: null,
        locationTitle: null,
        locationVibe: null,
        selectedAt: null
      },
      addonsDetails: {
        selectedAddons: [],
        totalAddonsPrice: 0,
        selectedAt: null
      },
      validationState: {
        schedule: false,
        package: false,
        location: false,
        addons: false
      }
    }

    setBookingFlow(newFlow)

    // Clear from localStorage if photographerId provided
    if (photographerId) {
      localStorage.removeItem(getStorageKey(photographerId))
    }
  }, [getStorageKey])

  // Get package price
  const getPackagePrice = useCallback(() => {
    return bookingFlow.packageDetails.packagePrice || 0
  }, [bookingFlow.packageDetails.packagePrice])

  // Get total price (package + add-ons)
  const getTotalPrice = useCallback(() => {
    const packagePrice = getPackagePrice()
    const addonsPrice = bookingFlow.addonsDetails.totalAddonsPrice || 0
    return packagePrice + addonsPrice
  }, [getPackagePrice, bookingFlow.addonsDetails.totalAddonsPrice])

  // Get selected add-ons total
  const getSelectedAddonsTotal = useCallback(() => {
    return bookingFlow.addonsDetails.totalAddonsPrice || 0
  }, [bookingFlow.addonsDetails.totalAddonsPrice])

  // Check if booking flow has any progress
  const hasProgress = useCallback(() => {
    return bookingFlow.completedSteps.length > 0 ||
           bookingFlow.scheduleDetails.date ||
           bookingFlow.packageDetails.packageType
  }, [bookingFlow])

  const value = {
    // State
    bookingFlow,
    sessionId,

    // Actions
    initializeBookingFlow,
    updateScheduleDetails,
    updatePackageDetails,
    updateLocationDetails,
    updateAddonsDetails,
    goToStep,
    resetBookingFlow,

    // Utilities
    canAccessStep,
    getCurrentStepConfig,
    getStepsForStepper,
    hasProgress,
    getPackagePrice,
    getTotalPrice,
    getSelectedAddonsTotal,

    // Constants
    BOOKING_STEPS
  }

  return (
    <BookingFlowContext.Provider value={value}>
      {children}
    </BookingFlowContext.Provider>
  )
}

export default BookingFlowContext