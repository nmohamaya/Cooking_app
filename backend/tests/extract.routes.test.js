/**
 * Tests for Extract Route (/api/extract)
 */

const request = require('supertest');
const app = require('../server');

describe('Extract Route - /api/extract', () => {

  describe('POST /api/extract', () => {
    it('should reject missing URL', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('MISSING_URL');
    });

    it('should reject empty URL', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({ url: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('MISSING_URL');
    });

    it('should reject invalid URL', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({ url: 'https://example.com/not-a-video' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('INVALID_URL');
    });

    it('should accept valid YouTube URL and return jobId', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({ url: 'https://www.youtube.com/watch?v=test123' });

      expect(response.status).toBe(202);
      expect(response.body.jobId).toBeTruthy();
      expect(response.body.status).toBe('queued');
    });

    it('should accept valid TikTok URL', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({ url: 'https://www.tiktok.com/@user/video/123' });

      expect(response.status).toBe(202);
      expect(response.body.jobId).toBeTruthy();
    });
  });

  describe('GET /api/extract/:jobId', () => {
    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/extract/non-existent-job-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('JOB_NOT_FOUND');
    });

    it('should return job status after creation', async () => {
      // Create a job first
      const createResponse = await request(app)
        .post('/api/extract')
        .send({ url: 'https://www.youtube.com/watch?v=statustest' });

      const { jobId } = createResponse.body;

      // Check status immediately
      const statusResponse = await request(app)
        .get(`/api/extract/${jobId}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.jobId).toBe(jobId);
      expect(statusResponse.body.steps).toBeDefined();
      expect(Array.isArray(statusResponse.body.steps)).toBe(true);
    });
  });

  describe('DELETE /api/extract/:jobId', () => {
    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .delete('/api/extract/non-existent-id');

      expect(response.status).toBe(404);
    });

    it('should cancel a queued job', async () => {
      // Create a job
      const createResponse = await request(app)
        .post('/api/extract')
        .send({ url: 'https://www.youtube.com/watch?v=canceltest' });

      const { jobId } = createResponse.body;

      // Cancel it
      const deleteResponse = await request(app)
        .delete(`/api/extract/${jobId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.status).toBe('cancelled');
    });
  });
});
