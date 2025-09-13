/**
 * Mock Stripe client for testing
 * Simulates Stripe API responses
 */

import { jest } from '@jest/globals';

// Mock Stripe objects
export const mockStripeSession = {
  id: 'cs_test_mock_session_123',
  object: 'checkout.session',
  url: 'https://checkout.stripe.com/c/pay/mock_session_123',
  payment_status: 'paid',
  customer_email: 'test@example.com',
  metadata: {
    photographer_id: 'test-photographer-123',
    package_id: 'test-package-123',
    event_date: '2024-06-15'
  },
  amount_total: 79900, // $799.00 in cents
  currency: 'usd',
  created: Math.floor(Date.now() / 1000),
  expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
};

export const mockStripeCustomer = {
  id: 'cus_test_mock_123',
  object: 'customer',
  email: 'test@example.com',
  name: 'Test Customer',
  phone: '+1234567890',
  created: Math.floor(Date.now() / 1000)
};

export const mockStripeAccount = {
  id: 'acct_test_mock_123',
  object: 'account',
  country: 'US',
  email: 'photographer@example.com',
  type: 'express',
  capabilities: {
    card_payments: 'active',
    transfers: 'active'
  },
  charges_enabled: true,
  payouts_enabled: true
};

export const mockStripeAccountLink = {
  object: 'account_link',
  url: 'https://connect.stripe.com/setup/e/test_link_123',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  created: Math.floor(Date.now() / 1000)
};

export const mockStripePaymentIntent = {
  id: 'pi_test_mock_123',
  object: 'payment_intent',
  amount: 79900,
  currency: 'usd',
  status: 'succeeded',
  client_secret: 'pi_test_mock_123_secret_123',
  created: Math.floor(Date.now() / 1000)
};

// Mock Stripe client
export const createMockStripeClient = () => ({
  checkout: {
    sessions: {
      create: jest.fn().mockImplementation(async (params) => {
        const session = {
          ...mockStripeSession,
          id: `cs_test_mock_${Date.now()}`,
          url: `https://checkout.stripe.com/c/pay/mock_${Date.now()}`,
          customer_email: params.customer_email,
          metadata: params.metadata || {},
          line_items: params.line_items,
          success_url: params.success_url,
          cancel_url: params.cancel_url
        };

        // Simulate different scenarios based on email
        if (params.customer_email?.includes('fail')) {
          throw new Error('Mock Stripe error: Invalid customer email');
        }

        return session;
      }),

      retrieve: jest.fn().mockImplementation(async (sessionId) => {
        if (sessionId.includes('fail') || sessionId.includes('invalid')) {
          throw new Error('No such checkout session');
        }

        return {
          ...mockStripeSession,
          id: sessionId,
          payment_status: sessionId.includes('unpaid') ? 'unpaid' : 'paid'
        };
      }),

      list: jest.fn().mockImplementation(async (params = {}) => ({
        object: 'list',
        data: [mockStripeSession],
        has_more: false,
        url: '/v1/checkout/sessions'
      }))
    }
  },

  customers: {
    create: jest.fn().mockImplementation(async (params) => ({
      ...mockStripeCustomer,
      id: `cus_test_mock_${Date.now()}`,
      email: params.email,
      name: params.name,
      phone: params.phone
    })),

    retrieve: jest.fn().mockImplementation(async (customerId) => {
      if (customerId.includes('fail') || customerId.includes('invalid')) {
        throw new Error('No such customer');
      }
      return { ...mockStripeCustomer, id: customerId };
    }),

    update: jest.fn().mockImplementation(async (customerId, updates) => ({
      ...mockStripeCustomer,
      id: customerId,
      ...updates
    })),

    del: jest.fn().mockImplementation(async (customerId) => ({
      id: customerId,
      object: 'customer',
      deleted: true
    }))
  },

  accounts: {
    create: jest.fn().mockImplementation(async (params) => ({
      ...mockStripeAccount,
      id: `acct_test_mock_${Date.now()}`,
      email: params.email,
      country: params.country || 'US'
    })),

    retrieve: jest.fn().mockImplementation(async (accountId) => {
      if (accountId.includes('fail') || accountId.includes('invalid')) {
        throw new Error('No such account');
      }
      return { ...mockStripeAccount, id: accountId };
    }),

    update: jest.fn().mockImplementation(async (accountId, updates) => ({
      ...mockStripeAccount,
      id: accountId,
      ...updates
    }))
  },

  accountLinks: {
    create: jest.fn().mockImplementation(async (params) => ({
      ...mockStripeAccountLink,
      url: `https://connect.stripe.com/setup/e/test_${Date.now()}`
    }))
  },

  paymentIntents: {
    create: jest.fn().mockImplementation(async (params) => ({
      ...mockStripePaymentIntent,
      id: `pi_test_mock_${Date.now()}`,
      amount: params.amount,
      currency: params.currency || 'usd',
      metadata: params.metadata || {}
    })),

    retrieve: jest.fn().mockImplementation(async (paymentIntentId) => {
      if (paymentIntentId.includes('fail') || paymentIntentId.includes('invalid')) {
        throw new Error('No such payment intent');
      }
      return { ...mockStripePaymentIntent, id: paymentIntentId };
    }),

    confirm: jest.fn().mockImplementation(async (paymentIntentId, params = {}) => ({
      ...mockStripePaymentIntent,
      id: paymentIntentId,
      status: 'succeeded'
    }))
  },

  webhooks: {
    constructEvent: jest.fn().mockImplementation((payload, signature, secret) => {
      // Mock webhook event construction
      if (signature === 'invalid_signature') {
        throw new Error('Invalid signature');
      }

      return {
        id: `evt_test_mock_${Date.now()}`,
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: mockStripeSession
        },
        created: Math.floor(Date.now() / 1000)
      };
    })
  },

  // Mock rate limiting and errors
  _mockError: jest.fn().mockImplementation((type = 'card_error') => {
    const error = new Error('Mock Stripe error');
    error.type = type;
    error.code = 'card_declined';
    error.decline_code = 'generic_decline';
    return error;
  }),

  _resetMocks: jest.fn().mockImplementation(() => {
    // Reset all mock functions
    Object.values(mockStripeClient).forEach(service => {
      if (typeof service === 'object' && service !== null) {
        Object.values(service).forEach(method => {
          if (jest.isMockFunction(method)) {
            method.mockClear();
          }
        });
      }
    });
  })
});

// Create singleton mock instance
const mockStripeClient = createMockStripeClient();

export default mockStripeClient;