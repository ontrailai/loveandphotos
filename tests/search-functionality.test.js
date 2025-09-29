/**
 * Search Functionality Integration Tests
 *
 * Tests for the photographer search feature to prevent regression.
 * The bug was: search parameter mismatch - form used 'zip' but logic expected city names.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Home from '../src/pages/Home'
import Browse from '../src/pages/customer/Browse'

// Mock Supabase client
jest.mock('../src/lib/supabaseClient', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockPhotographers,
          error: null
        }))
      }))
    }))
  },
  getPhotographerProfileLink: jest.fn((photographer) => `/photographer/${photographer.id}`)
}))

// Mock zip database hook
jest.mock('../src/hooks/useFullZipDatabase', () => ({
  useFullZipDatabase: () => ({
    searchZipCodes: jest.fn(async (term) => {
      if (term.toLowerCase().includes('san diego')) {
        return [
          { city: 'San Diego', state: 'CA', zip_code: '92101' },
          { city: 'San Diego', state: 'CA', zip_code: '92102' }
        ]
      }
      return []
    }),
    isReady: true
  })
}))

const mockPhotographers = [
  {
    id: 1,
    display_name: 'John Doe',
    location_city: 'San Diego',
    location_state: 'California',
    specialties: ['Wedding', 'Portrait'],
    average_rating: 4.8,
    total_reviews: 25,
    hourly_rate: 150,
    portfolio_images: ['https://example.com/image1.jpg']
  },
  {
    id: 2,
    display_name: 'Jane Smith',
    location_city: 'Los Angeles',
    location_state: 'California',
    specialties: ['Family', 'Event'],
    average_rating: 4.9,
    total_reviews: 32,
    hourly_rate: 175,
    portfolio_images: ['https://example.com/image2.jpg']
  },
  {
    id: 3,
    display_name: 'Mike Johnson',
    location_city: 'San Diego',
    location_state: 'CA',
    specialties: ['Corporate', 'Product'],
    average_rating: 4.7,
    total_reviews: 18,
    hourly_rate: 200,
    portfolio_images: ['https://example.com/image3.jpg']
  }
]

describe('Search Functionality', () => {
  describe('Home Page Search Form', () => {
    test('should render search input with correct placeholder', () => {
      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      )

      const searchInput = screen.getByPlaceholderText(/enter your zip code or city/i)
      expect(searchInput).toBeInTheDocument()
    })

    test('should navigate to photographers page with search parameter on submit', async () => {
      const mockNavigate = jest.fn()
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }))

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      )

      const searchInput = screen.getByPlaceholderText(/enter your zip code or city/i)
      const searchButton = screen.getByRole('button', { name: /search/i })

      fireEvent.change(searchInput, { target: { value: 'San Diego' } })
      fireEvent.click(searchButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?search=San%20Diego')
      })
    })

    test('should handle form submission on enter key', async () => {
      const mockNavigate = jest.fn()
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }))

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      )

      const searchInput = screen.getByPlaceholderText(/enter your zip code or city/i)

      fireEvent.change(searchInput, { target: { value: 'San Diego' } })
      fireEvent.submit(searchInput.closest('form'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?search=San%20Diego')
      })
    })
  })

  describe('Browse Page Search Logic', () => {
    test('should parse search parameter correctly', () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=San%20Diego']}>
          <Browse />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(searchInput.value).toBe('San Diego')
    })

    test('should maintain backward compatibility with zip parameter', () => {
      render(
        <MemoryRouter initialEntries={['/photographers?zip=San%20Diego']}>
          <Browse />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(searchInput.value).toBe('San Diego')
    })

    test('should prioritize search parameter over zip parameter', () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=San%20Diego&zip=Los%20Angeles']}>
          <Browse />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(searchInput.value).toBe('San Diego')
    })

    test('should filter photographers by city name', async () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=San%20Diego']}>
          <Browse />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    test('should filter photographers by state name', async () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=California']}>
          <Browse />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Jane Smith')).toBeInTheDocument()
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument() // Has 'CA' not 'California'
      })
    })

    test('should handle case insensitive search', async () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=san%20diego']}>
          <Browse />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
      })
    })

    test('should handle partial matches', async () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=san']}>
          <Browse />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })
    })

    test('should show no results for non-matching search', async () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=New%20York']}>
          <Browse />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument()
        expect(screen.getByText(/no photographers found/i)).toBeInTheDocument()
      })
    })

    test('should trim whitespace from search terms', async () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=%20%20San%20Diego%20%20']}>
          <Browse />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
      })
    })
  })

  describe('End-to-End Search Flow', () => {
    test('should complete full search journey from Home to Browse', async () => {
      const { rerender } = render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      )

      // Step 1: Enter search term on Home page
      const searchInput = screen.getByPlaceholderText(/enter your zip code or city/i)
      fireEvent.change(searchInput, { target: { value: 'San Diego' } })

      // Step 2: Submit form (simulate navigation)
      fireEvent.submit(searchInput.closest('form'))

      // Step 3: Simulate navigation to Browse page with search results
      rerender(
        <MemoryRouter initialEntries={['/photographers?search=San%20Diego']}>
          <Browse />
        </MemoryRouter>
      )

      // Step 4: Verify search results are displayed
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
      })

      // Step 5: Verify search term is preserved in Browse page filter
      const browseSearchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(browseSearchInput.value).toBe('San Diego')
    })
  })

  describe('Regression Prevention', () => {
    test('should prevent the original bug: zip codes vs city names mismatch', () => {
      // The original bug: form sends zip codes like "92101" but search logic
      // only matches against city/state names like "San Diego", "California"
      // This test ensures the parameter names are consistent

      render(
        <MemoryRouter initialEntries={['/photographers?search=San%20Diego']}>
          <Browse />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(searchInput.value).toBe('San Diego')

      // This should work for city names, not just zip codes
      expect(searchInput.placeholder).toContain('city')
    })

    test('should handle URL encoding correctly', () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=San%20Diego%2C%20CA']}>
          <Browse />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(searchInput.value).toBe('San Diego, CA')
    })

    test('should not break when search parameter is empty', () => {
      render(
        <MemoryRouter initialEntries={['/photographers?search=']}>
          <Browse />
        </MemoryRouter>
      )

      const searchInput = screen.getByPlaceholderText(/zip code or city/i)
      expect(searchInput.value).toBe('')

      // Should show all photographers when no search term
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
    })
  })
})