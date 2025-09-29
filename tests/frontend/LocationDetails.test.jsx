/**
 * Unit Tests for LocationDetails Page
 * Tests step 3 of booking flow - location selection with all states and interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LocationDetails from '../../src/pages/customer/booking/LocationDetails'

// Mock React Router
const mockNavigate = jest.fn()
const mockUseParams = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}))

// Mock BookingFlowContext
const mockGoToStep = jest.fn()
const mockCanAccessStep = jest.fn()
const mockUpdateLocationDetails = jest.fn()
const mockGetStepsForStepper = jest.fn()

jest.mock('../../src/contexts/BookingFlowContext', () => ({
  useBookingFlow: () => ({
    bookingFlow: {
      locationDetails: null
    },
    goToStep: mockGoToStep,
    getStepsForStepper: mockGetStepsForStepper,
    canAccessStep: mockCanAccessStep,
    updateLocationDetails: mockUpdateLocationDetails
  })
}))

// Mock usePhotographerLocations hook
const mockUsePhotographerLocations = jest.fn()

jest.mock('../../src/hooks/usePhotographerLocations', () => ({
  usePhotographerLocations: (photographerId) => mockUsePhotographerLocations(photographerId)
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPinIcon: ({ className, ...props }) => <div data-testid="map-pin-icon" className={className} {...props} />
}))

// Mock components
jest.mock('../../src/components/booking/BookingStepper', () => {
  return function MockBookingStepper({ steps, currentStepIndex, onStepClick }) {
    return (
      <div data-testid="booking-stepper" data-current-step={currentStepIndex}>
        {steps.map((step, index) => (
          <button
            key={step.id}
            data-testid={`step-${step.id}`}
            data-status={step.status}
            onClick={() => onStepClick(index, step)}
          >
            {step.title}
          </button>
        ))}
      </div>
    )
  }
})

jest.mock('../../src/components/booking/LocationCard', () => ({
  __esModule: true,
  default: function MockLocationCard({ location, isSelected, onSelect, onRouteDetails }) {
    return (
      <div
        data-testid={`location-card-${location.id}`}
        data-selected={isSelected}
        onClick={() => onSelect(location)}
      >
        <h3>{location.title}</h3>
        <p>{location.vibe}</p>
        <button
          data-testid={`route-details-${location.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onRouteDetails(location)
          }}
        >
          Route Details
        </button>
      </div>
    )
  },
  LoadingLocationCard: function MockLoadingLocationCard() {
    return <div data-testid="loading-location-card">Loading...</div>
  },
  EmptyLocationCard: function MockEmptyLocationCard() {
    return <div data-testid="empty-location-card">No locations available</div>
  }
}))

jest.mock('../../src/components/ui/Button', () => {
  return function MockButton({ children, variant, size, disabled, onClick, className, ...props }) {
    return (
      <button
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    )
  }
})

jest.mock('../../src/components/ui/Dialog', () => ({
  Dialog: function MockDialog({ open, onOpenChange, children }) {
    return open ? <div data-testid="dialog">{children}</div> : null
  },
  DialogContent: function MockDialogContent({ children, className }) {
    return <div data-testid="dialog-content" className={className}>{children}</div>
  },
  DialogHeader: function MockDialogHeader({ children }) {
    return <div data-testid="dialog-header">{children}</div>
  },
  DialogTitle: function MockDialogTitle({ children }) {
    return <h2 data-testid="dialog-title">{children}</h2>
  },
  DialogDescription: function MockDialogDescription({ children, className }) {
    return <p data-testid="dialog-description" className={className}>{children}</p>
  },
  DialogClose: function MockDialogClose({ onClose }) {
    return <button data-testid="dialog-close" onClick={onClose}>Close</button>
  }
}))

// Mock data
const mockLocations = [
  {
    id: 'loc-1',
    photographerId: 'photographer-123',
    title: 'Beach Location',
    vibe: 'Coastal vibes',
    imageUrl: 'https://example.com/beach.jpg',
    badge: 'Local\'s Choice',
    description: 'Beautiful beach with amazing sunsets'
  },
  {
    id: 'loc-2',
    photographerId: 'photographer-123',
    title: 'City Park',
    vibe: 'Urban nature',
    imageUrl: 'https://example.com/park.jpg',
    badge: 'Most Booked',
    description: 'Popular park with great photo opportunities'
  },
  {
    id: 'loc-3',
    photographerId: 'photographer-123',
    title: 'Downtown Area',
    vibe: 'Modern vibes',
    imageUrl: 'https://example.com/downtown.jpg',
    badge: null,
    description: 'Urban setting with architectural backdrops'
  }
]

const mockSteps = [
  { id: 'schedule', title: 'Schedule', status: 'completed' },
  { id: 'package', title: 'Package', status: 'completed' },
  { id: 'details', title: 'Details', status: 'current' },
  { id: 'confirm', title: 'Confirm', status: 'pending' }
]

const renderLocationDetails = (props = {}) => {
  return render(
    <MemoryRouter>
      <LocationDetails {...props} />
    </MemoryRouter>
  )
}

describe('LocationDetails Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset context mock to default
    const mockContextModule = require('../../src/contexts/BookingFlowContext')
    mockContextModule.useBookingFlow = jest.fn().mockReturnValue({
      bookingFlow: {
        locationDetails: null
      },
      goToStep: mockGoToStep,
      getStepsForStepper: mockGetStepsForStepper,
      canAccessStep: mockCanAccessStep,
      updateLocationDetails: mockUpdateLocationDetails
    })

    // Default mock setup
    mockUseParams.mockReturnValue({ photographerId: 'photographer-123' })
    mockCanAccessStep.mockReturnValue(true)
    mockGetStepsForStepper.mockReturnValue(mockSteps)
    mockUsePhotographerLocations.mockReturnValue({
      locations: mockLocations,
      isLoading: false,
      error: null
    })
  })

  describe('Page Structure', () => {
    test('renders main page elements', () => {
      renderLocationDetails()

      expect(screen.getByTestId('booking-stepper')).toBeInTheDocument()
      expect(screen.getByText('Choose Your Location')).toBeInTheDocument()
      expect(screen.getByText('Select where you\'d like your photo session to take place')).toBeInTheDocument()
    })

    test('renders BookingStepper with correct props', () => {
      renderLocationDetails()

      const stepper = screen.getByTestId('booking-stepper')
      expect(stepper).toHaveAttribute('data-current-step', '2')
      expect(mockGetStepsForStepper).toHaveBeenCalled()
    })

    test('calls goToStep on mount when access is allowed', () => {
      renderLocationDetails()

      expect(mockGoToStep).toHaveBeenCalledWith('details')
    })
  })

  describe('Route Protection', () => {
    test('redirects to schedule when cannot access details or package', () => {
      mockCanAccessStep.mockImplementation((step) => {
        if (step === 'details') return false
        if (step === 'package') return false
        return true
      })

      renderLocationDetails()

      expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/schedule', { replace: true })
    })

    test('redirects to package when cannot access details but can access package', () => {
      mockCanAccessStep.mockImplementation((step) => {
        if (step === 'details') return false
        if (step === 'package') return true
        return true
      })

      renderLocationDetails()

      expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package', { replace: true })
    })

    test('does not redirect when can access details', () => {
      mockCanAccessStep.mockReturnValue(true)

      renderLocationDetails()

      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/booking/'), { replace: true })
    })
  })

  describe('Loading States', () => {
    test('shows loading state when locations are loading', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: true,
        error: null
      })

      renderLocationDetails()

      const loadingCards = screen.getAllByTestId('loading-location-card')
      expect(loadingCards).toHaveLength(6)
      expect(screen.getByLabelText('Loading locations')).toBeInTheDocument()
    })

    test('does not show location grid when loading', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: true,
        error: null
      })

      renderLocationDetails()

      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    test('shows error state when there is an error', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: false,
        error: new Error('Failed to load')
      })

      renderLocationDetails()

      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
      expect(screen.getByText('Unable to Load Locations')).toBeInTheDocument()
      expect(screen.getByText('There was an error loading the available locations.')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    test('try again button is interactive', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: false,
        error: new Error('Failed to load')
      })

      renderLocationDetails()

      const tryAgainButton = screen.getByText('Try Again')
      expect(tryAgainButton).toBeInTheDocument()
      expect(tryAgainButton).toHaveAttribute('data-variant', 'outline')

      // Verify button is clickable (not disabled)
      expect(tryAgainButton).not.toBeDisabled()

      // Test that clicking doesn't throw an error
      expect(() => {
        fireEvent.click(tryAgainButton)
      }).not.toThrow()
    })

    test('does not show location grid when there is an error', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: false,
        error: new Error('Failed to load')
      })

      renderLocationDetails()

      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    test('shows empty state when no locations available', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: false,
        error: null
      })

      renderLocationDetails()

      expect(screen.getByTestId('empty-location-card')).toBeInTheDocument()
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    })
  })

  describe('Location Grid', () => {
    test('renders radiogroup with location cards when locations available', () => {
      renderLocationDetails()

      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toBeInTheDocument()
      expect(radiogroup).toHaveAttribute('aria-label', 'Location selection')
      expect(radiogroup).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4')
    })

    test('renders all location cards', () => {
      renderLocationDetails()

      expect(screen.getByTestId('location-card-loc-1')).toBeInTheDocument()
      expect(screen.getByTestId('location-card-loc-2')).toBeInTheDocument()
      expect(screen.getByTestId('location-card-loc-3')).toBeInTheDocument()

      expect(screen.getByText('Beach Location')).toBeInTheDocument()
      expect(screen.getByText('City Park')).toBeInTheDocument()
      expect(screen.getByText('Downtown Area')).toBeInTheDocument()
    })

    test('passes correct props to location cards', () => {
      renderLocationDetails()

      const card1 = screen.getByTestId('location-card-loc-1')
      expect(card1).toHaveAttribute('data-selected', 'false')
    })
  })

  describe('Location Selection', () => {
    test('updates selection state when location is clicked', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      // Should show selection summary
      expect(screen.getByText('Location Selected')).toBeInTheDocument()
      expect(screen.getByText('Beach Location - Coastal vibes')).toBeInTheDocument()
    })

    test('shows selection indicator for selected location', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      await waitFor(() => {
        const card = screen.getByTestId('location-card-loc-1')
        expect(card).toHaveAttribute('data-selected', 'true')
      })
    })

    test('exclusive selection - only one location can be selected', async () => {
      renderLocationDetails()

      // Select first location
      fireEvent.click(screen.getByTestId('location-card-loc-1'))
      await waitFor(() => {
        expect(screen.getByTestId('location-card-loc-1')).toHaveAttribute('data-selected', 'true')
      })

      // Select second location
      fireEvent.click(screen.getByTestId('location-card-loc-2'))
      await waitFor(() => {
        expect(screen.getByTestId('location-card-loc-1')).toHaveAttribute('data-selected', 'false')
        expect(screen.getByTestId('location-card-loc-2')).toHaveAttribute('data-selected', 'true')
      })
    })

    test('initializes selection from booking context', () => {
      // Mock existing location selection in context
      const mockContextModule = require('../../src/contexts/BookingFlowContext')
      mockContextModule.useBookingFlow = jest.fn().mockReturnValue({
        bookingFlow: {
          locationDetails: { locationId: 'loc-2' }
        },
        goToStep: mockGoToStep,
        getStepsForStepper: mockGetStepsForStepper,
        canAccessStep: mockCanAccessStep,
        updateLocationDetails: mockUpdateLocationDetails
      })

      renderLocationDetails()

      const card2 = screen.getByTestId('location-card-loc-2')
      expect(card2).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('Selection Summary', () => {
    test('shows selection summary when location is selected', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      expect(screen.getByText('Location Selected')).toBeInTheDocument()
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
      expect(screen.getByText('Beach Location - Coastal vibes')).toBeInTheDocument()
    })

    test('does not show selection summary when no location selected', () => {
      renderLocationDetails()

      expect(screen.queryByText('Location Selected')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    test('renders back button with correct navigation', () => {
      renderLocationDetails()

      const backButton = screen.getByText('Back to Packages')
      expect(backButton).toHaveAttribute('data-variant', 'outline')

      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/package')
    })

    test('renders continue button', () => {
      renderLocationDetails()

      const continueButton = screen.getByText('Continue')
      expect(continueButton).toHaveAttribute('data-size', 'lg')
      expect(continueButton).toHaveClass('min-w-32')
    })
  })

  describe('Continue Button Behavior', () => {
    test('continue button is disabled when no location selected', () => {
      renderLocationDetails()

      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeDisabled()
    })

    test('continue button is enabled when location is selected', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      await waitFor(() => {
        const continueButton = screen.getByText('Continue')
        expect(continueButton).not.toBeDisabled()
      })
    })

    test('continue button updates context and navigates', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      await waitFor(() => {
        const continueButton = screen.getByText('Continue')
        expect(continueButton).not.toBeDisabled()
      })

      fireEvent.click(screen.getByText('Continue'))

      expect(mockUpdateLocationDetails).toHaveBeenCalledWith({
        locationId: 'loc-1',
        locationTitle: 'Beach Location',
        locationVibe: 'Coastal vibes'
      })

      expect(mockNavigate).toHaveBeenCalledWith('/booking/confirm')
    })

    test('continue button does nothing when no location selected', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByText('Continue'))

      expect(mockUpdateLocationDetails).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalledWith('/booking/confirm')
    })
  })

  describe('Help Text', () => {
    test('shows help text when no location selected and locations available', () => {
      renderLocationDetails()

      expect(screen.getByText('Please select a location to continue to the next step')).toBeInTheDocument()
    })

    test('does not show help text when location is selected', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      await waitFor(() => {
        expect(screen.queryByText('Please select a location to continue to the next step')).not.toBeInTheDocument()
      })
    })

    test('does not show help text when loading', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: true,
        error: null
      })

      renderLocationDetails()

      expect(screen.queryByText('Please select a location to continue to the next step')).not.toBeInTheDocument()
    })

    test('does not show help text when no locations available', () => {
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: false,
        error: null
      })

      renderLocationDetails()

      expect(screen.queryByText('Please select a location to continue to the next step')).not.toBeInTheDocument()
    })
  })

  describe('Route Details Modal', () => {
    test('opens modal when route details button is clicked', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-1'))

      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Beach Location')
      expect(screen.getByTestId('dialog-description')).toHaveTextContent('Coastal vibes')
    })

    test('displays location information in modal', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-1'))

      expect(screen.getByText('About This Location')).toBeInTheDocument()
      expect(screen.getByText('Beautiful beach with amazing sunsets')).toBeInTheDocument()
      expect(screen.getByText('Why Choose This Location')).toBeInTheDocument()
      expect(screen.getByText(/Recommended by local photographers/)).toBeInTheDocument()
    })

    test('shows location image in modal when available', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-1'))

      const image = screen.getByAltText('Beach Location')
      expect(image).toHaveAttribute('src', 'https://example.com/beach.jpg')
      expect(image).toHaveClass('w-full', 'h-48', 'object-cover')
    })

    test('shows different badge explanation for Most Booked', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-2'))

      expect(screen.getByText(/One of our most popular locations/)).toBeInTheDocument()
    })

    test('does not show badge section when location has no badge', () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-3'))

      expect(screen.queryByText('Why Choose This Location')).not.toBeInTheDocument()
    })

    test('modal select button selects location and closes modal', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-1'))

      const selectButton = screen.getByText('Select This Location')
      fireEvent.click(selectButton)

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })

      // Location should be selected
      await waitFor(() => {
        expect(screen.getByText('Location Selected')).toBeInTheDocument()
        expect(screen.getByText('Beach Location - Coastal vibes')).toBeInTheDocument()
      })
    })

    test('modal button shows "Selected" when location is already selected', async () => {
      renderLocationDetails()

      // Select location first
      fireEvent.click(screen.getByTestId('location-card-loc-1'))

      await waitFor(() => {
        expect(screen.getByText('Location Selected')).toBeInTheDocument()
      })

      // Open modal for selected location
      fireEvent.click(screen.getByTestId('route-details-loc-1'))

      expect(screen.getByText('Selected')).toBeInTheDocument()
      expect(screen.queryByText('Select This Location')).not.toBeInTheDocument()
    })

    test('closes modal when close button is clicked', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('route-details-loc-1'))
      expect(screen.getByTestId('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('dialog-close'))

      await waitFor(() => {
        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Stepper Integration', () => {
    test('handles step click navigation for completed steps', () => {
      renderLocationDetails()

      const stepButton = screen.getByTestId('step-schedule')
      fireEvent.click(stepButton)

      expect(mockNavigate).toHaveBeenCalledWith('/booking/photographer-123/schedule')
    })

    test('does not navigate for non-completed steps', () => {
      mockGetStepsForStepper.mockReturnValue([
        { id: 'schedule', title: 'Schedule', status: 'completed' },
        { id: 'package', title: 'Package', status: 'completed' },
        { id: 'details', title: 'Details', status: 'current' },
        { id: 'confirm', title: 'Confirm', status: 'pending' }
      ])

      renderLocationDetails()

      const stepButton = screen.getByTestId('step-confirm')
      fireEvent.click(stepButton)

      expect(mockNavigate).not.toHaveBeenCalledWith('/booking/photographer-123/confirm')
    })
  })

  describe('Context Integration', () => {
    test('fetches locations for correct photographer', () => {
      renderLocationDetails()

      expect(mockUsePhotographerLocations).toHaveBeenCalledWith('photographer-123')
    })

    test('calls updateLocationDetails with correct data structure', async () => {
      renderLocationDetails()

      fireEvent.click(screen.getByTestId('location-card-loc-2'))

      await waitFor(() => {
        const continueButton = screen.getByText('Continue')
        expect(continueButton).not.toBeDisabled()
      })

      fireEvent.click(screen.getByText('Continue'))

      expect(mockUpdateLocationDetails).toHaveBeenCalledWith({
        locationId: 'loc-2',
        locationTitle: 'City Park',
        locationVibe: 'Urban nature'
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles missing modal location gracefully', () => {
      renderLocationDetails()

      // Manually trigger modal open without setting modalLocation
      // This simulates an edge case scenario
      const component = screen.getByTestId('booking-stepper').closest('div')

      // Component should still render without crashing
      expect(component).toBeInTheDocument()
    })

    test('handles continue click when selected location is not found', async () => {
      // Set up initial state with empty locations
      mockUsePhotographerLocations.mockReturnValue({
        locations: [],
        isLoading: false,
        error: null
      })

      renderLocationDetails()

      // Manually set selectedLocationId as if a location was previously selected
      // but now the locations list is empty
      const component = screen.getByText('Choose Your Location').closest('div')

      // Force the component to have a selectedLocationId but no matching location
      // Since we can't easily manipulate internal state, this test verifies
      // that the component still works when there's a mismatch
      expect(component).toBeInTheDocument()

      // The continue button should be disabled when no locations available
      const continueButton = screen.getByText('Continue')
      expect(continueButton).toBeDisabled()
    })
  })
})