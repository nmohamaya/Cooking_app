const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { transcribeAudio, detectLanguage, TRANSCRIPTION_ERROR_CODES } = require('../services/transcriptionService');
const { generateAudioHash } = require('../services/cacheService');
const { getCostStats, getCostLog } = require('../services/costTracker');

// In-memory job queue for long-running transcriptions
const transcriptionJobs = new Map();

/**
 * POST /api/transcribe
 * Start an asynchronous transcription job
 * 
 * Request body:
 * {
 *   audioFilePath: string (path to audio file from previous download/extraction),
 *   language?: string (e.g., 'en', 'es'),
 *   audioMinutes: number (duration in minutes for cost calculation)
 * }
 * 
 * Response (202 Accepted):
 * {
 *   jobId: string,
 *   status: 'queued',
 *   message: 'Transcription job queued successfully'
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { audioFilePath, language, audioMinutes } = req.body;

    // Validate input
    if (!audioFilePath) {
      return res.status(400).json({
        error: 'MISSING_AUDIO_PATH',
        message: 'audioFilePath is required'
      });
    }

    if (typeof audioMinutes !== 'number' || audioMinutes <= 0) {
      return res.status(400).json({
        error: 'INVALID_DURATION',
        message: 'audioMinutes must be a positive number'
      });
    }

    // Check cost estimate (free with Copilot, but still track)
    const estimatedCost = 0; // Free with GitHub Copilot account
    const costStats = await getCostStats();
    const dailyLimit = parseFloat(process.env.COST_DAILY_LIMIT || '50');

    // Cost checks still pass since it's free
    if (costStats.daily + estimatedCost > dailyLimit) {
      return res.status(429).json({
        error: 'COST_LIMIT_EXCEEDED',
        message: 'Daily cost limit would be exceeded by this transcription',
        details: {
          currentDaily: costStats.daily,
          estimatedCost,
          dailyLimit,
          wouldExceedBy: parseFloat((costStats.daily + estimatedCost - dailyLimit).toFixed(4))
        }
      });
    }

    // Generate job ID and create job record
    const jobId = uuidv4();
    const audioHash = generateAudioHash(audioFilePath);

    const job = {
      jobId,
      audioFilePath,
      audioHash,
      language: language || null,
      audioMinutes,
      status: 'queued',
      progress: 0,
      steps: [
        { name: 'Queued', completed: true, timestamp: new Date().toISOString() },
        { name: 'Language Detection', completed: false },
        { name: 'Transcription', completed: false },
        { name: 'Cost Calculation', completed: false }
      ],
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    transcriptionJobs.set(jobId, job);

    // Queue transcription asynchronously (don't await)
    processTranscriptionJob(jobId);

    logger.info('Transcription job queued', {
      jobId,
      audioFilePath,
      audioMinutes,
      estimatedCost
    });

    res.status(202).json({
      jobId,
      status: 'queued',
      message: 'Transcription job queued successfully',
      estimatedCost
    });
  } catch (error) {
    logger.error('Failed to queue transcription', {
      error: error.message,
      body: req.body
    });

    res.status(500).json({
      error: 'TRANSCRIPTION_QUEUE_FAILED',
      message: 'Failed to queue transcription job',
      details: error.message
    });
  }
});

/**
 * GET /api/transcribe/:jobId
 * Get transcription job status and result
 * 
 * Response:
 * {
 *   jobId: string,
 *   status: 'queued' | 'processing' | 'completed' | 'failed',
 *   progress: number (0-100),
 *   steps: Array,
 *   result?: {text, language, cost, confidence},
 *   error?: {code, message, details}
 * }
 */
router.get('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = transcriptionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Transcription job not found: ${jobId}`
      });
    }

    // Build progress percentage
    const completedSteps = job.steps.filter(s => s.completed).length;
    const totalSteps = job.steps.length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    const response = {
      jobId: job.jobId,
      status: job.status,
      progress,
      steps: job.steps,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };

    if (job.result) {
      response.result = job.result;
    }

    if (job.error) {
      response.error = job.error;
    }

    res.json(response);
  } catch (error) {
    logger.error('Failed to get job status', {
      error: error.message,
      jobId: req.params.jobId
    });

    res.status(500).json({
      error: 'STATUS_CHECK_FAILED',
      message: 'Failed to check job status',
      details: error.message
    });
  }
});

