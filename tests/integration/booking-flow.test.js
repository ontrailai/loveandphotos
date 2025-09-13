/**
 * Integration tests for complete booking flow
 * Tests end-to-end user booking journey with all services
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestServer, startTestServer, stopTestServer, resetMocks } from '../utils/testServer.js';
import createMockSupabaseClient, { resetMockData, seedMockData } from '../mocks/supabase.js';
import mockEmailService from '../mocks/email.js';
import { testUsers, testPhotographers, testPackages, testScenarios } from '../fixtures/testData.js';

describe('Booking Flow Integration', () => {
  let app;
  let server;
  let supabase;

  beforeAll(async () => {
    app = createTestServer();
    server = await startTestServer(app, 3002);
    supabase = createMockSupabaseClient();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  beforeEach(() => {
    resetMocks();
    resetMockData();
    mockEmailService.resetSentEmails();

    // Seed test data
    seedMockData('users', Object.values(testUsers));
    seedMockData('photographers', Object.values(testPhotographers));
    seedMockData('packages', Object.values(testPackages));
  });

  describe('Complete Booking Journey', () => {
    test('should complete successful booking flow', async () => {
      const { user, photographer, package: pkg, eventDate, eventLocation } = testScenarios.newUserBooking;

      // Step 1: User initiates booking with checkout session
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: user.email,
          amount: pkg.price,
          eventDate,
          photographerId: photographer.id,
          packageId: pkg.id,
          successUrl: 'http://localhost:3002/booking/confirm?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: 'http://localhost:3002/browse'
        })
        .expect(200);

      expect(checkoutResponse.body.id).toBeTruthy();
      expect(checkoutResponse.body.url).toBeTruthy();

      const sessionId = checkoutResponse.body.id;

      // Step 2: Simulate payment completion and verification
      const paymentResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: sessionId })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);
      expect(paymentResponse.body.session.payment_status).toBe('paid');

      // Step 3: Verify confirmation email would be sent
      // In real implementation, this would be triggered by webhook
      const emailResponse = await request(app)
        .post('/api/send-email')
        .send({
          to: user.email,
          template: 'booking_confirmation',
          templateData: {
            customerName: user.name,
            eventDate,
            photographerName: photographer.business_name,
            packageName: pkg.name,
            amount: pkg.price,
            sessionId
          }
        })
        .expect(200);

      expect(emailResponse.body.success).toBe(true);

      // Step 4: Verify photographer notification would be sent
      const photographerEmailResponse = await request(app)
        .post('/api/send-email')
        .send({
          to: photographer.user_id, // Would resolve to photographer's email
          template: 'photographer_notification',
          templateData: {
            photographerName: photographer.business_name,
            customerName: user.name,
            eventDate,
            packageName: pkg.name,
            amount: pkg.price
          }
        })
        .expect(200);

      expect(photographerEmailResponse.body.success).toBe(true);

      // Verify emails were sent
      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(2);

      const confirmationEmail = sentEmails.find(e => e.template === 'booking_confirmation');
      const notificationEmail = sentEmails.find(e => e.template === 'photographer_notification');

      expect(confirmationEmail).toBeTruthy();
      expect(confirmationEmail.to).toContain(user.email);

      expect(notificationEmail).toBeTruthy();
      expect(notificationEmail.templateData.photographerName).toBe(photographer.business_name);
    });

    test('should handle budget booking flow', async () => {
      const { user, photographer, package: pkg, eventDate } = testScenarios.budgetBooking;

      // Create checkout session for budget package
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: user.email,
          amount: pkg.price,
          eventDate,
          photographerId: photographer.id,
          packageId: pkg.id
        })
        .expect(200);

      expect(checkoutResponse.body.id).toBeTruthy();

      // Verify payment
      const paymentResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: checkoutResponse.body.id })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // Send confirmation for budget booking
      const emailResponse = await request(app)
        .post('/api/send-email')
        .send({
          to: user.email,
          subject: `Booking Confirmed - ${pkg.name}`,
          html: `<p>Your ${pkg.name} booking is confirmed for ${eventDate}</p>`
        })
        .expect(200);

      expect(emailResponse.body.success).toBe(true);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].subject).toContain(pkg.name);
    });

    test('should handle luxury booking flow', async () => {
      const { user, photographer, package: pkg, eventDate } = testScenarios.luxuryBooking;

      // Create checkout session for luxury package
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: user.email,
          amount: pkg.price,
          eventDate,
          photographerId: photographer.id,
          packageId: pkg.id
        })
        .expect(200);

      expect(checkoutResponse.body.id).toBeTruthy();

      // Verify payment for high-value booking
      const paymentResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: checkoutResponse.body.id })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // Send luxury service confirmation
      const emailResponse = await request(app)
        .post('/api/send-email')
        .send({
          to: user.email,
          subject: 'Luxury Photography Experience Confirmed',
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h1>Thank you for choosing our luxury service!</h1>
              <p>Your ${pkg.name} is confirmed for ${eventDate}</p>
              <p>Investment: $${pkg.price.toLocaleString()}</p>
              <p>You will receive a welcome call within 24 hours.</p>
            </div>
          `
        })
        .expect(200);

      expect(emailResponse.body.success).toBe(true);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails[0].html).toContain('luxury service');
      expect(sentEmails[0].html).toContain(pkg.price.toLocaleString());
    });
  });

  describe('Error Handling in Flow', () => {
    test('should handle payment failures gracefully', async () => {
      // Create checkout session
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: 'test@example.com',
          amount: 1299,
          eventDate: '2024-06-15',
          photographerId: 'photographer-123',
          packageId: 'package-456'
        })
        .expect(200);

      // Try to verify failed payment session
      const sessionId = checkoutResponse.body.id.replace('_mock_', '_mock_unpaid_');
      const paymentResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: sessionId })
        .expect(200);

      expect(paymentResponse.body.success).toBe(false);
      expect(paymentResponse.body.session.payment_status).toBe('unpaid');

      // Should not send confirmation email for failed payment
      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(0);
    });

    test('should handle email delivery failures', async () => {
      // Successful payment
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: 'success@example.com',
          amount: 799,
          eventDate: '2024-07-01',
          photographerId: 'photographer-789',
          packageId: 'package-123'
        })
        .expect(200);

      const paymentResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: checkoutResponse.body.id })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // Try to send email to failing address
      const emailResponse = await request(app)
        .post('/api/send-email')
        .send({
          to: 'fail@example.com',
          subject: 'Booking Confirmation',
          html: '<p>Your booking is confirmed</p>'
        })
        .expect(500);

      expect(emailResponse.body.error).toBeTruthy();

      // Payment should still be valid despite email failure
      const reVerifyResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: checkoutResponse.body.id })
        .expect(200);

      expect(reVerifyResponse.body.success).toBe(true);
    });

    test('should handle concurrent booking attempts', async () => {
      const bookingData = {
        customerEmail: 'concurrent@example.com',
        amount: 1299,
        eventDate: '2024-08-15',
        photographerId: 'photographer-concurrent',
        packageId: 'package-concurrent'
      };

      // Multiple users trying to book same photographer simultaneously
      const concurrentRequests = Array(3).fill().map((_, i) =>
        request(app)
          .post('/api/create-checkout-session')
          .send({
            ...bookingData,
            customerEmail: `concurrent${i}@example.com`
          })
      );

      const responses = await Promise.all(concurrentRequests);

      // All checkout sessions should be created
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.id).toBeTruthy();
      });

      // Each should have unique session ID
      const sessionIds = responses.map(r => r.body.id);
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(sessionIds.length);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain booking data consistency across services', async () => {
      const bookingData = {
        customerEmail: 'consistency@example.com',
        amount: 1599,
        eventDate: '2024-09-20',
        photographerId: 'photographer-consistency-test',
        packageId: 'package-consistency-test'
      };

      // Create session
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send(bookingData)
        .expect(200);

      const sessionId = checkoutResponse.body.id;

      // Verify payment multiple times - should be consistent
      const verifyRequests = Array(3).fill().map(() =>
        request(app)
          .get('/api/verify-payment')
          .query({ session_id: sessionId })
          .expect(200)
      );

      const verifyResponses = await Promise.all(verifyRequests);

      verifyResponses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.session.id).toBe(sessionId);
        expect(response.body.session.payment_status).toBe('paid');
      });
    });

    test('should handle partial system failures', async () => {
      // Successful payment
      const checkoutResponse = await request(app)
        .post('/api/create-checkout-session')
        .send({
          customerEmail: 'partial@example.com',
          amount: 999,
          eventDate: '2024-10-10',
          photographerId: 'photographer-partial',
          packageId: 'package-partial'
        })
        .expect(200);

      const paymentResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: checkoutResponse.body.id })
        .expect(200);

      expect(paymentResponse.body.success).toBe(true);

      // One email succeeds
      await request(app)
        .post('/api/send-email')
        .send({
          to: 'success@example.com',
          subject: 'Success Email',
          html: '<p>Success</p>'
        })
        .expect(200);

      // One email fails
      await request(app)
        .post('/api/send-email')
        .send({
          to: 'fail@example.com',
          subject: 'Fail Email',
          html: '<p>Fail</p>'
        })
        .expect(500);

      // Payment should remain valid
      const finalVerifyResponse = await request(app)
        .get('/api/verify-payment')
        .query({ session_id: checkoutResponse.body.id })
        .expect(200);

      expect(finalVerifyResponse.body.success).toBe(true);

      // Only successful email should be sent
      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toContain('success@example.com');
    });
  });

  describe('Performance Under Load', () => {
    test('should handle multiple simultaneous bookings', async () => {
      const startTime = Date.now();

      const bookingRequests = Array(10).fill().map((_, i) =>
        request(app)
          .post('/api/create-checkout-session')
          .send({
            customerEmail: `load${i}@example.com`,
            amount: 799 + (i * 100),
            eventDate: '2024-11-15',
            photographerId: `photographer-load-${i}`,
            packageId: `package-load-${i}`
          })
      );

      const responses = await Promise.all(bookingRequests);
      const endTime = Date.now();

      // All should succeed
      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body.id).toBeTruthy();
      });

      // Should complete within reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // < 5 seconds for 10 bookings
    });

    test('should maintain performance with email notifications', async () => {
      // Create multiple bookings with email confirmations
      const bookings = Array(5).fill().map((_, i) => ({
        customerEmail: `perf${i}@example.com`,
        amount: 1299,
        eventDate: '2024-12-01',
        photographerId: `photographer-perf-${i}`,
        packageId: `package-perf-${i}`
      }));

      const startTime = Date.now();

      // Process all bookings with confirmations
      for (const booking of bookings) {
        // Create checkout session
        const checkoutResponse = await request(app)
          .post('/api/create-checkout-session')
          .send(booking)
          .expect(200);

        // Verify payment
        await request(app)
          .get('/api/verify-payment')
          .query({ session_id: checkoutResponse.body.id })
          .expect(200);

        // Send confirmation email
        await request(app)
          .post('/api/send-email')
          .send({
            to: booking.customerEmail,
            subject: 'Booking Confirmed',
            html: '<p>Your booking is confirmed</p>'
          })
          .expect(200);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(10000); // < 10 seconds for 5 complete flows

      // Verify all emails were sent
      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(5);
    });
  });
});