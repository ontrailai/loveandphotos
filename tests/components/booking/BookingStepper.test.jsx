/**
 * Unit Tests for BookingStepper Component
 * Tests stepper states, accessibility, and navigation
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BookingStepper from '../../../src/components/booking/BookingStepper'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircleIcon: ({ className, ...props }) => <div data-testid="check-circle" className={className} {...props} />,
  CircleIcon: ({ className, ...props }) => <div data-testid="circle" className={className} {...props} />
}))

const renderBookingStepper = (props = {}) => {
  const defaultProps = {
    steps: [
      { id: 'schedule', label: 'Schedule Details', status: 'completed' },
      { id: 'package', label: 'Package Details', status: 'current' },
      { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
    ],
    currentStepIndex: 1,
    ...props
  }

  return render(
    <MemoryRouter>
      <BookingStepper {...defaultProps} />
    </MemoryRouter>
  )
}

describe('BookingStepper Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders all steps with correct labels', () => {
      renderBookingStepper()

      expect(screen.getByText('Schedule Details')).toBeInTheDocument()
      expect(screen.getByText('Package Details')).toBeInTheDocument()
      expect(screen.getByText('Location & Add-Ons')).toBeInTheDocument()
    })

    test('renders with correct ARIA attributes', () => {
      renderBookingStepper()

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Booking progress')

      const currentStep = screen.getByLabelText(/Package Details.*current step/i)
      expect(currentStep).toHaveAttribute('aria-current', 'step')
    })

    test('renders completed step with check icon', () => {
      renderBookingStepper()

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)
      expect(completedStep).toBeInTheDocument()

      // Check for check circle icon within the completed step
      const checkIcon = completedStep.querySelector('[data-testid="check-circle"]')
      expect(checkIcon).toBeInTheDocument()
    })

    test('renders upcoming step with circle icon', () => {
      renderBookingStepper()

      const upcomingStep = screen.getByLabelText(/Location & Add-Ons.*upcoming/i)
      expect(upcomingStep).toBeInTheDocument()

      // Check for circle icon within the upcoming step
      const circleIcon = upcomingStep.querySelector('[data-testid="circle"]')
      expect(circleIcon).toBeInTheDocument()
    })

    test('renders current step with correct styling', () => {
      renderBookingStepper()

      const currentStep = screen.getByLabelText(/Package Details.*current step/i)
      expect(currentStep).toBeInTheDocument()

      // Check for current step indicator (white dot)
      const currentIndicator = currentStep.querySelector('.bg-white')
      expect(currentIndicator).toBeInTheDocument()
    })
  })

  describe('Step States', () => {
    test('handles all completed steps', () => {
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'completed' },
        { id: 'details', label: 'Location & Add-Ons', status: 'completed' }
      ]

      renderBookingStepper({ steps, currentStepIndex: 2 })

      // All steps should show as completed
      expect(screen.getByLabelText(/Schedule Details.*completed/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Package Details.*completed/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Location & Add-Ons.*completed/i)).toBeInTheDocument()
    })

    test('handles all upcoming steps', () => {
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'current' },
        { id: 'package', label: 'Package Details', status: 'upcoming' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({ steps, currentStepIndex: 0 })

      expect(screen.getByLabelText(/Schedule Details.*current step/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Package Details.*upcoming/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Location & Add-Ons.*upcoming/i)).toBeInTheDocument()
    })

    test('handles custom step configuration', () => {
      const customSteps = [
        { id: 'step1', label: 'Custom Step 1', status: 'completed' },
        { id: 'step2', label: 'Custom Step 2', status: 'current' }
      ]

      renderBookingStepper({ steps: customSteps, currentStepIndex: 1 })

      expect(screen.getByText('Custom Step 1')).toBeInTheDocument()
      expect(screen.getByText('Custom Step 2')).toBeInTheDocument()
    })
  })

  describe('Interaction', () => {
    test('calls onStepClick when completed step is clicked', () => {
      const mockOnStepClick = jest.fn()
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({
        steps,
        currentStepIndex: 1,
        onStepClick: mockOnStepClick
      })

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)
      fireEvent.click(completedStep)

      expect(mockOnStepClick).toHaveBeenCalledWith(0, steps[0])
    })

    test('does not call onStepClick when current step is clicked', () => {
      const mockOnStepClick = jest.fn()
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({
        steps,
        currentStepIndex: 1,
        onStepClick: mockOnStepClick
      })

      const currentStep = screen.getByLabelText(/Package Details.*current step/i)
      fireEvent.click(currentStep)

      expect(mockOnStepClick).not.toHaveBeenCalled()
    })

    test('does not call onStepClick when upcoming step is clicked', () => {
      const mockOnStepClick = jest.fn()
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({
        steps,
        currentStepIndex: 1,
        onStepClick: mockOnStepClick
      })

      const upcomingStep = screen.getByLabelText(/Location & Add-Ons.*upcoming/i)
      fireEvent.click(upcomingStep)

      expect(mockOnStepClick).not.toHaveBeenCalled()
    })

    test('does not call onStepClick when no callback provided', () => {
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({ steps, currentStepIndex: 1 })

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)

      // Should not throw error when clicking without callback
      expect(() => {
        fireEvent.click(completedStep)
      }).not.toThrow()
    })
  })

  describe('Keyboard Navigation', () => {
    test('handles Enter key on completed step', () => {
      const mockOnStepClick = jest.fn()
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({
        steps,
        currentStepIndex: 1,
        onStepClick: mockOnStepClick
      })

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)
      fireEvent.keyDown(completedStep, { key: 'Enter' })

      expect(mockOnStepClick).toHaveBeenCalledWith(0, steps[0])
    })

    test('handles Space key on completed step', () => {
      const mockOnStepClick = jest.fn()
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({
        steps,
        currentStepIndex: 1,
        onStepClick: mockOnStepClick
      })

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)
      fireEvent.keyDown(completedStep, { key: ' ' })

      expect(mockOnStepClick).toHaveBeenCalledWith(0, steps[0])
    })

    test('ignores other key presses', () => {
      const mockOnStepClick = jest.fn()
      const steps = [
        { id: 'schedule', label: 'Schedule Details', status: 'completed' },
        { id: 'package', label: 'Package Details', status: 'current' },
        { id: 'details', label: 'Location & Add-Ons', status: 'upcoming' }
      ]

      renderBookingStepper({
        steps,
        currentStepIndex: 1,
        onStepClick: mockOnStepClick
      })

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)
      fireEvent.keyDown(completedStep, { key: 'Tab' })
      fireEvent.keyDown(completedStep, { key: 'Escape' })

      expect(mockOnStepClick).not.toHaveBeenCalled()
    })
  })

  describe('Responsive Layout', () => {
    test('renders desktop layout by default', () => {
      renderBookingStepper()

      // Desktop layout should be visible (md:flex class)
      const desktopStepper = screen.getByRole('navigation').querySelector('.hidden.md\\:flex')
      expect(desktopStepper).toBeInTheDocument()
    })

    test('includes mobile layout', () => {
      renderBookingStepper()

      // Mobile layout should be present (md:hidden class)
      const mobileStepper = screen.getByRole('navigation').querySelector('.md\\:hidden')
      expect(mobileStepper).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper landmark role', () => {
      renderBookingStepper()

      const navigation = screen.getByRole('navigation')
      expect(navigation).toHaveAttribute('aria-label', 'Booking progress')
    })

    test('uses ordered list semantics', () => {
      renderBookingStepper()

      const lists = screen.getAllByRole('list')
      expect(lists.length).toBeGreaterThan(0)
    })

    test('has proper focus indicators', () => {
      const mockOnStepClick = jest.fn()
      renderBookingStepper({ onStepClick: mockOnStepClick })

      const completedStep = screen.getByLabelText(/Schedule Details.*completed/i)

      // Should have focus styles when callback provided
      expect(completedStep).toHaveClass('focus:outline-none')
      expect(completedStep).toHaveClass('focus:ring-2')
    })

    test('indicates disabled state properly', () => {
      renderBookingStepper()

      const upcomingStep = screen.getByLabelText(/Location & Add-Ons.*upcoming/i)
      expect(upcomingStep).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    test('handles empty steps array', () => {
      renderBookingStepper({ steps: [], currentStepIndex: 0 })

      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
    })

    test('handles invalid currentStepIndex', () => {
      renderBookingStepper({ currentStepIndex: 999 })

      // Should still render without errors
      expect(screen.getByText('Schedule Details')).toBeInTheDocument()
    })

    test('handles steps without id property', () => {
      const stepsWithoutId = [
        { label: 'Step 1', status: 'completed' },
        { label: 'Step 2', status: 'current' }
      ]

      expect(() => {
        renderBookingStepper({ steps: stepsWithoutId, currentStepIndex: 1 })
      }).not.toThrow()
    })
  })
})