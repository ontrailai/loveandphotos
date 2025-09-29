/**
 * Unit Tests for LocationCard Component
 * Tests selection state, accessibility, keyboard navigation, and interactions
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import LocationCard, { LoadingLocationCard, EmptyLocationCard } from '../../../src/components/booking/LocationCard'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckIcon: ({ className, ...props }) => <div data-testid="check-icon" className={className} {...props} />,
  MapPinIcon: ({ className, ...props }) => <div data-testid="map-pin-icon" className={className} {...props} />,
  ExternalLinkIcon: ({ className, ...props }) => <div data-testid="external-link-icon" className={className} {...props} />
}))

// Mock UI components
jest.mock('../../../src/components/ui/Badge', () => {
  return function MockBadge({ children, variant, size, className, ...props }) {
    return (
      <span
        data-testid="badge"
        data-variant={variant}
        data-size={size}
        className={className}
        {...props}
      >
        {children}
      </span>
    )
  }
})

const mockLocation = {
  id: 'loc-test-1',
  photographerId: 'photographer-123',
  title: 'Coronado Island Beach',
  vibe: 'Beautiful beach',
  imageUrl: 'https://example.com/beach.jpg',
  badge: 'Local\'s Choice',
  description: 'Stunning beach with golden sand and perfect sunset views.'
}

const mockLocationWithoutBadge = {
  id: 'loc-test-2',
  photographerId: 'photographer-123',
  title: 'City Park',
  vibe: 'Urban nature',
  imageUrl: 'https://example.com/park.jpg',
  badge: null,
  description: 'Beautiful city park with walking trails.'
}

const mockLocationMostBooked = {
  id: 'loc-test-3',
  photographerId: 'photographer-123',
  title: 'Downtown District',
  vibe: 'Urban vibes',
  imageUrl: 'https://example.com/downtown.jpg',
  badge: 'Most Booked',
  description: 'Modern downtown area with great architecture.'
}

const renderLocationCard = (props = {}) => {
  const defaultProps = {
    location: mockLocation,
    isSelected: false,
    onSelect: jest.fn(),
    onRouteDetails: jest.fn(),
    ...props
  }

  return render(<LocationCard {...defaultProps} />)
}

describe('LocationCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders with basic location information', () => {
      renderLocationCard()

      expect(screen.getByText('Coronado Island Beach')).toBeInTheDocument()
      expect(screen.getByText('Beautiful beach')).toBeInTheDocument()
      expect(screen.getByAltText('Coronado Island Beach')).toBeInTheDocument()
      expect(screen.getByText('Route Details')).toBeInTheDocument()
    })

    test('renders image with correct src and alt attributes', () => {
      renderLocationCard()

      const image = screen.getByAltText('Coronado Island Beach')
      expect(image).toHaveAttribute('src', 'https://example.com/beach.jpg')
      expect(image).toHaveAttribute('loading', 'lazy')
    })

    test('renders badge when location has badge', () => {
      renderLocationCard()

      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent('Local\'s Choice')
      expect(badge).toHaveAttribute('data-variant', 'primary')
    })

    test('does not render badge when location has no badge', () => {
      renderLocationCard({ location: mockLocationWithoutBadge })

      expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
    })

    test('renders Most Booked badge with success variant', () => {
      renderLocationCard({ location: mockLocationMostBooked })

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveTextContent('Most Booked')
      expect(badge).toHaveAttribute('data-variant', 'success')
    })

    test('renders Route Details button with correct accessibility', () => {
      renderLocationCard()

      const routeButton = screen.getByRole('button', { name: /View route details for Coronado Island Beach/i })
      expect(routeButton).toBeInTheDocument()
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument()
    })
  })

  describe('Selection State', () => {
    test('shows selection indicator when selected', () => {
      renderLocationCard({ isSelected: true })

      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })

    test('does not show selection indicator when not selected', () => {
      renderLocationCard({ isSelected: false })

      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument()
    })

    test('applies selected styling when selected', () => {
      const { container } = renderLocationCard({ isSelected: true })

      const card = container.firstChild
      expect(card).toHaveClass('border-primary-500', 'ring-2', 'ring-primary-500', 'shadow-lg')
    })

    test('applies unselected styling when not selected', () => {
      const { container } = renderLocationCard({ isSelected: false })

      const card = container.firstChild
      expect(card).toHaveClass('border-gray-200')
      expect(card).not.toHaveClass('border-primary-500', 'ring-2')
    })
  })

  describe('Accessibility', () => {
    test('has proper radio role and aria attributes', () => {
      const { container } = renderLocationCard({ isSelected: false })

      const card = container.firstChild
      expect(card).toHaveAttribute('role', 'radio')
      expect(card).toHaveAttribute('aria-checked', 'false')
      expect(card).toHaveAttribute('aria-label', 'Select Coronado Island Beach - Beautiful beach')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    test('updates aria-checked when selected', () => {
      const { container } = renderLocationCard({ isSelected: true })

      const card = container.firstChild
      expect(card).toHaveAttribute('aria-checked', 'true')
    })

    test('has focus management classes', () => {
      const { container } = renderLocationCard()

      const card = container.firstChild
      expect(card).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2', 'focus:ring-primary-500')
    })
  })

  describe('Interaction', () => {
    test('calls onSelect when card is clicked', () => {
      const mockOnSelect = jest.fn()
      const { container } = renderLocationCard({ onSelect: mockOnSelect })

      fireEvent.click(container.firstChild)

      expect(mockOnSelect).toHaveBeenCalledWith(mockLocation)
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    test('calls onRouteDetails when Route Details button is clicked', () => {
      const mockOnRouteDetails = jest.fn()
      renderLocationCard({ onRouteDetails: mockOnRouteDetails })

      const routeButton = screen.getByRole('button', { name: /View route details/i })
      fireEvent.click(routeButton)

      expect(mockOnRouteDetails).toHaveBeenCalledWith(mockLocation)
      expect(mockOnRouteDetails).toHaveBeenCalledTimes(1)
    })

    test('Route Details button click does not trigger card selection', () => {
      const mockOnSelect = jest.fn()
      const mockOnRouteDetails = jest.fn()
      renderLocationCard({
        onSelect: mockOnSelect,
        onRouteDetails: mockOnRouteDetails
      })

      const routeButton = screen.getByRole('button', { name: /View route details/i })
      fireEvent.click(routeButton)

      expect(mockOnRouteDetails).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    test('does not crash when onSelect is not provided', () => {
      const { container } = renderLocationCard({ onSelect: undefined })

      expect(() => {
        fireEvent.click(container.firstChild)
      }).not.toThrow()
    })

    test('does not crash when onRouteDetails is not provided', () => {
      renderLocationCard({ onRouteDetails: undefined })

      const routeButton = screen.getByRole('button', { name: /View route details/i })

      expect(() => {
        fireEvent.click(routeButton)
      }).not.toThrow()
    })
  })

  describe('Keyboard Navigation', () => {
    test('calls onSelect when Enter key is pressed', () => {
      const mockOnSelect = jest.fn()
      const { container } = renderLocationCard({ onSelect: mockOnSelect })

      fireEvent.keyDown(container.firstChild, { key: 'Enter' })

      expect(mockOnSelect).toHaveBeenCalledWith(mockLocation)
    })

    test('calls onSelect when Space key is pressed', () => {
      const mockOnSelect = jest.fn()
      const { container } = renderLocationCard({ onSelect: mockOnSelect })

      fireEvent.keyDown(container.firstChild, { key: ' ' })

      expect(mockOnSelect).toHaveBeenCalledWith(mockLocation)
    })

    test('prevents default behavior for Enter and Space keys', () => {
      const { container } = renderLocationCard()

      const enterEvent = { key: 'Enter', preventDefault: jest.fn() }
      const spaceEvent = { key: ' ', preventDefault: jest.fn() }

      fireEvent.keyDown(container.firstChild, enterEvent)
      fireEvent.keyDown(container.firstChild, spaceEvent)

      expect(enterEvent.preventDefault).toHaveBeenCalled()
      expect(spaceEvent.preventDefault).toHaveBeenCalled()
    })

    test('ignores other key presses', () => {
      const mockOnSelect = jest.fn()
      const { container } = renderLocationCard({ onSelect: mockOnSelect })

      fireEvent.keyDown(container.firstChild, { key: 'Tab' })
      fireEvent.keyDown(container.firstChild, { key: 'Escape' })
      fireEvent.keyDown(container.firstChild, { key: 'a' })

      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    test('Route Details button prevents event propagation on keydown', () => {
      const mockOnSelect = jest.fn()
      renderLocationCard({ onSelect: mockOnSelect })

      const routeButton = screen.getByRole('button', { name: /View route details/i })

      const enterEvent = { key: 'Enter', stopPropagation: jest.fn() }
      const spaceEvent = { key: ' ', stopPropagation: jest.fn() }

      fireEvent.keyDown(routeButton, enterEvent)
      fireEvent.keyDown(routeButton, spaceEvent)

      expect(enterEvent.stopPropagation).toHaveBeenCalled()
      expect(spaceEvent.stopPropagation).toHaveBeenCalled()
    })
  })

  describe('Props Handling', () => {
    test('applies custom className', () => {
      const { container } = renderLocationCard({ className: 'custom-class' })

      expect(container.firstChild).toHaveClass('custom-class')
    })

    test('passes through additional props', () => {
      const { container } = renderLocationCard({ 'data-testid': 'custom-location-card' })

      expect(container.firstChild).toHaveAttribute('data-testid', 'custom-location-card')
    })

    test('handles location with different title and vibe', () => {
      const customLocation = {
        ...mockLocation,
        title: 'Custom Location Name',
        vibe: 'Amazing vibes'
      }

      renderLocationCard({ location: customLocation })

      expect(screen.getByText('Custom Location Name')).toBeInTheDocument()
      expect(screen.getByText('Amazing vibes')).toBeInTheDocument()
      expect(screen.getByAltText('Custom Location Name')).toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    test('applies hover and group styles', () => {
      const { container } = renderLocationCard()

      const card = container.firstChild
      expect(card).toHaveClass('group', 'hover:border-primary-300', 'hover:shadow-lg')
    })

    test('image has hover transform styles', () => {
      renderLocationCard()

      const image = screen.getByAltText('Coronado Island Beach')
      expect(image).toHaveClass('group-hover:scale-105')
    })

    test('route details button has hover styles', () => {
      renderLocationCard()

      const routeButton = screen.getByRole('button', { name: /View route details/i })
      expect(routeButton).toHaveClass('hover:text-primary-700', 'hover:bg-primary-50')
    })
  })
})

describe('LoadingLocationCard Component', () => {
  test('renders skeleton loading state', () => {
    render(<LoadingLocationCard />)

    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  test('applies custom className', () => {
    const { container } = render(<LoadingLocationCard className="custom-loading" />)

    expect(container.firstChild).toHaveClass('custom-loading')
  })

  test('has proper structure for loading state', () => {
    const { container } = render(<LoadingLocationCard />)

    const card = container.firstChild
    expect(card).toHaveClass('rounded-lg', 'bg-white', 'border', 'border-gray-200')
  })
})

describe('EmptyLocationCard Component', () => {
  test('renders empty state message', () => {
    render(<EmptyLocationCard />)

    expect(screen.getByText('No Locations Available')).toBeInTheDocument()
    expect(screen.getByText(/This photographer hasn't added any locations yet/)).toBeInTheDocument()
    expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const { container } = render(<EmptyLocationCard className="custom-empty" />)

    expect(container.firstChild).toHaveClass('custom-empty')
  })

  test('has proper styling for empty state', () => {
    const { container } = render(<EmptyLocationCard />)

    const card = container.firstChild
    expect(card).toHaveClass('border-dashed', 'border-gray-300', 'bg-gray-50')
  })
})

describe('Edge Cases', () => {
  test('handles location without imageUrl gracefully', () => {
    const locationWithoutImage = {
      ...mockLocation,
      imageUrl: ''
    }

    renderLocationCard({ location: locationWithoutImage })

    const image = screen.getByAltText('Coronado Island Beach')
    expect(image).toHaveAttribute('src', '')
  })

  test('handles very long location titles', () => {
    const locationWithLongTitle = {
      ...mockLocation,
      title: 'This is a very long location title that might wrap to multiple lines and test the layout'
    }

    renderLocationCard({ location: locationWithLongTitle })

    expect(screen.getByText(/This is a very long location title/)).toBeInTheDocument()
  })

  test('handles special characters in location data', () => {
    const locationWithSpecialChars = {
      ...mockLocation,
      title: 'Location with "quotes" & special chars',
      vibe: 'Très belle & amazing!'
    }

    renderLocationCard({ location: locationWithSpecialChars })

    expect(screen.getByText('Location with "quotes" & special chars')).toBeInTheDocument()
    expect(screen.getByText('Très belle & amazing!')).toBeInTheDocument()
  })

  test('handles missing vibe text', () => {
    const locationWithoutVibe = {
      ...mockLocation,
      vibe: ''
    }

    renderLocationCard({ location: locationWithoutVibe })

    expect(screen.getByText('Coronado Island Beach')).toBeInTheDocument()
    // Vibe text should still render as empty
    const vibeElement = screen.getByText('Coronado Island Beach').parentElement.querySelector('p')
    expect(vibeElement).toBeInTheDocument()
  })
})