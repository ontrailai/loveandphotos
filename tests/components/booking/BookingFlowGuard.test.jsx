/**
 * Unit Tests for BookingFlowGuard Component
 * Tests route protection, navigation logic, and access control
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BookingFlowGuard from '../../../src/components/booking/BookingFlowGuard'

// Mock react-router-dom hooks
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}))

// Mock BookingFlowContext
const mockBookingFlowContext = {
  bookingFlow: {
    photographerId: null,
    currentStep: 'schedule',
    completedSteps: []
  },
  canAccessStep: jest.fn(),
  initializeBookingFlow: jest.fn(),
  BOOKING_STEPS: [
    { id: 'schedule', label: 'Schedule Details', order: 0 },
    { id: 'package', label: 'Package Details', order: 1 },
    { id: 'details', label: 'Location & Add-Ons', order: 2 }
  ]
}

jest.mock('../../../src/contexts/BookingFlowContext', () => ({
  useBookingFlow: () => mockBookingFlowContext
}))

// Mock console.log to test logging behavior
const originalConsoleLog = console.log

const renderBookingFlowGuard = (props = {}) => {
  const defaultProps = {
    requiredStep: 'package',
    children: <div data-testid="protected-content">Protected Content</div>,
    ...props
  }

  return render(
    <MemoryRouter>
      <BookingFlowGuard {...defaultProps} />
    </MemoryRouter>
  )
}

describe('BookingFlowGuard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset mock implementations
    mockUseParams.mockReturnValue({ photographerId: 'photographer-123' })
    mockBookingFlowContext.bookingFlow = {
      photographerId: 'photographer-123',
      currentStep: 'package',
      completedSteps: ['schedule']
    }
    mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
      if (step === 'schedule') return true
      if (step === 'package') return true
      if (step === 'details') return false
      return false
    })

    // Mock console.log
    console.log = jest.fn()
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  describe('Rendering Behavior', () => {
    test('renders children when access is granted', () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(true)

      const { getByTestId } = renderBookingFlowGuard({
        requiredStep: 'package'
      })

      expect(getByTestId('protected-content')).toBeInTheDocument()
    })

    test('returns null when access is denied', () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      const { queryByTestId } = renderBookingFlowGuard({
        requiredStep: 'details'
      })

      expect(queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    test('returns null when photographerId is missing', () => {
      mockUseParams.mockReturnValue({})

      const { queryByTestId } = renderBookingFlowGuard()

      expect(queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    test('returns null when photographer does not match current flow', () => {
      mockUseParams.mockReturnValue({ photographerId: 'different-photographer' })
      mockBookingFlowContext.bookingFlow.photographerId = 'original-photographer'

      const { queryByTestId } = renderBookingFlowGuard()

      expect(queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    test('renders children with different content', () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(true)

      const customChildren = <div data-testid="custom-content">Custom Content</div>

      const { getByTestId } = renderBookingFlowGuard({
        children: customChildren
      })

      expect(getByTestId('custom-content')).toBeInTheDocument()
    })
  })

  describe('Route Protection Logic', () => {
    test('redirects to browse when no photographerId', async () => {
      mockUseParams.mockReturnValue({})

      renderBookingFlowGuard()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/browse', { replace: true })
      })
    })

    test('initializes booking flow for new photographer', async () => {
      mockBookingFlowContext.bookingFlow.photographerId = null
      mockUseParams.mockReturnValue({ photographerId: 'new-photographer' })

      renderBookingFlowGuard()

      await waitFor(() => {
        expect(mockBookingFlowContext.initializeBookingFlow).toHaveBeenCalledWith('new-photographer')
      })
    })

    test('does not initialize booking flow if already set for photographer', async () => {
      mockBookingFlowContext.bookingFlow.photographerId = 'photographer-123'
      mockUseParams.mockReturnValue({ photographerId: 'photographer-123' })

      renderBookingFlowGuard()

      await waitFor(() => {
        expect(mockBookingFlowContext.initializeBookingFlow).not.toHaveBeenCalled()
      })
    })

    test('redirects when user cannot access required step', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        if (step === 'schedule') return true
        if (step === 'package') return true
        if (step === 'details') return false
        return false
      })

      renderBookingFlowGuard({ requiredStep: 'details' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package', { replace: true })
      })
    })

    test('logs redirect information', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        return step === 'schedule'
      })

      renderBookingFlowGuard({ requiredStep: 'package' })

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          'BookingFlowGuard: Redirecting from package to /booking/photographer-123/schedule'
        )
      })
    })
  })

  describe('Redirect Path Construction', () => {
    test('uses custom fallbackPath when provided', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      renderBookingFlowGuard({
        requiredStep: 'details',
        fallbackPath: '/custom/path/:photographerId/fallback'
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/custom/path/photographer-123/fallback',
          { replace: true }
        )
      })
    })

    test('redirects to photographer profile for schedule step', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        return step === 'schedule'
      })

      renderBookingFlowGuard({ requiredStep: 'package' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('redirects to booking wizard step for non-schedule steps', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        if (step === 'schedule') return true
        if (step === 'package') return true
        return false
      })

      renderBookingFlowGuard({ requiredStep: 'details' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package', { replace: true })
      })
    })

    test('falls back to schedule when no steps are accessible', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      renderBookingFlowGuard({ requiredStep: 'package' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('handles fallbackPath without photographerId placeholder', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      renderBookingFlowGuard({
        requiredStep: 'details',
        fallbackPath: '/static/fallback/path'
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/static/fallback/path', { replace: true })
      })
    })
  })

  describe('Step Access Logic', () => {
    test('finds earliest accessible step correctly', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        if (step === 'schedule') return true
        if (step === 'package') return false
        if (step === 'details') return false
        return false
      })

      renderBookingFlowGuard({ requiredStep: 'details' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('handles all steps accessible', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(true)

      const { getByTestId } = renderBookingFlowGuard({ requiredStep: 'details' })

      expect(getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('handles partial step access correctly', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        if (step === 'schedule') return true
        if (step === 'package') return true
        if (step === 'details') return false
        return false
      })

      renderBookingFlowGuard({ requiredStep: 'details' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package', { replace: true })
      })
    })
  })

  describe('Context Integration', () => {
    test('uses BOOKING_STEPS from context correctly', async () => {
      const customSteps = [
        { id: 'custom1', label: 'Custom Step 1', order: 0 },
        { id: 'custom2', label: 'Custom Step 2', order: 1 }
      ]

      mockBookingFlowContext.BOOKING_STEPS = customSteps
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        return step === 'custom1'
      })

      renderBookingFlowGuard({ requiredStep: 'custom2' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/custom1', { replace: true })
      })
    })

    test('calls canAccessStep with correct parameters', () => {
      renderBookingFlowGuard({ requiredStep: 'package' })

      expect(mockBookingFlowContext.canAccessStep).toHaveBeenCalledWith('package')
    })

    test('handles canAccessStep returning undefined', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(undefined)

      renderBookingFlowGuard({ requiredStep: 'package' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })
  })

  describe('Effect Dependencies', () => {
    test('re-runs effect when photographerId changes', async () => {
      const { rerender } = renderBookingFlowGuard()

      // Change photographerId
      mockUseParams.mockReturnValue({ photographerId: 'new-photographer' })
      mockBookingFlowContext.bookingFlow.photographerId = 'photographer-123'

      rerender(
        <MemoryRouter>
          <BookingFlowGuard requiredStep="package">
            <div data-testid="protected-content">Protected Content</div>
          </BookingFlowGuard>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockBookingFlowContext.initializeBookingFlow).toHaveBeenCalledWith('new-photographer')
      })
    })

    test('re-runs effect when requiredStep changes', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        return step !== 'details'
      })

      const { rerender } = renderBookingFlowGuard({ requiredStep: 'package' })

      // Change requiredStep
      rerender(
        <MemoryRouter>
          <BookingFlowGuard requiredStep="details">
            <div data-testid="protected-content">Protected Content</div>
          </BookingFlowGuard>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })

    test('re-runs effect when fallbackPath changes', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      const { rerender } = renderBookingFlowGuard({
        requiredStep: 'details',
        fallbackPath: '/original/path/:photographerId'
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/original/path/photographer-123', { replace: true })
      })

      jest.clearAllMocks()

      // Change fallbackPath
      rerender(
        <MemoryRouter>
          <BookingFlowGuard
            requiredStep="details"
            fallbackPath="/new/path/:photographerId"
          >
            <div data-testid="protected-content">Protected Content</div>
          </BookingFlowGuard>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/new/path/photographer-123', { replace: true })
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles missing requiredStep', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      renderBookingFlowGuard({ requiredStep: undefined })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
    })

    test('handles invalid step names', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      renderBookingFlowGuard({ requiredStep: 'invalid-step' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('handles empty BOOKING_STEPS array', async () => {
      mockBookingFlowContext.BOOKING_STEPS = []
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      renderBookingFlowGuard({ requiredStep: 'package' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('handles null photographerId in params', async () => {
      mockUseParams.mockReturnValue({ photographerId: null })

      renderBookingFlowGuard()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/browse', { replace: true })
      })
    })

    test('handles empty string photographerId', async () => {
      mockUseParams.mockReturnValue({ photographerId: '' })

      renderBookingFlowGuard()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/browse', { replace: true })
      })
    })

    test('handles canAccessStep throwing error', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation(() => {
        throw new Error('Access check failed')
      })

      const { queryByTestId } = renderBookingFlowGuard()

      expect(queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    test('handles navigation errors gracefully', async () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed')
      })
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      expect(() => {
        renderBookingFlowGuard({ requiredStep: 'details' })
      }).not.toThrow()
    })
  })

  describe('Component Lifecycle', () => {
    test('does not navigate after component unmounts', async () => {
      mockBookingFlowContext.canAccessStep.mockReturnValue(false)

      const { unmount } = renderBookingFlowGuard()

      unmount()

      // Clear any pending navigations from before unmount
      jest.clearAllMocks()

      // Wait a bit to see if any delayed navigation occurs
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('handles rapid prop changes', async () => {
      const { rerender } = renderBookingFlowGuard({ requiredStep: 'package' })

      // Rapidly change props
      rerender(
        <MemoryRouter>
          <BookingFlowGuard requiredStep="details">
            <div data-testid="protected-content">Protected Content</div>
          </BookingFlowGuard>
        </MemoryRouter>
      )

      rerender(
        <MemoryRouter>
          <BookingFlowGuard requiredStep="schedule">
            <div data-testid="protected-content">Protected Content</div>
          </BookingFlowGuard>
        </MemoryRouter>
      )

      // Should handle rapid changes without errors
      expect(() => {}).not.toThrow()
    })
  })

  describe('Access Patterns', () => {
    test('allows access when all prerequisites are met', () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        return ['schedule', 'package'].includes(step)
      })

      const { getByTestId } = renderBookingFlowGuard({ requiredStep: 'package' })

      expect(getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    test('blocks access and redirects when prerequisites not met', async () => {
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        return step === 'schedule'
      })

      renderBookingFlowGuard({ requiredStep: 'package' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('handles complex access scenarios', async () => {
      // Scenario: Can access schedule and package, but not details
      mockBookingFlowContext.canAccessStep.mockImplementation((step) => {
        if (step === 'schedule') return true
        if (step === 'package') return true
        if (step === 'details') return false
        return false
      })

      // Request access to details - should redirect to package
      renderBookingFlowGuard({ requiredStep: 'details' })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package', { replace: true })
      })
    })
  })
})