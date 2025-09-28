/**
 * Trust and Availability Utilities Unit Tests
 * Testing trust badge calculations and availability level determination
 * Tests data formatting, color logic, and edge cases
 */

import { jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { TrustBadge, TrustBadges } from '@pages/photographers/components/TrustBadges'
import { AvailabilityChip, getAvailabilityLevel } from '@pages/photographers/components/AvailabilityChip'

describe('TrustBadges Utilities', () => {
  describe('TrustBadge Component', () => {
    test('should render bookings badge correctly', () => {
      render(<TrustBadge type="bookings" value={25} />)

      expect(screen.getByText('25 Events')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
    })

    test('should render singular event correctly', () => {
      render(<TrustBadge type="bookings" value={1} />)

      expect(screen.getByText('1 Event')).toBeInTheDocument()
    })

    test('should render response time in minutes', () => {
      render(<TrustBadge type="response" value={30} />)

      expect(screen.getByText('30min')).toBeInTheDocument()
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    test('should render response time in hours for large values', () => {
      render(<TrustBadge type="response" value={120} />)

      expect(screen.getByText('2h')).toBeInTheDocument()
    })

    test('should handle fractional hours correctly', () => {
      render(<TrustBadge type="response" value={150} />)

      expect(screen.getByText('3h')).toBeInTheDocument() // Should round to 2.5 → 3
    })

    test('should render acceptance rate as percentage', () => {
      render(<TrustBadge type="acceptance" value={0.85} />)

      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('Accept Rate')).toBeInTheDocument()
    })

    test('should handle perfect acceptance rate', () => {
      render(<TrustBadge type="acceptance" value={1.0} />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    test('should handle zero acceptance rate', () => {
      render(<TrustBadge type="acceptance" value={0} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    test('should not render when value is null', () => {
      const { container } = render(<TrustBadge type="bookings" value={null} />)

      expect(container.firstChild).toBeNull()
    })

    test('should not render when value is undefined', () => {
      const { container } = render(<TrustBadge type="bookings" value={undefined} />)

      expect(container.firstChild).toBeNull()
    })

    test('should render when value is 0', () => {
      render(<TrustBadge type="bookings" value={0} />)

      expect(screen.getByText('0 Events')).toBeInTheDocument()
    })

    test('should use custom label when provided', () => {
      render(<TrustBadge type="bookings" value={5} label="Custom Label" />)

      expect(screen.getByText('5 Events')).toBeInTheDocument()
      expect(screen.getByText('Custom Label')).toBeInTheDocument()
    })

    test('should apply correct color classes for acceptance rate', () => {
      // High acceptance rate (>= 90%)
      const { rerender, container } = render(
        <TrustBadge type="acceptance" value={0.95} />
      )

      expect(container.querySelector('.text-green-600')).toBeInTheDocument()

      // Medium acceptance rate (70-89%)
      rerender(<TrustBadge type="acceptance" value={0.8} />)
      expect(container.querySelector('.text-yellow-600')).toBeInTheDocument()

      // Low acceptance rate (< 70%)
      rerender(<TrustBadge type="acceptance" value={0.6} />)
      expect(container.querySelector('.text-gray-600')).toBeInTheDocument()
    })

    test('should apply correct color classes for response time', () => {
      const { rerender, container } = render(
        <TrustBadge type="response" value={25} />
      )

      // Fast response (<= 30 min)
      expect(container.querySelector('.text-green-600')).toBeInTheDocument()

      // Medium response (31-120 min)
      rerender(<TrustBadge type="response" value={60} />)
      expect(container.querySelector('.text-yellow-600')).toBeInTheDocument()

      // Slow response (> 120 min)
      rerender(<TrustBadge type="response" value={180} />)
      expect(container.querySelector('.text-gray-600')).toBeInTheDocument()
    })

    test('should apply color classes for bookings based on volume', () => {
      const { rerender, container } = render(
        <TrustBadge type="bookings" value={100} />
      )

      // High volume (>= 50)
      expect(container.querySelector('.text-blue-600')).toBeInTheDocument()

      // Medium volume (10-49)
      rerender(<TrustBadge type="bookings" value={25} />)
      expect(container.querySelector('.text-purple-600')).toBeInTheDocument()

      // Low volume (< 10)
      rerender(<TrustBadge type="bookings" value={5} />)
      expect(container.querySelector('.text-gray-600')).toBeInTheDocument()
    })
  })

  describe('TrustBadges Collection Component', () => {
    test('should render all provided badges horizontally', () => {
      render(
        <TrustBadges
          totalBookings={10}
          avgResponseTimeMinutes={45}
          acceptanceRate={0.88}
          layout="horizontal"
        />
      )

      expect(screen.getByText('10 Events')).toBeInTheDocument()
      expect(screen.getByText('45min')).toBeInTheDocument()
      expect(screen.getByText('88%')).toBeInTheDocument()
    })

    test('should render badges vertically when specified', () => {
      const { container } = render(
        <TrustBadges
          totalBookings={10}
          avgResponseTimeMinutes={45}
          layout="vertical"
        />
      )

      expect(container.querySelector('.flex-col')).toBeInTheDocument()
    })

    test('should filter out null/undefined values', () => {
      render(
        <TrustBadges
          totalBookings={10}
          avgResponseTimeMinutes={null}
          acceptanceRate={undefined}
        />
      )

      expect(screen.getByText('10 Events')).toBeInTheDocument()
      expect(screen.queryByText('Response')).not.toBeInTheDocument()
      expect(screen.queryByText('Accept Rate')).not.toBeInTheDocument()
    })

    test('should render nothing when all values are null/undefined', () => {
      const { container } = render(
        <TrustBadges
          totalBookings={null}
          avgResponseTimeMinutes={undefined}
          acceptanceRate={null}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    test('should include zero values in rendering', () => {
      render(
        <TrustBadges
          totalBookings={0}
          avgResponseTimeMinutes={0}
          acceptanceRate={0}
        />
      )

      expect(screen.getByText('0 Events')).toBeInTheDocument()
      expect(screen.getByText('0min')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      const { container } = render(
        <TrustBadges
          totalBookings={10}
          className="custom-class"
        />
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('getAvailabilityLevel Utility', () => {
    test('should determine level from percentage correctly', () => {
      expect(getAvailabilityLevel(90)).toBe('high')
      expect(getAvailabilityLevel(80)).toBe('high')
      expect(getAvailabilityLevel(70)).toBe('medium')
      expect(getAvailabilityLevel(50)).toBe('medium')
      expect(getAvailabilityLevel(30)).toBe('low')
      expect(getAvailabilityLevel(20)).toBe('low')
      expect(getAvailabilityLevel(10)).toBe('unknown')
    })

    test('should handle edge case percentages', () => {
      expect(getAvailabilityLevel(100)).toBe('high')
      expect(getAvailabilityLevel(0)).toBe('unknown')
      expect(getAvailabilityLevel(79.9)).toBe('medium')
      expect(getAvailabilityLevel(80.0)).toBe('high')
    })

    test('should infer from recent bookings when no percentage', () => {
      expect(getAvailabilityLevel(null, 1)).toBe('high')
      expect(getAvailabilityLevel(undefined, 2)).toBe('high')
      expect(getAvailabilityLevel(null, 3)).toBe('medium')
      expect(getAvailabilityLevel(null, 5)).toBe('medium')
      expect(getAvailabilityLevel(null, 6)).toBe('low')
      expect(getAvailabilityLevel(null, 10)).toBe('low')
    })

    test('should prioritize percentage over bookings', () => {
      // Even with many bookings, should use percentage
      expect(getAvailabilityLevel(90, 10)).toBe('high')
      expect(getAvailabilityLevel(30, 1)).toBe('low')
    })

    test('should return unknown for missing data', () => {
      expect(getAvailabilityLevel()).toBe('unknown')
      expect(getAvailabilityLevel(null)).toBe('unknown')
      expect(getAvailabilityLevel(undefined, null)).toBe('unknown')
      expect(getAvailabilityLevel(null, undefined)).toBe('unknown')
    })

    test('should handle zero values correctly', () => {
      expect(getAvailabilityLevel(0)).toBe('unknown')
      expect(getAvailabilityLevel(null, 0)).toBe('high') // 0 bookings = very available
    })
  })

  describe('AvailabilityChip Component', () => {
    test('should render high availability correctly', () => {
      render(<AvailabilityChip level="high" />)

      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByTitle('High Availability')).toBeInTheDocument()
    })

    test('should render medium availability correctly', () => {
      render(<AvailabilityChip level="medium" />)

      expect(screen.getByText('Limited')).toBeInTheDocument()
      expect(screen.getByTitle('Medium Availability')).toBeInTheDocument()
    })

    test('should render low availability correctly', () => {
      render(<AvailabilityChip level="low" />)

      expect(screen.getByText('Busy')).toBeInTheDocument()
      expect(screen.getByTitle('Low Availability')).toBeInTheDocument()
    })

    test('should render unknown availability correctly', () => {
      render(<AvailabilityChip level="unknown" />)

      expect(screen.getByText('Unknown')).toBeInTheDocument()
      expect(screen.getByTitle('Availability Unknown')).toBeInTheDocument()
    })

    test('should show full labels for larger sizes', () => {
      render(<AvailabilityChip level="high" size="lg" showLabel={true} />)

      expect(screen.getByText('High Availability')).toBeInTheDocument()
    })

    test('should hide labels when showLabel is false', () => {
      render(<AvailabilityChip level="high" showLabel={false} />)

      expect(screen.queryByText('Available')).not.toBeInTheDocument()
      expect(screen.queryByText('High Availability')).not.toBeInTheDocument()
    })

    test('should show calendar icon when requested', () => {
      const { container } = render(
        <AvailabilityChip level="high" showIcon={true} />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    test('should apply correct color classes', () => {
      const { rerender, container } = render(
        <AvailabilityChip level="high" />
      )

      expect(container.querySelector('.bg-green-100')).toBeInTheDocument()
      expect(container.querySelector('.text-green-700')).toBeInTheDocument()

      rerender(<AvailabilityChip level="medium" />)
      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument()
      expect(container.querySelector('.text-yellow-700')).toBeInTheDocument()

      rerender(<AvailabilityChip level="low" />)
      expect(container.querySelector('.bg-red-100')).toBeInTheDocument()
      expect(container.querySelector('.text-red-700')).toBeInTheDocument()

      rerender(<AvailabilityChip level="unknown" />)
      expect(container.querySelector('.bg-gray-100')).toBeInTheDocument()
      expect(container.querySelector('.text-gray-700')).toBeInTheDocument()
    })

    test('should apply correct size classes', () => {
      const { rerender, container } = render(
        <AvailabilityChip level="high" size="sm" />
      )

      expect(container.querySelector('.px-2')).toBeInTheDocument()
      expect(container.querySelector('.text-xs')).toBeInTheDocument()

      rerender(<AvailabilityChip level="high" size="md" />)
      expect(container.querySelector('.px-3')).toBeInTheDocument()
      expect(container.querySelector('.text-sm')).toBeInTheDocument()

      rerender(<AvailabilityChip level="high" size="lg" />)
      expect(container.querySelector('.px-4')).toBeInTheDocument()
      expect(container.querySelector('.text-base')).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      const { container } = render(
        <AvailabilityChip level="high" className="custom-class" />
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })

    test('should include status dot', () => {
      const { container } = render(<AvailabilityChip level="high" />)

      expect(container.querySelector('.bg-green-500')).toBeInTheDocument()
      expect(container.querySelector('.w-2.h-2')).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle extremely large numbers gracefully', () => {
      render(<TrustBadge type="bookings" value={999999} />)

      expect(screen.getByText('999999 Events')).toBeInTheDocument()
    })

    test('should handle very small acceptance rates', () => {
      render(<TrustBadge type="acceptance" value={0.001} />)

      expect(screen.getByText('0%')).toBeInTheDocument() // Should round to 0
    })

    test('should handle negative values gracefully', () => {
      render(<TrustBadge type="response" value={-5} />)

      // Should still render (could be a data error)
      expect(screen.getByText('-5min')).toBeInTheDocument()
    })

    test('should handle decimal bookings', () => {
      render(<TrustBadge type="bookings" value={5.7} />)

      expect(screen.getByText('5.7 Events')).toBeInTheDocument()
    })

    test('should handle NaN values', () => {
      const { container } = render(<TrustBadge type="bookings" value={NaN} />)

      // Should not render for NaN
      expect(container.firstChild).toBeNull()
    })

    test('should handle string numbers', () => {
      render(<TrustBadge type="bookings" value="25" />)

      expect(screen.getByText('25 Events')).toBeInTheDocument()
    })

    test('should handle availability level edge cases', () => {
      expect(getAvailabilityLevel(-10)).toBe('unknown')
      expect(getAvailabilityLevel(110)).toBe('high')
      expect(getAvailabilityLevel(NaN)).toBe('unknown')
    })
  })
})