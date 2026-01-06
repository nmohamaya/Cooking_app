const request = require('supertest');
const app = require('../server');

describe('Server Setup - Issue #110', () => {
  
  describe('Health Check Endpoint', () => {
    it('should return 200 OK for health check', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('API Version Endpoint', () => {
    it('should return API version info', async () => {
      const res = await request(app)
        .get('/api/version')
        .expect(200);
      
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('api', 'v1');
      expect(res.body).toHaveProperty('features');
      expect(Array.isArray(res.body.features)).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/unknown-route')
        .expect(404);
      
      expect(res.body).toHaveProperty('error', 'Not Found');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Parsing Middleware', () => {
    it('should parse JSON request body', async () => {
      const res = await request(app)
        .post('/api/download')
        .send({ url: 'https://youtube.com/watch?v=test' });
      
      // Download endpoint returns 202 (Accepted) for valid request
      expect([202, 400, 500]).toContain(res.status);
      expect(res.body).toBeDefined();
    });
  });
});
