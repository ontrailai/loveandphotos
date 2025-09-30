/**
 * ContractStep Page
 * Contract review and digital signature step in the booking flow
 * Features: contract display, signature capture, validation, API integration
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useBookingFlow } from '@contexts/BookingFlowContext'
import BookingStepper from '@components/booking/BookingStepper'
import ContractAgreement from '@components/contract/ContractAgreement'
import SignatureBox from '@components/contract/SignatureBox'
import Button from '@components/ui/Button'
import ErrorBoundary from '@components/ui/ErrorBoundary'
import AuxiliaryDataBoundary from '@components/ui/AuxiliaryDataBoundary'
import {
  validateBookingDataForContract,
  generateContractForBooking,
  validateSignatureData,
  prepareContractSignaturePayload,
  fetchMultipleAuxiliaryData
} from '@utils/contractHelpers'
import { withTimeoutAndRetry, normalizeError } from '@lib/async/withTimeout'
import { supabase } from '@lib/supabase'
import { ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { z } from 'zod'

// Zod schema for contract requirements validation
// Package details are now optional as we support add-on-only bookings
const ContractRequirementsSchema = z.object({
  eventDate: z.string().min(1, 'Event date is required'),
  location: z.string().optional(), // Optional - can be TBD
  packageName: z.string().optional(), // Optional - fallback to "Custom Package"
  price: z.union([z.string(), z.number()]).optional() // Optional - can be $0 base + addons
})

const ContractStep = () => {
  const { photographerId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    bookingFlow,
    goToStep,
    getStepsForStepper,
    canAccessStep,
    updateContractDetails
  } = useBookingFlow()

  // Local state
  const [contractData, setContractData] = useState(null)
  const [signatureData, setSignatureData] = useState({
    signaturePngBase64: null,
    signerFullName: '',
    consentAccepted: false
  })
  const [validationErrors, setValidationErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasEssentialData, setHasEssentialData] = useState(false) // Track if we have critical contract data
  const [auxiliaryDataErrors, setAuxiliaryDataErrors] = useState([]) // Track non-blocking errors
  const hasInitialized = useRef(false) // Track if contract initialization has completed

  // Helper function to convert Date objects to strings for validation
  const formatDateForValidation = (date) => {
    if (!date) return ''
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    if (typeof date === 'string') {
      return date
    }
    return String(date)
  }

  // Reset initialization flag when photographer changes
  useEffect(() => {
    hasInitialized.current = false
  }, [photographerId])

  // Check access and generate contract on mount with robust error handling
  useEffect(() => {
    let isMounted = true // Cleanup flag to prevent state updates after unmount

    const initializeContract = async () => {
      if (!isMounted) return
      if (hasInitialized.current) return // Prevent re-initialization on bookingFlow changes

      try {
        setIsLoading(true)
        setSubmitError(null)
        setAuxiliaryDataErrors([]) // Clear previous auxiliary errors

        // Check if user can access this step
        if (!canAccessStep('contract')) {
          // Redirect to first incomplete step
          if (!canAccessStep('schedule')) {
            navigate(`/booking/${photographerId}/schedule`, { replace: true })
          } else if (!canAccessStep('addons')) {
            navigate(`/booking/${photographerId}/addons`, { replace: true })
          } else if (!canAccessStep('account')) {
            navigate(`/booking/${photographerId}/account`, { replace: true })
          }
          return
        }

        // Wait for bookingId to be available in context
        if (!bookingFlow.bookingId) {
          console.log('⏳ Waiting for booking ID to be set in context...')
          setSubmitError('Finalizing your booking details. Please wait...')
          // Keep loading state active - useEffect will retry when bookingFlow.bookingId changes
          return
        }

        console.log('📋 Fetching booking from database:', bookingFlow.bookingId)

        // Fetch complete booking data from Supabase
        const { data: bookingFromDb, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            *,
            packages:package_id (
              id,
              title,
              base_price
            )
          `)
          .eq('id', bookingFlow.bookingId)
          .single()

        if (fetchError || !bookingFromDb) {
          console.error('Failed to fetch booking:', fetchError)
          setSubmitError(
            'Unable to load booking details from database. ' +
            'Please return to account setup and try again, or contact support if this persists.'
          )
          setIsLoading(false)
          return
        }

        console.log('✅ Booking fetched successfully from database')

        // Merge database booking with context for complete validation
        // Use database as source of truth, fallback to context
        const mergedBookingData = {
          ...bookingFlow,
          bookingId: bookingFromDb.id,
          scheduleDetails: {
            date: bookingFromDb.event_date || bookingFlow.scheduleDetails?.date,
            timeOfDay: bookingFlow.scheduleDetails?.timeOfDay,
            selectedAt: bookingFlow.scheduleDetails?.selectedAt
          },
          locationDetails: {
            address: bookingFromDb.venue_address || bookingFlow.locationDetails?.address,
            locationTitle: bookingFromDb.venue_name || bookingFlow.locationDetails?.locationTitle || 'Venue Location'
          },
          packageDetails: {
            packageTitle: bookingFromDb.packages?.title || bookingFlow.packageDetails?.packageTitle || 'Custom Package',
            packagePrice: bookingFromDb.packages?.base_price || bookingFlow.packageDetails?.packagePrice || 0,
            packageType: bookingFlow.packageDetails?.packageType || 'custom',
            hoursBooked: bookingFlow.packageDetails?.hoursBooked || 6,
            isPhotoVideo: bookingFlow.packageDetails?.isPhotoVideo || true
          },
          addonsDetails: {
            selectedAddons: bookingFlow.addonsDetails?.selectedAddons || [],
            totalAddonsPrice: bookingFlow.addonsDetails?.totalAddonsPrice || 0
          }
        }

        // Validate booking data with Zod schema for critical contract requirements using merged data
        const contractRequirements = {
          eventDate: formatDateForValidation(mergedBookingData.scheduleDetails?.date),
          location: mergedBookingData.locationDetails?.address || 'To Be Determined',
          packageName: mergedBookingData.packageDetails?.packageTitle || 'Custom Package',
          price: mergedBookingData.packageDetails?.packagePrice !== undefined
            ? mergedBookingData.packageDetails.packagePrice
            : 0
        }

        // Add detailed logging to understand validation failures
        console.log('🔍 Contract Requirements Debug:', {
          contractRequirements,
          rawBookingFlow: {
            scheduleDetails: bookingFlow.scheduleDetails,
            locationDetails: bookingFlow.locationDetails,
            packageDetails: bookingFlow.packageDetails
          }
        })

        try {
          ContractRequirementsSchema.parse(contractRequirements)
        } catch (zodError) {
          console.error('Contract requirements validation failed:', zodError.issues)
          const fieldMap = {
            eventDate: 'Event Date (Schedule step)',
            location: 'Location (Location step)',
            packageName: 'Package (Package step)',
            price: 'Price (Package step)'
          }
          const readableFields = zodError.issues
            .map(err => fieldMap[err.path.join('.')] || err.path.join('.'))
            .join(', ')
          setSubmitError(`Missing required information: ${readableFields}. Please go back and complete these steps.`)
          navigate(`/booking/${photographerId}/addons`, { replace: true })
          return
        }

        // Validate booking data (legacy validation for backward compatibility) using merged data
        const validation = validateBookingDataForContract(mergedBookingData)
        if (!validation.isValid) {
          console.error('Booking data incomplete:', validation.missing)
          navigate(`/booking/${photographerId}/addons`, { replace: true })
          return
        }

        // Generate contract with timeout and retry protection (10s timeout, 2 retries) using merged data
        const contract = await withTimeoutAndRetry(
          () => generateContractForBooking(mergedBookingData),
          {
            timeout: 10000, // 10 second timeout
            retries: 2,     // 2 retry attempts
            retryDelay: 1500 // 1.5 second delay between retries
          }
        )

        // Only update state if component is still mounted
        if (isMounted) {
          setContractData(contract)
          setHasEssentialData(true) // Mark that we have the critical contract data
          goToStep('contract')
          hasInitialized.current = true // Mark as initialized to prevent re-runs

          // Fetch auxiliary data in parallel after core contract is ready
          // This demonstrates graceful degradation pattern for non-critical features
          fetchAuxiliaryDataAfterContract()
        }

      } catch (error) {
        if (!isMounted) return

        const normalizedError = normalizeError(error, 'Failed to load contract')
        console.error('Contract initialization failed:', normalizedError)

        // Set appropriate error message based on error type
        if (normalizedError.code === 'REQUEST_TIMEOUT') {
          setSubmitError('Contract loading timed out after 10 seconds. Please check your connection and try again.')
        } else if (normalizedError.code === 'NETWORK_ERROR') {
          setSubmitError('Network connection failed. Please check your internet connection and try again.')
        } else {
          setSubmitError(normalizedError.message || 'Failed to load contract. Please try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Initialize contract loading
    initializeContract()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [photographerId, canAccessStep, goToStep, navigate, bookingFlow])

  // Fetch auxiliary data after core contract is loaded
  // This demonstrates graceful degradation pattern for non-critical data
  const fetchAuxiliaryDataAfterContract = async () => {
    try {
      // Example auxiliary data fetches that should never block main contract flow
      const auxiliaryTasks = [
        // Future auxiliary fetches could include:
        // { name: 'photographerStats', fetchFn: () => getPhotographerStats(photographerId), timeout: 5000 },
        // { name: 'contractTemplateMetadata', fetchFn: () => getContractMetadata(), timeout: 4000 }
      ]

      const results = await fetchMultipleAuxiliaryData(auxiliaryTasks)

      // Process results - all failures are already handled gracefully
      const errors = []
      Object.entries(results).forEach(([name, result]) => {
        if (result.error) {
          errors.push(`${name}: ${result.error.message}`)
        } else if (result.data) {
          console.log(`Auxiliary data loaded for ${name}:`, result.data)
        }
      })

      // Update auxiliary data errors state (non-blocking UI updates)
      if (errors.length > 0) {
        setAuxiliaryDataErrors(errors)
      }
    } catch (error) {
      // This should never happen due to graceful error handling in fetchMultipleAuxiliaryData
      console.warn('Unexpected error in auxiliary data coordination:', error)
    }
  }

  // Handle signature change
  const handleSignatureChange = (signaturePng) => {
    setSignatureData(prev => ({
      ...prev,
      signaturePngBase64: signaturePng
    }))
    // Clear validation errors when signature changes
    if (signaturePng && validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  // Handle signer name change
  const handleSignerNameChange = (name) => {
    setSignatureData(prev => ({
      ...prev,
      signerFullName: name
    }))
  }

  // Handle consent checkbox
  const handleConsentChange = (accepted) => {
    setSignatureData(prev => ({
      ...prev,
      consentAccepted: accepted
    }))
    // Clear validation errors when consent changes
    if (accepted && validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  // Validate and submit signature with robust error handling
  const handleSubmit = async () => {
    setValidationErrors([])
    setSubmitError(null)

    // Validate signature data
    const validation = validateSignatureData(signatureData)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    if (!contractData) {
      setSubmitError('Contract data not available. Please refresh the page.')
      return
    }

    setIsSubmitting(true)

    try {
      // Get booking ID from context
      const bookingId = bookingFlow.bookingId

      if (!bookingId) {
        throw new Error('Booking ID not found. Please go back to the previous step and complete the booking process.')
      }

      // Prepare payload
      const payload = await prepareContractSignaturePayload(
        bookingFlow,
        signatureData,
        bookingId
      )

      // Add userId from authenticated user for API authentication
      if (user && user.id) {
        payload.userId = user.id
      } else {
        throw new Error('User must be authenticated to sign contract')
      }

      // Submit to API with timeout and retry protection
      const result = await withTimeoutAndRetry(
        async () => {
          const response = await fetch('/api/contract/sign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
            error.status = response.status
            error.code = errorData.code || 'API_ERROR'

            // Don't retry on 4xx errors (client errors)
            if (response.status >= 400 && response.status < 500) {
              error.skipRetry = true
            }

            throw error
          }

          return response.json()
        },
        {
          timeout: 8000, // 8 second timeout for signature submission
          retries: 2,    // 2 retry attempts
          retryDelay: 2000, // 2 second delay between retries
          shouldRetry: (error) => {
            // Don't retry 4xx errors (client errors)
            return !error.skipRetry && error.status >= 500
          }
        }
      )

      // Update booking flow context
      updateContractDetails({
        contractSigned: true,
        contractSignatureId: result.contractSignatureId,
        signedAt: payload.signedAtISO,
        contractVersion: contractData.contractVersion
      })

      // Navigate to payment step
      navigate(`/booking/${photographerId}/payment`)

    } catch (error) {
      const normalizedError = normalizeError(error, 'Contract signature submission failed')
      console.error('Contract submission failed:', normalizedError)

      // Set appropriate error message based on error type
      if (normalizedError.code === 'REQUEST_TIMEOUT') {
        setSubmitError('Signature submission timed out. Please check your connection and try again.')
      } else if (normalizedError.code === 'RATE_LIMIT_EXCEEDED') {
        setSubmitError('Too many attempts. Please wait a moment and try again.')
      } else if (normalizedError.code === 'CONTRACT_ALREADY_SIGNED') {
        setSubmitError('This contract has already been signed. Redirecting to payment...')
        setTimeout(() => navigate(`/booking/${photographerId}/payment`), 2000)
      } else if (normalizedError.code === 'BOOKING_ACCESS_DENIED' || normalizedError.status === 403) {
        setSubmitError('You don\'t have access to this booking. Please verify your booking details.')
      } else if (normalizedError.code === 'BOOKING_NOT_FOUND' || normalizedError.status === 404) {
        setSubmitError('Booking not found. Please verify your booking ID.')
      } else if (normalizedError.code === 'MISSING_REQUIRED_FIELDS' || normalizedError.status === 400) {
        setSubmitError('Invalid signature data. Please try signing again.')
      } else if (normalizedError.status === 500) {
        setSubmitError('Server error during contract verification. Please try again or contact support.')
      } else if (normalizedError.status === 401) {
        setSubmitError('Authentication required. Please log in and try again.')
      } else {
        setSubmitError(normalizedError.message || 'Failed to submit signature. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    navigate(`/booking/${photographerId}/addons`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600" aria-live="polite">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (!contractData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6" role="alert">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Unavailable</h2>
          <p className="text-gray-600 mb-4">
            {submitError || 'Unable to load contract. Please try again.'}
          </p>
          <Button onClick={() => window.location.reload()} aria-label="Retry loading contract">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const steps = getStepsForStepper()

  return (
    <ErrorBoundary
      title="Contract Loading Error"
      message="Unable to load the contract page. Please try again or go back to add-ons."
      onRetry={() => window.location.reload()}
      onGoBack={() => navigate(`/booking/${photographerId}/addons`)}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Progress Stepper */}
        <BookingStepper
          steps={steps}
          currentStepIndex={3} // Contract is step 4 (0-indexed: 3)
          onStepClick={(stepIndex, step) => {
            if (step.status === 'completed') {
              const stepId = steps[stepIndex].id
              if (stepId === 'addons') {
                navigate(`/booking/${photographerId}/addons`)
              } else if (stepId === 'account') {
                navigate(`/booking/${photographerId}/account`)
              } else if (stepId === 'schedule') {
                navigate(`/booking/${photographerId}/schedule`)
              }
            }
          }}
        />

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 py-8 lg:px-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Contract Review & Signature
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please review the contract terms below and provide your digital signature to proceed with your booking.
          </p>
        </div>

        {/* Contract Agreement - Essential data, always render if available */}
        <AuxiliaryDataBoundary
          componentName="contract agreement"
          showErrorUI={false}
          fallback={
            <div className="mb-12 p-8 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Loading</h3>
                <p className="text-gray-600">Please wait while we prepare your contract...</p>
              </div>
            </div>
          }
        >
          <ContractAgreement
            bookingData={contractData.bookingData}
            contractText={contractData.contractText}
            contractVersion={contractData.contractVersion}
            className="mb-12"
          />
        </AuxiliaryDataBoundary>

        {/* Signature Section - Core functionality, always render */}
        <div className="space-y-6">
          <AuxiliaryDataBoundary
            componentName="signature capture"
            showErrorUI={false}
            fallback={
              <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border-2 border-gray-200 p-6">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Signature Widget Loading</h3>
                  <p className="text-gray-600">Please wait while we prepare the signature interface...</p>
                </div>
              </div>
            }
          >
            <SignatureBox
              onSignatureChange={handleSignatureChange}
              value={signatureData.signaturePngBase64}
              signerName={signatureData.signerFullName}
              onSignerNameChange={handleSignerNameChange}
              disabled={isSubmitting}
            />
          </AuxiliaryDataBoundary>

          {/* Consent Checkbox */}
          <div className="max-w-2xl mx-auto">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={signatureData.consentAccepted}
                onChange={(e) => handleConsentChange(e.target.checked)}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                aria-describedby="consent-description"
              />
              <span id="consent-description" className="text-sm text-gray-700">
                I have read, understood, and agree to the terms and conditions of this contract.
                I acknowledge that my digital signature has the same legal effect as a handwritten signature.
              </span>
            </label>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Please fix the following errors:
                    </h3>
                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                    <p className="mt-1 text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Add-Ons
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={
              !signatureData.signaturePngBase64 ||
              !signatureData.consentAccepted ||
              isSubmitting
            }
            className={clsx(
              'flex items-center min-w-32',
              isSubmitting && 'opacity-75'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Sign & Continue to Payment
              </>
            )}
          </Button>
        </div>

        {/* Auxiliary Data Status - Non-blocking information */}
        {auxiliaryDataErrors.length > 0 && (
          <AuxiliaryDataBoundary
            componentName="auxiliary data status"
            showErrorUI={true}
          >
            <div className="max-w-2xl mx-auto mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm text-yellow-800">
                    Some optional features are temporarily unavailable
                  </span>
                </div>
              </div>
            </div>
          </AuxiliaryDataBoundary>
        )}

        {/* Save & Return Later */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Your progress is automatically saved. You can return to complete this step later.
          </p>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  )
}

export default ContractStep