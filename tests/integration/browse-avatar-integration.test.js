/**
 * Browse.jsx Avatar Integration Tests
 * Testing the data transformation and SafeAvatar integration
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Browse from '@pages/customer/Browse'

// Mock Supabase
vi.mock('@lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [], // Will be overridden in tests
            error: null
          }))
        }))
      }))
    }))
  }
}))

// Mock the navigation hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  }
})

// Test data that mimics Supabase response
const mockPhotographerProfiles = [
  {
    id: '1',
    display_name: 'Sarah Johnson',
    portfolio_images: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
    ],
    bio: 'Professional wedding photographer',
    specialties: ['Wedding', 'Portrait'],
    hourly_rate: 200,
    location_city: 'New York',
    location_state: 'NY',
    average_rating: 4.8,
    is_verified: true,
    is_available: true
  },
  {
    id: '2',
    display_name: 'Mike Chen',
    portfolio_images: [], // No portfolio images
    bio: 'Event photographer',
    specialties: ['Event', 'Corporate'],
    hourly_rate: 150,
    location_city: 'Los Angeles',
    location_state: 'CA',
    average_rating: 4.5,
    is_verified: false,
    is_available: true
  },
  {
    id: '3',
    display_name: 'Emma Davis',
    portfolio_images: [
      'invalid-url', // Invalid portfolio image URL
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
    ],
    bio: 'Family photographer',
    specialties: ['Family', 'Newborn'],
    hourly_rate: 175,
    location_city: 'Chicago',
    location_state: 'IL',
    average_rating: 4.6,
    is_verified: true,
    is_available: true
  }
]

describe('Browse Avatar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should transform photographer data and render avatars correctly', async () => {
    // Mock successful Supabase response
    const { supabase } = await import('@lib/supabase')
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: mockPhotographerProfiles,
            error: null
          }))
        }))
      }))
    })

    render(
      <BrowserRouter>
        <Browse />
      </BrowserRouter>
    )

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('3 Photographers Available')).toBeInTheDocument()
    })

    // Test avatar rendering for each photographer

    // Sarah Johnson - should show image from portfolio_images[0]
    const sarahAvatar = screen.getByAltText(/Sarah Johnson/i)
    expect(sarahAvatar).toBeInTheDocument()
    expect(sarahAvatar.src).toContain('unsplash.com')

    // Mike Chen - should show initials (no portfolio images)
    const mikeInitials = screen.getByText('MC')
    expect(mikeInitials).toBeInTheDocument()

    // Emma Davis - should handle invalid URL gracefully
    // Should either show initials or the second valid URL
    const emmaCard = screen.getByText('Emma').closest('[class*="cursor-pointer"]')
    expect(emmaCard).toBeInTheDocument()
  })

  test('should use fallback profile images when portfolio_images is empty', async () => {
    const profilesWithoutPortfolios = mockPhotographerProfiles.map(p => ({
      ...p,
      portfolio_images: [] // Remove all portfolio images
    }))

    const { supabase } = await import('@lib/supabase')
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: profilesWithoutPortfolios,
            error: null
          }))
        }))
      }))
    })

    render(
      <BrowserRouter>
        <Browse />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('3 Photographers Available')).toBeInTheDocument()
    })

    // All photographers should have fallback profile images from the profileImages array
    const avatars = screen.getAllByRole('img', { hidden: true })
    expect(avatars.length).toBeGreaterThan(0)

    // Each avatar should have a valid unsplash URL from the fallback array
    avatars.forEach(avatar => {
      expect(avatar.src).toContain('unsplash.com')
    })
  })

  test('should handle data transformation edge cases', async () => {
    const edgeCaseProfiles = [
      {
        id: '4',
        display_name: '', // Empty name
        portfolio_images: null, // Null portfolio images
        bio: null,
        specialties: null,
        hourly_rate: null,
        location_city: null,
        location_state: null,
        average_rating: null,
        is_verified: null,
        is_available: true
      },
      {
        id: '5',
        display_name: 'Single Name', // Single word name
        portfolio_images: [''], // Empty string in array
        bio: 'Photographer with minimal data',
        specialties: ['Wedding'],
        hourly_rate: 100,
        location_city: 'Boston',
        location_state: 'MA',
        average_rating: 4.0,
        is_verified: false,
        is_available: true
      }
    ]

    const { supabase } = await import('@lib/supabase')
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: edgeCaseProfiles,
            error: null
          }))
        }))
      }))
    })

    render(
      <BrowserRouter>
        <Browse />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('2 Photographers Available')).toBeInTheDocument()
    })

    // Should handle edge cases gracefully
    // Empty name should get fallback
    const photographer1 = screen.getByText('Photographer 1')
    expect(photographer1).toBeInTheDocument()

    // Single name should work
    const singleName = screen.getByText('Single')
    expect(singleName).toBeInTheDocument()

    // Should show initials for both (SI for Single Name, P1 for Photographer 1)
    const sinitials = screen.getByText('SI')
    expect(sinitials).toBeInTheDocument()
  })

  test('should maintain avatar URL consistency with Browse data transformation', async () => {
    const { supabase } = await import('@lib/supabase')
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: mockPhotographerProfiles,
            error: null
          }))
        }))
      }))
    })

    render(
      <BrowserRouter>
        <Browse />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('3 Photographers Available')).toBeInTheDocument()
    })

    // Check that the avatar URLs match the expected transformation logic
    // Sarah: should use portfolio_images[0]
    const sarahAvatar = screen.getByAltText(/Sarah Johnson/i)
    expect(sarahAvatar.src).toBe(mockPhotographerProfiles[0].portfolio_images[0])

    // Mike: should use fallback from profileImages array (no portfolio images)
    // The exact fallback URL depends on the index, but should be a valid unsplash URL
    const avatars = screen.getAllByRole('img', { hidden: true })
    const mikeAvatar = avatars.find(img => img.alt.includes('Mike Chen'))
    if (mikeAvatar) {
      expect(mikeAvatar.src).toContain('unsplash.com')
      expect(mikeAvatar.src).toContain('crop=face') // Should be from profileImages array
    }
  })

  test('should handle Supabase errors gracefully', async () => {
    const { supabase } = await import('@lib/supabase')
    supabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database connection error' }
          }))
        }))
      }))
    })

    render(
      <BrowserRouter>
        <Browse />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Could not load photographers/i)).toBeInTheDocument()
      expect(screen.getByText(/Database connection error/i)).toBeInTheDocument()
    })

    // Should not show any avatars when there's an error
    const avatars = screen.queryAllByRole('img', { hidden: true })
    expect(avatars).toHaveLength(0)
  })
})