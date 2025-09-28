/**
 * Unit Tests for BookingFlowContext
 * Tests state management, localStorage persistence, and booking wizard logic
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { BookingFlowProvider, useBookingFlow } from '../../src/contexts/BookingFlowContext'

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234'
}))

// Mock console methods to test error handling
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Helper to create wrapper component
const createWrapper = (props = {}) => {
  return ({ children }) => (
    <BookingFlowProvider {...props}>
      {children}
    </BookingFlowProvider>
  )
}

// Helper to mock localStorage
const mockLocalStorage = () => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString() }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    get store() { return store },
    set store(newStore) { store = newStore }
  }
}

// Helper to mock sessionStorage
const mockSessionStorage = () => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString() }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    get store() { return store },
    set store(newStore) { store = newStore }
  }
}

describe('BookingFlowContext', () => {
  let mockLocalStorageImpl
  let mockSessionStorageImpl

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Mock localStorage and sessionStorage
    mockLocalStorageImpl = mockLocalStorage()
    mockSessionStorageImpl = mockSessionStorage()

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorageImpl,
      writable: true
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorageImpl,
      writable: true
    })

    // Mock console
    console.error = jest.fn()
    console.warn = jest.fn()
  })

  afterEach(() => {
    // Restore console
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  describe('Provider and Hook Setup', () => {
    test('renders children correctly', () => {
      const TestComponent = () => <div>Test Content</div>
      const { result } = renderHook(() => <TestComponent />, {
        wrapper: createWrapper()
      })

      expect(result.current).toBeDefined()
    })

    test('useBookingFlow throws error when used outside provider', () => {
      const { result } = renderHook(() => useBookingFlow())

      expect(result.error).toEqual(
        new Error('useBookingFlow must be used within BookingFlowProvider')
      )
    })

    test('provides all expected context values', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      const context = result.current

      // State
      expect(context.bookingFlow).toBeDefined()
      expect(context.sessionId).toBeDefined()

      // Actions
      expect(typeof context.initializeBookingFlow).toBe('function')
      expect(typeof context.updateScheduleDetails).toBe('function')
      expect(typeof context.updatePackageDetails).toBe('function')
      expect(typeof context.updateLocationDetails).toBe('function')
      expect(typeof context.goToStep).toBe('function')
      expect(typeof context.resetBookingFlow).toBe('function')

      // Utilities
      expect(typeof context.canAccessStep).toBe('function')
      expect(typeof context.getCurrentStepConfig).toBe('function')
      expect(typeof context.getStepsForStepper).toBe('function')
      expect(typeof context.hasProgress).toBe('function')

      // Constants
      expect(context.BOOKING_STEPS).toBeDefined()
      expect(Array.isArray(context.BOOKING_STEPS)).toBe(true)
    })
  })

  describe('Initial State', () => {
    test('has correct initial booking flow state', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      const { bookingFlow } = result.current

      expect(bookingFlow).toEqual({
        photographerId: null,
        currentStep: 'schedule',
        completedSteps: [],
        scheduleDetails: {
          date: null,
          timeOfDay: null,
          selectedAt: null
        },
        packageDetails: {
          packageType: null,
          selectedAt: null
        },
        locationDetails: {
          selectedAt: null
        },
        validationState: {
          schedule: false,
          package: false,
          details: false
        }
      })
    })

    test('generates session ID correctly', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      expect(result.current.sessionId).toBe('booking_mock-uuid-1234')
      expect(mockSessionStorageImpl.setItem).toHaveBeenCalledWith(
        'booking_session_id',
        'booking_mock-uuid-1234'
      )
    })

    test('reuses existing session ID', () => {
      mockSessionStorageImpl.store = { booking_session_id: 'existing-session-123' }

      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      expect(result.current.sessionId).toBe('existing-session-123')
    })

    test('BOOKING_STEPS constant is correctly defined', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      expect(result.current.BOOKING_STEPS).toEqual([
        { id: 'schedule', label: 'Schedule Details', order: 0 },
        { id: 'package', label: 'Package Details', order: 1 },
        { id: 'details', label: 'Location & Add-Ons', order: 2 }
      ])
    })
  })

  describe('localStorage Operations', () => {
    test('saves booking flow to localStorage on change', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(mockLocalStorageImpl.setItem).toHaveBeenCalledWith(
        'booking_flow_photographer-123_booking_mock-uuid-1234',
        expect.stringContaining('"photographerId":"photographer-123"')
      )
    })

    test('loads existing booking flow from localStorage', () => {
      const existingFlow = {
        photographerId: 'photographer-123',
        currentStep: 'package',
        completedSteps: ['schedule'],
        scheduleDetails: {
          date: '2024-06-15',
          timeOfDay: 'morning',
          selectedAt: '2024-01-01T00:00:00.000Z'
        },
        packageDetails: { packageType: null, selectedAt: null },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: false, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_booking_mock-uuid-1234': JSON.stringify(existingFlow)
      }

      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(result.current.bookingFlow.currentStep).toBe('package')
      expect(result.current.bookingFlow.completedSteps).toEqual(['schedule'])
    })

    test('handles localStorage errors gracefully', () => {
      mockLocalStorageImpl.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(console.error).toHaveBeenCalledWith('Failed to load booking flow:', expect.any(Error))
      expect(result.current.bookingFlow.photographerId).toBe('photographer-123')
    })

    test('handles corrupted localStorage data', () => {
      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_booking_mock-uuid-1234': 'invalid-json-{'
      }

      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(console.error).toHaveBeenCalledWith('Failed to load booking flow:', expect.any(Error))
      expect(result.current.bookingFlow.photographerId).toBe('photographer-123')
    })

    test('ignores stored data for different photographer', () => {
      const differentPhotographerFlow = {
        photographerId: 'different-photographer',
        currentStep: 'package'
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_booking_mock-uuid-1234': JSON.stringify(differentPhotographerFlow)
      }

      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(result.current.bookingFlow.currentStep).toBe('schedule')
      expect(result.current.bookingFlow.photographerId).toBe('photographer-123')
    })
  })

  describe('Booking Flow Initialization', () => {
    test('initializes new booking flow without initial data', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(result.current.bookingFlow.photographerId).toBe('photographer-123')
      expect(result.current.bookingFlow.currentStep).toBe('schedule')
      expect(result.current.bookingFlow.completedSteps).toEqual([])
      expect(result.current.bookingFlow.validationState.schedule).toBe(false)
    })

    test('initializes with initial schedule data', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      const initialData = {
        date: new Date('2024-06-15'),
        timeOfDay: 'morning'
      }

      act(() => {
        result.current.initializeBookingFlow('photographer-123', initialData)
      })

      expect(result.current.bookingFlow.scheduleDetails.date).toEqual(initialData.date)
      expect(result.current.bookingFlow.scheduleDetails.timeOfDay).toBe('morning')
      expect(result.current.bookingFlow.completedSteps).toEqual(['schedule'])
      expect(result.current.bookingFlow.currentStep).toBe('package')
      expect(result.current.bookingFlow.validationState.schedule).toBe(true)
    })

    test('handles initialization without photographerId', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow(null)
      })

      expect(result.current.bookingFlow.photographerId).toBe(null)
    })
  })

  describe('Schedule Details Updates', () => {
    test('updates schedule details correctly', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      const testDate = new Date('2024-06-15')

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      act(() => {
        result.current.updateScheduleDetails(testDate, 'afternoon')
      })

      expect(result.current.bookingFlow.scheduleDetails.date).toEqual(testDate)
      expect(result.current.bookingFlow.scheduleDetails.timeOfDay).toBe('afternoon')
      expect(result.current.bookingFlow.completedSteps).toContain('schedule')
      expect(result.current.bookingFlow.currentStep).toBe('package')
      expect(result.current.bookingFlow.validationState.schedule).toBe(true)
    })

    test('removes schedule completion when invalid data provided', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      expect(result.current.bookingFlow.completedSteps).toContain('schedule')

      act(() => {
        result.current.updateScheduleDetails(null, null)
      })

      expect(result.current.bookingFlow.completedSteps).not.toContain('schedule')
      expect(result.current.bookingFlow.currentStep).toBe('schedule')
      expect(result.current.bookingFlow.validationState.schedule).toBe(false)
    })

    test('sets selectedAt timestamp when updating schedule', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      const beforeUpdate = new Date()

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      const selectedAt = new Date(result.current.bookingFlow.scheduleDetails.selectedAt)
      expect(selectedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('Package Details Updates', () => {
    test('updates package details correctly', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updatePackageDetails('monthly')
      })

      expect(result.current.bookingFlow.packageDetails.packageType).toBe('monthly')
      expect(result.current.bookingFlow.completedSteps).toContain('package')
      expect(result.current.bookingFlow.currentStep).toBe('details')
      expect(result.current.bookingFlow.validationState.package).toBe(true)
    })

    test('removes package completion when null provided', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updatePackageDetails('deposit')
      })

      expect(result.current.bookingFlow.completedSteps).toContain('package')

      act(() => {
        result.current.updatePackageDetails(null)
      })

      expect(result.current.bookingFlow.completedSteps).not.toContain('package')
      expect(result.current.bookingFlow.currentStep).toBe('package')
      expect(result.current.bookingFlow.validationState.package).toBe(false)
    })

    test('handles deposit package selection', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updatePackageDetails('deposit')
      })

      expect(result.current.bookingFlow.packageDetails.packageType).toBe('deposit')
      expect(result.current.bookingFlow.validationState.package).toBe(true)
    })
  })

  describe('Location Details Updates', () => {
    test('updates location details correctly', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      const locationData = { venue: 'Test Venue', additionalInfo: 'Special requirements' }

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateLocationDetails(locationData)
      })

      expect(result.current.bookingFlow.locationDetails.venue).toBe('Test Venue')
      expect(result.current.bookingFlow.locationDetails.additionalInfo).toBe('Special requirements')
      expect(result.current.bookingFlow.completedSteps).toContain('details')
      expect(result.current.bookingFlow.validationState.details).toBe(true)
    })

    test('removes location completion when null provided', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateLocationDetails({ venue: 'Test' })
      })

      expect(result.current.bookingFlow.completedSteps).toContain('details')

      act(() => {
        result.current.updateLocationDetails(null)
      })

      expect(result.current.bookingFlow.completedSteps).not.toContain('details')
      expect(result.current.bookingFlow.validationState.details).toBe(false)
    })
  })

  describe('Step Access Validation', () => {
    test('allows access to schedule step always', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      expect(result.current.canAccessStep('schedule')).toBe(true)
    })

    test('blocks package step until schedule completed', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(result.current.canAccessStep('package')).toBe(false)

      act(() => {
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      expect(result.current.canAccessStep('package')).toBe(true)
    })

    test('blocks details step until package completed', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      expect(result.current.canAccessStep('details')).toBe(false)

      act(() => {
        result.current.updatePackageDetails('monthly')
      })

      expect(result.current.canAccessStep('details')).toBe(true)
    })

    test('returns false for invalid step names', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      expect(result.current.canAccessStep('invalid-step')).toBe(false)
      expect(result.current.canAccessStep('')).toBe(false)
      expect(result.current.canAccessStep(null)).toBe(false)
    })
  })

  describe('Step Navigation', () => {
    test('navigates to accessible step', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      act(() => {
        const success = result.current.goToStep('package')
        expect(success).toBe(true)
      })

      expect(result.current.bookingFlow.currentStep).toBe('package')
    })

    test('blocks navigation to inaccessible step', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      act(() => {
        const success = result.current.goToStep('details')
        expect(success).toBe(false)
      })

      expect(result.current.bookingFlow.currentStep).toBe('schedule')
      expect(console.warn).toHaveBeenCalledWith(
        'Cannot access step "details" - prerequisites not met'
      )
    })
  })

  describe('Utility Functions', () => {
    test('getCurrentStepConfig returns correct configuration', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      const config = result.current.getCurrentStepConfig()
      expect(config).toEqual({
        id: 'schedule',
        label: 'Schedule Details',
        order: 0
      })
    })

    test('getStepsForStepper returns correct step statuses', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      const steps = result.current.getStepsForStepper()
      expect(steps).toEqual([
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ])
    })

    test('hasProgress detects booking progress', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(result.current.hasProgress()).toBe(false)

      act(() => {
        result.current.updateScheduleDetails(new Date(), 'morning')
      })

      expect(result.current.hasProgress()).toBe(true)
    })

    test('hasProgress detects package selection progress', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updatePackageDetails('monthly')
      })

      expect(result.current.hasProgress()).toBe(true)
    })
  })

  describe('Reset Functionality', () => {
    test('resets booking flow to initial state', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
        result.current.updatePackageDetails('monthly')
      })

      act(() => {
        result.current.resetBookingFlow('photographer-456')
      })

      expect(result.current.bookingFlow.photographerId).toBe('photographer-456')
      expect(result.current.bookingFlow.currentStep).toBe('schedule')
      expect(result.current.bookingFlow.completedSteps).toEqual([])
      expect(result.current.bookingFlow.validationState.schedule).toBe(false)
    })

    test('clears localStorage when resetting with photographerId', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.resetBookingFlow('photographer-123')
      })

      expect(mockLocalStorageImpl.removeItem).toHaveBeenCalledWith(
        'booking_flow_photographer-123_booking_mock-uuid-1234'
      )
    })

    test('resets without photographerId', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.resetBookingFlow()
      })

      expect(result.current.bookingFlow.photographerId).toBe(null)
    })
  })

  describe('Edge Cases', () => {
    test('handles duplicate completed steps correctly', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
        result.current.updateScheduleDetails(new Date(), 'afternoon')
      })

      const scheduleSteps = result.current.bookingFlow.completedSteps.filter(step => step === 'schedule')
      expect(scheduleSteps).toHaveLength(1)
    })

    test('preserves existing completed steps when updating', () => {
      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
        result.current.updateScheduleDetails(new Date(), 'morning')
        result.current.updatePackageDetails('monthly')
      })

      expect(result.current.bookingFlow.completedSteps).toEqual(['schedule', 'package'])

      act(() => {
        result.current.updateScheduleDetails(new Date(), 'afternoon')
      })

      expect(result.current.bookingFlow.completedSteps).toContain('schedule')
      expect(result.current.bookingFlow.completedSteps).toContain('package')
    })

    test('handles storage save errors gracefully', () => {
      mockLocalStorageImpl.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useBookingFlow(), {
        wrapper: createWrapper()
      })

      act(() => {
        result.current.initializeBookingFlow('photographer-123')
      })

      expect(console.error).toHaveBeenCalledWith('Failed to save booking flow:', expect.any(Error))
    })
  })
})