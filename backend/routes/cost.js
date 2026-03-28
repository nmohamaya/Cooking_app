/**
 * Cost Routes (Issue #172)
 *
 * Routes for cost tracking and monitoring:
 * - GET /api/cost/summary - Get cost summary (daily, monthly, total)
 * - GET /api/cost/daily - Get today's cost log entries
 * - GET /api/cost/alerts - Get cost limit alerts
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { getCostStats, getCostLog, getCostAlerts } = require('../services/costTracker');

/**
 * GET /api/cost/summary
 * Returns daily, monthly, and total cost stats
 */
router.get('/summary', async (req, res) => {
  try {
    const stats = await getCostStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get cost summary', { error: error.message });
    res.status(500).json({
      error: 'COST_SUMMARY_FAILED',
      message: 'Failed to retrieve cost summary',
      details: error.message
    });
  }
});

/**
 * GET /api/cost/daily
 * Returns today's cost log entries
 * Query params: limit (default 100, max 1000)
 */
router.get('/daily', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 1000);
    const log = await getCostLog(limit);

    // Filter to today's entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyEntries = log.filter(entry => new Date(entry.timestamp) >= today);

    res.json({
      date: today.toISOString().split('T')[0],
      count: dailyEntries.length,
      entries: dailyEntries
    });
  } catch (error) {
    logger.error('Failed to get daily costs', { error: error.message });
    res.status(500).json({
      error: 'COST_DAILY_FAILED',
      message: 'Failed to retrieve daily costs',
      details: error.message
    });
  }
});

/**
 * GET /api/cost/alerts
 * Returns cost limit comparisons and alert status
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await getCostAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Failed to get cost alerts', { error: error.message });
    res.status(500).json({
      error: 'COST_ALERTS_FAILED',
      message: 'Failed to retrieve cost alerts',
      details: error.message
    });
  }
});

module.exports = router;
