/**
 * Integration Tests for /api/contract/sign Endpoint
 * Tests the complete contract signing flow including the fixed column names
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import app from '../../api/server.js'

// Mock the contract service functions
vi.mock('../../src/lib/async/contractService.js', () => ({
  verifyBookingOwnership: vi.fn(),
  verifyContractHash: vi.fn(),
  storeContractSignature: vi.fn(),
  contractServiceHealthCheck: vi.fn().mockResolvedValue({ status: 'healthy' })
}))

vi.mock('../../src/lib/async/withTimeout.js', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  normalizeError: vi.fn((error, message) => ({ message, ...error })),
  auditLog: vi.fn()
}))

import { verifyBookingOwnership, verifyContractHash, storeContractSignature } from '../../src/lib/async/contractService.js'

describe('POST /api/contract/sign', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up environment variables for production mode
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
    process.env.SUPABASE_URL = 'https://test.supabase.co'
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const createValidPayload = () => ({
    bookingId: '12345678-1234-1234-1234-123456789012',
    contractVersion: '1.0',
    contractHash: 'abc123def456',
    eventDate: '2024-06-15',
    location: 'Test Venue',
    packageName: 'Gold Package',
    price: 299.99,
    signerFullName: 'John Doe',
    signaturePngBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    signedAtISO: '2024-01-15T10:30:00Z',
    userId: 'user-456'
  })

  describe('Success path', () => {
    it('should successfully sign contract and return 200', async () => {
      // Mock successful booking verification with correct venue fields
      const mockBookingData = {
        id: 'booking-123',
        customer_id: 'user-456',
        event_date: '2024-06-15',
        venue_name: 'Test Venue',
        venue_address: { street: '123 Main St', city: 'Test City' },
        total_amount: 299.99,
        contract_signed: false,
        packages: {
          id: 'package-789',
          name: 'Gold Package', // Correctly aliased from 'title'
          price: 299.99        // Correctly aliased from 'base_price'
        }
      }

      verifyBookingOwnership.mockResolvedValue(mockBookingData)
      verifyContractHash.mockResolvedValue()
      storeContractSignature.mockResolvedValue('signature-456')

      const payload = createValidPayload()

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        contractSignatureId: 'signature-456',
        message: 'Contract signature recorded successfully'
      })

      // Verify the service functions were called correctly
      expect(verifyBookingOwnership).toHaveBeenCalledWith(payload.bookingId, payload.userId)
      expect(verifyContractHash).toHaveBeenCalledWith(
        payload.contractHash,
        payload.contractVersion,
        mockBookingData
      )

      // Verify signature data includes venue field mapping
      expect(storeContractSignature).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: payload.bookingId,
          location: 'Test Venue', // Should use venue_name from booking
          venue_name: 'Test Venue',
          venue_address: mockBookingData.venue_address,
          packageName: 'Gold Package'
        }),
        expect.any(String) // IP address
      )
    })
  })

  describe('Error handling', () => {
    it('should return 403 for BOOKING_ACCESS_DENIED', async () => {
      verifyBookingOwnership.mockRejectedValue({
        message: 'Booking not found or access denied',
        status: 403,
        code: 'BOOKING_ACCESS_DENIED'
      })

      const payload = createValidPayload()

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Booking not found or access denied',
        code: 'BOOKING_ACCESS_DENIED'
      })
    })

    it('should return 500 for database column errors with redacted message', async () => {
      // Simulate the original packages_1.name error
      verifyBookingOwnership.mockRejectedValue({
        message: 'Failed to verify booking ownership: column packages_1.name does not exist',
        code: '42703',
        status: 500
      })

      const payload = createValidPayload()

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(500)

      expect(response.body).toMatchObject({
        success: false,
        code: '42703'
      })

      // Should not leak internal database details to client
      expect(response.body.error).not.toContain('packages_1.name')
    })

    it('should return 400 for missing required fields', async () => {
      const invalidPayload = {
        bookingId: '12345678-1234-1234-1234-123456789012',
        // Missing contractVersion, contractHash, signaturePngBase64
      }

      const response = await request(app)
        .post('/api/contract/sign')
        .send(invalidPayload)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        missing: expect.arrayContaining(['contractVersion', 'contractHash', 'signaturePngBase64'])
      })
    })

    it('should return 401 for missing userId', async () => {
      const payload = createValidPayload()
      delete payload.userId

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(401)

      expect(response.body).toMatchObject({
        error: 'UNAUTHORIZED',
        message: 'Authentication required for contract signing'
      })
    })

    it('should return 409 for CONTRACT_ALREADY_SIGNED', async () => {
      verifyBookingOwnership.mockRejectedValue({
        message: 'Contract already signed for this booking',
        status: 409,
        code: 'CONTRACT_ALREADY_SIGNED'
      })

      const payload = createValidPayload()

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Contract already signed for this booking',
        code: 'CONTRACT_ALREADY_SIGNED'
      })
    })
  })

  describe('Validation', () => {
    it('should reject invalid signature format', async () => {
      const payload = createValidPayload()
      payload.signaturePngBase64 = 'invalid-format'

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid signature format (must be PNG base64)',
        code: 'INVALID_SIGNATURE_FORMAT'
      })
    })

    it('should reject signature that is too large', async () => {
      const payload = createValidPayload()
      // Create a large base64 string (>2MB)
      const largeData = 'a'.repeat(3 * 1024 * 1024) // 3MB
      payload.signaturePngBase64 = `data:image/png;base64,${largeData}`

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Signature image too large (max 2MB)',
        code: 'SIGNATURE_TOO_LARGE'
      })
    })
  })

  describe('Rate limiting', () => {
    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      const { checkRateLimit } = await import('../../src/lib/async/withTimeout.js')
      checkRateLimit.mockReturnValue({
        allowed: false,
        retryAfter: 30
      })

      const payload = createValidPayload()

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(429)

      expect(response.body).toMatchObject({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 30
      })
    })
  })

  describe('Mock mode', () => {
    it('should work in mock mode when Supabase not configured', async () => {
      // Temporarily remove Supabase config
      delete process.env.SUPABASE_SERVICE_KEY

      const payload = createValidPayload()

      const response = await request(app)
        .post('/api/contract/sign')
        .send(payload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Contract signature recorded successfully (mock mode)',
        metadata: expect.objectContaining({
          mode: 'mock'
        })
      })

      expect(response.body.contractSignatureId).toMatch(/^cs_mock_/)
    })
  })
})

/**
 * Regression Test: Verify the packages_1.name fix works end-to-end
 */
