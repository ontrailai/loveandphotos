/**
 * useUrlState Hook Unit Tests
 * Comprehensive testing for URL state synchronization with filters, sorting, and view mode
 * Tests bidirectional sync, debouncing, URL validation, and browser navigation
 */

import { jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useUrlState } from '@hooks/useUrlState'

// Mock React Router's useSearchParams
const mockSetSearchParams = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  useLocation: () => ({
    pathname: '/photographers',
    search: mockSearchParams.toString()
  })
}))

// Test data
const defaultFilters = {
  zip: '',
  date: '',
  rating: 0,
  tier: 'all',
  specialties: [],
  languages: [],
  photographyStyle: 'all',
  femaleOnly: false
}

const testFilters = {
  zip: '10001',
  date: '2024-12-01',
  rating: 4,
  tier: 'gold',
  specialties: ['Wedding', 'Portrait'],
  languages: ['English', 'Spanish'],
  photographyStyle: 'candid',
  femaleOnly: true
}

// Helper to create router wrapper
const createRouterWrapper = (initialEntries = ['/photographers']) => {
  return ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  )
}

describe('useUrlState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial State', () => {
    test('should return default state when no URL parameters', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters).toEqual(defaultFilters)
      expect(result.current.sortBy).toBe('rating')
      expect(result.current.viewMode).toBe('grid')
    })

    test('should parse URL parameters correctly', () => {
      // Setup URL with parameters
      mockSearchParams.set('zip', '10001')
      mockSearchParams.set('date', '2024-12-01')
      mockSearchParams.set('rating', '4')
      mockSearchParams.set('tier', 'gold')
      mockSearchParams.set('specialties', 'Wedding,Portrait')
      mockSearchParams.set('languages', 'English,Spanish')
      mockSearchParams.set('photographyStyle', 'candid')
      mockSearchParams.set('femaleOnly', 'true')
      mockSearchParams.set('sortBy', 'reviews')
      mockSearchParams.set('viewMode', 'list')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters).toEqual(testFilters)
      expect(result.current.sortBy).toBe('reviews')
      expect(result.current.viewMode).toBe('list')
    })

    test('should handle malformed URL parameters gracefully', () => {
      // Setup malformed parameters
      mockSearchParams.set('rating', 'invalid')
      mockSearchParams.set('specialties', 'Invalid Specialty')
      mockSearchParams.set('femaleOnly', 'maybe')
      mockSearchParams.set('sortBy', 'unknown')
      mockSearchParams.set('viewMode', 'invalid')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Should fall back to defaults for invalid values
      expect(result.current.filters.rating).toBe(0)
      expect(result.current.filters.specialties).toEqual([])
      expect(result.current.filters.femaleOnly).toBe(false)
      expect(result.current.sortBy).toBe('rating')
      expect(result.current.viewMode).toBe('grid')
    })
  })

  describe('Filter Updates', () => {
    test('should update filters and sync to URL with debouncing', async () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Update filters
      act(() => {
        result.current.updateFilters({
          zip: '10001',
          rating: 4
        })
      })

      // Filters should update immediately
      expect(result.current.filters.zip).toBe('10001')
      expect(result.current.filters.rating).toBe(4)

      // URL should not be updated yet (debounced)
      expect(mockSetSearchParams).not.toHaveBeenCalled()

      // Fast-forward debounce timer
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Now URL should be updated
      expect(mockSetSearchParams).toHaveBeenCalledWith(
        expect.any(URLSearchParams),
        { replace: true }
      )
    })

    test('should merge filter updates with existing filters', () => {
      // Start with some existing filters
      mockSearchParams.set('zip', '90210')
      mockSearchParams.set('rating', '3')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Update only rating
      act(() => {
        result.current.updateFilters({ rating: 5 })
      })

      // Should merge with existing filters
      expect(result.current.filters.zip).toBe('90210')
      expect(result.current.filters.rating).toBe(5)
    })

    test('should reset filters to defaults', () => {
      // Start with some filters
      mockSearchParams.set('zip', '10001')
      mockSearchParams.set('rating', '4')
      mockSearchParams.set('specialties', 'Wedding,Portrait')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters.zip).toBe('10001')

      // Clear filters
      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filters).toEqual(defaultFilters)

      // Should update URL immediately (not debounced for clear)
      expect(mockSetSearchParams).toHaveBeenCalled()
    })
  })

  describe('Sort and View Mode Updates', () => {
    test('should update sort option', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      act(() => {
        result.current.updateSort('reviews')
      })

      expect(result.current.sortBy).toBe('reviews')

      // Should update URL with debouncing
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(mockSetSearchParams).toHaveBeenCalled()
    })

    test('should update view mode', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      act(() => {
        result.current.updateView('list')
      })

      expect(result.current.viewMode).toBe('list')

      // View mode changes should be immediate (not debounced)
      expect(mockSetSearchParams).toHaveBeenCalled()
    })

    test('should validate sort options', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Try invalid sort option
      act(() => {
        result.current.updateSort('invalid')
      })

      // Should remain at default
      expect(result.current.sortBy).toBe('rating')
    })

    test('should validate view mode options', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Try invalid view mode
      act(() => {
        result.current.updateView('invalid')
      })

      // Should remain at default
      expect(result.current.viewMode).toBe('grid')
    })
  })

  describe('Debouncing Behavior', () => {
    test('should debounce multiple rapid filter updates', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Make multiple rapid updates
      act(() => {
        result.current.updateFilters({ zip: '10001' })
      })

      act(() => {
        result.current.updateFilters({ rating: 4 })
      })

      act(() => {
        result.current.updateFilters({ tier: 'gold' })
      })

      // Fast-forward partial time
      act(() => {
        jest.advanceTimersByTime(150)
      })

      // Should not have updated URL yet
      expect(mockSetSearchParams).not.toHaveBeenCalled()

      // Make another update (should reset debounce timer)
      act(() => {
        result.current.updateFilters({ femaleOnly: true })
      })

      // Fast-forward remaining original time
      act(() => {
        jest.advanceTimersByTime(150)
      })

      // Still should not have updated (timer was reset)
      expect(mockSetSearchParams).not.toHaveBeenCalled()

      // Fast-forward full debounce time
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Now should have updated only once with final state
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
    })

    test('should not debounce immediate updates', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Update with immediate flag
      act(() => {
        result.current.updateFilters({ zip: '10001' }, true)
      })

      // Should update immediately without waiting for debounce
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
    })
  })

  describe('URL Length Validation', () => {
    test('should handle URLs that exceed length limits', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Create filters that would result in very long URL
      const longSpecialties = Array.from({ length: 50 }, (_, i) => `VeryLongSpecialtyName${i}`)
      const longLanguages = Array.from({ length: 30 }, (_, i) => `VeryLongLanguageName${i}`)

      act(() => {
        result.current.updateFilters({
          specialties: longSpecialties,
          languages: longLanguages,
          zip: 'A'.repeat(1000) // Very long zip
        })
      })

      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should still call setSearchParams (URL validation handled internally)
      expect(mockSetSearchParams).toHaveBeenCalled()

      // Get the actual URLSearchParams passed
      const calledParams = mockSetSearchParams.mock.calls[0][0]
      const urlString = calledParams.toString()

      // URL should be reasonable length (validation should have truncated)
      expect(urlString.length).toBeLessThan(2000)
    })
  })

  describe('Search URL Building', () => {
    test('should build search URLs correctly', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      const searchUrl = result.current.buildSearchUrl({
        zip: '10001',
        specialties: ['Wedding', 'Portrait']
      })

      expect(searchUrl).toContain('zip=10001')
      expect(searchUrl).toContain('specialties=Wedding%2CPortrait')
    })

    test('should exclude default values from search URL', () => {
      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      const searchUrl = result.current.buildSearchUrl({
        zip: '10001',
        rating: 0, // Default value
        specialties: [], // Default value
        tier: 'all' // Default value
      })

      expect(searchUrl).toContain('zip=10001')
      expect(searchUrl).not.toContain('rating=')
      expect(searchUrl).not.toContain('specialties=')
      expect(searchUrl).not.toContain('tier=')
    })
  })

  describe('Parameter Parsing Edge Cases', () => {
    test('should handle empty string parameters', () => {
      mockSearchParams.set('zip', '')
      mockSearchParams.set('specialties', '')
      mockSearchParams.set('languages', '')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters.zip).toBe('')
      expect(result.current.filters.specialties).toEqual([])
      expect(result.current.filters.languages).toEqual([])
    })

    test('should handle array parameters with single values', () => {
      mockSearchParams.set('specialties', 'Wedding')
      mockSearchParams.set('languages', 'English')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters.specialties).toEqual(['Wedding'])
      expect(result.current.filters.languages).toEqual(['English'])
    })

    test('should handle array parameters with duplicates', () => {
      mockSearchParams.set('specialties', 'Wedding,Wedding,Portrait,Wedding')

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Should deduplicate
      expect(result.current.filters.specialties).toEqual(['Wedding', 'Portrait'])
    })

    test('should handle numeric string conversion edge cases', () => {
      mockSearchParams.set('rating', '4.5') // Float
      mockSearchParams.set('tier', '0') // Numeric string

      const { result } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters.rating).toBe(4) // Should round down
      expect(result.current.filters.tier).toBe('all') // Should fall back to default
    })
  })

  describe('Memory Management', () => {
    test('should cleanup timers on unmount', () => {
      const { result, unmount } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      // Start a debounced update
      act(() => {
        result.current.updateFilters({ zip: '10001' })
      })

      // Unmount before timer fires
      unmount()

      // Fast-forward timer
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // Should not call setSearchParams after unmount
      expect(mockSetSearchParams).not.toHaveBeenCalled()
    })
  })

  describe('Browser Navigation', () => {
    test('should handle browser back/forward navigation', () => {
      // Start with initial state
      const { result, rerender } = renderHook(() => useUrlState(), {
        wrapper: createRouterWrapper()
      })

      expect(result.current.filters.zip).toBe('')

      // Simulate browser navigation changing URL
      mockSearchParams.set('zip', '10001')
      mockSearchParams.set('rating', '4')

      // Trigger re-render (simulates URL change)
      rerender()

      // Should parse new URL state
      expect(result.current.filters.zip).toBe('10001')
      expect(result.current.filters.rating).toBe(4)
    })
  })
})