/**
 * Transcription Routes (Issue #110)
 * 
 * Routes for video transcription processing:
 * - POST /api/transcribe - Start video transcription
 * - GET /api/transcribe/:id - Get transcription status
 * - GET /api/transcribe/:id/result - Get transcription result
 * 
 * Full implementation in Issue #112
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

// Placeholder endpoints for Phase 1
router.post('/', (req, res) => {
  logger.info('Transcribe endpoint - implement in Issue #112');
  res.status(501).json({ 
    error: 'Not Implemented',
    message: 'Transcription endpoint will be implemented in Issue #112',
    issue: 112
  });
});

router.get('/:id', (req, res) => {
  logger.info(`Get transcription status: ${req.params.id}`);
  res.status(501).json({ 
    error: 'Not Implemented',
    message: 'Status endpoint will be implemented in Issue #112',
    issue: 112
  });
});

router.get('/:id/result', (req, res) => {
  logger.info(`Get transcription result: ${req.params.id}`);
  res.status(501).json({ 
    error: 'Not Implemented',
    message: 'Result endpoint will be implemented in Issue #112',
    issue: 112
  });
});

module.exports = router;
