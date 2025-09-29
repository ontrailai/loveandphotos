/**
 * Unit Tests for IP Address Parser
 * Tests all scenarios including comma-separated IPs from CDN/proxy
 */

import {
  extractFirstValidIP,
  parseClientIP,
  sanitizeIPForStorage,
  getIPMetadata
} from '../../src/lib/async/ipAddressParser.js'

describe('IP Address Parser', () => {
  describe('extractFirstValidIP', () => {
    it('should extract single valid IPv4 address', () => {
      expect(extractFirstValidIP('192.168.1.1')).toBe('192.168.1.1')
      expect(extractFirstValidIP('8.8.8.8')).toBe('8.8.8.8')
      expect(extractFirstValidIP('127.0.0.1')).toBe('127.0.0.1')
    })

    it('should extract first IP from comma-separated list', () => {
      // Common CDN/Cloudflare format
      expect(extractFirstValidIP('72.197.124.218, 172.68.174.55')).toBe('72.197.124.218')
      expect(extractFirstValidIP('1.2.3.4, 5.6.7.8, 9.10.11.12')).toBe('1.2.3.4')
      expect(extractFirstValidIP('203.0.113.1, 198.51.100.1')).toBe('203.0.113.1')
    })

    it('should handle whitespace in IP lists', () => {
      expect(extractFirstValidIP('  192.168.1.1  ')).toBe('192.168.1.1')
      expect(extractFirstValidIP('192.168.1.1 , 10.0.0.1')).toBe('192.168.1.1')
      expect(extractFirstValidIP('  1.2.3.4  ,  5.6.7.8  ')).toBe('1.2.3.4')
    })

    it('should reject invalid IPv4 addresses', () => {
      expect(extractFirstValidIP('256.1.1.1')).toBeNull() // Octet > 255
      expect(extractFirstValidIP('192.168.1')).toBeNull() // Too few octets
      expect(extractFirstValidIP('192.168.1.1.1')).toBeNull() // Too many octets
      expect(extractFirstValidIP('abc.def.ghi.jkl')).toBeNull() // Non-numeric
    })

    it('should handle IPv6 addresses', () => {
      expect(extractFirstValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
      expect(extractFirstValidIP('::1')).toBe('::1') // Localhost
      expect(extractFirstValidIP('::')).toBe('::') // All zeros
      expect(extractFirstValidIP('fe80::1')).toBe('fe80::1')
    })

    it('should handle null/undefined/empty input', () => {
      expect(extractFirstValidIP(null)).toBeNull()
      expect(extractFirstValidIP(undefined)).toBeNull()
      expect(extractFirstValidIP('')).toBeNull()
      expect(extractFirstValidIP('   ')).toBeNull()
    })

    it('should handle malformed comma-separated lists', () => {
      expect(extractFirstValidIP('invalid, 192.168.1.1')).toBe('192.168.1.1')
      expect(extractFirstValidIP(',,, 10.0.0.1')).toBe('10.0.0.1')
      expect(extractFirstValidIP('not-an-ip, also-not-ip')).toBeNull()
    })
  })

  describe('parseClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1'
        }
      }
      expect(parseClientIP(req)).toBe('203.0.113.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const req = {
        headers: {
          'x-real-ip': '192.168.1.1'
        }
      }
      expect(parseClientIP(req)).toBe('192.168.1.1')
    })

    it('should fallback to req.ip', () => {
      const req = {
        headers: {},
        ip: '10.0.0.1'
      }
      expect(parseClientIP(req)).toBe('10.0.0.1')
    })

    it('should fallback to connection.remoteAddress', () => {
      const req = {
        headers: {},
        connection: {
          remoteAddress: '172.16.0.1'
        }
      }
      expect(parseClientIP(req)).toBe('172.16.0.1')
    })

    it('should prioritize x-forwarded-for over other sources', () => {
      const req = {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '192.168.1.1'
        },
        ip: '10.0.0.1',
        connection: {
          remoteAddress: '172.16.0.1'
        }
      }
      expect(parseClientIP(req)).toBe('203.0.113.1')
    })

    it('should return default IP when no valid source found', () => {
      const req = {
        headers: {}
      }
      expect(parseClientIP(req)).toBe('0.0.0.0')
    })

    it('should handle real Cloudflare scenario', () => {
      const req = {
        headers: {
          'x-forwarded-for': '72.197.124.218, 172.68.174.55',
          'cf-connecting-ip': '72.197.124.218',
          'x-real-ip': '172.68.174.55'
        }
      }
      expect(parseClientIP(req)).toBe('72.197.124.218')
    })
  })

  describe('sanitizeIPForStorage', () => {
    it('should sanitize valid IP addresses', () => {
      expect(sanitizeIPForStorage('192.168.1.1')).toBe('192.168.1.1')
      expect(sanitizeIPForStorage('8.8.8.8')).toBe('8.8.8.8')
    })

    it('should extract first IP from comma-separated list', () => {
      expect(sanitizeIPForStorage('72.197.124.218, 172.68.174.55')).toBe('72.197.124.218')
    })

    it('should reject SQL injection attempts', () => {
      expect(sanitizeIPForStorage("192.168.1.1'; DROP TABLE users;--")).toBeNull()
      expect(sanitizeIPForStorage('192.168.1.1; DELETE FROM users')).toBeNull()
      expect(sanitizeIPForStorage("192.168.1.1'--")).toBeNull()
    })

    it('should return null for invalid IPs', () => {
      expect(sanitizeIPForStorage('not-an-ip')).toBeNull()
      expect(sanitizeIPForStorage('256.256.256.256')).toBeNull()
      expect(sanitizeIPForStorage('')).toBeNull()
      expect(sanitizeIPForStorage(null)).toBeNull()
    })

    it('should handle edge cases safely', () => {
      expect(sanitizeIPForStorage('   ')).toBeNull()
      expect(sanitizeIPForStorage(undefined)).toBeNull()
      expect(sanitizeIPForStorage(123)).toBeNull() // Non-string input
    })
  })

  describe('getIPMetadata', () => {
    it('should identify valid IPv4 addresses', () => {
      const metadata = getIPMetadata('192.168.1.1')
      expect(metadata.valid).toBe(true)
      expect(metadata.type).toBe('ipv4')
      expect(metadata.isPrivate).toBe(true)
      expect(metadata.isLocalhost).toBe(false)
    })

    it('should identify valid IPv6 addresses', () => {
      const metadata = getIPMetadata('2001:0db8:85a3::7334')
      expect(metadata.valid).toBe(true)
      expect(metadata.type).toBe('ipv6')
    })

    it('should identify localhost addresses', () => {
      const localhostIPv4 = getIPMetadata('127.0.0.1')
      expect(localhostIPv4.isLocalhost).toBe(true)

      const localhostIPv6 = getIPMetadata('::1')
      expect(localhostIPv6.isLocalhost).toBe(true)
    })

    it('should identify private IP ranges', () => {
      expect(getIPMetadata('10.0.0.1').isPrivate).toBe(true)
      expect(getIPMetadata('172.16.0.1').isPrivate).toBe(true)
      expect(getIPMetadata('192.168.1.1').isPrivate).toBe(true)
      expect(getIPMetadata('8.8.8.8').isPrivate).toBe(false) // Public IP
    })

    it('should handle invalid IP addresses', () => {
      const metadata = getIPMetadata('invalid-ip')
      expect(metadata.valid).toBe(false)
      expect(metadata.type).toBe('invalid')
      expect(metadata.isPrivate).toBe(false)
      expect(metadata.isLocalhost).toBe(false)
    })
  })

  describe('Real-world CDN scenarios', () => {
    it('should handle Cloudflare X-Forwarded-For header', () => {
      const ip = extractFirstValidIP('72.197.124.218, 172.68.174.55')
      expect(ip).toBe('72.197.124.218')
      expect(sanitizeIPForStorage(ip)).toBe('72.197.124.218')
    })

    it('should handle AWS CloudFront X-Forwarded-For header', () => {
      const ip = extractFirstValidIP('203.0.113.1, 70.132.45.67')
      expect(ip).toBe('203.0.113.1')
    })

    it('should handle multiple proxy hops', () => {
      const ip = extractFirstValidIP('1.2.3.4, 5.6.7.8, 9.10.11.12, 13.14.15.16')
      expect(ip).toBe('1.2.3.4') // First IP is client, rest are proxies
    })

    it('should handle mixed valid/invalid IPs in list', () => {
      const ip = extractFirstValidIP('invalid, 192.168.1.1, 10.0.0.1')
      expect(ip).toBe('192.168.1.1') // Skips invalid, returns first valid
    })
  })

  describe('PostgreSQL inet compatibility', () => {
    it('should produce inet-compatible IPv4 addresses', () => {
      const validIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '8.8.8.8',
        '1.1.1.1'
      ]

      validIPs.forEach(ip => {
        const sanitized = sanitizeIPForStorage(ip)
        expect(sanitized).toBe(ip)
        // Should not contain commas, semicolons, or other problematic characters
        expect(sanitized).not.toContain(',')
        expect(sanitized).not.toContain(';')
        expect(sanitized).not.toContain("'")
      })
    })

    it('should produce inet-compatible IPv6 addresses', () => {
      const validIPv6s = [
        '2001:0db8:85a3::7334',
        '::1',
        'fe80::1',
        '::'
      ]

      validIPv6s.forEach(ip => {
        const sanitized = sanitizeIPForStorage(ip)
        expect(sanitized).toBe(ip)
      })
    })

    it('should reject comma-separated lists for storage', () => {
      // Even though we can extract from them, storage should be single IP
      const sanitized = sanitizeIPForStorage('1.2.3.4, 5.6.7.8')
      expect(sanitized).toBe('1.2.3.4') // First valid IP only
      expect(sanitized).not.toContain(',')
    })
  })
})