/**
 * Integration Tests for Complete Booking Flow
 * Tests end-to-end user journey from photographer profile through booking wizard
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BookingFlowProvider } from '../../src/contexts/BookingFlowContext'
import BookingSidebar from '../../src/components/booking/BookingSidebar'
import PackageDetails from '../../src/pages/customer/booking/PackageDetails'
import BookingFlowGuard from '../../src/components/booking/BookingFlowGuard'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CalendarIcon: ({ className, ...props }) => <div data-testid="calendar-icon" className={className} {...props} />,
  SunIcon: ({ className, ...props }) => <div data-testid="sun-icon" className={className} {...props} />,
  MoonIcon: ({ className, ...props }) => <div data-testid="moon-icon" className={className} {...props} />,
  CreditCardIcon: ({ className, ...props }) => <div data-testid="credit-card-icon" className={className} {...props} />,
  CheckIcon: ({ className, ...props }) => <div data-testid="check-icon" className={className} {...props} />,
  StarIcon: ({ className, ...props }) => <div data-testid="star-icon" className={className} {...props} />
}))

// Mock UI components with simplified versions
jest.mock('../../src/components/ui/Calendar', () => {
  return function MockCalendar({ value, onChange, className }) {
    return (
      <div data-testid="calendar" className={className}>
        <button
          data-testid="calendar-select-june-15"
          onClick={() => onChange?.(new Date('2024-06-15'))}
        >
          Select June 15
        </button>
        <div data-testid="selected-date">
          {value ? value.toDateString() : 'No date selected'}
        </div>
      </div>
    )
  }
})

jest.mock('../../src/components/ui/Button', () => {
  return function MockButton({ children, onClick, disabled, variant, size, className, ...props }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-size={size}
        className={className}
        data-testid={props['data-testid']}
        {...props}
      >
        {children}
      </button>
    )
  }
})

jest.mock('../../src/components/ui/Card', () => {
  return function MockCard({ children, onClick, className, role, tabIndex, onKeyDown, ...props }) {
    return (
      <div
        onClick={onClick}
        className={className}
        role={role}
        tabIndex={tabIndex}
        onKeyDown={onKeyDown}
        data-testid="package-card"
        {...props}
      >
        {children}
      </div>
    )
  }
})

jest.mock('../../src/components/booking/BookingStepper', () => {
  return function MockBookingStepper({ steps, currentStepIndex, onStepClick }) {
    return (
      <div data-testid="booking-stepper">
        <div data-testid="current-step-index">{currentStepIndex}</div>
        {steps?.map((step, index) => (
          <div key={step.id} data-testid={`step-${step.id}`} data-status={step.status}>
            <button
              data-testid={`step-button-${step.id}`}
              onClick={() => onStepClick?.(index, step)}
              disabled={step.status === 'upcoming'}
            >
              {step.label} ({step.status})
            </button>
          </div>
        ))}
      </div>
    )
  }
})

// Mock react-router-dom for navigation tracking
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}))

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
  let store = { booking_session_id: 'test-session-123' }
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString() }),
    removeItem: jest.fn((key) => { delete store[key] }),
    clear: jest.fn(() => { store = {} }),
    get store() { return store },
    set store(newStore) { store = newStore }
  }
}

// Test wrapper component
const TestWrapper = ({ children, initialRoute = '/photographer/photographer-123' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <BookingFlowProvider>
        {children}
      </BookingFlowProvider>
    </MemoryRouter>
  )
}

describe('Booking Flow Integration Tests', () => {
  let mockLocalStorageImpl
  let mockSessionStorageImpl

  beforeEach(() => {
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

    // Default params
    mockUseParams.mockReturnValue({ photographerId: 'photographer-123' })
  })

  describe('Complete Booking Flow', () => {
    test('completes full booking flow from sidebar to package selection', async () => {
      // Test photographer data
      const testPhotographer = {
        id: 'photographer-123',
        users: { full_name: 'John Doe' },
        display_name: 'John Doe Photography'
      }

      // Step 1: Render BookingSidebar (photographer profile page)
      const { rerender } = render(
        <TestWrapper>
          <BookingSidebar photographer={testPhotographer} />
        </TestWrapper>
      )

      // Step 2: Select date in calendar
      const calendarSelectButton = screen.getByTestId('calendar-select-june-15')
      fireEvent.click(calendarSelectButton)

      // Verify date selection
      await waitFor(() => {
        expect(screen.getByTestId('selected-date')).toHaveTextContent('Sat Jun 15 2024')
      })

      // Step 3: Select time of day
      const morningButton = screen.getByRole('button', { name: /Morning/i })
      fireEvent.click(morningButton)

      // Step 4: Click "Request to book" button
      const requestButton = screen.getByRole('button', { name: /Request to book/i })
      expect(requestButton).not.toBeDisabled()
      fireEvent.click(requestButton)

      // Verify navigation to package details
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package')
      })

      // Step 5: Simulate navigation to package details page
      rerender(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Step 6: Verify package details page renders
      await waitFor(() => {
        expect(screen.getByText('Choose Your Package')).toBeInTheDocument()
        expect(screen.getByText('$199 Payment Plan')).toBeInTheDocument()
        expect(screen.getByText('$500 Deposit')).toBeInTheDocument()
      })

      // Step 7: Select a package
      const monthlyPackageCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyPackageCard)

      // Verify package selection
      await waitFor(() => {
        expect(screen.getByText('Package Selected')).toBeInTheDocument()
        expect(screen.getByText('$199 Payment Plan - Ready to continue')).toBeInTheDocument()
      })

      // Step 8: Click Continue button
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      expect(continueButton).not.toBeDisabled()
      fireEvent.click(continueButton)

      // Verify navigation to details step
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/details')
      })
    })

    test('maintains state across page refresh simulation', async () => {
      const testPhotographer = {
        id: 'photographer-123',
        users: { full_name: 'Jane Smith' }
      }

      // Step 1: Complete initial booking flow
      render(
        <TestWrapper>
          <BookingSidebar photographer={testPhotographer} />
        </TestWrapper>
      )

      fireEvent.click(screen.getByTestId('calendar-select-june-15'))
      fireEvent.click(screen.getByRole('button', { name: /Afternoon/i }))
      fireEvent.click(screen.getByRole('button', { name: /Request to book/i }))

      // Wait for localStorage to be updated
      await waitFor(() => {
        expect(mockLocalStorageImpl.setItem).toHaveBeenCalled()
      })

      // Step 2: Simulate page refresh by setting up localStorage with saved data
      const savedData = {
        photographerId: 'photographer-123',
        currentStep: 'package',
        completedSteps: ['schedule'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'afternoon',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: null, selectedAt: null },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: false, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(savedData)
      }

      // Step 3: Render package details page (simulating direct navigation after refresh)
      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Verify state is restored and page renders correctly
      await waitFor(() => {
        expect(screen.getByText('Choose Your Package')).toBeInTheDocument()
      })

      // Verify stepper shows correct state
      expect(screen.getByTestId('step-schedule')).toHaveAttribute('data-status', 'completed')
      expect(screen.getByTestId('step-package')).toHaveAttribute('data-status', 'current')
      expect(screen.getByTestId('step-details')).toHaveAttribute('data-status', 'upcoming')
    })
  })

  describe('Route Protection Integration', () => {
    test('prevents access to package step without schedule completion', async () => {
      // Try to access package step directly without completing schedule
      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Should redirect to photographer profile (schedule step)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('prevents access to details step without package completion', async () => {
      // Setup state with only schedule completed
      const partialState = {
        photographerId: 'photographer-123',
        currentStep: 'package',
        completedSteps: ['schedule'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'morning',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: null, selectedAt: null },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: false, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(partialState)
      }

      // Try to access details step
      render(
        <TestWrapper initialRoute="/booking/photographer-123/details">
          <BookingFlowGuard requiredStep="details">
            <div data-testid="details-content">Location Details</div>
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Should redirect to package step
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package', { replace: true })
      })
    })

    test('allows access when all prerequisites are met', async () => {
      // Setup complete state
      const completeState = {
        photographerId: 'photographer-123',
        currentStep: 'details',
        completedSteps: ['schedule', 'package'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'morning',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: 'monthly', selectedAt: new Date().toISOString() },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: true, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(completeState)
      }

      // Access details step
      render(
        <TestWrapper initialRoute="/booking/photographer-123/details">
          <BookingFlowGuard requiredStep="details">
            <div data-testid="details-content">Location Details</div>
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Should render content without redirecting
      await waitFor(() => {
        expect(screen.getByTestId('details-content')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Multi-Package Selection Flow', () => {
    test('handles switching between package options', async () => {
      // Setup with schedule completed
      const stateWithSchedule = {
        photographerId: 'photographer-123',
        currentStep: 'package',
        completedSteps: ['schedule'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'morning',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: null, selectedAt: null },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: false, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(stateWithSchedule)
      }

      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Select monthly package first
      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      await waitFor(() => {
        expect(screen.getByText('$199 Payment Plan - Ready to continue')).toBeInTheDocument()
      })

      // Switch to deposit package
      const depositCard = screen.getByLabelText('Select $500 Deposit package')
      fireEvent.click(depositCard)

      await waitFor(() => {
        expect(screen.getByText('$500 Deposit - Ready to continue')).toBeInTheDocument()
      })

      // Verify continue button is still enabled
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    test('validates package selection before allowing continuation', async () => {
      // Setup with schedule completed
      const stateWithSchedule = {
        photographerId: 'photographer-123',
        currentStep: 'package',
        completedSteps: ['schedule'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'afternoon',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: null, selectedAt: null },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: false, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(stateWithSchedule)
      }

      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Verify continue button is initially disabled
      const continueButton = screen.getByRole('button', { name: /Continue/i })
      expect(continueButton).toBeDisabled()

      // Verify help text is shown
      expect(screen.getByText('Please select a package to continue to the next step')).toBeInTheDocument()

      // Select a package
      const depositCard = screen.getByLabelText('Select $500 Deposit package')
      fireEvent.click(depositCard)

      // Verify continue button becomes enabled
      await waitFor(() => {
        expect(continueButton).not.toBeDisabled()
      })

      // Verify help text is hidden
      expect(screen.queryByText('Please select a package to continue to the next step')).not.toBeInTheDocument()
    })
  })

  describe('Navigation Integration', () => {
    test('back button navigates to previous step', async () => {
      const stateWithSchedule = {
        photographerId: 'photographer-123',
        currentStep: 'package',
        completedSteps: ['schedule'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'morning',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: null, selectedAt: null },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: false, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(stateWithSchedule)
      }

      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Click back button
      const backButton = screen.getByRole('button', { name: /Back to Schedule/i })
      fireEvent.click(backButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/schedule')
      })
    })

    test('stepper navigation works for completed steps', async () => {
      const stateWithPackageCompleted = {
        photographerId: 'photographer-123',
        currentStep: 'details',
        completedSteps: ['schedule', 'package'],
        scheduleDetails: {
          date: '2024-06-15T00:00:00.000Z',
          timeOfDay: 'morning',
          selectedAt: new Date().toISOString()
        },
        packageDetails: { packageType: 'monthly', selectedAt: new Date().toISOString() },
        locationDetails: { selectedAt: null },
        validationState: { schedule: true, package: true, details: false }
      }

      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': JSON.stringify(stateWithPackageCompleted)
      }

      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Click on schedule step in stepper
      const scheduleStepButton = screen.getByTestId('step-button-schedule')
      fireEvent.click(scheduleStepButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/schedule')
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('handles corrupted localStorage data gracefully', async () => {
      // Set corrupted data in localStorage
      mockLocalStorageImpl.store = {
        'booking_flow_photographer-123_test-session-123': 'invalid-json-data-{'
      }

      render(
        <TestWrapper initialRoute="/booking/photographer-123/package">
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Should redirect due to invalid state (no schedule completion)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/photographer-123', { replace: true })
      })
    })

    test('handles missing photographer ID gracefully', async () => {
      mockUseParams.mockReturnValue({}) // No photographerId

      render(
        <TestWrapper>
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Should redirect to browse page
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/browse', { replace: true })
      })
    })

    test('initializes fresh flow for new photographer', async () => {
      // Start with different photographer data in storage
      const differentPhotographerState = {
        photographerId: 'different-photographer',
        currentStep: 'package',
        completedSteps: ['schedule']
      }

      mockLocalStorageImpl.store = {
        'booking_flow_different-photographer_test-session-123': JSON.stringify(differentPhotographerState)
      }

      // Access with new photographer
      mockUseParams.mockReturnValue({ photographerId: 'new-photographer-456' })

      render(
        <TestWrapper>
          <BookingFlowGuard requiredStep="package">
            <PackageDetails />
          </BookingFlowGuard>
        </TestWrapper>
      )

      // Should redirect because new flow has no schedule completion
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographer/new-photographer-456', { replace: true })
      })
    })
  })

  describe('Performance and State Management', () => {
    test('efficiently manages localStorage updates', async () => {
      const testPhotographer = {
        id: 'photographer-123',
        users: { full_name: 'Test Photographer' }
      }

      render(
        <TestWrapper>
          <BookingSidebar photographer={testPhotographer} />
        </TestWrapper>
      )

      // Make multiple selections
      fireEvent.click(screen.getByTestId('calendar-select-june-15'))
      fireEvent.click(screen.getByRole('button', { name: /Morning/i }))

      // Verify localStorage is called appropriately (should debounce/batch updates)
      await waitFor(() => {
        expect(mockLocalStorageImpl.setItem).toHaveBeenCalled()
      })

      // Click request to book
      fireEvent.click(screen.getByRole('button', { name: /Request to book/i }))

      // Verify final state is saved
      await waitFor(() => {
        const callCount = mockLocalStorageImpl.setItem.mock.calls.length
        expect(callCount).toBeGreaterThan(0)

        // Check that the final call includes the correct data
        const lastCall = mockLocalStorageImpl.setItem.mock.calls[callCount - 1]
        const [key, value] = lastCall
        expect(key).toContain('booking_flow_photographer-123')

        const parsedValue = JSON.parse(value)
        expect(parsedValue.scheduleDetails.timeOfDay).toBe('morning')
        expect(parsedValue.validationState.schedule).toBe(true)
      })
    })
  })
})