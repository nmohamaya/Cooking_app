// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const config = require('./config/env');

// Initialize Express app
const app = express();

// Security headers
app.use(helmet());

// Rate limiting for API routes
const parseRateLimitEnv = (envValue, defaultValue) => {
  if (envValue === undefined) return defaultValue;
  const parsed = parseInt(envValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    logger.warn(`Invalid rate limit env value "${envValue}", using default ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
};

const apiLimiter = rateLimit({
  windowMs: parseRateLimitEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
  max: parseRateLimitEnv(process.env.RATE_LIMIT_MAX, 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Rate limit exceeded. Try again later.'
  }
});
app.use('/api/', apiLimiter);

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({ 
    version: '1.0.0',
    api: 'v1',
    features: ['video-transcription', 'recipe-extraction']
  });
});

// Routes — versioned under /api/v1/, with /api/ aliases for backward compatibility
const downloadRoutes = require('./routes/download');    // Phase 2
const transcribeRoutes = require('./routes/transcribe'); // Phase 3
const recipesRoutes = require('./routes/recipes');       // Phase 4
const costRoutes = require('./routes/cost');              // Phase 6
const extractRoutes = require('./routes/extract');        // Extraction cascade
const featuresRoutes = require('./routes/features');      // Feature flags dashboard
const { interceptExtractResponses } = require('./middleware/contractValidator');

// Versioned routes (preferred)
app.use('/api/v1/download', downloadRoutes);
app.use('/api/v1/transcribe', transcribeRoutes);
app.use('/api/v1/recipes', recipesRoutes);
app.use('/api/v1/cost', costRoutes);
app.use('/api/v1/extract', interceptExtractResponses(), extractRoutes);
app.use('/api/v1/features', featuresRoutes);

// Backward-compatible aliases (unversioned)
app.use('/api/download', downloadRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/extract', interceptExtractResponses(), extractRoutes);
app.use('/api/features', featuresRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, _next) => {
  logger.error('Unhandled error:', err);
  
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error'
    : err.message;
  
  res.status(status).json({ 
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server only when run directly, not when imported for tests
let server;

if (require.main === module) {
  server = app.listen(config.port, config.host, () => {
    logger.info(`🚀 Server running at http://${config.host}:${config.port}`);
    logger.info(`📡 Environment: ${config.nodeEnv}`);
    logger.info(`✓ Health check: http://${config.host}:${config.port}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close((err) => {
      if (err) {
        logger.error('Error closing HTTP server:', err);
        process.exit(1);
      } else {
        logger.info('HTTP server closed');
        process.exit(0);
      }
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close((err) => {
      if (err) {
        logger.error('Error closing HTTP server:', err);
        process.exit(1);
      } else {
        logger.info('HTTP server closed');
        process.exit(0);
      }
    });
  });
}

module.exports = app;
