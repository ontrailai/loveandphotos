/**
 * Branding Utility Tests
 */

import { describe, it, expect } from 'vitest'
import { getBrandName, getBrandDomain, getBrandEmail } from '../branding'

describe('Branding Utilities', () => {
  describe('getBrandName', () => {
    it('returns correct brand name', () => {
      expect(getBrandName()).toBe('Love & Photos')
    })

    it('returns short version when requested', () => {
      expect(getBrandName({ short: true })).toBe('L&P')
    })
  })

  describe('getBrandDomain', () => {
    it('returns correct domain', () => {
      expect(getBrandDomain()).toBe('loveandphotos.com')
    })

    it('returns full URL when requested', () => {
      expect(getBrandDomain({ full: true })).toBe('https://love-and-photos.onrender.com')
    })
  })

  describe('getBrandEmail', () => {
    it('returns support email by default', () => {
      expect(getBrandEmail()).toBe('support@loveandphotos.com')
    })

    it('returns specific department emails', () => {
      expect(getBrandEmail('info')).toBe('info@loveandphotos.com')
      expect(getBrandEmail('photographers')).toBe('photographers@loveandphotos.com')
      expect(getBrandEmail('bookings')).toBe('bookings@loveandphotos.com')
    })
  })
})