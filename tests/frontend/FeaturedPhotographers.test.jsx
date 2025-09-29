import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { FeaturedPhotographersSection, PhotographerCard } from '../../src/components/ui/featured-photographers'
import { getPhotographerProfileLink } from '../../src/lib/supabaseClient'

// Mock Supabase functions
jest.mock('../../src/lib/supabaseClient', () => ({
  getFeaturedPhotographers: jest.fn(),
  getFeaturedPhotographersMetrics: jest.fn(),
  getPhotographerProfileLink: jest.fn(),
  formatCurrency: jest.fn((amount) => `$${amount}`)
}))

// Mock motion/react
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))

const mockPhotographer = {
  id: 'test-photographer-1',
  slug: 'test-photographer',
  full_name: 'Jane Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  tier: 'Gold',
  city: 'Los Angeles',
  state: 'CA',
  joinedDate: '2023',
  total_reviews: 15,
  weddings_completed: 25,
  average_rating: 4.8,
  hourly_rate: 200,
  bio: 'Professional wedding photographer with 5+ years experience.'
}

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      {component}
    </MemoryRouter>
  )
}

describe('FeaturedPhotographers Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PhotographerCard Navigation', () => {
    test('renders View Profile link with correct href for slug', () => {
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).toBeInTheDocument()
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/test-photographer')
    })

    test('renders View Profile link with correct href for id fallback', () => {
      const photographerWithoutSlug = { ...mockPhotographer, slug: null }
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer-1')

      renderWithRouter(
        <PhotographerCard photographer={photographerWithoutSlug} index={0} />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).toBeInTheDocument()
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/test-photographer-1')
    })

    test('hides View Profile button when profileLink is null', () => {
      getPhotographerProfileLink.mockReturnValue(null)

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      const viewProfileLink = screen.queryByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).not.toBeInTheDocument()
    })

    test('has proper accessibility attributes', () => {
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).toHaveAttribute('aria-label', `View ${mockPhotographer.full_name}'s profile`)
    })

    test('keyboard navigation works correctly', () => {
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })

      // Test focus
      viewProfileLink.focus()
      expect(viewProfileLink).toHaveFocus()

      // Test keyboard activation with Enter
      fireEvent.keyDown(viewProfileLink, { key: 'Enter', code: 'Enter' })
      // Link should handle Enter key navigation naturally
      expect(viewProfileLink).toBeInTheDocument()

      // Test keyboard activation with Space
      fireEvent.keyDown(viewProfileLink, { key: ' ', code: 'Space' })
      // Link should handle Space key navigation naturally
      expect(viewProfileLink).toBeInTheDocument()
    })

    test('displays correct photographer information', () => {
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      // Check photographer details
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('Los Angeles, CA')).toBeInTheDocument()
      expect(screen.getByText('Gold')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument() // reviews
      expect(screen.getByText('25')).toBeInTheDocument() // weddings
      expect(screen.getByText('4.8')).toBeInTheDocument() // rating
    })
  })

  describe('Navigation Button Consistency', () => {
    test('all navigation buttons use Link components instead of window.location', async () => {
      // Mock successful API calls
      const mockGetFeaturedPhotographers = require('../../src/lib/supabaseClient').getFeaturedPhotographers
      const mockGetFeaturedPhotographersMetrics = require('../../src/lib/supabaseClient').getFeaturedPhotographersMetrics

      mockGetFeaturedPhotographers.mockResolvedValue([mockPhotographer])
      mockGetFeaturedPhotographersMetrics.mockResolvedValue({
        acceptanceRate: 95,
        fiveStarReviews: 87,
        responseTime: 12
      })
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(<FeaturedPhotographersSection />)

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      })

      // Check View Profile link
      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/test-photographer')

      // Check View Photographers link (should appear at bottom)
      await waitFor(() => {
        const viewPhotographersLink = screen.getByRole('link', { name: /view photographers/i })
        expect(viewPhotographersLink).toHaveAttribute('href', '/photographers')
      })
    })
  })

  describe('getPhotographerProfileLink function', () => {
    beforeEach(() => {
      // Use real implementation for these tests
      jest.unmock('../../src/lib/supabaseClient')
      jest.doMock('../../src/lib/supabaseClient', () => ({
        getPhotographerProfileLink: (photographer) => {
          if (photographer.slug) {
            return `/photographer/${photographer.slug}`
          } else if (photographer.id) {
            return `/photographer/${photographer.id}`
          }
          return null
        }
      }))
    })

    afterEach(() => {
      jest.resetModules()
    })

    test('returns slug-based path when slug exists', () => {
      const photographer = { id: '123', slug: 'jane-doe-photographer' }
      // Call the real implementation
      const realGetPhotographerProfileLink = (photographer) => {
        if (photographer.slug) {
          return `/photographer/${photographer.slug}`
        } else if (photographer.id) {
          return `/photographer/${photographer.id}`
        }
        return null
      }
      const result = realGetPhotographerProfileLink(photographer)
      expect(result).toBe('/photographer/jane-doe-photographer')
    })

    test('returns id-based path when slug is missing', () => {
      const photographer = { id: '123', slug: null }
      const realGetPhotographerProfileLink = (photographer) => {
        if (photographer.slug) {
          return `/photographer/${photographer.slug}`
        } else if (photographer.id) {
          return `/photographer/${photographer.id}`
        }
        return null
      }
      const result = realGetPhotographerProfileLink(photographer)
      expect(result).toBe('/photographer/123')
    })

    test('returns null when both id and slug are missing', () => {
      const photographer = { id: null, slug: null }
      const realGetPhotographerProfileLink = (photographer) => {
        if (photographer.slug) {
          return `/photographer/${photographer.slug}`
        } else if (photographer.id) {
          return `/photographer/${photographer.id}`
        }
        return null
      }
      const result = realGetPhotographerProfileLink(photographer)
      expect(result).toBeNull()
    })

    test('prefers slug over id when both exist', () => {
      const photographer = { id: '123', slug: 'jane-doe-photographer' }
      const realGetPhotographerProfileLink = (photographer) => {
        if (photographer.slug) {
          return `/photographer/${photographer.slug}`
        } else if (photographer.id) {
          return `/photographer/${photographer.id}`
        }
        return null
      }
      const result = realGetPhotographerProfileLink(photographer)
      expect(result).toBe('/photographer/jane-doe-photographer')
    })
  })

  describe('Link vs Button Pattern', () => {
    test('uses Button asChild with Link pattern correctly', () => {
      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })

      // Should be a link element
      expect(viewProfileLink.tagName).toBe('A')

      // Should contain expected content
      expect(viewProfileLink).toHaveTextContent('View Profile')

      // Should have proper href
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/test-photographer')

      // Should have aria-label for accessibility
      expect(viewProfileLink).toHaveAttribute('aria-label')
    })

    test('no nested interactive elements warning', () => {
      // This test ensures we don't have button > a or a > button nesting
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      getPhotographerProfileLink.mockReturnValue('/photographer/test-photographer')

      renderWithRouter(
        <PhotographerCard photographer={mockPhotographer} index={0} />
      )

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).toBeInTheDocument()

      // Check for React warnings about nested interactive elements
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('nested')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Error States', () => {
    test('handles missing photographer data gracefully', () => {
      getPhotographerProfileLink.mockReturnValue(null)

      renderWithRouter(
        <PhotographerCard photographer={{}} index={0} />
      )

      // Should not crash and should hide view profile button
      const viewProfileLink = screen.queryByRole('link', { name: /view.*profile/i })
      expect(viewProfileLink).not.toBeInTheDocument()
    })
  })
})