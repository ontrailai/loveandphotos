/**
 * Contract Helper Utilities
 * Utility functions for contract handling, validation, and formatting
 */

import { populateContractTemplate } from '@lib/contract/contractText'
import { CONTRACT_VERSION, generateContractHash, getCurrentContractHash } from '@lib/contract/contractVersion'

/**
 * Formats booking data for contract display
 * @param {Object} bookingFlow - Booking flow context data
 * @returns {Object} Formatted data for contract population
 */
export function formatBookingDataForContract(bookingFlow) {
  const eventDate = bookingFlow.scheduleDetails?.date
    ? new Date(bookingFlow.scheduleDetails.date).toLocaleDateString('en-US')
    : 'Not specified'

  // Use city+state if available, otherwise fall back to locationTitle, then 'Not specified'
  let location = 'Not specified'
  if (bookingFlow.locationDetails?.city && bookingFlow.locationDetails?.state) {
    location = `${bookingFlow.locationDetails.city}, ${bookingFlow.locationDetails.state}`
  } else if (bookingFlow.locationDetails?.locationTitle) {
    location = bookingFlow.locationDetails.locationTitle
  }

  const packageName = bookingFlow.packageDetails?.packageTitle || 'Package'

  const packagePrice = bookingFlow.packageDetails?.packagePrice || 0
  const addonsTotal = bookingFlow.addonsDetails?.totalAddonsPrice || 0
  const totalPrice = packagePrice + addonsTotal
  const formattedPrice = `$${totalPrice.toLocaleString()}`

  return {
    eventDate,
    location,
    packageName,
    price: formattedPrice
  }
}

/**
 * Validates that all required booking data is present for contract generation
 * Enhanced with comprehensive schema validation to fail fast on invalid data
 * @param {Object} bookingFlow - Booking flow context data
 * @returns {Object} Validation result with isValid flag and missing fields
 */
export function validateBookingDataForContract(bookingFlow) {
  const missing = []
  const errors = []

  // Validate booking flow object exists
  if (!bookingFlow || typeof bookingFlow !== 'object') {
    throw new Error('CONTRACT_VALIDATION_ERROR: BookingFlow context is required')
  }

  // Enhanced schedule validation
  if (!bookingFlow.scheduleDetails?.date) {
    missing.push('Event Date')
  } else {
    // Validate date format and ensure it's in the future
    const eventDate = new Date(bookingFlow.scheduleDetails.date)
    if (isNaN(eventDate.getTime())) {
      errors.push('Event Date must be a valid date')
    } else {
      // Compare dates only (not time) - event is valid if it's today or later
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to start of today
      if (eventDate < today) {
        errors.push('Event Date must be in the future')
      }
    }
  }

  // Enhanced location validation - Accept city+state OR locationTitle
  const hasCity = bookingFlow.locationDetails?.city &&
                  typeof bookingFlow.locationDetails.city === 'string' &&
                  bookingFlow.locationDetails.city.trim().length > 0
  const hasState = bookingFlow.locationDetails?.state &&
                   typeof bookingFlow.locationDetails.state === 'string' &&
                   bookingFlow.locationDetails.state.trim().length > 0
  const hasLocationTitle = bookingFlow.locationDetails?.locationTitle &&
                           typeof bookingFlow.locationDetails.locationTitle === 'string' &&
                           bookingFlow.locationDetails.locationTitle.trim().length > 0

  // Location is valid if we have (city AND state) OR locationTitle
  if (!(hasCity && hasState) && !hasLocationTitle) {
    missing.push('Location')
  }

  // Enhanced package validation
  if (!bookingFlow.packageDetails?.packageTitle) {
    missing.push('Package')
  } else if (typeof bookingFlow.packageDetails.packageTitle !== 'string' ||
             bookingFlow.packageDetails.packageTitle.trim().length === 0) {
    errors.push('Package title must be a non-empty string')
  }

  // Enhanced price validation
  if (bookingFlow.packageDetails?.packagePrice === undefined ||
      bookingFlow.packageDetails?.packagePrice === null) {
    missing.push('Package Price')
  } else {
    const price = Number(bookingFlow.packageDetails.packagePrice)
    if (isNaN(price) || price <= 0) {
      errors.push('Package Price must be a positive number')
    }
  }

  // Validate add-ons data exists (even if empty)
  if (!bookingFlow.addonsDetails) {
    missing.push('Add-ons Details')
  } else if (bookingFlow.addonsDetails.totalAddonsPrice !== undefined) {
    const addonsPrice = Number(bookingFlow.addonsDetails.totalAddonsPrice)
    if (isNaN(addonsPrice) || addonsPrice < 0) {
      errors.push('Add-ons total price must be a non-negative number')
    }
  }

  // Fail fast if critical validation errors exist
  if (errors.length > 0) {
    throw new Error(`CONTRACT_VALIDATION_ERROR: ${errors.join(', ')}`)
  }

  return {
    isValid: missing.length === 0,
    missing,
    errors
  }
}

/**
 * Generates the complete contract text for a booking
 * @param {Object} bookingFlow - Booking flow context data
 * @returns {Promise<Object>} Contract data with text, hash, and version
 */
export async function generateContractForBooking(bookingFlow) {
  const bookingData = formatBookingDataForContract(bookingFlow)
  const contractText = populateContractTemplate(bookingData, CONTRACT_VERSION)
  const contractHash = await generateContractHash(contractText)

  return {
    contractText,
    contractHash,
    contractVersion: CONTRACT_VERSION,
    bookingData
  }
}

