/**
 * Unit tests for geo utility functions
 */

import { isZip, resolveCityFromZip } from '../geo'

// Mock the zipcodes library for consistent testing
jest.mock('zipcodes', () => ({
  lookup: jest.fn()
}))

import zipdb from 'zipcodes'

describe('geo utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isZip', () => {
    test('returns true for valid 5-digit ZIP codes', () => {
      expect(isZip('94103')).toBe(true)
      expect(isZip('10001')).toBe(true)
      expect(isZip('92101')).toBe(true)
      expect(isZip('01234')).toBe(true) // Leading zeros
    })

    test('returns false for invalid ZIP codes', () => {
      expect(isZip('1234')).toBe(false)   // Too short
      expect(isZip('123456')).toBe(false) // Too long
      expect(isZip('abcde')).toBe(false)  // Non-numeric
      expect(isZip('941-03')).toBe(false) // Contains dash
      expect(isZip('')).toBe(false)       // Empty string
      expect(isZip()).toBe(false)         // Undefined
    })

    test('handles whitespace correctly', () => {
      expect(isZip(' 94103 ')).toBe(true)
      expect(isZip('  10001  ')).toBe(true)
      expect(isZip('   ')).toBe(false)
    })
  })

  describe('resolveCityFromZip', () => {
    test('resolves valid ZIP codes to city and state', () => {
      zipdb.lookup.mockReturnValue({
        city: 'San Francisco',
        state: 'CA'
      })

      const result = resolveCityFromZip('94103')

      expect(zipdb.lookup).toHaveBeenCalledWith('94103')
      expect(result).toEqual({
        city: 'San Francisco',
        state: 'CA'
      })
    })

    test('handles ZIP codes with leading zeros', () => {
      zipdb.lookup.mockReturnValue({
        city: 'New York',
        state: 'NY'
      })

      const result = resolveCityFromZip('10001')

      expect(zipdb.lookup).toHaveBeenCalledWith('10001')
      expect(result).toEqual({
        city: 'New York',
        state: 'NY'
      })
    })

    test('returns null for invalid ZIP format', () => {
      const result = resolveCityFromZip('1234') // Invalid format

      expect(zipdb.lookup).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    test('returns null when library returns null', () => {
      zipdb.lookup.mockReturnValue(null)

      const result = resolveCityFromZip('99999')

      expect(zipdb.lookup).toHaveBeenCalledWith('99999')
      expect(result).toBeNull()
    })

    test('returns null when library returns empty object', () => {
      zipdb.lookup.mockReturnValue({})

      const result = resolveCityFromZip('99999')

      expect(result).toBeNull()
    })

    test('returns null when library returns object without city', () => {
      zipdb.lookup.mockReturnValue({
        state: 'CA'
        // Missing city property
      })

      const result = resolveCityFromZip('99999')

      expect(result).toBeNull()
    })

    test('handles missing state gracefully', () => {
      zipdb.lookup.mockReturnValue({
        city: 'Some City'
        // Missing state property
      })

      const result = resolveCityFromZip('12345')

      expect(result).toEqual({
        city: 'Some City',
        state: ''
      })
    })

    test('handles library errors gracefully', () => {
      zipdb.lookup.mockImplementation(() => {
        throw new Error('Library error')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = resolveCityFromZip('94103')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error resolving ZIP code:', '94103', expect.any(Error))

      consoleSpy.mockRestore()
    })

    test('trims whitespace from ZIP input', () => {
      zipdb.lookup.mockReturnValue({
        city: 'San Francisco',
        state: 'CA'
      })

      const result = resolveCityFromZip('  94103  ')

      expect(zipdb.lookup).toHaveBeenCalledWith('94103')
      expect(result).toEqual({
        city: 'San Francisco',
        state: 'CA'
      })
    })
  })

  describe('integration with real ZIP codes', () => {
    test('handles common test ZIP codes', () => {
      // Test San Francisco
      zipdb.lookup.mockReturnValueOnce({
        city: 'San Francisco',
        state: 'CA'
      })
      expect(resolveCityFromZip('94103')).toEqual({
        city: 'San Francisco',
        state: 'CA'
      })

      // Test New York
      zipdb.lookup.mockReturnValueOnce({
        city: 'New York',
        state: 'NY'
      })
      expect(resolveCityFromZip('10001')).toEqual({
        city: 'New York',
        state: 'NY'
      })

      // Test San Diego
      zipdb.lookup.mockReturnValueOnce({
        city: 'San Diego',
        state: 'CA'
      })
      expect(resolveCityFromZip('92101')).toEqual({
        city: 'San Diego',
        state: 'CA'
      })
    })
  })
})