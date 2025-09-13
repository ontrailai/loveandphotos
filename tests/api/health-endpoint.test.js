/**
 * API tests for health check endpoint
 * Tests system status reporting and monitoring
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestServer, startTestServer, stopTestServer } from '../utils/testServer.js';

describe('Health Check API', () => {
  let app;
  let server;

  beforeAll(async () => {
    app = createTestServer();
    server = await startTestServer(app, 3002);
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('GET /api/health', () => {
    test('should return health status with 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        environment: 'test',
        services: expect.any(Object)
      });
    });

    test('should include timestamp in ISO format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    test('should report service status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.services).toMatchObject({
        supabase: 'mocked',
        stripe: 'mocked',
        email: 'mocked'
      });
    });

    test('should respond within reasonable time', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app).get('/api/health').expect(200)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
      });
    });
  });

  describe('Health Check Response Format', () => {
    test('should have consistent response structure', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');

      // Validate data types
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.environment).toBe('string');
      expect(typeof response.body.services).toBe('object');
    });

    test('should include Content-Type header', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should not include sensitive information', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Ensure no sensitive data in response
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toMatch(/password|secret|key|token/i);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      // Test with various malformed requests
      await request(app)
        .get('/api/health?malformed=<script>')
        .expect(200);

      await request(app)
        .get('/api/health')
        .set('User-Agent', '<script>alert("xss")</script>')
        .expect(200);
    });

    test('should handle different HTTP methods appropriately', async () => {
      // POST should return 404 (not found)
      await request(app)
        .post('/api/health')
        .expect(404);

      // PUT should return 404
      await request(app)
        .put('/api/health')
        .expect(404);

      // DELETE should return 404
      await request(app)
        .delete('/api/health')
        .expect(404);
    });
  });

  describe('Load Testing Scenarios', () => {
    test('should handle high load without degradation', async () => {
      const startTime = Date.now();
      const requests = Array(50).fill().map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });

      // Average response time should be reasonable
      const avgResponseTime = (endTime - startTime) / requests.length;
      expect(avgResponseTime).toBeLessThan(100); // < 100ms per request on average
    });

    test('should maintain consistency under load', async () => {
      const requests = Array(20).fill().map(() =>
        request(app).get('/api/health').then(res => res.body)
      );

      const responses = await Promise.all(requests);

      // All responses should have the same structure
      const firstResponse = responses[0];
      responses.forEach(response => {
        expect(Object.keys(response)).toEqual(Object.keys(firstResponse));
        expect(response.status).toBe('ok');
        expect(response.environment).toBe('test');
      });
    });
  });

  describe('Monitoring Integration', () => {
    test('should provide metrics suitable for monitoring', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should include status that monitoring can parse
      expect(['ok', 'degraded', 'down']).toContain(response.body.status);

      // Should include timestamp for monitoring
      const timestamp = new Date(response.body.timestamp);
      expect(Date.now() - timestamp.getTime()).toBeLessThan(5000); // Recent timestamp
    });

    test('should be suitable for health check probes', async () => {
      // Kubernetes/Docker health check requirements
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should respond quickly for probe timeout settings
      expect(response.body.status).toBe('ok');

      // Should not require authentication
      // (This test passes because no auth is required)
    });
  });
});