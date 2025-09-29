/**
 * Contract Signing API Tests
 * Comprehensive test suite for timeout/retry utilities and contract signing endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import {
  withTimeout,
  withRetry,
  normalizeError,
  withTimeoutAndRetry,
  checkRateLimit
} from '../../src/lib/async/withTimeout.js'

// Mock data for testing
const mockValidSignature = {
  bookingId: 'booking_123',
  contractVersion: '1.0',
  contractHash: 'validhash123',
  eventDate: '2024-06-15',
  location: 'Test Location',
  packageName: 'Premium Package',
  price: 299.99,
  signerFullName: 'John Doe',
  signaturePngBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  signedAtISO: new Date().toISOString()
}

const mockLargeSignature = {
  ...mockValidSignature,
  signaturePngBase64: 'data:image/png;base64,' + 'A'.repeat(3 * 1024 * 1024) // 3MB base64
}

describe('Timeout and Retry Utilities', () => {
  describe('withTimeout', () => {
    it('should resolve when promise completes before timeout', async () => {
      const fastPromise = new Promise(resolve => setTimeout(() => resolve('success'), 100))
      const result = await withTimeout(fastPromise, 1000)
      expect(result).toBe('success')
    })

    it('should reject with timeout error when promise takes too long', async () => {
      const slowPromise = new Promise(resolve => setTimeout(() => resolve('success'), 2000))

      await expect(withTimeout(slowPromise, 100))
        .rejects
        .toThrow('Operation timed out after 100ms')
    })

    it('should reject with original error when promise fails', async () => {
      const failingPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Original error')), 100)
      )

      await expect(withTimeout(failingPromise, 1000))
        .rejects
        .toThrow('Original error')
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const successFn = vi.fn().mockResolvedValue('success')
      const result = await withRetry(successFn, 3)

      expect(result).toBe('success')
      expect(successFn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const retryFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')

      const result = await withRetry(retryFn, 3, 10) // Small delay for testing

      expect(result).toBe('success')
      expect(retryFn).toHaveBeenCalledTimes(3)
    })

    it('should not retry client errors (4xx)', async () => {
      const clientErrorFn = vi.fn().mockRejectedValue({ status: 400, message: 'Bad Request' })

      await expect(withRetry(clientErrorFn, 3))
        .rejects
        .toMatchObject({ status: 400 })

      expect(clientErrorFn).toHaveBeenCalledTimes(1)
    })

    it('should exhaust retries and throw last error', async () => {
      const alwaysFailFn = vi.fn().mockRejectedValue(new Error('Always fails'))

      await expect(withRetry(alwaysFailFn, 2, 10))
        .rejects
        .toThrow('Failed after 2 attempts')

      expect(alwaysFailFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('normalizeError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error')
      error.code = 'TEST_CODE'

      const normalized = normalizeError(error, 'Context')

      expect(normalized.message).toBe('Context: Test error')
      expect(normalized.code).toBe('TEST_CODE')
    })

    it('should handle string errors', () => {
      const normalized = normalizeError('String error', 'Context')

      expect(normalized.message).toBe('Context: String error')
      expect(normalized.code).toBe('INTERNAL_ERROR')
    })

    it('should handle network errors', () => {
      const networkError = { code: 'ECONNREFUSED', message: 'Connection refused' }
      const normalized = normalizeError(networkError)

      expect(normalized.code).toBe('NETWORK_ERROR')
      expect(normalized.status).toBe(503)
    })

    it('should handle Supabase/PostgreSQL errors', () => {
      const dbError = {
        message: 'Database error',
        details: 'Column does not exist',
        hint: 'Check your column name',
        code: '42703'
      }

      const normalized = normalizeError(dbError)

      expect(normalized.name).toBe('DatabaseError')
      expect(normalized.details).toBe('Column does not exist')
      expect(normalized.hint).toBe('Check your column name')
    })
  })

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear rate limit store
      const { rateLimitStore } = require('../../src/lib/async/withTimeout.js')
      rateLimitStore?.clear?.() || rateLimitStore.forEach?.((_, key) => rateLimitStore.delete(key))
    })

    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-key', 5, 60000)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should block requests after limit exceeded', () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-key', 5, 60000)
      }

      // 6th request should be blocked
      const result = checkRateLimit('test-key', 5, 60000)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })
  })
})

describe('Contract Signing API Integration', () => {
  let app

  beforeEach(async () => {
    // Import app for testing
    const serverModule = await import('../../api/server.js')
    app = serverModule.default
  })

  describe('POST /api/contract/sign', () => {
    it('should successfully sign contract in mock mode', async () => {
      const response = await request(app)
        .post('/api/contract/sign')
        .send(mockValidSignature)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.contractSignatureId).toMatch(/^cs_mock_/)
      expect(response.body.message).toContain('mock mode')
      expect(response.body.processingTime).toBeDefined()
      expect(response.body.metadata.bookingId).toBe(mockValidSignature.bookingId)
    })

    it('should reject missing required fields', async () => {
      const invalidRequest = { ...mockValidSignature }
      delete invalidRequest.bookingId

      const response = await request(app)
        .post('/api/contract/sign')
        .send(invalidRequest)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('MISSING_REQUIRED_FIELDS')
      expect(response.body.missing).toContain('bookingId')
    })

    it('should reject invalid signature format', async () => {
      const invalidSignature = {
        ...mockValidSignature,
        signaturePngBase64: 'data:image/jpeg;base64,invalidformat'
      }

      const response = await request(app)
        .post('/api/contract/sign')
        .send(invalidSignature)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('INVALID_SIGNATURE_FORMAT')
    })

    it('should reject signatures larger than 2MB', async () => {
      const response = await request(app)
        .post('/api/contract/sign')
        .send(mockLargeSignature)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('SIGNATURE_TOO_LARGE')
      expect(response.body.actualSize).toContain('KB')
    })

    it('should implement rate limiting', async () => {
      const promises = []

      // Make 6 concurrent requests (limit is 5 per minute)
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/contract/sign')
            .send({ ...mockValidSignature, bookingId: `booking_${i}` })
        )
      }

      const responses = await Promise.all(promises)

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)

      const rateLimited = rateLimitedResponses[0]
      expect(rateLimited.body.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(rateLimited.body.retryAfter).toBeDefined()
    })

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/contract/sign')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400)

      // Express should handle this and return appropriate error
    })

    it('should include audit logs', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await request(app)
        .post('/api/contract/sign')
        .send(mockValidSignature)
        .expect(200)

      // Should have audit log entries
      const auditLogs = consoleSpy.mock.calls.filter(call =>
        call[0] === '🔒 AUDIT:'
      )
      expect(auditLogs.length).toBeGreaterThan(0)

      consoleSpy.mockRestore()
    })
  })

  describe('GET /api/contract/status/:signatureId', () => {
    it('should return mock contract status', async () => {
      const mockSignatureId = 'cs_mock_123456789'

      const response = await request(app)
        .get(`/api/contract/status/${mockSignatureId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.signature.id).toBe(mockSignatureId)
      expect(response.body.signature.booking_id).toBeDefined()
      expect(response.body.message).toContain('mock mode')
    })

    it('should return 404 for non-existent signature', async () => {
      const response = await request(app)
        .get('/api/contract/status/nonexistent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.code).toBe('SIGNATURE_NOT_FOUND')
    })
  })

  describe('GET /api/health', () => {
    it('should include contract service status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body.services.contractSigning).toBeDefined()
      expect(response.body.contractService).toBeDefined()
    })
  })
})

describe('Error Handling Edge Cases', () => {
  it('should handle promise rejection in withTimeoutAndRetry', async () => {
    const alwaysFailFn = () => Promise.reject(new Error('Network failure'))

    await expect(withTimeoutAndRetry(alwaysFailFn, {
      timeout: 1000,
      retries: 2,
      retryDelay: 10
    })).rejects.toThrow('Failed after 2 attempts')
  })

  it('should handle timeout during retry attempts', async () => {
    const slowFn = () => new Promise(resolve => setTimeout(resolve, 2000))

    await expect(withTimeoutAndRetry(slowFn, {
      timeout: 100,
      retries: 2,
      retryDelay: 10
    })).rejects.toThrow('Operation timed out after 100ms')
  })
})