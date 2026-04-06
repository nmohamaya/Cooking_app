/**
 * Feature Flags Dashboard Route
 *
 * GET /api/v1/features — Returns all feature flags and their resolved values.
 * Useful for debugging which flags are active and whether they come from
 * env vars or defaults.
 *
 * Protected: only available in non-production environments, or when
 * FEATURES_DASHBOARD=true is explicitly set.
 */

const express = require('express');
const router = express.Router();
const features = require('../config/features');
const logger = require('../config/logger');

/**
 * GET /api/v1/features
 * Returns all feature flags with their current state and source.
 *
 * Response:
 * {
 *   environment: "development",
 *   flags: {
 *     parallelExtraction: { enabled: true, source: "default", default: true },
 *     ...
 *   }
 * }
 */
router.get('/', (req, res) => {
  const env = process.env.NODE_ENV || 'development';
  const dashboardEnabled = process.env.FEATURES_DASHBOARD === 'true';

  if (env === 'production' && !dashboardEnabled) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Feature flag dashboard is disabled in production. Set FEATURES_DASHBOARD=true to enable.',
    });
  }

  logger.debug('Feature flags dashboard accessed');

  res.json({
    environment: env,
    flags: features.getAll(),
  });
});

module.exports = router;
