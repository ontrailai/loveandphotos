/**
 * Unit tests for resolveZipToCity utility with mocked Supabase
 */

import { resolveZipToCity } from '../resolveZipToCity'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn()
}

describe('resolveZipToCity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ZIP validation', () => {
    test('returns null for empty string', async () => {
      const result = await resolveZipToCity(mockSupabase, '')
      expect(result).toBeNull()
    })

    test('returns null for null input', async () => {
      const result = await resolveZipToCity(mockSupabase, null)
      expect(result).toBeNull()
    })

    test('returns null for undefined input', async () => {
      const result = await resolveZipToCity(mockSupabase, undefined)
      expect(result).toBeNull()
    })

    test('returns null for 4-digit string', async () => {
      const result = await resolveZipToCity(mockSupabase, '1234')
      expect(result).toBeNull()
    })

    test('returns null for 6-digit string', async () => {
      const result = await resolveZipToCity(mockSupabase, '123456')
      expect(result).toBeNull()
    })

    test('returns null for non-numeric string', async () => {
      const result = await resolveZipToCity(mockSupabase, 'abcde')
      expect(result).toBeNull()
    })

    test('returns null for ZIP+4 format', async () => {
      const result = await resolveZipToCity(mockSupabase, '94103-1234')
      expect(result).toBeNull()
    })
  })

  describe('zip_city table resolution', () => {
    test('returns data from zip_city table when found', async () => {
      const mockData = { city: 'San Francisco', state: 'CA' }
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: mockData, error: null })

      const result = await resolveZipToCity(mockSupabase, '94103')

      expect(mockSupabase.from).toHaveBeenCalledWith('zip_city')
      expect(mockSupabase.select).toHaveBeenCalledWith('city, state')
      expect(mockSupabase.eq).toHaveBeenCalledWith('zip', '94103')
      expect(result).toEqual({
        city: 'San Francisco',
        state: 'CA'
      })
    })

    test('continues to fallback when zip_city returns null', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })

      const result = await resolveZipToCity(mockSupabase, '94103')

      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'zip_city')
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'photographer_preview_profiles')
      expect(result).toBeNull()
    })

    test('continues to fallback when zip_city has error', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: { message: 'Table error' } })
        .mockResolvedValueOnce({ data: null, error: null })

      const result = await resolveZipToCity(mockSupabase, '94103')

      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(result).toBeNull()
    })
  })

  describe('photographer fallback resolution', () => {
    test('returns photographer data when zip_city fails but photographer exists', async () => {
      const photographerData = { location_city: 'Portland', location_state: 'Oregon' }
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: photographerData, error: null })

      const result = await resolveZipToCity(mockSupabase, '97201')

      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'photographer_preview_profiles')
      expect(mockSupabase.select).toHaveBeenNthCalledWith(2, 'location_city, location_state')
      expect(mockSupabase.eq).toHaveBeenNthCalledWith(2, 'location_zip', '97201')
      expect(mockSupabase.limit).toHaveBeenCalledWith(1)
      expect(result).toEqual({
        city: 'Portland',
        state: 'Oregon'
      })
    })

    test('returns null when photographer data is incomplete (missing city)', async () => {
      const photographerData = { location_city: null, location_state: 'Oregon' }
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: photographerData, error: null })

      const result = await resolveZipToCity(mockSupabase, '97201')
      expect(result).toBeNull()
    })

    test('returns null when photographer data is incomplete (missing state)', async () => {
      const photographerData = { location_city: 'Portland', location_state: null }
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: photographerData, error: null })

      const result = await resolveZipToCity(mockSupabase, '97201')
      expect(result).toBeNull()
    })

    test('returns null when photographer query has error', async () => {
      mockSupabase.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Photographer query error' } })

      const result = await resolveZipToCity(mockSupabase, '97201')
      expect(result).toBeNull()
    })
  })

  describe('error handling', () => {
    test('handles unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const result = await resolveZipToCity(mockSupabase, '94103')
      expect(result).toBeNull()
    })

    test('handles promise rejection gracefully', async () => {
      mockSupabase.maybeSingle.mockRejectedValue(new Error('Promise rejection'))

      const result = await resolveZipToCity(mockSupabase, '94103')
      expect(result).toBeNull()
    })
  })
})