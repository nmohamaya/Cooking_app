/**
 * Tests for Feature Flags Dashboard Route
 */

const request = require('supertest');
const app = require('../server');

describe('GET /api/v1/features', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete process.env.FEATURES_DASHBOARD;
  });

  it('should return feature flags in development', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/api/v1/features');
    expect(res.status).toBe(200);
    expect(res.body.environment).toBe('development');
    expect(res.body.flags).toBeDefined();
    expect(res.body.flags.parallelExtraction).toBeDefined();
    expect(res.body.flags.parallelExtraction).toHaveProperty('enabled');
    expect(res.body.flags.parallelExtraction).toHaveProperty('source');
    expect(res.body.flags.parallelExtraction).toHaveProperty('default');
  });

  it('should return 403 in production without FEATURES_DASHBOARD', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/api/v1/features');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('should allow access in production with FEATURES_DASHBOARD=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FEATURES_DASHBOARD = 'true';
    const res = await request(app).get('/api/v1/features');
    expect(res.status).toBe(200);
    expect(res.body.flags).toBeDefined();
  });

  it('should be accessible via backward-compatible path', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/api/features');
    expect(res.status).toBe(200);
    expect(res.body.flags).toBeDefined();
  });

  it('should list all known feature flags', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/api/v1/features');
    const flagNames = Object.keys(res.body.flags);
    expect(flagNames).toContain('parallelExtraction');
    expect(flagNames).toContain('completenessScoring');
    expect(flagNames).toContain('costTracking');
    expect(flagNames).toContain('apiVersioning');
  });
});
