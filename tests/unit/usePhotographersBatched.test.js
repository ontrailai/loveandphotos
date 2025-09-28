/**
 * usePhotographersBatched Hook Unit Tests
 * Comprehensive testing for batched photographers data fetching with infinite scroll
 * Tests SWR integration, infinite scroll, caching, error handling, and performance
 */

import { jest } from '@jest/globals'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { usePhotographersBatched } from '@hooks/usePhotographersBatched'

// Mock Supabase client and query builders
jest.mock('@lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}))

jest.mock('@utils/photographers/queryBuilders', () => ({
  buildPhotographersQuery: jest.fn(),
  applySorting: jest.fn(),
  applyFilters: jest.fn()
}))

// Mock data
const mockPhotographers = [
  {
    user_id: 'user1',
    users: { full_name: 'John Doe', avatar_url: 'avatar1.jpg' },
    specialties: ['Wedding', 'Portrait'],
    average_rating: 4.8,
    total_reviews: 25,
    pay_tiers: { name: 'Gold', hourly_rate: 200 },
    portfolio_items: [{ image_url: 'portfolio1.jpg' }],
    is_verified: true,
    location_city: 'New York',
    location_state: 'NY'
  },
  {
    user_id: 'user2',
    users: { full_name: 'Jane Smith', avatar_url: 'avatar2.jpg' },
    specialties: ['Event', 'Corporate'],
    average_rating: 4.6,
    total_reviews: 18,
    pay_tiers: { name: 'Silver', hourly_rate: 150 },
    portfolio_items: [{ image_url: 'portfolio2.jpg' }],
    is_verified: false,
    location_city: 'Los Angeles',
    location_state: 'CA'
  }
]

const createMockSupabaseQuery = () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockFilter = jest.fn()
  const mockOrder = jest.fn()
  const mockRange = jest.fn()
  const mockSingle = jest.fn()

  // Chain the mock methods
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({
    filter: mockFilter,
    order: mockOrder,
    range: mockRange,
    single: mockSingle
  })
  mockFilter.mockReturnValue({
    order: mockOrder,
    range: mockRange
  })
  mockOrder.mockReturnValue({
    range: mockRange
  })

  return {
    from: mockFrom,
    select: mockSelect,
    filter: mockFilter,
    order: mockOrder,
    range: mockRange,
    single: mockSingle
  }
}

// SWR test wrapper
const createSWRWrapper = (cache = new Map()) => {
  return ({ children }) => (
    <SWRConfig value={{
      provider: () => cache,
      dedupingInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }}>
      {children}
    </SWRConfig>
  )
}