/**
 * Validates signature data before submission
 * @param {Object} signatureData - Signature data to validate
 * @returns {Object} Validation result
 */
export function validateSignatureData(signatureData) {
  const errors = []

  if (!signatureData.signaturePngBase64 || signatureData.signaturePngBase64.length === 0) {
    errors.push('Signature is required')
  }

  if (!signatureData.signerFullName || !signatureData.signerFullName.trim()) {
    errors.push('Please type your full name before continuing.')
  }

  if (!signatureData.consentAccepted) {
    errors.push('You must agree to the terms and conditions')
  }

  if (signatureData.signaturePngBase64 && signatureData.signaturePngBase64.length > 2 * 1024 * 1024) {
    errors.push('Signature image is too large (max 2MB)')
  }

  // Validate base64 format
  if (signatureData.signaturePngBase64) {
    try {
      const base64Regex = /^data:image\/png;base64,/
      if (!base64Regex.test(signatureData.signaturePngBase64)) {
        errors.push('Invalid signature format')
      }
    } catch (e) {
      errors.push('Invalid signature data')
    }
  }

  // Validate signer name if provided
  if (signatureData.signerFullName && signatureData.signerFullName.length > 100) {
    errors.push('Signer name is too long (max 100 characters)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Prepares contract signature payload for API submission
 * @param {Object} bookingFlow - Booking flow context
 * @param {Object} signatureData - Signature form data
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} API payload
 */
export async function prepareContractSignaturePayload(bookingFlow, signatureData, bookingId) {
  // Generate the contract for display purposes
  const contract = await generateContractForBooking(bookingFlow)

  // But use the raw template hash for verification (matches backend expectation)
  const templateHash = await getCurrentContractHash()

  return {
    bookingId,
    contractVersion: contract.contractVersion,
    contractHash: templateHash,  // Use template hash, not populated contract hash
    eventDate: contract.bookingData.eventDate,
    location: contract.bookingData.location,
    packageName: contract.bookingData.packageName,
    price: parseFloat(contract.bookingData.price.replace(/[$,]/g, '')),
    signerFullName: signatureData.signerFullName || null,
    signaturePngBase64: signatureData.signaturePngBase64,
    signedAtISO: new Date().toISOString()
  }
}


/**
 * Smooth scrolls to the signature section
 * @param {string} elementId - ID of element to scroll to (default: 'signature')
 */
export function scrollToSignature(elementId = 'signature') {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
    // Focus the element for accessibility
    element.focus({ preventScroll: true })
  }
}

/**
 * Formats contract text for display with proper line breaks
 * @param {string} contractText - Raw contract text
 * @returns {string} Formatted contract text
 */
export function formatContractTextForDisplay(contractText) {
  return contractText
    .replace(/\n\n/g, '\n\n') // Preserve paragraph breaks
    .replace(/\n/g, '\n') // Preserve line breaks
    .trim()
}

/**
 * Estimates contract reading time
 * @param {string} contractText - Contract text
 * @returns {number} Estimated reading time in minutes
 */
export function estimateReadingTime(contractText) {
  const wordsPerMinute = 200 // Average reading speed
  const wordCount = contractText.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Fetches auxiliary data with timeout and graceful failure
 * This ensures that auxiliary data failures never block main contract functionality
 * @param {Function} fetchFunction - Function that returns a promise
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in milliseconds (default: 6000)
 * @param {string} options.dataType - Description of data being fetched for logging
 * @returns {Promise<{data: any, error: Error|null}>} Result with data or error
 */
export async function fetchAuxiliaryData(fetchFunction, options = {}) {
  const { timeout = 6000, dataType = 'auxiliary data' } = options

  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${dataType} fetch timed out after ${timeout}ms`))
      }, timeout)
    })

    // Race the fetch function against the timeout
    const data = await Promise.race([
      fetchFunction(),
      timeoutPromise
    ])

    return { data, error: null }
  } catch (error) {
    // Log warning but don't throw - auxiliary data should fail gracefully
    console.warn(`${dataType} fetch failed (non-blocking):`, error.message)
    return { data: null, error }
  }
}

/**
 * Wraps multiple auxiliary data fetches and executes them in parallel
 * Ensures that failures don't propagate and main contract flow continues
 * @param {Array<{name: string, fetchFn: Function, timeout?: number}>} fetchTasks - Array of fetch tasks
 * @returns {Promise<Object>} Object with results keyed by task name
 */
export async function fetchMultipleAuxiliaryData(fetchTasks) {
  const results = {}

  // Execute all auxiliary fetches in parallel
  const promises = fetchTasks.map(async (task) => {
    const { name, fetchFn, timeout = 6000 } = task
    const result = await fetchAuxiliaryData(fetchFn, {
      timeout,
      dataType: `auxiliary data (${name})`
    })
    return { name, result }
  })

  try {
    const completedTasks = await Promise.allSettled(promises)

    completedTasks.forEach((taskResult) => {
      if (taskResult.status === 'fulfilled') {
        const { name, result } = taskResult.value
        results[name] = result
      } else {
        console.warn('Auxiliary data task failed:', taskResult.reason)
      }
    })
  } catch (error) {
    console.warn('Error in auxiliary data fetch coordination:', error)
  }

  return results
}