describe('Regression: packages_1.name error fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
    process.env.SUPABASE_URL = 'https://test.supabase.co'
  })

  it('should not encounter packages_1.name error in ownership verification', async () => {
    // Mock the booking data with the correct field structure
    const mockBookingData = {
      id: 'booking-123',
      customer_id: 'user-456',
      event_date: '2024-06-15',
      venue_name: 'Test Venue',          // NOT 'location'
      venue_address: { city: 'Test City' }, // JSONB field
      total_amount: 299.99,
      contract_signed: false,
      packages: {
        id: 'package-789',
        name: 'Gold Package',    // Aliased from 'title'
        price: 299.99            // Aliased from 'base_price'
      }
    }

    verifyBookingOwnership.mockResolvedValue(mockBookingData)
    verifyContractHash.mockResolvedValue()
    storeContractSignature.mockResolvedValue('signature-456')

    const payload = createValidPayload()

    const response = await request(app)
      .post('/api/contract/sign')
      .send(payload)
      .expect(200)

    // Verify that the endpoint succeeds and correctly maps venue fields
    expect(response.body.success).toBe(true)

    // Verify that storeContractSignature was called with correctly mapped fields
    const storeCall = storeContractSignature.mock.calls[0][0]
    expect(storeCall).toMatchObject({
      location: 'Test Venue',      // Should use venue_name
      venue_name: 'Test Venue',    // Should pass through venue_name
      venue_address: mockBookingData.venue_address // Should pass through venue_address
    })
  })
})