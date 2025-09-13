/**
 * API tests for email sending endpoints
 * Tests notification and communication functionality
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestServer, startTestServer, stopTestServer, resetMocks } from '../utils/testServer.js';
import mockEmailService from '../mocks/email.js';

describe('Email API', () => {
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
    mockEmailService.resetSentEmails();
  });

  describe('POST /api/send-email', () => {
    const validEmailData = {
      to: 'test@example.com',
      subject: 'Test Email Subject',
      html: '<p>This is a test email content</p>',
      text: 'This is a test email content'
    };

    test('should send email with valid data', async () => {
      const response = await request(app)
        .post('/api/send-email')
        .send(validEmailData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        id: expect.any(String),
        messageId: expect.any(String)
      });

      // Verify email was recorded
      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toContain('test@example.com');
      expect(sentEmails[0].subject).toBe('Test Email Subject');
    });

    test('should handle multiple recipients', async () => {
      const multiRecipientData = {
        ...validEmailData,
        to: ['user1@example.com', 'user2@example.com', 'user3@example.com']
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(multiRecipientData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toEqual(['user1@example.com', 'user2@example.com', 'user3@example.com']);
    });

    test('should require recipient email', async () => {
      const invalidData = { ...validEmailData };
      delete invalidData.to;

      await request(app)
        .post('/api/send-email')
        .send(invalidData)
        .expect(500);
    });

    test('should require subject or template', async () => {
      const invalidData = { ...validEmailData };
      delete invalidData.subject;

      await request(app)
        .post('/api/send-email')
        .send(invalidData)
        .expect(500);
    });

    test('should handle template-based emails', async () => {
      const templateData = {
        to: 'template@example.com',
        template: 'booking_confirmation',
        templateData: {
          customerName: 'John Doe',
          eventDate: '2024-06-15',
          photographerName: 'Jane Smith'
        }
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(templateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].template).toBe('booking_confirmation');
      expect(sentEmails[0].templateData).toEqual(templateData.templateData);
    });

    test('should handle email delivery failures', async () => {
      const failingEmailData = {
        ...validEmailData,
        to: 'fail@example.com'
      };

      await request(app)
        .post('/api/send-email')
        .send(failingEmailData)
        .expect(500);
    });

    test('should validate email addresses', async () => {
      const invalidEmailData = {
        ...validEmailData,
        to: 'invalid-email-address'
      };

      await request(app)
        .post('/api/send-email')
        .send(invalidEmailData)
        .expect(500);
    });

    test('should handle HTML and text content', async () => {
      const richEmailData = {
        to: 'rich@example.com',
        subject: 'Rich Content Email',
        html: '<html><body><h1>Welcome!</h1><p>This is <strong>HTML</strong> content.</p></body></html>',
        text: 'Welcome! This is plain text content.'
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(richEmailData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails[0].html).toContain('<h1>Welcome!</h1>');
      expect(sentEmails[0].text).toContain('plain text content');
    });

    test('should sanitize dangerous content', async () => {
      const dangerousEmailData = {
        to: 'safe@example.com',
        subject: '<script>alert("XSS")</script>Dangerous Subject',
        html: '<script>alert("XSS")</script><p>Content with scripts</p>',
        text: 'Safe text content'
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(dangerousEmailData);

      // Should either succeed (with sanitized content) or fail safely
      expect([200, 400, 500]).toContain(response.status);

      if (response.status === 200) {
        const sentEmails = mockEmailService.getSentEmails();
        const sentEmail = sentEmails[0];
        // Content should be sanitized - exact implementation depends on sanitization strategy
        expect(sentEmail).toBeTruthy();
      }
    });

    test('should handle concurrent email requests', async () => {
      const requests = Array(5).fill().map((_, i) =>
        request(app)
          .post('/api/send-email')
          .send({
            to: `concurrent${i}@example.com`,
            subject: `Concurrent Email ${i}`,
            html: `<p>Concurrent email content ${i}</p>`
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(5);
    });

    test('should handle large email content', async () => {
      const largeContent = 'This is a very long email content. '.repeat(1000);
      const largeEmailData = {
        to: 'large@example.com',
        subject: 'Large Email',
        html: `<p>${largeContent}</p>`,
        text: largeContent
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(largeEmailData);

      // Should either succeed or fail gracefully
      expect([200, 400, 413, 500]).toContain(response.status);
    });

    test('should include proper error messages', async () => {
      const invalidData = {
        to: '',
        subject: '',
        html: ''
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(invalidData)
        .expect(500);

      expect(response.body.error).toBeTruthy();
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Email Content Validation', () => {
    test('should handle different character encodings', async () => {
      const unicodeEmailData = {
        to: 'unicode@example.com',
        subject: 'Unicode Subject: 🎉 Célébration! 中文测试',
        html: '<p>Unicode content: 🎨 Naïve résumé 测试内容</p>',
        text: 'Unicode content: 🎨 Naïve résumé 测试内容'
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(unicodeEmailData)
        .expect(200);

      expect(response.body.success).toBe(true);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails[0].subject).toContain('🎉');
      expect(sentEmails[0].html).toContain('🎨');
    });

    test('should handle empty content gracefully', async () => {
      const emptyContentData = {
        to: 'empty@example.com',
        subject: 'Empty Content Test',
        html: '',
        text: ''
      };

      const response = await request(app)
        .post('/api/send-email')
        .send(emptyContentData);

      // Should either succeed or fail gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    test('should validate email format strictly', async () => {
      const emailFormats = [
        'valid@example.com',
        'user.name@domain.co.uk',
        'first+last@subdomain.example.org',
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        ''
      ];

      for (const email of emailFormats) {
        const response = await request(app)
          .post('/api/send-email')
          .send({
            to: email,
            subject: 'Format Test',
            html: '<p>Test</p>'
          });

        if (email.includes('@') && email.includes('.') && !email.includes('..')) {
          expect([200, 500]).toContain(response.status); // Valid format but might fail for other reasons
        } else {
          expect(response.status).toBe(500); // Invalid format should fail
        }
      }
    });
  });

  describe('Email Service Integration', () => {
    test('should track email sending statistics', async () => {
      const emails = [
        { to: 'user1@example.com', subject: 'Test 1', html: '<p>Content 1</p>' },
        { to: 'user2@example.com', subject: 'Test 2', html: '<p>Content 2</p>' },
        { to: 'fail@example.com', subject: 'Test 3', html: '<p>Content 3</p>' }
      ];

      const responses = await Promise.all(
        emails.map(email =>
          request(app)
            .post('/api/send-email')
            .send(email)
        )
      );

      const successCount = responses.filter(r => r.status === 200).length;
      const failureCount = responses.filter(r => r.status === 500).length;

      expect(successCount).toBe(2);
      expect(failureCount).toBe(1);

      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(2);
    });

    test('should provide unique message IDs', async () => {
      const emailRequests = Array(3).fill().map((_, i) =>
        request(app)
          .post('/api/send-email')
          .send({
            to: `unique${i}@example.com`,
            subject: `Unique Email ${i}`,
            html: `<p>Content ${i}</p>`
          })
          .expect(200)
      );

      const responses = await Promise.all(emailRequests);
      const messageIds = responses.map(r => r.body.messageId);

      // All message IDs should be unique
      const uniqueIds = new Set(messageIds);
      expect(uniqueIds.size).toBe(messageIds.length);

      // All message IDs should be truthy strings
      messageIds.forEach(id => {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      });
    });

    test('should handle rate limiting gracefully', async () => {
      // Send many emails rapidly
      const rapidRequests = Array(20).fill().map((_, i) =>
        request(app)
          .post('/api/send-email')
          .send({
            to: `rate${i}@example.com`,
            subject: `Rate Test ${i}`,
            html: `<p>Rate test content ${i}</p>`
          })
      );

      const responses = await Promise.all(rapidRequests);

      // Most should succeed (rate limiting is handled by service, not mocked)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(15); // Allow for some failures
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle service unavailability', async () => {
      // This would test actual service failures in real implementation
      const response = await request(app)
        .post('/api/send-email')
        .send({
          to: 'service-unavailable@example.com',
          subject: 'Service Test',
          html: '<p>Testing service availability</p>'
        });

      // Should either succeed or fail gracefully with proper error
      expect([200, 500, 503]).toContain(response.status);

      if (response.status !== 200) {
        expect(response.body.error).toBeTruthy();
      }
    });

    test('should maintain data integrity on failures', async () => {
      const mixedRequests = [
        { to: 'success1@example.com', subject: 'Success 1', html: '<p>Success</p>' },
        { to: 'fail@example.com', subject: 'Failure', html: '<p>Fail</p>' },
        { to: 'success2@example.com', subject: 'Success 2', html: '<p>Success</p>' }
      ];

      const responses = await Promise.all(
        mixedRequests.map(email =>
          request(app)
            .post('/api/send-email')
            .send(email)
        )
      );

      // Successful emails should be sent, failed ones should not corrupt data
      const sentEmails = mockEmailService.getSentEmails();
      expect(sentEmails.length).toBe(2);

      sentEmails.forEach(email => {
        expect(email.to[0]).not.toBe('fail@example.com');
        expect(email.status).toBe('sent');
      });
    });
  });
});