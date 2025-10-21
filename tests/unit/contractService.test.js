/**
 * Unit Tests for Contract Service
 * Tests the database query fixes and ownership verification
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { verifyBookingOwnership, storeContractSignature } from '../../src/lib/async/contractService.js'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  insert: vi.fn()
}

// Mock withTimeout function
vi.mock('../../src/lib/async/withTimeout.js', () => ({
  withTimeout: vi.fn((promise) => promise),
  normalizeError: vi.fn((error, message) => ({ message, ...error }))
}))

// Mock the Supabase client creation
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

describe('Contract Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Set up environment variables
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
    process.env.SUPABASE_URL = 'https://test.supabase.co'
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('verifyBookingOwnership', () => {
    it('should query with correct column names (title, base_price)', async () => {
      // Mock successful query response
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
          name: 'Gold Package', // This should be aliased from 'title'
          price: 299.99        // This should be aliased from 'base_price'
        }
      }

      // Set up the mock chain
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBookingData, error: null })
      }

      mockSupabaseClient.from.mockReturnValue(mockChain)

      // Test the function
      const result = await verifyBookingOwnership('booking-123', 'user-456')

      // Verify the query was built correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings')
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('title as name'))
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('base_price as price'))
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('venue_name'))
      expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('venue_address'))

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'booking-123')
      expect(mockChain.eq).toHaveBeenCalledWith('customer_id', 'user-456')

      expect(result).toEqual(mockBookingData)
    })

    it('should throw BOOKING_ACCESS_DENIED when no rows returned', async () => {
      // Mock PGRST116 error (no rows returned)
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows returned' }
        })
      }

      mockSupabaseClient.from.mockReturnValue(mockChain)

      await expect(verifyBookingOwnership('booking-123', 'wrong-user'))
        .rejects
        .toMatchObject({
          message: 'Booking not found or access denied',
          status: 403,
          code: 'BOOKING_ACCESS_DENIED'
        })
    })

    it('should throw CONTRACT_ALREADY_SIGNED when contract is already signed', async () => {
      const mockBookingData = {
        id: 'booking-123',
        customer_id: 'user-456',
        contract_signed: true // Already signed
      }

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBookingData, error: null })
      }

      mockSupabaseClient.from.mockReturnValue(mockChain)

      await expect(verifyBookingOwnership('booking-123', 'user-456'))
        .rejects
        .toMatchObject({
          message: 'Contract already signed for this booking',
          status: 409,
          code: 'CONTRACT_ALREADY_SIGNED'
        })
    })
  })

  describe('storeContractSignature', () => {
    it('should handle venue_name fallback for location field', async () => {
      const signatureData = {
        bookingId: 'booking-123',
        contractVersion: '1.0',
        contractHash: 'abc123',
        eventDate: '2024-06-15',
        venue_name: 'Test Venue', // Should be used as fallback for location
        packageName: 'Gold Package',
        price: 299.99,
        signerFullName: 'John Doe',
        signaturePngBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        signedAtISO: '2024-01-15T10:30:00Z'
      }

      const mockResponse = {
        id: 'signature-456',
        booking_id: 'booking-123',
        created_at: '2024-01-15T10:30:00Z'
      }

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResponse, error: null })
      }

      mockSupabaseClient.from.mockReturnValue(mockChain)

      // Mock the verification function that runs after storage
      vi.mock('../../src/lib/async/contractService.js', async (importOriginal) => {
        const actual = await importOriginal()
        return {
          ...actual,
          // This would normally be an internal function, but we need to mock it
          verifyContractSigningComplete: vi.fn().mockResolvedValue()
        }
      })

      const result = await storeContractSignature(signatureData, '127.0.0.1')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('contract_signatures')
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Test Venue', // Should use venue_name as fallback
          venue_name: 'Test Venue'
        })
      )
      expect(result).toBe('signature-456')
    })
  })
})

/**
 * Regression Test: Ensure the packages_1.name error doesn't reoccur
 */
describe('Regression: packages_1.name error', () => {
  it('should not reference packages_1.name in any query', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'test', customer_id: 'user', contract_signed: false },
        error: null
      })
    }

    mockSupabaseClient.from.mockReturnValue(mockChain)

    await verifyBookingOwnership('booking-123', 'user-456')

    // Verify that the select query uses the correct aliased column names
    const selectCall = mockChain.select.mock.calls[0][0]
    expect(selectCall).toContain('title as name')
    expect(selectCall).toContain('base_price as price')
    expect(selectCall).not.toContain('packages_1.name')
    expect(selectCall).not.toContain('packages.name')
    expect(selectCall).not.toContain('packages.price')
  })
})