/**
 * Unit tests for mock service implementations
 * Tests the reliability and consistency of mocked external services
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import createMockSupabaseClient, { resetMockData, seedMockData } from '../mocks/supabase.js';
import mockStripeClient from '../mocks/stripe.js';
import mockEmailService from '../mocks/email.js';
import { testUsers, testPhotographers, testPackages } from '../fixtures/testData.js';

describe('Mock Supabase Client', () => {
  let supabase;

  beforeEach(() => {
    resetMockData();
    supabase = createMockSupabaseClient();
  });

  describe('Database Operations', () => {
    test('should insert and retrieve records', async () => {
      const testUser = testUsers.validUser;

      // Insert user
      const insertResult = await supabase
        .from('users')
        .insert(testUser);

      expect(insertResult.data).toBeTruthy();
      expect(insertResult.error).toBeNull();

      // Retrieve user
      const selectResult = await supabase
        .from('users')
        .select('*')
        .eq('email', testUser.email);

      expect(selectResult.data).toBeTruthy();
      expect(selectResult.data.length).toBe(1);
      expect(selectResult.data[0].email).toBe(testUser.email);
    });

    test('should handle filtering operations', async () => {
      // Seed test data
      seedMockData('photographers', Object.values(testPhotographers));

      const result = await supabase
        .from('photographers')
        .select('*')
        .like('location', '%New York%');

      expect(result.data).toBeTruthy();
      expect(result.data.length).toBe(1);
      expect(result.data[0].location).toContain('New York');
    });

    test('should handle update operations', async () => {
      // Insert initial data
      const testUser = testUsers.validUser;
      await supabase.from('users').insert(testUser);

      // Update user
      const updateResult = await supabase
        .from('users')
        .update({ name: 'Updated Name' })
        .eq('id', testUser.id);

      expect(updateResult.data).toBeTruthy();
      expect(updateResult.error).toBeNull();

      // Verify update
      const selectResult = await supabase
        .from('users')
        .select('*')
        .eq('id', testUser.id);

      expect(selectResult.data[0].name).toBe('Updated Name');
    });

    test('should handle delete operations', async () => {
      // Insert test data
      const testUser = testUsers.validUser;
      await supabase.from('users').insert(testUser);

      // Delete user
      const deleteResult = await supabase
        .from('users')
        .delete()
        .eq('id', testUser.id);

      expect(deleteResult.data).toBeTruthy();
      expect(deleteResult.error).toBeNull();

      // Verify deletion
      const selectResult = await supabase
        .from('users')
        .select('*')
        .eq('id', testUser.id);

      expect(selectResult.data.length).toBe(0);
    });

    test('should handle complex queries with multiple conditions', async () => {
      seedMockData('packages', Object.values(testPackages));

      const result = await supabase
        .from('packages')
        .select('*')
        .gte('price', 1000)
        .eq('tier_id', 'silver');

      expect(result.data).toBeTruthy();
      expect(result.data.length).toBe(1);
      expect(result.data[0].price).toBeGreaterThanOrEqual(1000);
      expect(result.data[0].tier_id).toBe('silver');
    });

    test('should handle RPC function calls', async () => {
      const result = await supabase.rpc('search_photographers', {
        location: 'New York'
      });

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Auth Operations', () => {
    test('should handle auth state changes', () => {
      const callback = jest.fn();
      const subscription = supabase.auth.onAuthStateChange(callback);

      expect(subscription.data.subscription.unsubscribe).toBeDefined();
      expect(typeof subscription.data.subscription.unsubscribe).toBe('function');
    });

    test('should handle user signup', async () => {
      const result = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword'
      });

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
    });
  });

  describe('Storage Operations', () => {
    test('should handle file uploads', async () => {
      const bucket = supabase.storage.from('test-bucket');
      const result = await bucket.upload('test-file.jpg', new Blob());

      expect(result.data).toBeTruthy();
      expect(result.data.path).toBe('mock/path');
      expect(result.error).toBeNull();
    });

    test('should generate public URLs', () => {
      const bucket = supabase.storage.from('test-bucket');
      const result = bucket.getPublicUrl('test-file.jpg');

      expect(result.data.publicUrl).toBeTruthy();
      expect(result.data.publicUrl).toContain('mock-storage.com');
    });
  });
});

describe('Mock Stripe Client', () => {
  beforeEach(() => {
    if (mockStripeClient._resetMocks) {
      mockStripeClient._resetMocks();
    }
  });

  describe('Checkout Sessions', () => {
    test('should create checkout sessions', async () => {
      const sessionData = {
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'Test Product' },
            unit_amount: 2000
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer_email: 'test@example.com'
      };

      const session = await mockStripeClient.checkout.sessions.create(sessionData);

      expect(session.id).toBeTruthy();
      expect(session.id).toMatch(/^cs_test_mock_/);
      expect(session.url).toBeTruthy();
      expect(session.customer_email).toBe('test@example.com');
    });

    test('should retrieve checkout sessions', async () => {
      const session = await mockStripeClient.checkout.sessions.retrieve('cs_test_mock_123');

      expect(session.id).toBe('cs_test_mock_123');
      expect(session.payment_status).toBe('paid');
    });

    test('should handle session creation failures', async () => {
      await expect(
        mockStripeClient.checkout.sessions.create({
          customer_email: 'fail@example.com',
          line_items: []
        })
      ).rejects.toThrow('Mock Stripe error');
    });

    test('should handle session retrieval failures', async () => {
      await expect(
        mockStripeClient.checkout.sessions.retrieve('invalid_session')
      ).rejects.toThrow('No such checkout session');
    });
  });

  describe('Customer Operations', () => {
    test('should create customers', async () => {
      const customer = await mockStripeClient.customers.create({
        email: 'test@example.com',
        name: 'Test Customer'
      });

      expect(customer.id).toBeTruthy();
      expect(customer.id).toMatch(/^cus_test_mock_/);
      expect(customer.email).toBe('test@example.com');
      expect(customer.name).toBe('Test Customer');
    });

    test('should retrieve customers', async () => {
      const customer = await mockStripeClient.customers.retrieve('cus_test_mock_123');

      expect(customer.id).toBe('cus_test_mock_123');
      expect(customer.object).toBe('customer');
    });

    test('should update customers', async () => {
      const customer = await mockStripeClient.customers.update('cus_test_mock_123', {
        name: 'Updated Name'
      });

      expect(customer.id).toBe('cus_test_mock_123');
      expect(customer.name).toBe('Updated Name');
    });

    test('should delete customers', async () => {
      const result = await mockStripeClient.customers.del('cus_test_mock_123');

      expect(result.deleted).toBe(true);
      expect(result.id).toBe('cus_test_mock_123');
    });
  });

  describe('Connect Accounts', () => {
    test('should create connect accounts', async () => {
      const account = await mockStripeClient.accounts.create({
        type: 'express',
        country: 'US',
        email: 'photographer@example.com'
      });

      expect(account.id).toBeTruthy();
      expect(account.id).toMatch(/^acct_test_mock_/);
      expect(account.type).toBe('express');
      expect(account.email).toBe('photographer@example.com');
    });

    test('should create account links', async () => {
      const accountLink = await mockStripeClient.accountLinks.create({
        account: 'acct_test_mock_123',
        refresh_url: 'https://example.com/refresh',
        return_url: 'https://example.com/return',
        type: 'account_onboarding'
      });

      expect(accountLink.url).toBeTruthy();
      expect(accountLink.url).toContain('connect.stripe.com');
    });
  });

  describe('Webhooks', () => {
    test('should construct webhook events', () => {
      const event = mockStripeClient.webhooks.constructEvent(
        'payload',
        'valid_signature',
        'webhook_secret'
      );

      expect(event.id).toBeTruthy();
      expect(event.type).toBe('checkout.session.completed');
      expect(event.data.object).toBeTruthy();
    });

    test('should handle invalid signatures', () => {
      expect(() => {
        mockStripeClient.webhooks.constructEvent(
          'payload',
          'invalid_signature',
          'webhook_secret'
        );
      }).toThrow('Invalid signature');
    });
  });
});

describe('Mock Email Service', () => {
  beforeEach(() => {
    mockEmailService.resetSentEmails();
  });

  describe('Email Sending', () => {
    test('should send emails successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content'
      };

      const result = await mockEmailService.send(emailData);

      expect(result.id).toBeTruthy();
      expect(result.messageId).toBeTruthy();
      expect(result.status).toBe('sent');

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toContain('test@example.com');
    });

    test('should handle template rendering', () => {
      const rendered = mockEmailService.renderTemplate('booking_confirmation', {
        customerName: 'John Doe',
        eventDate: '2024-06-15'
      });

      expect(rendered.subject).toBeTruthy();
      expect(rendered.html).toBeTruthy();
      expect(rendered.text).toBeTruthy();
    });

    test('should validate email addresses', () => {
      expect(mockEmailService.validateEmail('test@example.com')).toEqual({
        valid: true,
        email: 'test@example.com',
        reason: null
      });

      expect(mockEmailService.validateEmail('invalid-email')).toEqual({
        valid: false,
        email: 'invalid-email',
        reason: 'Invalid email format'
      });
    });

    test('should handle email sending failures', async () => {
      await expect(
        mockEmailService.send({
          to: 'fail@example.com',
          subject: 'Test'
        })
      ).rejects.toThrow('Mock email delivery failure');
    });

    test('should handle bulk email sending', async () => {
      const emails = [
        { to: 'user1@example.com', subject: 'Test 1', html: 'Content 1' },
        { to: 'user2@example.com', subject: 'Test 2', html: 'Content 2' },
        { to: 'fail@example.com', subject: 'Test 3', html: 'Content 3' }
      ];

      const result = await mockEmailService.sendBulk(emails);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results.length).toBe(3);
    });
  });

  describe('Delivery Tracking', () => {
    test('should track delivery status', async () => {
      // Send an email first
      const result = await mockEmailService.send({
        to: 'test@example.com',
        subject: 'Test',
        html: 'Content'
      });

      const status = await mockEmailService.getDeliveryStatus(result.messageId);

      expect(status.messageId).toBe(result.messageId);
      expect(status.status).toBeTruthy();
      expect(status.events).toBeTruthy();
      expect(Array.isArray(status.events)).toBe(true);
    });

    test('should handle unknown message IDs', async () => {
      const status = await mockEmailService.getDeliveryStatus('unknown_id');
      expect(status.status).toBe('not_found');
    });
  });

  describe('Unsubscribe Handling', () => {
    test('should handle unsubscribe requests', async () => {
      const result = await mockEmailService.unsubscribe('test@example.com', 'marketing');

      expect(result.success).toBe(true);
      expect(result.email).toBe('test@example.com');
      expect(result.unsubscribedFrom).toBe('marketing');
    });
  });
});