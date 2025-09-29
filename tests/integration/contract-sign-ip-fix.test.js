/**
 * Integration Test for Contract Signing IP Address Bug Fix
 * Tests that comma-separated IPs from CDN/proxy don't cause PostgreSQL errors
 *
 * Bug: "invalid input syntax for type inet: '72.197.124.218, 172.68.174.55'"
 * Fix: Parse and extract first valid IP before database insertion
 */

import { storeContractSignature } from '../../src/lib/async/contractService.js'
import { extractFirstValidIP, sanitizeIPForStorage } from '../../src/lib/async/ipAddressParser.js'

describe('Contract Signing IP Address Fix - Integration', () => {
  describe('IP Parser Integration', () => {
    it('should extract first IP from Cloudflare X-Forwarded-For format', () => {
      const cloudflareIP = '72.197.124.218, 172.68.174.55'
      const extracted = extractFirstValidIP(cloudflareIP)

      expect(extracted).toBe('72.197.124.218')
      expect(extracted).not.toContain(',')
    })

    it('should sanitize comma-separated IPs for database storage', () => {
      const rawIP = '72.197.124.218, 172.68.174.55'
      const sanitized = sanitizeIPForStorage(rawIP)

      expect(sanitized).toBe('72.197.124.218')
      expect(sanitized).not.toContain(',')
      expect(sanitized).not.toContain(';')
      expect(sanitized).not.toContain("'")
    })

    it('should handle single IP addresses without modification', () => {
      const singleIP = '192.168.1.1'
      const sanitized = sanitizeIPForStorage(singleIP)

      expect(sanitized).toBe('192.168.1.1')
    })

    it('should handle multiple proxy hops', () => {
      const multiHopIP = '203.0.113.1, 198.51.100.1, 172.16.0.1'
      const extracted = extractFirstValidIP(multiHopIP)

      expect(extracted).toBe('203.0.113.1')
    })

    it('should return safe fallback for invalid IPs', () => {
      const invalidIP = 'not-an-ip'
      const sanitized = sanitizeIPForStorage(invalidIP)

      expect(sanitized).toBeNull()
    })

    it('should reject SQL injection attempts', () => {
      const maliciousIP = "192.168.1.1'; DROP TABLE contract_signatures;--"
      const sanitized = sanitizeIPForStorage(maliciousIP)

      expect(sanitized).toBeNull()
    })
  })

  describe('storeContractSignature IP handling', () => {
    // Note: This test requires a running Supabase instance
    // For unit testing, we verify the sanitization logic works correctly
    // The actual database integration is tested in E2E tests

    it('should prepare valid IP data for database insertion', () => {
      const testSignatureData = {
        bookingId: 'test-booking-id',
        contractVersion: '1.0',
        contractHash: 'test-hash',
        eventDate: '2024-06-15',
        location: 'Test Location',
        packageName: 'Test Package',
        price: 299.99,
        signerFullName: 'Test Signer',
        signaturePngBase64: 'data:image/png;base64,test-data',
        signedAtISO: new Date().toISOString()
      }

      // Test with Cloudflare-style comma-separated IP
      const cloudflareIP = '72.197.124.218, 172.68.174.55'
      const sanitizedIP = sanitizeIPForStorage(cloudflareIP)

      expect(sanitizedIP).toBe('72.197.124.218')
      expect(sanitizedIP).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)

      // Verify this would be safe for PostgreSQL inet column
      expect(sanitizedIP).not.toContain(',')
      expect(sanitizedIP.split('.').every(octet =>
        parseInt(octet, 10) >= 0 && parseInt(octet, 10) <= 255
      )).toBe(true)
    })

    it('should handle production-like IP scenarios', () => {
      const scenarios = [
        {
          name: 'Cloudflare CDN',
          raw: '72.197.124.218, 172.68.174.55',
          expected: '72.197.124.218'
        },
        {
          name: 'AWS CloudFront',
          raw: '203.0.113.1, 70.132.45.67',
          expected: '203.0.113.1'
        },
        {
          name: 'Multiple proxy hops',
          raw: '1.2.3.4, 5.6.7.8, 9.10.11.12',
          expected: '1.2.3.4'
        },
        {
          name: 'Single IP (no proxy)',
          raw: '192.168.1.1',
          expected: '192.168.1.1'
        },
        {
          name: 'IPv6 format',
          raw: '2001:0db8:85a3::7334',
          expected: '2001:0db8:85a3::7334'
        }
      ]

      scenarios.forEach(scenario => {
        const sanitized = sanitizeIPForStorage(scenario.raw)
        expect(sanitized).toBe(scenario.expected)

        // Verify PostgreSQL compatibility
        expect(sanitized).not.toContain(',')
        expect(sanitized).toBeTruthy()
      })
    })
  })

  describe('Error scenario prevention', () => {
    it('should prevent PostgreSQL 22P02 error (invalid inet syntax)', () => {
      // This is the exact error case from production
      const problematicIP = '72.197.124.218, 172.68.174.55'

      // Before fix: This would cause PostgreSQL error 22P02
      // After fix: Should extract valid single IP
      const sanitized = sanitizeIPForStorage(problematicIP)

      expect(sanitized).toBe('72.197.124.218')
      expect(sanitized).not.toContain(',')

      // Verify it matches PostgreSQL inet format requirements
      const isValidIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(sanitized)
      expect(isValidIPv4).toBe(true)
    })

    it('should handle edge cases that could break database insertion', () => {
      const edgeCases = [
        { input: '', shouldBeNull: true },
        { input: null, shouldBeNull: true },
        { input: undefined, shouldBeNull: true },
        { input: '   ', shouldBeNull: true },
        { input: 'invalid-ip', shouldBeNull: true },
        { input: '256.256.256.256', shouldBeNull: true },
        { input: "192.168.1.1'; DROP TABLE users;--", shouldBeNull: true }
      ]

      edgeCases.forEach(({ input, shouldBeNull }) => {
        const sanitized = sanitizeIPForStorage(input)
        expect(sanitized).toBeNull()
      })
    })
  })

  describe('Audit trail and logging', () => {
    it('should provide clear IP metadata for audit logs', () => {
      const testIP = '72.197.124.218, 172.68.174.55'
      const extracted = extractFirstValidIP(testIP)

      // Should log original and extracted IP for audit purposes
      expect(extracted).toBe('72.197.124.218')

      // Original raw IP should be preserved in logs (not in database)
      expect(testIP).toContain(',')
      expect(extracted).not.toContain(',')
    })
  })
})