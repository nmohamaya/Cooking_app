const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { extractRecipeFromVideo } = require('../services/recipeExtractionOrchestrator');
const { validateUrl } = require('../services/downloadService');

// In-memory job queue for extraction jobs
const extractionJobs = new Map();

// Cleanup completed jobs older than 30 minutes
const JOB_TTL_MS = 30 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of extractionJobs) {
    if (job.completedAt && (now - new Date(job.completedAt).getTime()) > JOB_TTL_MS) {
      extractionJobs.delete(jobId);
      logger.debug('Cleaned up expired extraction job', { jobId });
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

/**
 * POST /api/extract
 * Start a recipe extraction job with fallback cascade
 *
 * Request body:
 * {
 *   url: string (video URL — required),
 *   language?: string (e.g., 'en', 'es')
 * }
 *
 * Response (202 Accepted):
 * {
 *   jobId: string,
 *   status: 'queued',
 *   message: 'Extraction job queued successfully'
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { url, language } = req.body;

    // Validate input
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({
        error: 'MISSING_URL',
        message: 'url is required. Provide the video URL to extract a recipe from.',
      });
    }

    if (!validateUrl(url.trim())) {
      return res.status(400).json({
        error: 'INVALID_URL',
        message: 'URL is not from a supported platform (YouTube, TikTok, Instagram, Twitter, Facebook).',
      });
    }

    const jobId = uuidv4();

    const job = {
      jobId,
      url: url.trim(),
      language: language || 'en',
      status: 'queued',
      progress: 0,
      steps: [
        { name: 'Fetching video info', status: 'pending' },
        { name: 'Checking description', status: 'pending' },
        { name: 'Extracting captions', status: 'pending' },
        { name: 'Checking linked sites', status: 'pending' },
      ],
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    extractionJobs.set(jobId, job);

    // Process asynchronously
    processExtractionJob(jobId).catch(err => {
      logger.error('Unhandled error in extraction job', {
        jobId,
        error: err.message,
      });
    });

    logger.info('Extraction job queued', { jobId, url: url.trim() });

    res.status(202).json({
      jobId,
      status: 'queued',
      message: 'Extraction job queued successfully',
    });
  } catch (error) {
    logger.error('Failed to queue extraction', {
      error: error.message,
      body: req.body,
    });

    res.status(500).json({
      error: 'EXTRACTION_QUEUE_FAILED',
      message: 'Failed to queue extraction job',
      details: error.message,
    });
  }
});

/**
 * GET /api/extract/:jobId
 * Get extraction job status and result
 */
router.get('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = extractionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Extraction job not found: ${jobId}`,
      });
    }

    // Calculate progress from steps
    const completedSteps = job.steps.filter(s =>
      s.status === 'completed' || s.status === 'skipped'
    ).length;
    const totalSteps = job.steps.length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    const response = {
      jobId: job.jobId,
      status: job.status,
      progress,
      steps: job.steps,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };

    if (job.result) {
      response.result = job.result;
    }

    if (job.error) {
      response.error = job.error;
    }

    res.json(response);
  } catch (error) {
    logger.error('Failed to get extraction job status', {
      error: error.message,
      jobId: req.params.jobId,
    });

    res.status(500).json({
      error: 'STATUS_CHECK_FAILED',
      message: 'Failed to check job status',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/extract/:jobId
 * Cancel an extraction job
 */
router.delete('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = extractionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Extraction job not found: ${jobId}`,
      });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return res.status(400).json({
        error: 'CANNOT_CANCEL',
        message: `Cannot cancel job with status: ${job.status}`,
      });
    }

    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();

    logger.info('Extraction job cancelled', { jobId });

    res.json({
      jobId,
      status: 'cancelled',
      message: 'Extraction job cancelled successfully',
    });
  } catch (error) {
    logger.error('Failed to cancel extraction job', {
      error: error.message,
      jobId: req.params.jobId,
    });

    res.status(500).json({
      error: 'CANCEL_FAILED',
      message: 'Failed to cancel extraction job',
      details: error.message,
    });
  }
});

/**
 * Process extraction job asynchronously
 * @private
 */
async function processExtractionJob(jobId) {
  const job = extractionJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.startedAt = new Date().toISOString();

    const result = await extractRecipeFromVideo(job.url, {
      language: job.language,
      onStepUpdate: (name, status, detail) => {
        updateJobStep(job, name, status, detail);
      },
    });

    if (job.status === 'cancelled') return;

    if (result.success && result.recipe) {
      job.result = {
        recipe: result.recipe,
        source: result.source,
        completeness: result.completeness,
        metadata: result.metadata,
        attempts: result.attempts,
        timestamp: new Date().toISOString(),
      };
      job.status = 'completed';
    } else {
      job.status = 'failed';
      job.error = {
        code: 'NO_RECIPE_FOUND',
        message: 'Could not extract a recipe from this video. Tried: description, captions, and linked websites.',
        attempts: result.attempts,
      };
    }

    job.completedAt = new Date().toISOString();

    logger.info('Extraction job finished', {
      jobId,
      success: result.success,
      source: result.source,
    });
  } catch (error) {
    logger.error('Extraction job failed', {
      jobId,
      error: error.message,
    });

    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.error = {
      code: error.code || 'EXTRACTION_FAILED',
      message: error.message,
    };
  }
}

/**
 * Update a step in the job
 * @private
 */
function updateJobStep(job, stepName, status, detail) {
  const step = job.steps.find(s => s.name === stepName);
  if (step) {
    step.status = status;
    step.detail = detail || null;
    step.timestamp = new Date().toISOString();
  }
}

// Export for testing
module.exports = router;
module.exports._extractionJobs = extractionJobs;