describe('usePhotographersBatched', () => {
  let mockSupabase, queryBuilders

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock modules
    mockSupabase = createMockSupabaseQuery()
    require('@lib/supabaseClient').supabase = mockSupabase

    queryBuilders = require('@utils/photographers/queryBuilders')
    queryBuilders.buildPhotographersQuery.mockReturnValue(mockSupabase)
  })

  describe('Initial Data Loading', () => {
    test('should load initial data successfully', async () => {
      // Mock successful response
      mockSupabase.range.mockResolvedValue({
        data: mockPhotographers,
        error: null,
        count: 100
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001', rating: 4 },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toEqual([])

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockPhotographers)
      expect(result.current.total).toBe(100)
      expect(result.current.hasMore).toBe(true)
      expect(result.current.error).toBeNull()
      expect(result.current.isEmpty).toBe(false)
    })

    test('should handle empty results', async () => {
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '00000' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([])
      expect(result.current.total).toBe(0)
      expect(result.current.hasMore).toBe(false)
      expect(result.current.isEmpty).toBe(true)
    })

    test('should handle loading errors', async () => {
      const testError = new Error('Database connection failed')
      mockSupabase.range.mockRejectedValue(testError)

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([])
      expect(result.current.error).toBe(testError)
      expect(result.current.hasMore).toBe(false)
    })
  })

  describe('Infinite Scroll', () => {
    test('should fetch next page correctly', async () => {
      const page1Data = mockPhotographers.slice(0, 1)
      const page2Data = mockPhotographers.slice(1, 2)

      // Mock first page
      mockSupabase.range
        .mockResolvedValueOnce({
          data: page1Data,
          error: null,
          count: 100
        })
        // Mock second page
        .mockResolvedValueOnce({
          data: page2Data,
          error: null,
          count: 100
        })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(page1Data)
      expect(result.current.hasMore).toBe(true)

      // Fetch next page
      await act(async () => {
        await result.current.fetchNext()
      })

      expect(result.current.data).toEqual([...page1Data, ...page2Data])
      expect(mockSupabase.range).toHaveBeenCalledTimes(2)

      // Check second call had correct offset
      expect(mockSupabase.range).toHaveBeenNthCalledWith(2, 1, 50) // offset 1, limit 50
    })

    test('should prevent duplicate fetches when already loading', async () => {
      mockSupabase.range.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: mockPhotographers, error: null, count: 100 }), 100)
        )
      )

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Start multiple fetchNext calls quickly
      const fetchPromise1 = result.current.fetchNext()
      const fetchPromise2 = result.current.fetchNext()
      const fetchPromise3 = result.current.fetchNext()

      await Promise.all([fetchPromise1, fetchPromise2, fetchPromise3])

      // Should only make one additional call despite multiple fetchNext calls
      expect(mockSupabase.range).toHaveBeenCalledTimes(2) // 1 initial + 1 next
    })

    test('should stop fetching when no more data', async () => {
      const limitedData = [mockPhotographers[0]]

      mockSupabase.range.mockResolvedValue({
        data: limitedData,
        error: null,
        count: 1 // Total count matches returned data
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasMore).toBe(false)

      // Try to fetch next - should not make additional requests
      await act(async () => {
        await result.current.fetchNext()
      })

      expect(mockSupabase.range).toHaveBeenCalledTimes(1) // Only initial call
    })
  })

  describe('Parameter Changes and Refetching', () => {
    test('should refetch when filters change', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockPhotographers,
        error: null,
        count: 100
      })

      const { result, rerender } = renderHook(
        ({ filters, sortBy }) => usePhotographersBatched({ filters, sortBy }),
        {
          wrapper: createSWRWrapper(),
          initialProps: {
            filters: { zip: '10001', rating: 4 },
            sortBy: 'rating'
          }
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabase.range).toHaveBeenCalledTimes(1)

      // Change filters
      rerender({
        filters: { zip: '90210', rating: 5 },
        sortBy: 'rating'
      })

      await waitFor(() => {
        expect(mockSupabase.range).toHaveBeenCalledTimes(2)
      })

      // Verify new query was built with updated filters
      expect(queryBuilders.buildPhotographersQuery).toHaveBeenLastCalledWith(
        mockSupabase,
        expect.objectContaining({
          filters: { zip: '90210', rating: 5 },
          sortBy: 'rating'
        }),
        0,
        50
      )
    })

    test('should refetch when sortBy changes', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockPhotographers,
        error: null,
        count: 100
      })

      const { result, rerender } = renderHook(
        ({ filters, sortBy }) => usePhotographersBatched({ filters, sortBy }),
        {
          wrapper: createSWRWrapper(),
          initialProps: {
            filters: { zip: '10001' },
            sortBy: 'rating'
          }
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Change sort
      rerender({
        filters: { zip: '10001' },
        sortBy: 'reviews'
      })

      await waitFor(() => {
        expect(mockSupabase.range).toHaveBeenCalledTimes(2)
      })

      expect(queryBuilders.buildPhotographersQuery).toHaveBeenLastCalledWith(
        mockSupabase,
        expect.objectContaining({
          sortBy: 'reviews'
        }),
        0,
        50
      )
    })

    test('should reset pagination when parameters change', async () => {
      const page1Data = [mockPhotographers[0]]
      const page2Data = [mockPhotographers[1]]

      mockSupabase.range
        .mockResolvedValueOnce({ data: page1Data, error: null, count: 100 })
        .mockResolvedValueOnce({ data: page2Data, error: null, count: 100 })
        .mockResolvedValueOnce({ data: mockPhotographers, error: null, count: 100 })

      const { result, rerender } = renderHook(
        ({ filters, sortBy }) => usePhotographersBatched({ filters, sortBy }),
        {
          wrapper: createSWRWrapper(),
          initialProps: {
            filters: { zip: '10001' },
            sortBy: 'rating'
          }
        }
      )

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Fetch next page
      await act(async () => {
        await result.current.fetchNext()
      })

      expect(result.current.data).toHaveLength(2)

      // Change filters - should reset to first page
      rerender({
        filters: { zip: '90210' },
        sortBy: 'rating'
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPhotographers)
      })

      // Should have reset pagination
      expect(queryBuilders.buildPhotographersQuery).toHaveBeenLastCalledWith(
        mockSupabase,
        expect.objectContaining({
          filters: { zip: '90210' }
        }),
        0, // Reset to offset 0
        50
      )
    })
  })

  describe('Manual Refetch', () => {
    test('should refetch data manually', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockPhotographers,
        error: null,
        count: 100
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockSupabase.range).toHaveBeenCalledTimes(1)

      // Manual refetch
      await act(async () => {
        await result.current.refetch()
      })

      expect(mockSupabase.range).toHaveBeenCalledTimes(2)
    })
  })

  describe('Caching and Performance', () => {
    test('should use SWR cache for identical queries', async () => {
      const cache = new Map()
      mockSupabase.range.mockResolvedValue({
        data: mockPhotographers,
        error: null,
        count: 100
      })

      const params = {
        filters: { zip: '10001', rating: 4 },
        sortBy: 'rating'
      }

      // First render
      const { unmount: unmount1 } = renderHook(
        () => usePhotographersBatched(params),
        { wrapper: createSWRWrapper(cache) }
      )

      await waitFor(() => {
        expect(mockSupabase.range).toHaveBeenCalledTimes(1)
      })

      unmount1()

      // Second render with same parameters - should use cache
      const { result } = renderHook(
        () => usePhotographersBatched(params),
        { wrapper: createSWRWrapper(cache) }
      )

      // Should have immediate data from cache
      expect(result.current.data).toEqual(mockPhotographers)

      // Should not make additional request immediately
      expect(mockSupabase.range).toHaveBeenCalledTimes(1)
    })

    test('should handle stale-while-revalidate pattern', async () => {
      const cache = new Map()
      const staleData = [mockPhotographers[0]]
      const freshData = mockPhotographers

      // Setup cache with stale data
      cache.set(
        JSON.stringify({
          filters: { zip: '10001' },
          sortBy: 'rating',
          offset: 0
        }),
        staleData
      )

      mockSupabase.range.mockResolvedValue({
        data: freshData,
        error: null,
        count: 100
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        {
          wrapper: createSWRWrapper(cache)
        }
      )

      // Should show stale data immediately
      expect(result.current.data).toEqual(staleData)

      // Should revalidate and get fresh data
      await waitFor(() => {
        expect(result.current.data).toEqual(freshData)
      })
    })
  })

  describe('Error Recovery', () => {
    test('should retry failed requests', async () => {
      const testError = new Error('Network timeout')

      mockSupabase.range
        .mockRejectedValueOnce(testError)
        .mockResolvedValueOnce({
          data: mockPhotographers,
          error: null,
          count: 100
        })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.error).toBe(testError)
      })

      // Retry should succeed
      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPhotographers)
        expect(result.current.error).toBeNull()
      })
    })

    test('should handle errors during fetchNext', async () => {
      mockSupabase.range
        .mockResolvedValueOnce({
          data: [mockPhotographers[0]],
          error: null,
          count: 100
        })
        .mockRejectedValueOnce(new Error('Next page failed'))

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Fetch next page should fail gracefully
      await act(async () => {
        await result.current.fetchNext()
      })

      // Should keep first page data and not add error data
      expect(result.current.data).toEqual([mockPhotographers[0]])
      expect(result.current.hasMore).toBe(true) // Should still allow retry
    })
  })

  describe('Edge Cases', () => {
    test('should handle null or undefined filter values', async () => {
      mockSupabase.range.mockResolvedValue({
        data: mockPhotographers,
        error: null,
        count: 100
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: null, rating: undefined },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockPhotographers)
      expect(queryBuilders.buildPhotographersQuery).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          filters: { zip: null, rating: undefined }
        }),
        0,
        50
      )
    })

    test('should handle malformed response data', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: null,
        count: 0
      })

      const { result } = renderHook(
        () => usePhotographersBatched({
          filters: { zip: '10001' },
          sortBy: 'rating'
        }),
        { wrapper: createSWRWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([])
      expect(result.current.isEmpty).toBe(true)
    })
  })
})