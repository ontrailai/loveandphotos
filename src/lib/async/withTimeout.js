/**
 * Robust timeout and retry utilities for contract signing system
 * Provides bulletproof async operation handling with comprehensive error management
 */

/**
 * Race a promise against a timeout
 * @param {Promise} promise - The promise to execute
 * @param {number} ms - Timeout in milliseconds (default: 10000)
 * @returns {Promise} - The original promise or timeout rejection
 */
export function withTimeout(promise, ms = 10000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`))
    }, ms)

    promise
      .then(result => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch(error => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

/**
 * Retry failed operations with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} tries - Maximum retry attempts (default: 2)
 * @param {number} delay - Initial delay in ms (default: 1000)
 * @param {number} backoffMultiplier - Backoff multiplier (default: 2)
 * @returns {Promise} - Result of successful execution
 */
export async function withRetry(fn, tries = 2, delay = 1000, backoffMultiplier = 2) {
  let lastError
  let currentDelay = delay

  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const result = await fn()
      return result
    } catch (error) {
      lastError = error

      // Don't retry on the last attempt
      if (attempt === tries) {
        break
      }

      // Don't retry client errors (4xx) - these won't resolve with retries
      if (error.status >= 400 && error.status < 500) {
        throw error
      }

      // Log retry attempt
      console.warn(`Retry attempt ${attempt}/${tries} failed:`, error.message)
      console.warn(`Retrying in ${currentDelay}ms...`)

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffMultiplier
    }
  }

  // All retries exhausted
  throw normalizeError(lastError, `Failed after ${tries} attempts`)
}

/**
 * Normalize error messages for consistent API responses
 * @param {Error|any} error - The error to normalize
 * @param {string} context - Additional context for the error
 * @returns {Error} - Normalized error object
 */
export function normalizeError(error, context = '') {
  // Handle different error types
  if (!error) {
    return new Error(`Unknown error${context ? `: ${context}` : ''}`)
  }

  // Already an Error object
  if (error instanceof Error) {
    return {
      ...error,
      message: context ? `${context}: ${error.message}` : error.message,
      code: error.code || 'INTERNAL_ERROR',
      status: error.status || 500
    }
  }

  // String error
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: context ? `${context}: ${error}` : error,
      code: 'INTERNAL_ERROR',
      status: 500
    }
  }

  // Object with message
  if (error.message) {
    return {
      name: error.name || 'Error',
      message: context ? `${context}: ${error.message}` : error.message,
      code: error.code || error.type || 'INTERNAL_ERROR',
      status: error.status || error.statusCode || 500
    }
  }

  // Supabase/PostgreSQL errors
  if (error.details || error.hint) {
    return {
      name: 'DatabaseError',
      message: context ? `${context}: ${error.message || 'Database operation failed'}` : (error.message || 'Database operation failed'),
      code: error.code || 'DATABASE_ERROR',
      status: 500,
      details: error.details,
      hint: error.hint
    }
  }

  // Network/fetch errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      name: 'NetworkError',
      message: context ? `${context}: Network connection failed` : 'Network connection failed',
      code: 'NETWORK_ERROR',
      status: 503
    }
  }

  // Generic object - stringify and return
  return {
    name: 'Error',
    message: context ? `${context}: ${JSON.stringify(error)}` : JSON.stringify(error),
    code: 'UNKNOWN_ERROR',
    status: 500
  }
}

/**
 * Combine timeout and retry for ultimate reliability
 * @param {Function} fn - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Promise} - Result of successful execution
 */
export async function withTimeoutAndRetry(fn, options = {}) {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    backoffMultiplier = 2
  } = options

  return withRetry(
    () => withTimeout(fn(), timeout),
    retries,
    retryDelay,
    backoffMultiplier
  )
}

/**
 * Rate limiting utility to prevent abuse
 * Simple in-memory rate limiter (for production, use Redis or database)
 */
const rateLimitStore = new Map()

export function checkRateLimit(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now()
  const windowStart = now - windowMs

  // Get existing requests for this key
  const requests = rateLimitStore.get(key) || []

  // Filter out requests outside the time window
  const validRequests = requests.filter(timestamp => timestamp > windowStart)

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...validRequests)
    const resetTime = oldestRequest + windowMs

    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfter: Math.ceil((resetTime - now) / 1000)
    }
  }

  // Add current request
  validRequests.push(now)
  rateLimitStore.set(key, validRequests)

  return {
    allowed: true,
    remaining: maxRequests - validRequests.length,
    resetTime: now + windowMs,
    retryAfter: 0
  }
}

/**
 * Audit logging utility for security events
 * @param {string} event - Event type
 * @param {Object} data - Event data
 * @param {string} ip - Client IP address
 */
export function auditLog(event, data, ip) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    event,
    ip,
    data: {
      ...data,
      // Sanitize sensitive data
      signaturePngBase64: data.signaturePngBase64 ? '[SIGNATURE_DATA]' : undefined
    }
  }

  // In production, this should go to a proper logging service
  console.log('🔒 AUDIT:', JSON.stringify(logEntry))

  // Store in audit table if needed
  return logEntry
}