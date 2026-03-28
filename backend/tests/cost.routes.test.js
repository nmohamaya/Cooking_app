const request = require('supertest');
const express = require('express');

// Mock the costTracker service
jest.mock('../services/costTracker', () => ({
  getCostStats: jest.fn().mockResolvedValue({
    daily: 0,
    monthly: 0,
    total: 0,
    dateRange: { start: null, end: null }
  }),
  getCostLog: jest.fn().mockResolvedValue([]),
  getCostAlerts: jest.fn().mockResolvedValue({
    daily: { current: 0, limit: 50, exceeded: false, percentUsed: 0 },
    monthly: { current: 0, limit: 500, exceeded: false, percentUsed: 0 },
    total: 0
  })
}));

const costRouter = require('../routes/cost');
const { getCostStats, getCostLog, getCostAlerts } = require('../services/costTracker');

// Create test app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cost', costRouter);
  return app;
}

describe('Cost Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/cost/summary', () => {
    test('returns cost stats', async () => {
      const res = await request(app)
        .get('/api/cost/summary')
        .expect(200);

      expect(res.body).toHaveProperty('daily');
      expect(res.body).toHaveProperty('monthly');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('dateRange');
      expect(getCostStats).toHaveBeenCalledTimes(1);
    });

    test('returns stats with actual cost data', async () => {
      getCostStats.mockResolvedValueOnce({
        daily: 1.5,
        monthly: 25.0,
        total: 100.0,
        dateRange: {
          start: '2026-03-01T00:00:00.000Z',
          end: '2026-03-28T12:00:00.000Z'
        }
      });

      const res = await request(app)
        .get('/api/cost/summary')
        .expect(200);

      expect(res.body.daily).toBe(1.5);
      expect(res.body.monthly).toBe(25.0);
      expect(res.body.total).toBe(100.0);
    });

    test('returns 500 on service error', async () => {
      getCostStats.mockRejectedValueOnce(new Error('File read error'));

      const res = await request(app)
        .get('/api/cost/summary')
        .expect(500);

      expect(res.body.error).toBe('COST_SUMMARY_FAILED');
    });
  });

  describe('GET /api/cost/daily', () => {
    test('returns today\'s entries', async () => {
      getCostLog.mockResolvedValueOnce([
        { timestamp: new Date().toISOString(), type: 'transcription', cost: 0, status: 'success' },
        { timestamp: '2026-01-01T00:00:00.000Z', type: 'transcription', cost: 0, status: 'success' }
      ]);

      const res = await request(app)
        .get('/api/cost/daily')
        .expect(200);

      expect(res.body).toHaveProperty('date');
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('entries');
      // Only today's entry should be included
      expect(res.body.count).toBe(1);
    });

    test('returns empty array when no entries today', async () => {
      getCostLog.mockResolvedValueOnce([
        { timestamp: '2026-01-01T00:00:00.000Z', type: 'transcription', cost: 0, status: 'success' }
      ]);

      const res = await request(app)
        .get('/api/cost/daily')
        .expect(200);

      expect(res.body.count).toBe(0);
      expect(res.body.entries).toEqual([]);
    });

    test('respects limit query parameter', async () => {
      const res = await request(app)
        .get('/api/cost/daily?limit=50')
        .expect(200);

      expect(getCostLog).toHaveBeenCalledWith(50);
    });

    test('caps limit at 1000', async () => {
      await request(app)
        .get('/api/cost/daily?limit=5000')
        .expect(200);

      expect(getCostLog).toHaveBeenCalledWith(1000);
    });

    test('returns 500 on service error', async () => {
      getCostLog.mockRejectedValueOnce(new Error('Read error'));

      const res = await request(app)
        .get('/api/cost/daily')
        .expect(500);

      expect(res.body.error).toBe('COST_DAILY_FAILED');
    });
  });

  describe('GET /api/cost/alerts', () => {
    test('returns alert status for daily and monthly limits', async () => {
      const res = await request(app)
        .get('/api/cost/alerts')
        .expect(200);

      expect(res.body).toHaveProperty('daily');
      expect(res.body).toHaveProperty('monthly');
      expect(res.body).toHaveProperty('total');
      expect(res.body.daily).toHaveProperty('current');
      expect(res.body.daily).toHaveProperty('limit');
      expect(res.body.daily).toHaveProperty('exceeded');
      expect(res.body.daily).toHaveProperty('percentUsed');
      expect(getCostAlerts).toHaveBeenCalledTimes(1);
    });

    test('shows exceeded status when over limit', async () => {
      getCostAlerts.mockResolvedValueOnce({
        daily: { current: 75, limit: 50, exceeded: true, percentUsed: 150 },
        monthly: { current: 200, limit: 500, exceeded: false, percentUsed: 40 },
        total: 200
      });

      const res = await request(app)
        .get('/api/cost/alerts')
        .expect(200);

      expect(res.body.daily.exceeded).toBe(true);
      expect(res.body.monthly.exceeded).toBe(false);
    });

    test('returns 500 on service error', async () => {
      getCostAlerts.mockRejectedValueOnce(new Error('Alert error'));

      const res = await request(app)
        .get('/api/cost/alerts')
        .expect(500);

      expect(res.body.error).toBe('COST_ALERTS_FAILED');
    });
  });
});
