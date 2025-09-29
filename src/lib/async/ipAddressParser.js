/**
 * IP Address Parser and Validator
 * Safely extracts and validates IP addresses for PostgreSQL inet column storage
 *
 * Handles:
 * - Comma-separated IP lists from CDN/proxy headers (e.g., "1.2.3.4, 5.6.7.8")
 * - IPv4 validation
 * - IPv6 validation
 * - Localhost and private IP handling
 * - Malformed input gracefully
 */

/**
 * IPv4 validation regex
 * Validates standard IPv4 format: xxx.xxx.xxx.xxx
 */
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/

/**
 * IPv6 validation regex (simplified)
 * Validates standard IPv6 format with colons and optional ::
 */
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

/**
 * Validate if string is a valid IPv4 address
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IPv4
 */
function isValidIPv4(ip) {
  if (!IPV4_REGEX.test(ip)) return false

  const octets = ip.split('.')
  return octets.every(octet => {
    const num = parseInt(octet, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * Validate if string is a valid IPv6 address
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IPv6
 */
function isValidIPv6(ip) {
  // Basic IPv6 validation
  if (!IPV6_REGEX.test(ip)) return false

  // Additional checks for special cases
  if (ip === '::') return true // All zeros shorthand
  if (ip.startsWith('::') || ip.endsWith('::')) return true // Leading/trailing zeros
  if (ip.includes(':::')) return false // Invalid triple colon

  return true
}

/**
 * Validate if string is a valid IP address (IPv4 or IPv6)
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP address
 */
function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false

  const trimmedIp = ip.trim()
  if (!trimmedIp) return false

  return isValidIPv4(trimmedIp) || isValidIPv6(trimmedIp)
}

/**
 * Extract the first valid IP address from a comma-separated list
 * Common with CDN/proxy headers like X-Forwarded-For
 *
 * Format: "client_ip, proxy1_ip, proxy2_ip"
 * Returns: "client_ip"
 *
 * @param {string} ipString - IP address or comma-separated list
 * @returns {string|null} First valid IP address or null if none found
 */
export function extractFirstValidIP(ipString) {
  if (!ipString || typeof ipString !== 'string') {
    return null
  }

  // Split by comma and process each potential IP
  const ipList = ipString.split(',').map(ip => ip.trim())

  // Find the first valid IP
  for (const ip of ipList) {
    if (isValidIP(ip)) {
      return ip
    }
  }

  return null
}

/**
 * Parse and clean IP address from request headers
 * Handles various header formats and CDN scenarios
 *
 * Priority order:
 * 1. x-forwarded-for (most common with proxies/CDN)
 * 2. x-real-ip (alternative header)
 * 3. req.ip (Express/Node.js default)
 * 4. connection.remoteAddress (fallback)
 *
 * @param {Object} req - Express request object
 * @returns {string} Cleaned, validated IP address suitable for inet storage
 */
export function parseClientIP(req) {
  const defaultIP = '0.0.0.0' // Safe fallback for unknown IPs

  // Try various sources in priority order
  const ipSources = [
    req.headers['x-forwarded-for'],
    req.headers['x-real-ip'],
    req.ip,
    req.connection?.remoteAddress,
    req.socket?.remoteAddress,
    req.connection?.socket?.remoteAddress
  ]

  for (const source of ipSources) {
    if (!source) continue

    const cleanedIP = extractFirstValidIP(source)
    if (cleanedIP) {
      // Log for audit trail
      if (source !== cleanedIP) {
        console.log(`📍 IP parsed: "${source}" → "${cleanedIP}"`)
      }
      return cleanedIP
    }
  }

  // No valid IP found - log warning and return safe default
  console.warn('⚠️ Could not extract valid IP address, using default:', defaultIP)
  return defaultIP
}

/**
 * Validate and sanitize IP address for database storage
 * Ensures IP is safe to store in PostgreSQL inet column
 *
 * @param {string} ip - IP address to validate
 * @returns {string|null} Validated IP or null if invalid
 */
export function sanitizeIPForStorage(ip) {
  const cleanedIP = extractFirstValidIP(ip)

  if (!cleanedIP) {
    console.warn('⚠️ Invalid IP address provided for storage:', ip)
    return null
  }

  // Additional sanitization - ensure no SQL injection attempts
  if (cleanedIP.includes(';') || cleanedIP.includes('--') || cleanedIP.includes("'")) {
    console.error('🚨 Potential SQL injection attempt in IP:', ip)
    return null
  }

  return cleanedIP
}

/**
 * Get IP address metadata for logging/auditing
 * @param {string} ip - IP address to analyze
 * @returns {Object} IP metadata
 */
export function getIPMetadata(ip) {
  if (!ip || !isValidIP(ip)) {
    return {
      valid: false,
      type: 'invalid',
      isPrivate: false,
      isLocalhost: false
    }
  }

  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost'

  // Check for private IP ranges (RFC 1918)
  const isPrivate = isValidIPv4(ip) && (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  )

  return {
    valid: true,
    type: isValidIPv6(ip) ? 'ipv6' : 'ipv4',
    isPrivate,
    isLocalhost,
    raw: ip
  }
}