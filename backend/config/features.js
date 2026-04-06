/**
 * Feature Flags
 *
 * Simple feature flag system for enabling/disabling features per environment.
 * Agents can merge incomplete features behind flags without blocking each other.
 *
 * Usage:
 *   const features = require('./config/features');
 *   if (features.isEnabled('parallelExtraction')) { ... }
 *
 * Configuration:
 *   Set FEATURE_<FLAG_NAME>=true|false in .env to override defaults.
 *   e.g., FEATURE_PARALLEL_EXTRACTION=false
 */

const logger = require('./logger');

// Default feature flags — override via FEATURE_<NAME> env vars
const DEFAULTS = {
  // Extraction pipeline
  parallelExtraction: true,       // Run Phase 1 sources in parallel (vs sequential)
  completenessScoring: true,      // Score recipes on 0-12 scale (vs binary isValidRecipe)
  linkScraping: true,             // Scrape linked URLs from description
  headingBasedParsing: true,      // Use heading-based HTML parsing strategy

  // Future phases (disabled until implemented)
  videoFrameAnalysis: false,      // Phase 2: analyze video frames for recipe text
  audioTranscription: false,      // Phase 3: full audio transcription via AI

  // Cost tracking
  costTracking: true,             // Track AI API usage costs
  costAlerts: true,               // Send alerts when cost threshold exceeded

  // API
  apiVersioning: true,            // Serve routes under /api/v1/
};

/**
 * Convert a camelCase flag name to SCREAMING_SNAKE_CASE env var name
 * e.g., parallelExtraction → FEATURE_PARALLEL_EXTRACTION
 */
function toEnvVar(flagName) {
  return 'FEATURE_' + flagName.replace(/([A-Z])/g, '_$1').toUpperCase();
}

/**
 * Get the resolved value of a feature flag.
 * Environment variable overrides take precedence over defaults.
 *
 * @param {string} flagName - camelCase flag name
 * @returns {boolean}
 */
function isEnabled(flagName) {
  if (!(flagName in DEFAULTS)) {
    logger.warn('Unknown feature flag queried', { flagName });
    return false;
  }

  const envVar = toEnvVar(flagName);
  const envValue = process.env[envVar];

  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }

  return DEFAULTS[flagName];
}

/**
 * Get all feature flags and their resolved values.
 * Useful for health check / debugging endpoints.
 *
 * @returns {object} Map of flagName → { enabled, source }
 */
function getAll() {
  const result = {};
  for (const [flag, defaultValue] of Object.entries(DEFAULTS)) {
    const envVar = toEnvVar(flag);
    const envValue = process.env[envVar];
    result[flag] = {
      enabled: isEnabled(flag),
      source: envValue !== undefined ? `env:${envVar}` : 'default',
      default: defaultValue,
    };
  }
  return result;
}

module.exports = {
  isEnabled,
  getAll,
  DEFAULTS,
};
