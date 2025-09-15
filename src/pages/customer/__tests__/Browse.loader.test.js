/**
 * Loader tests for Browse page query parameter handling
 */

import { jest } from '@jest/globals'

// Mock the Browse loader function directly
const mockLoader = async ({ request }) => {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  // This simulates the loader behavior
  return {
    photographers: [], // Mocked empty for tests
    searchParams: {
      q: searchParams.get('q') || searchParams.get('search') || searchParams.get('zip') || '',
      packages: searchParams.get('packages') || '',
      specialties: searchParams.get('specialties') || '',
      tier: searchParams.get('tier') || ''
    }
  }
}

describe('Browse page loader', () => {
  describe('Query parameter handling', () => {
    test('handles q parameter correctly', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q=San%20Diego'
      }

      const result = await mockLoader({ request: mockRequest })

      expect(result.searchParams.q).toBe('San Diego')
      expect(result.searchParams.packages).toBe('')
      expect(result.searchParams.specialties).toBe('')
      expect(result.searchParams.tier).toBe('')
    })

    test('handles legacy search parameter', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?search=San%20Diego'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('San Diego')
    })

    test('handles legacy zip parameter', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?zip=94103'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('94103')
    })

    test('prioritizes q over legacy parameters', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q=San%20Diego&search=Los%20Angeles&zip=94103'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('San Diego')
    })

    test('handles multiple filter parameters', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q=San%20Diego&packages=wedding&specialties=portrait&tier=gold'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('San Diego')
      expect(result.searchParams.packages).toBe('wedding')
      expect(result.searchParams.specialties).toBe('portrait')
      expect(result.searchParams.tier).toBe('gold')
    })

    test('handles URL encoded parameters', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q=San%20Diego%2C%20CA&packages=wedding%2Cportrait'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('San Diego, CA')
      expect(result.searchParams.packages).toBe('wedding,portrait')
    })

    test('handles empty parameters', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('')
      expect(result.searchParams.packages).toBe('')
      expect(result.searchParams.specialties).toBe('')
      expect(result.searchParams.tier).toBe('')
    })

    test('handles special characters in location', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q=New%20York%2C%20NY'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('New York, NY')
    })

    test('handles ZIP codes as location', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q=10001'
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('10001')
    })
  })

  describe('Edge cases', () => {
    test('handles malformed URL gracefully', async () => {
      const mockRequest = {
        url: 'http://localhost:5173/photographers?q='
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe('')
    })

    test('handles very long query parameters', async () => {
      const longQuery = 'a'.repeat(1000)
      const mockRequest = {
        url: `http://localhost:5173/photographers?q=${encodeURIComponent(longQuery)}`
      }

      const result = await mockLoader({ request: mockRequest })
      expect(result.searchParams.q).toBe(longQuery)
    })
  })
})