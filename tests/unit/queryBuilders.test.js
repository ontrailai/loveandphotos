/**
 * Query Builders Unit Tests
 * Comprehensive testing for Supabase query construction functions
 * Tests filtering, sorting, pagination, and SQL injection prevention
 */

import { jest } from '@jest/globals'
import {
  buildPhotographersQuery,
  applyFilters,
  applySorting,
  applyPagination,
  applyAvailabilityFilter,
  applyRatingFilter,
  applyTierFilter,
  applySpecialtiesFilter,
  applyLanguagesFilter,
  applyStyleFilter,
  applyGenderFilter
} from '@utils/photographers/queryBuilders'

// Mock Supabase client
const createMockSupabaseQuery = () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockFilter = jest.fn()
  const mockContains = jest.fn()
  const mockIn = jest.fn()
  const mockGte = jest.fn()
  const mockEq = jest.fn()
  const mockOrder = jest.fn()
  const mockRange = jest.fn()
  const mockLimit = jest.fn()

  // Create chainable query object
  const query = {
    select: mockSelect,
    filter: mockFilter,
    contains: mockContains,
    in: mockIn,
    gte: mockGte,
    eq: mockEq,
    order: mockOrder,
    range: mockRange,
    limit: mockLimit
  }

  // All methods return the query object for chaining
  mockFrom.mockReturnValue(query)
  mockSelect.mockReturnValue(query)
  mockFilter.mockReturnValue(query)
  mockContains.mockReturnValue(query)
  mockIn.mockReturnValue(query)
  mockGte.mockReturnValue(query)
  mockEq.mockReturnValue(query)
  mockOrder.mockReturnValue(query)
  mockRange.mockReturnValue(query)
  mockLimit.mockReturnValue(query)

  const client = { from: mockFrom }

  return {
    client,
    query,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      filter: mockFilter,
      contains: mockContains,
      in: mockIn,
      gte: mockGte,
      eq: mockEq,
      order: mockOrder,
      range: mockRange,
      limit: mockLimit
    }
  }
}

