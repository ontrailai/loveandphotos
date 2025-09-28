/**
 * Batch Supabase Queries Unit Tests
 * Comprehensive testing for batching utility that prevents oversized URL errors
 * Tests batching, retry logic, error handling, deduplication, and performance
 */

import { jest } from '@jest/globals'
import {
  fetchInBatches,
  fetchPhotographerTrustMetrics
} from '@utils/batchSupabaseQueries'

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockIn = jest.fn()
  const mockOrder = jest.fn()
  const mockLimit = jest.fn()

  const client = {
    from: mockFrom
  }

  // Chain the mock methods
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ in: mockIn })
  mockIn.mockReturnValue({ order: mockOrder })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockLimit.mockReturnValue({ order: mockOrder })

  return {
    client,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      in: mockIn,
      order: mockOrder,
      limit: mockLimit
    }
  }
}

describe('Batch Supabase Queries', () => {
  let mockClient, mocks

  beforeEach(() => {
    const setup = createMockSupabaseClient()
    mockClient = setup.client
    mocks = setup.mocks
    jest.clearAllMocks()
  })

  describe('fetchInBatches', () => {
    describe('Basic Functionality', () => {
      test('should handle small arrays without batching', async () => {
        const testIds = ['id1', 'id2', 'id3']
        const expectedData = [
          { user_id: 'id1', name: 'User 1' },
          { user_id: 'id2', name: 'User 2' },
          { user_id: 'id3', name: 'User 3' }
        ]

        mocks.limit.mockResolvedValue({ data: expectedData, error: null })

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50 }
        )

        expect(result.data).toEqual(expectedData)
        expect(result.error).toBeNull()
        expect(result.hadPartialFailure).toBe(false)
        expect(result.successfulBatches).toBe(1)
        expect(result.totalBatches).toBe(1)

        // Should only make one query for small array
        expect(mocks.from).toHaveBeenCalledTimes(1)
        expect(mocks.from).toHaveBeenCalledWith('users')
        expect(mocks.select).toHaveBeenCalledWith('user_id, name')
        expect(mocks.in).toHaveBeenCalledWith('user_id', testIds)
      })

      test('should batch large arrays correctly', async () => {
        // Create array of 125 IDs (should create 3 batches with batchSize=50)
        const testIds = Array.from({ length: 125 }, (_, i) => `id${i + 1}`)
        const batch1Data = Array.from({ length: 50 }, (_, i) => ({ user_id: `id${i + 1}`, name: `User ${i + 1}` }))
        const batch2Data = Array.from({ length: 50 }, (_, i) => ({ user_id: `id${i + 51}`, name: `User ${i + 51}` }))
        const batch3Data = Array.from({ length: 25 }, (_, i) => ({ user_id: `id${i + 101}`, name: `User ${i + 101}` }))

        mocks.limit
          .mockResolvedValueOnce({ data: batch1Data, error: null })
          .mockResolvedValueOnce({ data: batch2Data, error: null })
          .mockResolvedValueOnce({ data: batch3Data, error: null })

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50 }
        )

        expect(result.data).toHaveLength(125)
        expect(result.error).toBeNull()
        expect(result.hadPartialFailure).toBe(false)
        expect(result.successfulBatches).toBe(3)
        expect(result.totalBatches).toBe(3)

        // Should make 3 queries for 125 items with batchSize=50
        expect(mocks.from).toHaveBeenCalledTimes(3)

        // Check batch sizes
        expect(mocks.in).toHaveBeenNthCalledWith(1, 'user_id', testIds.slice(0, 50))
        expect(mocks.in).toHaveBeenNthCalledWith(2, 'user_id', testIds.slice(50, 100))
        expect(mocks.in).toHaveBeenNthCalledWith(3, 'user_id', testIds.slice(100, 125))
      })

      test('should handle empty input arrays', async () => {
        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          [],
          { batchSize: 50 }
        )

        expect(result.data).toEqual([])
        expect(result.error).toBeNull()
        expect(result.hadPartialFailure).toBe(false)
        expect(result.successfulBatches).toBe(0)
        expect(result.totalBatches).toBe(0)

        // Should not make any queries for empty array
        expect(mocks.from).not.toHaveBeenCalled()
      })
    })

    describe('Error Handling and Retry Logic', () => {
      test('should handle complete failure gracefully', async () => {
        const testIds = ['id1', 'id2']
        const testError = new Error('Database connection failed')

        mocks.limit.mockRejectedValue(testError)

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50, retryAttempts: 2 }
        )

        expect(result.data).toEqual([])
        expect(result.error).toEqual(testError)
        expect(result.hadPartialFailure).toBe(false)
        expect(result.successfulBatches).toBe(0)
        expect(result.totalBatches).toBe(1)

        // Should attempt retries (1 initial + 2 retries = 3 total attempts)
        expect(mocks.from).toHaveBeenCalledTimes(3)
      })

      test('should handle partial failures with some batches succeeding', async () => {
        const testIds = Array.from({ length: 100 }, (_, i) => `id${i + 1}`)
        const batch1Data = Array.from({ length: 50 }, (_, i) => ({ user_id: `id${i + 1}`, name: `User ${i + 1}` }))
        const testError = new Error('Batch 2 failed')

        mocks.limit
          .mockResolvedValueOnce({ data: batch1Data, error: null })  // Batch 1 succeeds
          .mockRejectedValue(testError)  // Batch 2 fails after retries

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50, retryAttempts: 1 }
        )

        expect(result.data).toEqual(batch1Data)  // Only successful batch data
        expect(result.error).toEqual(testError)   // Last error encountered
        expect(result.hadPartialFailure).toBe(true)
        expect(result.successfulBatches).toBe(1)
        expect(result.totalBatches).toBe(2)

        // Batch 1: 1 attempt, Batch 2: 1 initial + 1 retry = 2 attempts
        expect(mocks.from).toHaveBeenCalledTimes(3)
      })

      test('should implement exponential backoff on retries', async () => {
        const testIds = ['id1']
        const testError = new Error('Temporary failure')

        mocks.limit.mockRejectedValue(testError)

        const startTime = Date.now()

        await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50, retryAttempts: 2, retryDelay: 100 }
        )

        const endTime = Date.now()
        const totalTime = endTime - startTime

        // Should have delays: 100ms + 200ms = 300ms minimum (exponential backoff)
        expect(totalTime).toBeGreaterThan(250)  // Account for execution time
        expect(mocks.from).toHaveBeenCalledTimes(3)  // 1 initial + 2 retries
      }, 10000)

      test('should handle Supabase error objects correctly', async () => {
        const testIds = ['id1']
        const supabaseError = {
          message: 'RLS policy violation',
          details: 'Row level security policy check failed',
          code: '42501'
        }

        mocks.limit.mockResolvedValue({ data: null, error: supabaseError })

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50, retryAttempts: 1 }
        )

        expect(result.data).toEqual([])
        expect(result.error.message).toBe('RLS policy violation')
        expect(result.hadPartialFailure).toBe(false)
        expect(result.successfulBatches).toBe(0)
        expect(result.totalBatches).toBe(1)

        // Should attempt retries for Supabase errors too
        expect(mocks.from).toHaveBeenCalledTimes(2)
      })
    })

    describe('Deduplication', () => {
      test('should deduplicate results by specified key', async () => {
        const testIds = ['id1', 'id2', 'id1', 'id3', 'id2']  // Duplicates
        const responseData = [
          { user_id: 'id1', name: 'User 1' },
          { user_id: 'id2', name: 'User 2' },
          { user_id: 'id1', name: 'User 1 Duplicate' },  // Duplicate
          { user_id: 'id3', name: 'User 3' },
          { user_id: 'id2', name: 'User 2 Duplicate' }   // Duplicate
        ]

        mocks.limit.mockResolvedValue({ data: responseData, error: null })

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50, deduplicateBy: 'user_id' }
        )

        expect(result.data).toHaveLength(3)  // Should have only unique entries
        expect(result.data.map(item => item.user_id)).toEqual(['id1', 'id2', 'id3'])
        expect(result.error).toBeNull()
        expect(result.hadPartialFailure).toBe(false)
      })

      test('should handle deduplication when no key specified', async () => {
        const testIds = ['id1', 'id2']
        const responseData = [
          { user_id: 'id1', name: 'User 1' },
          { user_id: 'id1', name: 'User 1 Duplicate' },
          { user_id: 'id2', name: 'User 2' }
        ]

        mocks.limit.mockResolvedValue({ data: responseData, error: null })

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 50 }  // No deduplicateBy specified
        )

        expect(result.data).toHaveLength(3)  // Should keep all entries including duplicates
        expect(result.error).toBeNull()
      })
    })

    describe('Configuration Options', () => {
      test('should respect custom batch size', async () => {
        const testIds = Array.from({ length: 75 }, (_, i) => `id${i + 1}`)

        mocks.limit.mockResolvedValue({ data: [], error: null })

        await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 25 }  // Custom batch size
        )

        // Should create 3 batches (25 + 25 + 25) for 75 items
        expect(mocks.from).toHaveBeenCalledTimes(3)
        expect(mocks.in).toHaveBeenNthCalledWith(1, 'user_id', testIds.slice(0, 25))
        expect(mocks.in).toHaveBeenNthCalledWith(2, 'user_id', testIds.slice(25, 50))
        expect(mocks.in).toHaveBeenNthCalledWith(3, 'user_id', testIds.slice(50, 75))
      })

      test('should handle minimum batch size of 1', async () => {
        const testIds = ['id1', 'id2', 'id3']

        mocks.limit.mockResolvedValue({ data: [], error: null })

        await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 1 }
        )

        // Should create 3 batches (1 + 1 + 1) for 3 items
        expect(mocks.from).toHaveBeenCalledTimes(3)
      })

      test('should enforce maximum batch size limit', async () => {
        const testIds = Array.from({ length: 50 }, (_, i) => `id${i + 1}`)

        mocks.limit.mockResolvedValue({ data: [], error: null })

        await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          testIds,
          { batchSize: 500 }  // Above maximum
        )

        // Should use maximum batch size of 200, creating 1 batch for 50 items
        expect(mocks.from).toHaveBeenCalledTimes(1)
        expect(mocks.in).toHaveBeenCalledWith('user_id', testIds)
      })
    })
  })

  describe('fetchPhotographerTrustMetrics', () => {
    test('should fetch photographer trust metrics with correct parameters', async () => {
      const testIds = ['user1', 'user2', 'user3']
      const expectedData = [
        { user_id: 'user1', acceptance_rate: 95.0, response_time_hours: 2.5 },
        { user_id: 'user2', acceptance_rate: 88.5, response_time_hours: 4.0 },
        { user_id: 'user3', acceptance_rate: 92.0, response_time_hours: 1.5 }
      ]

      mocks.limit.mockResolvedValue({ data: expectedData, error: null })

      const result = await fetchPhotographerTrustMetrics(mockClient, testIds)

      expect(result.data).toEqual(expectedData)
      expect(result.error).toBeNull()
      expect(result.hadPartialFailure).toBe(false)

      // Check correct table and fields are used
      expect(mocks.from).toHaveBeenCalledWith('photographers')
      expect(mocks.select).toHaveBeenCalledWith(
        'user_id, acceptance_rate, response_time_hours, is_verified, total_reviews'
      )
      expect(mocks.in).toHaveBeenCalledWith('user_id', testIds)
    })

    test('should handle empty photographer IDs', async () => {
      const result = await fetchPhotographerTrustMetrics(mockClient, [])

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
      expect(result.hadPartialFailure).toBe(false)

      // Should not make any queries
      expect(mocks.from).not.toHaveBeenCalled()
    })

    test('should handle photographer trust metrics fetch errors', async () => {
      const testIds = ['user1', 'user2']
      const testError = new Error('Trust metrics fetch failed')

      mocks.limit.mockRejectedValue(testError)

      const result = await fetchPhotographerTrustMetrics(mockClient, testIds)

      expect(result.data).toEqual([])
      expect(result.error).toEqual(testError)
      expect(result.hadPartialFailure).toBe(false)

      expect(mocks.from).toHaveBeenCalledWith('photographers')
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle very large datasets efficiently', async () => {
      // Test with 1000 IDs to ensure scalability
      const testIds = Array.from({ length: 1000 }, (_, i) => `id${i + 1}`)

      mocks.limit.mockResolvedValue({ data: [], error: null })

      const startTime = performance.now()

      const result = await fetchInBatches(
        mockClient,
        'users',
        'user_id, name',
        'user_id',
        testIds,
        { batchSize: 50 }
      )

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.totalBatches).toBe(20)  // 1000 / 50 = 20 batches
      expect(result.successfulBatches).toBe(20)
      expect(executionTime).toBeLessThan(1000)  // Should complete in under 1 second

      // Should make 20 parallel requests
      expect(mocks.from).toHaveBeenCalledTimes(20)
    })

    test('should execute batches in parallel for performance', async () => {
      const testIds = Array.from({ length: 100 }, (_, i) => `id${i + 1}`)

      // Mock delay to test parallel execution
      mocks.limit.mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: [], error: null }), 100)
        )
      )

      const startTime = performance.now()

      await fetchInBatches(
        mockClient,
        'users',
        'user_id, name',
        'user_id',
        testIds,
        { batchSize: 50 }
      )

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should complete in ~100ms (parallel) not ~200ms (sequential)
      expect(executionTime).toBeLessThan(150)  // Account for overhead
      expect(executionTime).toBeGreaterThan(90)   // Should still take at least 100ms
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      const scenarios = [
        { ids: null, expected: [] },
        { ids: undefined, expected: [] },
        { ids: [null, undefined, 'valid-id'], expected: ['valid-id'] }
      ]

      for (const scenario of scenarios) {
        mocks.limit.mockResolvedValue({ data: [], error: null })

        const result = await fetchInBatches(
          mockClient,
          'users',
          'user_id, name',
          'user_id',
          scenario.ids,
          { batchSize: 50 }
        )

        expect(result.data).toEqual([])
        expect(result.error).toBeNull()
      }
    })

    test('should handle network timeout scenarios', async () => {
      const testIds = ['id1']

      // Mock timeout error
      const timeoutError = new Error('Network request timed out')
      timeoutError.code = 'NETWORK_TIMEOUT'

      mocks.limit.mockRejectedValue(timeoutError)

      const result = await fetchInBatches(
        mockClient,
        'users',
        'user_id, name',
        'user_id',
        testIds,
        { batchSize: 50, retryAttempts: 1 }
      )

      expect(result.error.code).toBe('NETWORK_TIMEOUT')
      expect(result.data).toEqual([])
      expect(mocks.from).toHaveBeenCalledTimes(2)  // 1 initial + 1 retry
    })

    test('should handle malformed response data', async () => {
      const testIds = ['id1', 'id2']

      // Mock malformed response
      mocks.limit.mockResolvedValue({ data: null, error: null })

      const result = await fetchInBatches(
        mockClient,
        'users',
        'user_id, name',
        'user_id',
        testIds,
        { batchSize: 50 }
      )

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
      expect(result.successfulBatches).toBe(1)  // Should still count as successful
    })
  })
})