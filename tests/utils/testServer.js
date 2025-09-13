/**
 * Test server utility for API testing
 * Creates isolated Express server instances for testing
 */

import express from 'express';
import cors from 'cors';
import { jest } from '@jest/globals';

// Import mock services
import createMockSupabaseClient from '../mocks/supabase.js';
import mockStripeClient from '../mocks/stripe.js';
import mockEmailService from '../mocks/email.js';

let testServerInstance = null;

/**
 * Create a test server with mocked dependencies
 */
export const createTestServer = (options = {}) => {
  const {
    mockServices = true,
    customRoutes = [],
    middleware = [],
    port = globalThis.TEST_PORT || 3002
  } = options;

  const app = express();

  // Basic middleware
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add custom middleware
  middleware.forEach(mw => app.use(mw));

  // Mock service injection
  if (mockServices) {
    app.locals.supabase = createMockSupabaseClient();
    app.locals.stripe = mockStripeClient;
    app.locals.emailService = mockEmailService;
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
      services: {
        supabase: 'mocked',
        stripe: 'mocked',
        email: 'mocked'
      }
    });
  });

  // Mock Stripe Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const {
        customerEmail,
        amount,
        eventDate,
        photographerId,
        packageId,
        successUrl,
        cancelUrl
      } = req.body;

      // Validation
      if (!customerEmail || !amount) {
        return res.status(400).json({
          error: 'Missing required fields: customerEmail, amount'
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          error: 'Amount must be greater than 0'
        });
      }

      const session = await app.locals.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Photography Service',
              description: `Event date: ${eventDate}`
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: successUrl || 'http://localhost:3002/booking/confirm?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: cancelUrl || 'http://localhost:3002/browse',
        customer_email: customerEmail,
        metadata: {
          photographerId: photographerId || '',
          packageId: packageId || '',
          eventDate: eventDate || ''
        }
      });

      res.json({
        id: session.id,
        url: session.url
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify payment session
  app.get('/api/verify-payment', async (req, res) => {
    try {
      const { session_id } = req.query;

      if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const session = await app.locals.stripe.checkout.sessions.retrieve(session_id);

      res.json({
        success: session.payment_status === 'paid',
        session: {
          id: session.id,
          payment_status: session.payment_status,
          metadata: session.metadata
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mock email sending
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, html, text, template, templateData } = req.body;

      const result = await app.locals.emailService.send({
        to,
        subject,
        html,
        text,
        template,
        templateData
      });

      res.json({
        success: true,
        id: result.id,
        messageId: result.messageId
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mock file upload
  app.post('/api/upload', (req, res) => {
    const { filename, contentType } = req.body;

    res.json({
      success: true,
      url: `https://mock-storage.com/${filename || 'test-file.jpg'}`,
      path: `uploads/${filename || 'test-file.jpg'}`,
      contentType: contentType || 'image/jpeg'
    });
  });

  // Mock Stripe Connect onboarding
  app.post('/api/create-connect-onboarding', async (req, res) => {
    try {
      const { accountId, refreshUrl, returnUrl } = req.body;

      const accountLink = await app.locals.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl || 'http://localhost:3002/photographer/onboarding?refresh=true',
        return_url: returnUrl || 'http://localhost:3002/photographer/onboarding?step=complete',
        type: 'account_onboarding'
      });

      res.json({
        url: accountLink.url
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook endpoint
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const event = app.locals.stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'test_webhook_secret'
      );

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          // Handle successful payment
          break;
        case 'account.updated':
          // Handle Connect account updates
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Add custom routes
  customRoutes.forEach(route => {
    app.use(route.path || '/', route.handler);
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Test server error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'test' && { stack: err.stack })
    });
  });

  return app;
};

/**
 * Start test server
 */
export const startTestServer = async (app, port = globalThis.TEST_PORT) => {
  return new Promise((resolve, reject) => {
    testServerInstance = app.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(testServerInstance);
      }
    });
  });
};

/**
 * Stop test server
 */
export const stopTestServer = async () => {
  if (testServerInstance) {
    return new Promise((resolve) => {
      testServerInstance.close(() => {
        testServerInstance = null;
        resolve();
      });
    });
  }
};

/**
 * Get test server URL
 */
export const getTestServerURL = (port = globalThis.TEST_PORT) => {
  return `http://localhost:${port}`;
};

/**
 * Reset all mocks
 */
export const resetMocks = () => {
  if (jest.isMockFunction(mockStripeClient._resetMocks)) {
    mockStripeClient._resetMocks();
  }
  mockEmailService.resetSentEmails();
};