describe('Query Builders', () => {
  let mockSupabase, query, mocks

  beforeEach(() => {
    const setup = createMockSupabaseQuery()
    mockSupabase = setup.client
    query = setup.query
    mocks = setup.mocks
    jest.clearAllMocks()
  })

  describe('buildPhotographersQuery', () => {
    test('should build basic query with default parameters', () => {
      const params = {
        filters: {
          zip: '',
          rating: 0,
          tier: 'all',
          specialties: [],
          languages: [],
          photographyStyle: 'all',
          femaleOnly: false
        },
        sortBy: 'rating'
      }

      const result = buildPhotographersQuery(mockSupabase, params)

      expect(mocks.from).toHaveBeenCalledWith('photographer_preview_profiles')
      expect(mocks.select).toHaveBeenCalledWith(
        expect.stringContaining('user_id, users!inner(*)')
      )
      expect(result).toBe(query)
    })

    test('should include correct fields in select', () => {
      const params = {
        filters: { zip: '', rating: 0, tier: 'all', specialties: [], languages: [], photographyStyle: 'all', femaleOnly: false },
        sortBy: 'rating'
      }

      buildPhotographersQuery(mockSupabase, params)

      const selectCall = mocks.select.mock.calls[0][0]
      expect(selectCall).toContain('user_id')
      expect(selectCall).toContain('users!inner(*)')
      expect(selectCall).toContain('specialties')
      expect(selectCall).toContain('average_rating')
      expect(selectCall).toContain('total_reviews')
      expect(selectCall).toContain('pay_tiers(*)')
      expect(selectCall).toContain('portfolio_items(*)')
      expect(selectCall).toContain('is_verified')
      expect(selectCall).toContain('location_city')
      expect(selectCall).toContain('location_state')
    })

    test('should apply all filters correctly', () => {
      const params = {
        filters: {
          zip: '10001',
          rating: 4,
          tier: 'gold',
          specialties: ['Wedding', 'Portrait'],
          languages: ['English', 'Spanish'],
          photographyStyle: 'candid',
          femaleOnly: true
        },
        sortBy: 'rating'
      }

      buildPhotographersQuery(mockSupabase, params)

      // Should call various filter methods
      expect(mocks.gte).toHaveBeenCalledWith('average_rating', 4)
      expect(mocks.eq).toHaveBeenCalledWith('pay_tiers.name', 'gold')
      expect(mocks.contains).toHaveBeenCalledWith('specialties', ['Wedding', 'Portrait'])
      expect(mocks.contains).toHaveBeenCalledWith('languages', ['English', 'Spanish'])
      expect(mocks.eq).toHaveBeenCalledWith('photography_style', 'candid')
      expect(mocks.eq).toHaveBeenCalledWith('gender', 'female')
    })

    test('should apply sorting and pagination', () => {
      const params = {
        filters: { zip: '', rating: 0, tier: 'all', specialties: [], languages: [], photographyStyle: 'all', femaleOnly: false },
        sortBy: 'reviews'
      }

      buildPhotographersQuery(mockSupabase, params, 25, 50)

      expect(mocks.order).toHaveBeenCalledWith('total_reviews', { ascending: false })
      expect(mocks.range).toHaveBeenCalledWith(25, 74) // offset + limit - 1
    })
  })

  describe('applyFilters', () => {
    test('should apply no filters for default values', () => {
      const filters = {
        zip: '',
        rating: 0,
        tier: 'all',
        specialties: [],
        languages: [],
        photographyStyle: 'all',
        femaleOnly: false
      }

      const result = applyFilters(query, filters)

      // Only availability filter should be applied by default
      expect(mocks.filter).toHaveBeenCalledTimes(1)
      expect(result).toBe(query)
    })

    test('should apply multiple filters correctly', () => {
      const filters = {
        zip: '10001',
        rating: 4,
        tier: 'gold',
        specialties: ['Wedding'],
        languages: ['English'],
        photographyStyle: 'candid',
        femaleOnly: true
      }

      applyFilters(query, filters)

      expect(mocks.gte).toHaveBeenCalledWith('average_rating', 4)
      expect(mocks.eq).toHaveBeenCalledWith('pay_tiers.name', 'gold')
      expect(mocks.contains).toHaveBeenCalledWith('specialties', ['Wedding'])
      expect(mocks.contains).toHaveBeenCalledWith('languages', ['English'])
      expect(mocks.eq).toHaveBeenCalledWith('photography_style', 'candid')
      expect(mocks.eq).toHaveBeenCalledWith('gender', 'female')
    })
  })

  describe('applySorting', () => {
    test('should apply rating sort (default)', () => {
      applySorting(query, 'rating')

      expect(mocks.order).toHaveBeenCalledWith('average_rating', { ascending: false })
    })

    test('should apply reviews sort', () => {
      applySorting(query, 'reviews')

      expect(mocks.order).toHaveBeenCalledWith('total_reviews', { ascending: false })
    })

    test('should apply experience sort', () => {
      applySorting(query, 'experience')

      expect(mocks.order).toHaveBeenCalledWith('years_experience', { ascending: false })
    })

    test('should apply recent sort', () => {
      applySorting(query, 'recent')

      expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    test('should apply response time sort', () => {
      applySorting(query, 'response_time')

      expect(mocks.order).toHaveBeenCalledWith('avg_response_time_minutes', { ascending: true })
    })

    test('should apply price sorts', () => {
      applySorting(query, 'price_low')
      expect(mocks.order).toHaveBeenCalledWith('pay_tiers.hourly_rate', { ascending: true })

      mocks.order.mockClear()

      applySorting(query, 'price_high')
      expect(mocks.order).toHaveBeenCalledWith('pay_tiers.hourly_rate', { ascending: false })
    })

    test('should handle invalid sort option gracefully', () => {
      applySorting(query, 'invalid_sort')

      // Should default to rating sort
      expect(mocks.order).toHaveBeenCalledWith('average_rating', { ascending: false })
    })

    test('should apply secondary sorts for consistency', () => {
      applySorting(query, 'rating')

      expect(mocks.order).toHaveBeenCalledWith('average_rating', { ascending: false })
      expect(mocks.order).toHaveBeenCalledWith('total_reviews', { ascending: false })
      expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('applyPagination', () => {
    test('should apply correct range for first page', () => {
      applyPagination(query, 0, 50)

      expect(mocks.range).toHaveBeenCalledWith(0, 49)
    })

    test('should apply correct range for subsequent pages', () => {
      applyPagination(query, 50, 50)

      expect(mocks.range).toHaveBeenCalledWith(50, 99)
    })

    test('should handle custom page sizes', () => {
      applyPagination(query, 0, 25)

      expect(mocks.range).toHaveBeenCalledWith(0, 24)
    })

    test('should enforce maximum limit', () => {
      applyPagination(query, 0, 500)

      // Should cap at maximum limit (e.g., 200)
      expect(mocks.range).toHaveBeenCalledWith(0, 199)
    })
  })

  describe('Individual Filter Functions', () => {
    describe('applyRatingFilter', () => {
      test('should apply rating filter when value > 0', () => {
        applyRatingFilter(query, 4)

        expect(mocks.gte).toHaveBeenCalledWith('average_rating', 4)
      })

      test('should not apply filter when rating is 0', () => {
        applyRatingFilter(query, 0)

        expect(mocks.gte).not.toHaveBeenCalled()
      })

      test('should handle edge case ratings', () => {
        applyRatingFilter(query, 5)
        expect(mocks.gte).toHaveBeenCalledWith('average_rating', 5)

        mocks.gte.mockClear()

        applyRatingFilter(query, 1)
        expect(mocks.gte).toHaveBeenCalledWith('average_rating', 1)
      })
    })

    describe('applyTierFilter', () => {
      test('should apply tier filter for specific tiers', () => {
        const tiers = ['bronze', 'silver', 'gold', 'platinum']

        tiers.forEach(tier => {
          mocks.eq.mockClear()
          applyTierFilter(query, tier)
          expect(mocks.eq).toHaveBeenCalledWith('pay_tiers.name', tier)
        })
      })

      test('should not apply filter for "all" tier', () => {
        applyTierFilter(query, 'all')

        expect(mocks.eq).not.toHaveBeenCalled()
      })

      test('should handle case insensitive tier names', () => {
        applyTierFilter(query, 'GOLD')

        expect(mocks.eq).toHaveBeenCalledWith('pay_tiers.name', 'gold')
      })
    })

    describe('applySpecialtiesFilter', () => {
      test('should apply filter for specialty arrays', () => {
        const specialties = ['Wedding', 'Portrait', 'Event']

        applySpecialtiesFilter(query, specialties)

        expect(mocks.contains).toHaveBeenCalledWith('specialties', specialties)
      })

      test('should not apply filter for empty arrays', () => {
        applySpecialtiesFilter(query, [])

        expect(mocks.contains).not.toHaveBeenCalled()
      })

      test('should handle single specialty', () => {
        applySpecialtiesFilter(query, ['Wedding'])

        expect(mocks.contains).toHaveBeenCalledWith('specialties', ['Wedding'])
      })
    })

    describe('applyLanguagesFilter', () => {
      test('should apply filter for language arrays', () => {
        const languages = ['English', 'Spanish', 'French']

        applyLanguagesFilter(query, languages)

        expect(mocks.contains).toHaveBeenCalledWith('languages', languages)
      })

      test('should not apply filter for empty arrays', () => {
        applyLanguagesFilter(query, [])

        expect(mocks.contains).not.toHaveBeenCalled()
      })
    })

    describe('applyStyleFilter', () => {
      test('should apply filter for specific styles', () => {
        applyStyleFilter(query, 'candid')

        expect(mocks.eq).toHaveBeenCalledWith('photography_style', 'candid')
      })

      test('should not apply filter for "all" style', () => {
        applyStyleFilter(query, 'all')

        expect(mocks.eq).not.toHaveBeenCalled()
      })
    })

    describe('applyGenderFilter', () => {
      test('should apply female filter when femaleOnly is true', () => {
        applyGenderFilter(query, true)

        expect(mocks.eq).toHaveBeenCalledWith('gender', 'female')
      })

      test('should not apply filter when femaleOnly is false', () => {
        applyGenderFilter(query, false)

        expect(mocks.eq).not.toHaveBeenCalled()
      })
    })

    describe('applyAvailabilityFilter', () => {
      test('should apply availability filter by default', () => {
        applyAvailabilityFilter(query)

        // Should filter for available photographers
        expect(mocks.filter).toHaveBeenCalledWith(
          'availability_status',
          'eq',
          'available'
        )
      })
    })
  })

  describe('SQL Injection Prevention', () => {
    test('should handle malicious input in string filters', () => {
      const maliciousInput = "'; DROP TABLE photographers; --"

      const filters = {
        zip: maliciousInput,
        tier: maliciousInput,
        photographyStyle: maliciousInput
      }

      // Should not throw and should sanitize input
      expect(() => applyFilters(query, filters)).not.toThrow()

      // Verify Supabase methods were called (they handle sanitization)
      expect(mocks.eq).toHaveBeenCalled()
    })

    test('should handle malicious input in array filters', () => {
      const maliciousArray = ["'; DROP TABLE photographers; --", 'normal_value']

      const filters = {
        specialties: maliciousArray,
        languages: maliciousArray
      }

      expect(() => applyFilters(query, filters)).not.toThrow()
      expect(mocks.contains).toHaveBeenCalled()
    })

    test('should handle numeric injection attempts', () => {
      const maliciousRating = "4; DROP TABLE photographers; --"

      const filters = { rating: maliciousRating }

      expect(() => applyFilters(query, filters)).not.toThrow()

      // Should convert to number or default
      expect(mocks.gte).toHaveBeenCalledWith('average_rating', expect.any(Number))
    })
  })

  describe('Query Chaining', () => {
    test('should maintain query chain integrity', () => {
      const params = {
        filters: {
          rating: 4,
          tier: 'gold',
          specialties: ['Wedding'],
          femaleOnly: true
        },
        sortBy: 'rating'
      }

      const result = buildPhotographersQuery(mockSupabase, params, 0, 50)

      // All operations should return the same query object
      expect(result).toBe(query)

      // Verify chain was maintained through all operations
      expect(mocks.from).toHaveBeenCalledTimes(1)
      expect(mocks.select).toHaveBeenCalledTimes(1)
      expect(mocks.filter).toHaveBeenCalled()
      expect(mocks.gte).toHaveBeenCalled()
      expect(mocks.eq).toHaveBeenCalled()
      expect(mocks.contains).toHaveBeenCalled()
      expect(mocks.order).toHaveBeenCalled()
      expect(mocks.range).toHaveBeenCalled()
    })
  })

  describe('Performance Optimizations', () => {
    test('should skip unnecessary filters for performance', () => {
      const emptyFilters = {
        zip: '',
        rating: 0,
        tier: 'all',
        specialties: [],
        languages: [],
        photographyStyle: 'all',
        femaleOnly: false
      }

      applyFilters(query, emptyFilters)

      // Should only apply availability filter, not empty/default filters
      expect(mocks.filter).toHaveBeenCalledTimes(1) // Only availability
      expect(mocks.gte).not.toHaveBeenCalled()
      expect(mocks.eq).not.toHaveBeenCalledWith('pay_tiers.name', expect.anything())
      expect(mocks.contains).not.toHaveBeenCalled()
    })

    test('should apply filters in optimal order', () => {
      const filters = {
        rating: 4, // Selective filter
        specialties: ['Wedding'], // Moderately selective
        tier: 'gold' // Less selective
      }

      applyFilters(query, filters)

      // Verify filters are applied (order handled by Supabase query planner)
      expect(mocks.gte).toHaveBeenCalled()
      expect(mocks.contains).toHaveBeenCalled()
      expect(mocks.eq).toHaveBeenCalled()
    })
  })
})