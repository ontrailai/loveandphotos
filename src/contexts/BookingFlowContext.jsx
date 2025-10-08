/**
 * BookingFlowContext
 * Multi-step booking wizard state management
 * Manages schedule, package, and location details with localStorage persistence
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getBasePhotoPrice, validateHours } from '@/lib/constants/pricing'

const BookingFlowContext = createContext({})

// Step configuration
// Actual booking flow: Schedule → Add-Ons → Account Setup → Contract → Payment
const BOOKING_STEPS = [
  { id: 'schedule', label: 'Schedule Details', order: 0 },
  { id: 'addons', label: 'Add-Ons', order: 1 },
  { id: 'account', label: 'Account Setup', order: 2 },
  { id: 'contract', label: 'Contract & Signature', order: 3 },
  { id: 'payment', label: 'Payment', order: 4 }
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
    videographerId: null, // Optional videographer ID for video add-on
    bookingId: null, // Database booking ID once created
    currentStep: 'schedule',
    completedSteps: [],

    scheduleDetails: {
      date: null,
      startTime: null,
      endTime: null,
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

    addonsDetails: {
      selectedAddons: [], // Array of {id, title, price, qty}
      totalAddonsPrice: 0, // Computed total of all add-ons
      selectedAt: null
    },

    locationDetails: {
      city: null,
      state: null,
      locationTitle: null,
      address: null,
      selectedAt: null
    },

    accountDetails: {
      isAuthenticated: false,
      userId: null,
      email: null,
      fullName: null,
      phone: null,
      selectedAt: null
    },

    contractDetails: {
      contractSigned: false,
      contractSignatureId: null,
      contractVersion: null,
      signedAt: null,
      selectedAt: null
    },

    paymentDetails: {
      paymentCompleted: false,
      paymentMethod: null,
      paymentPlan: 'full', // 'full', 'deposit+3', or 'installments'
      paymentIntentId: null,
      receiptUrl: null,
      paidAt: null,
      selectedAt: null
    },

    validationState: {
      schedule: false,
      package: false,
      addons: false,
      account: false,
      contract: false,
      payment: false
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

    // Create new flow with optional initial package details
    const hasPackage = !!(initialData.packageDetails?.packagePrice)
    const hasSchedule = !!initialData.date

    const newFlow = {
      photographerId,
      currentStep: hasSchedule ? (hasPackage ? 'addons' : 'schedule') : 'schedule',
      completedSteps: hasSchedule ? ['schedule'] : [],
      scheduleDetails: {
        date: initialData.date || null,
        startTime: initialData.startTime || null,
        endTime: initialData.endTime || null,
        selectedAt: initialData.date ? new Date().toISOString() : null
      },
      packageDetails: initialData.packageDetails ? {
        ...initialData.packageDetails,
        selectedAt: new Date().toISOString()
      } : {
        packageType: null,
        packagePrice: null,
        hoursBooked: null,
        isPhotoVideo: false,
        packageTitle: null,
        selectedAt: null
      },
      addonsDetails: {
        selectedAddons: [],
        totalAddonsPrice: 0,
        selectedAt: null
      },
      locationDetails: {
        city: null,
        state: null,
        locationTitle: null,
        address: null,
        selectedAt: null
      },
      accountDetails: {
        isAuthenticated: false,
        userId: null,
        email: null,
        fullName: null,
        phone: null,
        selectedAt: null
      },
      contractDetails: {
        contractSigned: false,
        contractSignatureId: null,
        contractVersion: null,
        signedAt: null,
        selectedAt: null
      },
      validationState: {
        schedule: hasSchedule,
        package: hasPackage,
        addons: false,
        account: false,
        contract: false
      }
    }

    setBookingFlow(newFlow)
    return newFlow
  }, [loadBookingFlow, sessionId])

  // Update schedule details
  const updateScheduleDetails = useCallback((date, startTime = null, endTime = null) => {
    setBookingFlow(prev => {
      const scheduleValid = !!date && !!startTime && !!endTime
      const newCompletedSteps = scheduleValid
        ? [...new Set([...prev.completedSteps, 'schedule'])]
        : prev.completedSteps.filter(step => step !== 'schedule')

      // Calculate package price from hours using authoritative pricing table
      let packagePrice = 0
      let hoursBooked = 0
      if (startTime && endTime) {
        const [startHour] = startTime.split(':').map(Number)
        const [endHour] = endTime.split(':').map(Number)
        hoursBooked = endHour - startHour

        // Use authoritative pricing lookup instead of hourly rate
        packagePrice = getBasePhotoPrice(hoursBooked) || 0
      }

      return {
        ...prev,
        scheduleDetails: {
          date,
          startTime,
          endTime,
          selectedAt: new Date().toISOString()
        },
        packageDetails: {
          ...prev.packageDetails,
          packagePrice, // Update package price based on authoritative pricing
          hoursBooked, // Store hours booked
          packageTitle: scheduleValid ? `${hoursBooked} Hour Photoshoot` : null
        },
        completedSteps: newCompletedSteps,
        currentStep: scheduleValid ? 'addons' : 'schedule',
        validationState: {
          ...prev.validationState,
          schedule: scheduleValid
        }
      }
    })
  }, [])

  // Update package details (legacy - no longer used but kept for backwards compatibility)
  const updatePackageDetails = useCallback((packageData) => {
    setBookingFlow(prev => {
      return {
        ...prev,
        packageDetails: {
          ...packageData,
          selectedAt: new Date().toISOString()
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
        currentStep: addonsValid ? 'contract' : 'addons',
        validationState: {
          ...prev.validationState,
          addons: addonsValid
        }
      }
    })
  }, [])

  // Update location details
  const updateLocationDetails = useCallback((locationData) => {
    setBookingFlow(prev => {
      const locationValid = !!(locationData && (locationData.city || locationData.state || locationData.locationTitle))
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
        validationState: {
          ...prev.validationState,
          location: locationValid
        }
      }
    })
  }, [])

  // Set booking ID (called after booking is created)
  const setBookingId = useCallback((bookingId) => {
    setBookingFlow(prev => ({
      ...prev,
      bookingId
    }))
  }, [])

  // Set videographer ID (called when user adds videographer to booking)
  const setVideographerId = useCallback((videographerId) => {
    setBookingFlow(prev => ({
      ...prev,
      videographerId
    }))
  }, [])

  // Update account details
  const updateAccountDetails = useCallback((accountData) => {
    setBookingFlow(prev => {
      const accountValid = !!(accountData && accountData.isAuthenticated && accountData.userId)
      const newCompletedSteps = accountValid
        ? [...new Set([...prev.completedSteps, 'account'])]
        : prev.completedSteps.filter(step => step !== 'account')

      return {
        ...prev,
        accountDetails: {
          ...accountData,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        currentStep: accountValid ? 'contract' : 'account', // Move to contract after account
        validationState: {
          ...prev.validationState,
          account: accountValid
        }
      }
    })
  }, [])

  // Update contract details
  const updateContractDetails = useCallback((contractData) => {
    setBookingFlow(prev => {
      const contractValid = !!(contractData && contractData.contractSigned)
      const newCompletedSteps = contractValid
        ? [...new Set([...prev.completedSteps, 'contract'])]
        : prev.completedSteps.filter(step => step !== 'contract')

      return {
        ...prev,
        contractDetails: {
          ...contractData,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        currentStep: contractValid ? 'payment' : 'contract',
        validationState: {
          ...prev.validationState,
          contract: contractValid
        }
      }
    })
  }, [])

  // Update payment details
  const updatePaymentDetails = useCallback((paymentData) => {
    setBookingFlow(prev => {
      const paymentValid = !!(paymentData && paymentData.paymentIntentId)
      const newCompletedSteps = paymentValid
        ? [...new Set([...prev.completedSteps, 'payment'])]
        : prev.completedSteps.filter(step => step !== 'payment')

      return {
        ...prev,
        paymentDetails: {
          ...prev.paymentDetails,
          ...paymentData,
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        validationState: {
          ...prev.validationState,
          payment: paymentValid
        }
      }
    })
  }, [])

  // Update payment plan selection
  const updatePaymentPlan = useCallback((paymentPlan) => {
    setBookingFlow(prev => ({
      ...prev,
      paymentDetails: {
        ...prev.paymentDetails,
        paymentPlan,
        selectedAt: new Date().toISOString()
      }
    }))
  }, [])

  // Mark payment as complete
  const markPaymentComplete = useCallback((paymentIntentId, receiptUrl) => {
    setBookingFlow(prev => {
      const newCompletedSteps = [...new Set([...prev.completedSteps, 'payment'])]

      return {
        ...prev,
        paymentDetails: {
          ...prev.paymentDetails,
          paymentCompleted: true,
          paymentIntentId: paymentIntentId || prev.paymentDetails?.paymentIntentId || null,
          receiptUrl: receiptUrl || prev.paymentDetails?.receiptUrl || null,
          paidAt: new Date().toISOString(),
          selectedAt: new Date().toISOString()
        },
        completedSteps: newCompletedSteps,
        validationState: {
          ...prev.validationState,
          payment: true
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

    // Special requirement for contract step: must have bookingId
    if (stepName === 'contract') {
      // Check all previous steps are completed
      for (let i = 0; i < step.order; i++) {
        const prevStep = BOOKING_STEPS[i]
        if (!bookingFlow.completedSteps.includes(prevStep.id)) {
          return false
        }
      }
      // Additional requirement: must have bookingId from account setup
      return !!bookingFlow.bookingId
    }

    // Special requirement for payment step: contract must be signed
    if (stepName === 'payment') {
      // Check all previous steps are completed
      for (let i = 0; i < step.order; i++) {
        const prevStep = BOOKING_STEPS[i]
        if (!bookingFlow.completedSteps.includes(prevStep.id)) {
          return false
        }
      }
      // Additional requirement: contract must be signed
      return bookingFlow.contractDetails.contractSigned === true
    }

    // Check if all previous steps are completed
    for (let i = 0; i < step.order; i++) {
      const prevStep = BOOKING_STEPS[i]
      if (!bookingFlow.completedSteps.includes(prevStep.id)) {
        return false
      }
    }

    return true
  }, [bookingFlow.completedSteps, bookingFlow.contractDetails.contractSigned, bookingFlow.bookingId])

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
      bookingId: null,
      currentStep: 'schedule',
      completedSteps: [],
      scheduleDetails: {
        date: null,
        startTime: null,
        endTime: null,
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
      addonsDetails: {
        selectedAddons: [],
        totalAddonsPrice: 0,
        selectedAt: null
      },
      locationDetails: {
        city: null,
        state: null,
        locationTitle: null,
        address: null,
        selectedAt: null
      },
      accountDetails: {
        isAuthenticated: false,
        userId: null,
        email: null,
        fullName: null,
        phone: null,
        selectedAt: null
      },
      contractDetails: {
        contractSigned: false,
        contractSignatureId: null,
        contractVersion: null,
        signedAt: null,
        selectedAt: null
      },
      validationState: {
        schedule: false,
        package: false,
        location: false,
        addons: false,
        account: false,
        contract: false
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
    updateAddonsDetails,
    updateLocationDetails,
    setBookingId,
    setVideographerId,
    updateAccountDetails,
    updateContractDetails,
    updatePaymentDetails,
    updatePaymentPlan,
    markPaymentComplete,
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