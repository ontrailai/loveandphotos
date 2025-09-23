import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const GuestBookingContext = createContext({})

// Generate or retrieve a persistent guest session ID
const getGuestSessionId = () => {
  let sessionId = sessionStorage.getItem('guest_session_id')
  if (!sessionId) {
    sessionId = `guest_${uuidv4()}`
    sessionStorage.setItem('guest_session_id', sessionId)
  }
  return sessionId
}

export const useGuestBooking = () => {
  const context = useContext(GuestBookingContext)
  if (!context) {
    throw new Error('useGuestBooking must be used within GuestBookingProvider')
  }
  return context
}

export const GuestBookingProvider = ({ children }) => {
  const [guestSessionId] = useState(getGuestSessionId)
  const [pendingBooking, setPendingBooking] = useState(null)
  const [bookingFormData, setBookingFormData] = useState(null)
  
  // Load any existing pending booking from localStorage
  useEffect(() => {
    const storedBooking = localStorage.getItem(`pending_booking_${guestSessionId}`)
    const storedFormData = localStorage.getItem(`booking_form_${guestSessionId}`)
    
    if (storedBooking) {
      try {
        setPendingBooking(JSON.parse(storedBooking))
      } catch (e) {
        console.error('Failed to parse stored booking:', e)
      }
    }
    
    if (storedFormData) {
      try {
        setBookingFormData(JSON.parse(storedFormData))
      } catch (e) {
        console.error('Failed to parse stored form data:', e)
      }
    }
  }, [guestSessionId])
  
  // Save pending booking to localStorage when it changes
  useEffect(() => {
    if (pendingBooking) {
      localStorage.setItem(`pending_booking_${guestSessionId}`, JSON.stringify(pendingBooking))
    } else {
      localStorage.removeItem(`pending_booking_${guestSessionId}`)
    }
  }, [pendingBooking, guestSessionId])
  
  // Save form data to localStorage when it changes
  useEffect(() => {
    if (bookingFormData) {
      localStorage.setItem(`booking_form_${guestSessionId}`, JSON.stringify(bookingFormData))
    } else {
      localStorage.removeItem(`booking_form_${guestSessionId}`)
    }
  }, [bookingFormData, guestSessionId])
  
  // Store pending booking data
  const savePendingBooking = (bookingData) => {
    setPendingBooking({
      ...bookingData,
      guestSessionId,
      createdAt: new Date().toISOString()
    })
  }
  
  // Store form data separately (for form state persistence)
  const saveBookingFormData = (formData) => {
    setBookingFormData({
      ...formData,
      updatedAt: new Date().toISOString()
    })
  }
  
  // Clear pending booking after successful account creation
  const clearPendingBooking = () => {
    setPendingBooking(null)
    setBookingFormData(null)
    localStorage.removeItem(`pending_booking_${guestSessionId}`)
    localStorage.removeItem(`booking_form_${guestSessionId}`)
  }
  
  // Check if there's a pending booking
  const hasPendingBooking = () => {
    return !!pendingBooking
  }
  
  // Get the pending booking data for migration after signup
  const getPendingBookingForMigration = () => {
    if (!pendingBooking) return null
    
    // Remove guest-specific fields before migration
    const { guestSessionId, createdAt, ...bookingData } = pendingBooking
    return bookingData
  }
  
  const value = {
    guestSessionId,
    pendingBooking,
    bookingFormData,
    savePendingBooking,
    saveBookingFormData,
    clearPendingBooking,
    hasPendingBooking,
    getPendingBookingForMigration
  }
  
  return (
    <GuestBookingContext.Provider value={value}>
      {children}
    </GuestBookingContext.Provider>
  )
}