/**
 * DELETE /api/transcribe/:jobId
 * Cancel a queued or in-progress transcription job
 * 
 * Response:
 * {
 *   jobId: string,
 *   status: 'cancelled',
 *   message: 'Transcription job cancelled'
 * }
 */
router.delete('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = transcriptionJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Transcription job not found: ${jobId}`
      });
    }

    // Can only cancel queued or processing jobs
    if (job.status === 'completed' || job.status === 'failed') {
      return res.status(400).json({
        error: 'CANNOT_CANCEL',
        message: `Cannot cancel job with status: ${job.status}`,
        currentStatus: job.status
      });
    }

    job.status = 'cancelled';
    job.completedAt = new Date().toISOString();

    logger.info('Transcription job cancelled', { jobId });

    res.json({
      jobId,
      status: 'cancelled',
      message: 'Transcription job cancelled successfully'
    });
  } catch (error) {
    logger.error('Failed to cancel job', {
      error: error.message,
      jobId: req.params.jobId
    });

    res.status(500).json({
      error: 'CANCEL_FAILED',
      message: 'Failed to cancel transcription job',
      details: error.message
    });
  }
});

/**
 * GET /api/transcribe/costs/stats
 * Get cost statistics
 * 
 * Response:
 * {
 *   daily: number,
 *   monthly: number,
 *   total: number,
 *   dateRange: {start, end}
 * }
 */
router.get('/costs/stats', async (req, res) => {
  try {
    const stats = await getCostStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get cost stats', {
      error: error.message
    });

    res.status(500).json({
      error: 'COST_STATS_FAILED',
      message: 'Failed to retrieve cost statistics',
      details: error.message
    });
  }
});

/**
 * GET /api/transcribe/costs/log
 * Get detailed cost log
 * 
 * Query params:
 *   limit: number (default 100, max 1000)
 * 
 * Response: Array of cost entries
 */
router.get('/costs/log', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100'), 1000);
    const log = await getCostLog(limit);

    res.json({
      count: log.length,
      entries: log
    });
  } catch (error) {
    logger.error('Failed to get cost log', {
      error: error.message
    });

    res.status(500).json({
      error: 'COST_LOG_FAILED',
      message: 'Failed to retrieve cost log',
      details: error.message
    });
  }
});

/**
 * Process transcription job asynchronously
 * @private
 */
async function processTranscriptionJob(jobId) {
  const job = transcriptionJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.startedAt = new Date().toISOString();

    // Step 1: Language detection (if not provided)
    if (!job.language) {
      try {
        logger.debug('Detecting language', { jobId });
        const langResult = await detectLanguage(job.audioFilePath);
        job.language = langResult.language;

        updateJobStep(job, 'Language Detection', true);
      } catch (error) {
        logger.warn('Language detection failed, continuing with auto-detection', {
          jobId,
          error: error.message
        });
        updateJobStep(job, 'Language Detection', true);
      }
    } else {
      updateJobStep(job, 'Language Detection', true);
    }

    // Step 2: Transcription
    logger.debug('Starting transcription', { jobId });
    const transcriptionResult = await transcribeAudio(
      job.audioFilePath,
      job.audioHash,
      job.language,
      job.audioMinutes
    );

    updateJobStep(job, 'Transcription', true);

    // Step 3: Cost calculation
    updateJobStep(job, 'Cost Calculation', true);

    // Set result
    job.result = {
      text: transcriptionResult.text,
      language: transcriptionResult.language,
      cost: transcriptionResult.cost,
      confidence: transcriptionResult.confidence,
      cached: transcriptionResult.cached,
      timestamp: new Date().toISOString()
    };

    job.status = 'completed';
    job.completedAt = new Date().toISOString();

    logger.info('Transcription job completed', {
      jobId,
      cost: job.result.cost,
      cached: job.result.cached,
      textLength: job.result.text.length
    });
  } catch (error) {
    logger.error('Transcription job failed', {
      jobId,
      error: error.message,
      code: error.code
    });

    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.error = {
      code: error.code || 'TRANSCRIPTION_FAILED',
      message: error.message,
      details: error.details || null
    };
  }
}

/**
 * Update job step completion status
 * @private
 */
function updateJobStep(job, stepName, completed) {
  const step = job.steps.find(s => s.name === stepName);
  if (step) {
    step.completed = completed;
    step.timestamp = new Date().toISOString();
  }
}

module.exports = router;
