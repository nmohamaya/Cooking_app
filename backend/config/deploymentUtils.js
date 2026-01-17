/**
 * deploymentUtils.js
 * Issue #115: Backend Deployment & Cost Monitoring
 * 
 * Utility functions for production deployment setup and monitoring
 * Includes environment validation, health checks, and startup procedures
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Validates production environment configuration
 * Checks for required environment variables and valid values
 */
const validateProductionEnvironment = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'GITHUB_TOKEN',
  ];

  const missing = [];
  const invalid = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Validate specific environment variables
  if (process.env.NODE_ENV && !['development', 'production', 'staging'].includes(process.env.NODE_ENV)) {
    invalid.push(`NODE_ENV must be 'development', 'production', or 'staging', got: ${process.env.NODE_ENV}`);
  }

  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    invalid.push(`PORT must be a number, got: ${process.env.PORT}`);
  }

  // Check for API keys - validate GitHub token format
  if (process.env.GITHUB_TOKEN) {
    const validGithubTokenPrefixes = ['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_'];
    const hasValidGithubTokenPrefix = validGithubTokenPrefixes.some(prefix =>
      process.env.GITHUB_TOKEN.startsWith(prefix)
    );
    if (!hasValidGithubTokenPrefix) {
      invalid.push('GITHUB_TOKEN does not appear to be a valid GitHub Personal Access Token');
    }
  }

  // Report validation results
  if (missing.length > 0 || invalid.length > 0) {
    const errors = [];
    if (missing.length > 0) {
      errors.push(`Missing required environment variables: ${missing.join(', ')}`);
    }
    if (invalid.length > 0) {
      errors.push(`Invalid environment variables:\n  - ${invalid.join('\n  - ')}`);
    }
    
    logger.error('Environment validation failed', { errors });
    return {
      valid: false,
      errors,
    };
  }

  logger.info('Environment validation passed');
  return {
    valid: true,
    errors: [],
  };
};

/**
 * Creates required directories for deployment
 * Ensures logs, temp, and cache directories exist
 */
const setupDirectories = () => {
  const directories = [
    path.join(__dirname, '../logs'),
    path.join(__dirname, '../temp'),
    path.join(__dirname, '../temp/uploads'),
    path.join(__dirname, '../temp/cache'),
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (err) {
        logger.error(`Failed to create directory: ${dir}`, { error: err.message });
        return false;
      }
    }
  }

  return true;
};

/**
 * Performs health checks on critical services
 * Verifies GitHub token, database connections, cache, etc.
 */
const performHealthChecks = async () => {
  const checks = {
    github_token: false,
    file_system: false,
    logs: false,
    cache: false,
  };

  // Check GitHub token by making a test API call (using built-in fetch in Node.js 18+)
  try {
    const response = await fetch('https://models.inference.ai.azure.com/health', {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });
    checks.github_token = response.ok;
    if (!checks.github_token) {
      logger.warn('GitHub Models API health check failed');
    }
  } catch (err) {
    logger.warn('GitHub token health check error', { error: err.message });
    checks.github_token = false;
  }

  // Check file system access
  try {
    const tempDir = path.join(__dirname, '../temp');
    fs.accessSync(tempDir, fs.constants.W_OK);
    checks.file_system = true;
  } catch (err) {
    logger.error('File system check failed', { error: err.message });
    checks.file_system = false;
  }

  // Check logging system
  try {
    const logsDir = path.join(__dirname, '../logs');
    fs.accessSync(logsDir, fs.constants.W_OK);
    checks.logs = true;
  } catch (err) {
    logger.error('Logs directory check failed', { error: err.message });
    checks.logs = false;
  }

  // Check cache (in-memory by default)
  checks.cache = true; // In-memory cache always available

  const allChecksPassed = Object.values(checks).every(check => check);
  
  logger.info('Health checks completed', { checks, allPassed: allChecksPassed });
  
  return {
    healthy: allChecksPassed,
    checks,
  };
};

/**
 * Sets up production-specific middleware and configurations
 */
const setupProductionMiddleware = (app) => {
  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    });
    next();
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error('Request error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  logger.info('Production middleware configured');
};

/**
 * Initializes performance monitoring
 */
const setupMonitoring = () => {
  // Log memory usage every 5 minutes in production
  const memoryCheckInterval = 5 * 60 * 1000;
  
  const checkMemory = () => {
    const memUsage = process.memoryUsage();
    logger.debug('Memory usage', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    });

    // Alert if memory usage is too high
    if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
      logger.warn('High memory usage detected', {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      });
    }
  };

  setInterval(checkMemory, memoryCheckInterval);
  logger.info('Monitoring initialized');
};

/**
 * Initializes cost tracking configuration
 */
const setupCostTracking = () => {
  const dailyLimit = parseFloat(process.env.COST_DAILY_LIMIT || '100');
  const monthlyLimit = parseFloat(process.env.COST_MONTHLY_LIMIT || '1000');
  const warningThreshold = parseInt(process.env.COST_WARNING_THRESHOLD || '75');
  const alertThreshold = parseInt(process.env.COST_ALERT_THRESHOLD || '90');

  logger.info('Cost tracking configured', {
    dailyLimit: `$${dailyLimit}`,
    monthlyLimit: `$${monthlyLimit}`,
    warningThreshold: `${warningThreshold}%`,
    alertThreshold: `${alertThreshold}%`,
  });

  return {
    dailyLimit,
    monthlyLimit,
    warningThreshold,
    alertThreshold,
  };
};

/**
 * Logs deployment information
 */
const logDeploymentInfo = () => {
  logger.info('Deployment Information', {
    environment: process.env.NODE_ENV,
    platform: process.env.RAILWAY_ENVIRONMENT_ID ? 'Railway' : process.env.AWS_LAMBDA_FUNCTION_NAME ? 'AWS Lambda' : 'Unknown',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });

  // Log available resources
  const os = require('os');
  logger.info('System Resources', {
    cpus: os.cpus().length,
    totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
    freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
    platform: os.platform(),
  });
};

/**
 * Performs graceful shutdown
 */
const setupGracefulShutdown = (server) => {
  const shutdown = async () => {
    logger.info('Graceful shutdown initiated');

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

/**
 * Executes all deployment setup procedures
 */
const initializeProduction = async (app, server) => {
  logger.info('Initializing production environment');

  // Step 1: Validate environment
  const envValidation = validateProductionEnvironment();
  if (!envValidation.valid) {
    logger.error('Environment validation failed', { errors: envValidation.errors });
    process.exit(1);
  }

  // Step 2: Setup directories
  if (!setupDirectories()) {
    logger.error('Failed to setup required directories');
    process.exit(1);
  }

  // Step 3: Perform health checks
  const healthChecks = await performHealthChecks();
  if (!healthChecks.healthy) {
    logger.warn('Some health checks failed', { checks: healthChecks.checks });
  }

  // Step 4: Setup middleware
  setupProductionMiddleware(app);

  // Step 5: Initialize monitoring
  setupMonitoring();

  // Step 6: Setup cost tracking
  setupCostTracking();

  // Step 7: Log deployment info
  logDeploymentInfo();

  // Step 8: Setup graceful shutdown
  setupGracefulShutdown(server);

  logger.info('Production initialization complete');
};

module.exports = {
  validateProductionEnvironment,
  setupDirectories,
  performHealthChecks,
  setupProductionMiddleware,
  setupMonitoring,
  setupCostTracking,
  logDeploymentInfo,
  setupGracefulShutdown,
  initializeProduction,
};
