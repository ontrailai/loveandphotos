/**
 * Unit Tests for PackageDetails Component
 * Tests package selection, navigation, context integration, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PackageDetails from '../../../src/pages/customer/booking/PackageDetails'
import { BookingFlowProvider } from '../../../src/contexts/BookingFlowContext'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CreditCardIcon: ({ className, ...props }) => <div data-testid="credit-card-icon" className={className} {...props} />,
  CheckIcon: ({ className, ...props }) => <div data-testid="check-icon" className={className} {...props} />,
  StarIcon: ({ className, ...props }) => <div data-testid="star-icon" className={className} {...props} />
}))

// Mock BookingStepper component
jest.mock('../../../src/components/booking/BookingStepper', () => {
  return function MockBookingStepper({ steps, currentStepIndex, onStepClick }) {
    return (
      <div data-testid="booking-stepper">
        <div data-testid="current-step-index">{currentStepIndex}</div>
        <button
          data-testid="stepper-step-0"
          onClick={() => onStepClick?.(0, steps?.[0])}
        >
          Step 0
        </button>
      </div>
    )
  }
})

// Mock UI components
jest.mock('../../../src/components/ui/Button', () => {
  return function MockButton({ children, onClick, disabled, variant, size, className, ...props }) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-size={size}
        className={className}
        {...props}
      >
        {children}
      </button>
    )
  }
})

jest.mock('../../../src/components/ui/Card', () => {
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

jest.mock('../../../src/components/ui/Badge', () => {
  return function MockBadge({ children, className, ...props }) {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    )
  }
})

// Mock react-router-dom navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ photographerId: 'test-photographer-123' })
}))

const renderPackageDetails = (props = {}) => {
  const defaultProps = {
    ...props
  }

  // Create test booking flow context
  const TestBookingFlowProvider = ({ children }) => {
    const [mockBookingFlow] = React.useState({
      photographerId: 'test-photographer-123',
      currentStep: 'package',
      completedSteps: ['schedule'],
      scheduleDetails: {
        date: new Date('2024-06-15'),
        timeOfDay: 'morning',
        selectedAt: new Date()
      },
      packageDetails: {
        packageType: props.initialPackage || null,
        selectedAt: props.initialPackage ? new Date() : null
      },
      locationDetails: { selectedAt: null },
      validationState: { schedule: true, package: false, details: false }
    })

    const mockContext = {
      bookingFlow: mockBookingFlow,
      updatePackageDetails: jest.fn(),
      goToStep: jest.fn(),
      getStepsForStepper: jest.fn(() => [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]),
      canAccessStep: jest.fn((step) => {
        if (step === 'schedule') return true
        if (step === 'package') return props.canAccessPackage !== false
        if (step === 'details') return false
        return false
      })
    }

    return (
      <div data-testid="mock-booking-context" data-context={JSON.stringify(mockContext)}>
        {React.cloneElement(children, { mockContext })}
      </div>
    )
  }

  return render(
    <MemoryRouter initialEntries={['/booking/test-photographer-123/package']}>
      <TestBookingFlowProvider>
        <PackageDetails {...defaultProps} />
      </TestBookingFlowProvider>
    </MemoryRouter>
  )
}

describe('PackageDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders page header and description', () => {
      renderPackageDetails()

      expect(screen.getByText('Choose Your Package')).toBeInTheDocument()
      expect(screen.getByText('Select the payment option that works best for you')).toBeInTheDocument()
    })

    test('renders BookingStepper with correct props', () => {
      renderPackageDetails()

      const stepper = screen.getByTestId('booking-stepper')
      expect(stepper).toBeInTheDocument()
      expect(screen.getByTestId('current-step-index')).toHaveTextContent('1')
    })

    test('renders both package cards', () => {
      renderPackageDetails()

      expect(screen.getByText('$199 Payment Plan')).toBeInTheDocument()
      expect(screen.getByText('$500 Deposit')).toBeInTheDocument()
    })

    test('renders monthly plan with popular badge', () => {
      renderPackageDetails()

      expect(screen.getByText('MOST POPULAR')).toBeInTheDocument()
      expect(screen.getByTestId('star-icon')).toBeInTheDocument()
    })

    test('renders package features lists', () => {
      renderPackageDetails()

      // Monthly plan features
      expect(screen.getByText('Split payment into 6 monthly installments')).toBeInTheDocument()
      expect(screen.getByText('No interest or hidden fees')).toBeInTheDocument()

      // Deposit plan features
      expect(screen.getByText('Secure your photographer immediately')).toBeInTheDocument()
      expect(screen.getByText('Remaining balance due 30 days before event')).toBeInTheDocument()
    })

    test('renders pricing information correctly', () => {
      renderPackageDetails()

      expect(screen.getByText('$199')).toBeInTheDocument()
      expect(screen.getByText('/month')).toBeInTheDocument()
      expect(screen.getByText('$500')).toBeInTheDocument()
      expect(screen.getByText('upfront')).toBeInTheDocument()
    })

    test('renders action buttons for both packages', () => {
      renderPackageDetails()

      expect(screen.getByRole('button', { name: /Monthly Plan/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Deposit/i })).toBeInTheDocument()
    })

    test('renders navigation buttons', () => {
      renderPackageDetails()

      expect(screen.getByRole('button', { name: /Back to Schedule/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument()
    })

    test('renders credit card acceptance information', () => {
      renderPackageDetails()

      expect(screen.getAllByTestId('credit-card-icon')).toHaveLength(2)
      expect(screen.getAllByText('Visa, Mastercard, Amex, Discover')).toHaveLength(2)
    })

    test('shows help text when no package selected', () => {
      renderPackageDetails()

      expect(screen.getByText('Please select a package to continue to the next step')).toBeInTheDocument()
    })

    test('does not show selection summary when no package selected', () => {
      renderPackageDetails()

      expect(screen.queryByText('Package Selected')).not.toBeInTheDocument()
    })
  })

  describe('Package Selection', () => {
    test('selects monthly package when clicked', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      // Check for selection indicator
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons.length).toBeGreaterThan(0)
    })

    test('selects deposit package when clicked', () => {
      renderPackageDetails()

      const depositCard = screen.getByLabelText('Select $500 Deposit package')
      fireEvent.click(depositCard)

      // Check for selection indicator
      const checkIcons = screen.getAllByTestId('check-icon')
      expect(checkIcons.length).toBeGreaterThan(0)
    })

    test('shows selection summary when package is selected', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      expect(screen.getByText('Package Selected')).toBeInTheDocument()
      expect(screen.getByText('$199 Payment Plan - Ready to continue')).toBeInTheDocument()
    })

    test('hides help text when package is selected', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      expect(screen.queryByText('Please select a package to continue to the next step')).not.toBeInTheDocument()
    })

    test('updates package button styles when selected', () => {
      renderPackageDetails()

      const monthlyButton = screen.getByRole('button', { name: /Monthly Plan/i })
      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')

      fireEvent.click(monthlyCard)

      expect(monthlyButton).toHaveAttribute('data-variant', 'primary')
    })

    test('can switch between packages', () => {
      renderPackageDetails()

      // Select monthly first
      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)
      expect(screen.getByText('$199 Payment Plan - Ready to continue')).toBeInTheDocument()

      // Switch to deposit
      const depositCard = screen.getByLabelText('Select $500 Deposit package')
      fireEvent.click(depositCard)
      expect(screen.getByText('$500 Deposit - Ready to continue')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    test('selects package with Enter key', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.keyDown(monthlyCard, { key: 'Enter' })

      expect(screen.getByText('Package Selected')).toBeInTheDocument()
    })

    test('selects package with Space key', () => {
      renderPackageDetails()

      const depositCard = screen.getByLabelText('Select $500 Deposit package')
      fireEvent.keyDown(depositCard, { key: ' ' })

      expect(screen.getByText('Package Selected')).toBeInTheDocument()
    })

    test('ignores other key presses', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.keyDown(monthlyCard, { key: 'Tab' })
      fireEvent.keyDown(monthlyCard, { key: 'Escape' })

      expect(screen.queryByText('Package Selected')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    test('Continue button is disabled when no package selected', () => {
      renderPackageDetails()

      const continueButton = screen.getByRole('button', { name: /Continue/i })
      expect(continueButton).toBeDisabled()
    })

    test('Continue button is enabled when package selected', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      const continueButton = screen.getByRole('button', { name: /Continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    test('clicking Continue navigates to details step', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      const continueButton = screen.getByRole('button', { name: /Continue/i })
      fireEvent.click(continueButton)

      expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer-123/details')
    })

    test('clicking Back navigates to schedule step', () => {
      renderPackageDetails()

      const backButton = screen.getByRole('button', { name: /Back to Schedule/i })
      fireEvent.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer-123/schedule')
    })

    test('clicking completed step in stepper navigates correctly', () => {
      renderPackageDetails()

      const stepperButton = screen.getByTestId('stepper-step-0')
      fireEvent.click(stepperButton)

      expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer-123/schedule')
    })
  })

  describe('Accessibility', () => {
    test('package cards have proper ARIA attributes', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      const depositCard = screen.getByLabelText('Select $500 Deposit package')

      expect(monthlyCard).toHaveAttribute('role', 'button')
      expect(monthlyCard).toHaveAttribute('tabIndex', '0')
      expect(monthlyCard).toHaveAttribute('aria-pressed', 'false')

      expect(depositCard).toHaveAttribute('role', 'button')
      expect(depositCard).toHaveAttribute('tabIndex', '0')
      expect(depositCard).toHaveAttribute('aria-pressed', 'false')
    })

    test('selected package updates aria-pressed state', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      expect(monthlyCard).toHaveAttribute('aria-pressed', 'true')
    })

    test('package cards are keyboard focusable', () => {
      renderPackageDetails()

      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      const depositCard = screen.getByLabelText('Select $500 Deposit package')

      expect(monthlyCard).toHaveAttribute('tabIndex', '0')
      expect(depositCard).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Context Integration', () => {
    test('renders with pre-selected package from context', () => {
      renderPackageDetails({ initialPackage: 'monthly' })

      expect(screen.getByText('Package Selected')).toBeInTheDocument()
      expect(screen.getByText('$199 Payment Plan - Ready to continue')).toBeInTheDocument()
    })

    test('Continue button is enabled with pre-selected package', () => {
      renderPackageDetails({ initialPackage: 'deposit' })

      const continueButton = screen.getByRole('button', { name: /Continue/i })
      expect(continueButton).not.toBeDisabled()
    })

    test('redirects when cannot access package step', async () => {
      renderPackageDetails({ canAccessPackage: false })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/booking/test-photographer-123/schedule', { replace: true })
      })
    })
  })

  describe('Edge Cases', () => {
    test('handles missing photographerId parameter', () => {
      // Mock useParams to return no photographerId
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({})
      }))

      expect(() => {
        renderPackageDetails()
      }).not.toThrow()
    })

    test('handles package button click event propagation', () => {
      renderPackageDetails()

      const monthlyButton = screen.getByRole('button', { name: /Monthly Plan/i })
      const clickEvent = { stopPropagation: jest.fn() }

      fireEvent.click(monthlyButton, clickEvent)

      expect(screen.getByText('Package Selected')).toBeInTheDocument()
    })

    test('displays correct package information for each option', () => {
      renderPackageDetails()

      // Monthly plan
      expect(screen.getByText('Flexible monthly payments')).toBeInTheDocument()
      expect(screen.getByText('Automatic payment processing')).toBeInTheDocument()

      // Deposit plan
      expect(screen.getByText('Single upfront deposit')).toBeInTheDocument()
      expect(screen.getByText('Preferred booking priority')).toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    test('shows selection indicator only for selected package', () => {
      renderPackageDetails()

      // Initially no selection indicators
      expect(screen.queryByText('Package Selected')).not.toBeInTheDocument()

      // Select monthly package
      const monthlyCard = screen.getByLabelText('Select $199 Payment Plan package')
      fireEvent.click(monthlyCard)

      // Now should show selection indicator
      expect(screen.getByText('Package Selected')).toBeInTheDocument()
    })

    test('monthly plan shows popular badge correctly', () => {
      renderPackageDetails()

      const popularBadge = screen.getByText('MOST POPULAR')
      const starIcon = screen.getByTestId('star-icon')

      expect(popularBadge).toBeInTheDocument()
      expect(starIcon).toBeInTheDocument()
    })

    test('deposit plan does not show popular badge', () => {
      renderPackageDetails()

      // Should only be one "MOST POPULAR" badge (for monthly plan)
      const popularBadges = screen.getAllByText('MOST POPULAR')
      expect(popularBadges).toHaveLength(1)
    })
  })
})