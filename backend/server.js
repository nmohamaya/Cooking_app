// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const config = require('./config/env');

// Initialize Express app
const app = express();

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

// Routes
app.use('/api/download', require('./routes/download')); // Phase 2
app.use('/api/transcribe', require('./routes/transcribe')); // Phase 3
app.use('/api/recipes', require('./routes/recipes')); // Phase 4
app.use('/api/cost', require('./routes/cost')); // Phase 6

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
