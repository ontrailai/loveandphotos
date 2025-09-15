/**
 * Unit tests for normalizeLocationQuery utility
 */

import { normalizeLocationQuery, getCanonicalQueryParam } from '../normalizeLocationQuery'

describe('normalizeLocationQuery', () => {
  describe('City normalization', () => {
    test('extracts city from "City, ST" format', () => {
      const result = normalizeLocationQuery('San Diego, CA')
      expect(result).toEqual({
        kind: 'city',
        city: 'San Diego',
        raw: 'San Diego, CA'
      })
    })

    test('extracts city from "City, State, Country" format', () => {
      const result = normalizeLocationQuery('Los Angeles, California, USA')
      expect(result).toEqual({
        kind: 'city',
        city: 'Los Angeles',
        raw: 'Los Angeles, California, USA'
      })
    })

    test('handles city with "United States" suffix', () => {
      const result = normalizeLocationQuery('Seattle, WA, United States')
      expect(result).toEqual({
        kind: 'city',
        city: 'Seattle',
        raw: 'Seattle, WA, United States'
      })
    })

    test('handles city with "US" suffix', () => {
      const result = normalizeLocationQuery('Portland, Oregon, US')
      expect(result).toEqual({
        kind: 'city',
        city: 'Portland',
        raw: 'Portland, Oregon, US'
      })
    })

    test('handles simple city name without comma', () => {
      const result = normalizeLocationQuery('Chicago')
      expect(result).toEqual({
        kind: 'city',
        city: 'Chicago',
        raw: 'Chicago'
      })
    })

    test('trims whitespace and normalizes spaces', () => {
      const result = normalizeLocationQuery('  New York  ,   NY  ')
      expect(result).toEqual({
        kind: 'city',
        city: 'New York',
        raw: '  New York  ,   NY  '
      })
    })
  })

  describe('ZIP code normalization', () => {
    test('identifies 5-digit ZIP code', () => {
      const result = normalizeLocationQuery('94103')
      expect(result).toEqual({
        kind: 'zip',
        zip: '94103',
        raw: '94103'
      })
    })

    test('identifies ZIP with leading zeros', () => {
      const result = normalizeLocationQuery('01234')
      expect(result).toEqual({
        kind: 'zip',
        zip: '01234',
        raw: '01234'
      })
    })

    test('rejects 4-digit numbers as ZIP', () => {
      const result = normalizeLocationQuery('1234')
      expect(result).toEqual({
        kind: 'city',
        city: '1234',
        raw: '1234'
      })
    })

    test('rejects 6-digit numbers as ZIP', () => {
      const result = normalizeLocationQuery('123456')
      expect(result).toEqual({
        kind: 'city',
        city: '123456',
        raw: '123456'
      })
    })

    test('rejects ZIP+4 format as city', () => {
      const result = normalizeLocationQuery('94103-1234')
      expect(result).toEqual({
        kind: 'city',
        city: '94103-1234',
        raw: '94103-1234'
      })
    })
  })

  describe('Edge cases', () => {
    test('handles empty string', () => {
      const result = normalizeLocationQuery('')
      expect(result).toEqual({
        kind: 'city',
        city: '',
        raw: ''
      })
    })

    test('handles null input', () => {
      const result = normalizeLocationQuery(null)
      expect(result).toEqual({
        kind: 'city',
        city: '',
        raw: null
      })
    })

    test('handles undefined input', () => {
      const result = normalizeLocationQuery(undefined)
      expect(result).toEqual({
        kind: 'city',
        city: '',
        raw: undefined
      })
    })

    test('handles whitespace-only string', () => {
      const result = normalizeLocationQuery('   ')
      expect(result).toEqual({
        kind: 'city',
        city: '',
        raw: '   '
      })
    })
  })
})

describe('getCanonicalQueryParam', () => {
  test('returns zip for zip kind', () => {
    const normalized = { kind: 'zip', zip: '94103', raw: '94103' }
    expect(getCanonicalQueryParam(normalized)).toBe('94103')
  })

  test('returns city for city kind', () => {
    const normalized = { kind: 'city', city: 'San Diego', raw: 'San Diego, CA' }
    expect(getCanonicalQueryParam(normalized)).toBe('San Diego')
  })

  test('returns empty string for missing zip', () => {
    const normalized = { kind: 'zip', raw: '94103' }
    expect(getCanonicalQueryParam(normalized)).toBe('')
  })

  test('returns empty string for missing city', () => {
    const normalized = { kind: 'city', raw: 'San Diego, CA' }
    expect(getCanonicalQueryParam(normalized)).toBe('')
  })

  test('returns raw for unknown kind', () => {
    const normalized = { kind: 'unknown', raw: 'test' }
    expect(getCanonicalQueryParam(normalized)).toBe('test')
  })
}