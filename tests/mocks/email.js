/**
 * Mock email service for testing
 * Simulates Resend API and other email providers
 */

import { jest } from '@jest/globals';

// Store sent emails for testing
let sentEmails = [];

// Mock email templates
export const mockEmailTemplates = {
  booking_confirmation: {
    subject: 'Booking Confirmation - Love & Photos',
    template: 'Your booking has been confirmed!'
  },
  photographer_notification: {
    subject: 'New Booking Received - Love & Photos',
    template: 'You have received a new booking request!'
  },
  payment_receipt: {
    subject: 'Payment Receipt - Love & Photos',
    template: 'Thank you for your payment!'
  },
  welcome: {
    subject: 'Welcome to Love & Photos!',
    template: 'Welcome to our photography marketplace!'
  }
};

// Mock email service
export const createMockEmailService = () => ({
  // Reset sent emails (for testing)
  resetSentEmails: () => {
    sentEmails = [];
  },

  // Get sent emails (for testing)
  getSentEmails: () => [...sentEmails],

  // Mock send function
  send: jest.fn().mockImplementation(async (emailData) => {
    const {
      to,
      from = 'noreply@lovep.app',
      subject,
      html,
      text,
      template,
      templateData = {}
    } = emailData;

    // Validate required fields
    if (!to) {
      throw new Error('Recipient email is required');
    }
    if (!subject && !template) {
      throw new Error('Subject or template is required');
    }

    // Simulate email sending failures
    if (to.includes('fail@')) {
      throw new Error('Mock email delivery failure');
    }
    if (to.includes('invalid@')) {
      throw new Error('Invalid email address');
    }

    // Create email record
    const emailRecord = {
      id: `email_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to: Array.isArray(to) ? to : [to],
      from,
      subject: subject || mockEmailTemplates[template]?.subject || 'Test Subject',
      html: html || mockEmailTemplates[template]?.template || 'Test content',
      text: text || 'Test text content',
      template,
      templateData,
      status: 'sent',
      sentAt: new Date().toISOString(),
      metadata: {
        provider: 'mock',
        messageId: `mock_${Date.now()}`,
        timestamp: Date.now()
      }
    };

    // Store the sent email
    sentEmails.push(emailRecord);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 10));

    return {
      id: emailRecord.id,
      messageId: emailRecord.metadata.messageId,
      status: 'sent',
      sentAt: emailRecord.sentAt
    };
  }),

  // Mock bulk send function
  sendBulk: jest.fn().mockImplementation(async (emails) => {
    const results = [];

    for (const emailData of emails) {
      try {
        const result = await mockEmailService.send(emailData);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          email: emailData.to
        });
      }
    }

    return {
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }),

  // Mock template rendering
  renderTemplate: jest.fn().mockImplementation((templateName, data = {}) => {
    const template = mockEmailTemplates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Simple template variable replacement
    let renderedSubject = template.subject;
    let renderedContent = template.template;

    Object.keys(data).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      renderedSubject = renderedSubject.replace(placeholder, data[key] || '');
      renderedContent = renderedContent.replace(placeholder, data[key] || '');
    });

    return {
      subject: renderedSubject,
      html: renderedContent,
      text: renderedContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
  }),

  // Mock email validation
  validateEmail: jest.fn().mockImplementation((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: emailRegex.test(email) && !email.includes('invalid'),
      email: email.toLowerCase(),
      reason: emailRegex.test(email) ? null : 'Invalid email format'
    };
  }),

  // Mock unsubscribe handling
  unsubscribe: jest.fn().mockImplementation(async (email, type = 'all') => {
    return {
      success: true,
      email,
      unsubscribedFrom: type,
      timestamp: new Date().toISOString()
    };
  }),

  // Mock bounce/complaint handling
  handleBounce: jest.fn().mockImplementation(async (email, bounceType = 'hard') => {
    return {
      email,
      bounceType,
      handled: true,
      timestamp: new Date().toISOString()
    };
  }),

  // Mock delivery status tracking
  getDeliveryStatus: jest.fn().mockImplementation(async (messageId) => {
    const email = sentEmails.find(e => e.metadata.messageId === messageId);

    if (!email) {
      return { status: 'not_found' };
    }

    // Simulate different delivery statuses
    const statuses = ['delivered', 'opened', 'clicked', 'bounced'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      messageId,
      status: randomStatus,
      deliveredAt: email.sentAt,
      lastEvent: randomStatus,
      events: [
        {
          event: 'sent',
          timestamp: email.sentAt
        },
        {
          event: randomStatus,
          timestamp: new Date().toISOString()
        }
      ]
    };
  })
});

// Create singleton mock instance
const mockEmailService = createMockEmailService();

// Mock fetch for Resend API
export const mockResendAPI = jest.fn().mockImplementation(async (url, options) => {
  const { method, headers, body } = options;

  if (method === 'POST' && url.includes('/emails')) {
    const emailData = JSON.parse(body);

    // Simulate API response
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: `re_mock_${Date.now()}`,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        created_at: new Date().toISOString()
      })
    };
  }

  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' })
  };
});

export default mockEmailService;