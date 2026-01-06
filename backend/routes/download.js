/**
 * Download Routes (Phase 2 - Issue #111)
 * 
 * Routes for video download and audio extraction:
 * - POST /api/download - Start download and extract audio
 * - GET /api/download/:id - Get download/extraction status
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const downloadService = require('../services/downloadService');
const audioService = require('../services/audioService');
const env = require('../config/env');
const { v4: uuidv4 } = require('uuid');

// In-memory store for download/extraction status
// In production, this would be a database
const downloadQueue = new Map();

// Warning about in-memory storage limitations
logger.warn('Download queue is using in-memory storage; all download jobs will be lost on server restart. Configure persistent storage for production use.');

// Cleanup configuration to prevent unbounded memory growth
const JOB_TTL_MS = 24 * 60 * 60 * 1000;       // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;    // 1 hour
const MAX_QUEUE_SIZE = 1000;                  // Maximum number of jobs to retain

// Periodically clean up old or excess jobs from the in-memory queue
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  
  // Remove jobs older than the TTL
  for (const [jobId, job] of downloadQueue.entries()) {
    if (!job || !job.startTime) continue;
    const startTime = job.startTime instanceof Date
      ? job.startTime.getTime()
      : new Date(job.startTime).getTime();
    if (Number.isNaN(startTime)) continue;
    if (now - startTime > JOB_TTL_MS) {
      downloadQueue.delete(jobId);
    }
  }
  
  // Enforce maximum size by removing oldest jobs
  if (downloadQueue.size > MAX_QUEUE_SIZE) {
    const jobsWithStartTime = [];
    for (const [jobId, job] of downloadQueue.entries()) {
      if (!job || !job.startTime) continue;
      const startTime = job.startTime instanceof Date
        ? job.startTime.getTime()
        : new Date(job.startTime).getTime();
      if (Number.isNaN(startTime)) continue;
      jobsWithStartTime.push({ jobId, startTime });
    }
    jobsWithStartTime.sort((a, b) => a.startTime - b.startTime);
    let removed = 0;
    for (const { jobId } of jobsWithStartTime) {
      if (downloadQueue.size <= MAX_QUEUE_SIZE) break;
      downloadQueue.delete(jobId);
      removed++;
    }
    if (removed > 0) logger.info(`Cleaned up ${removed} old download jobs from queue`);
  }
}, CLEANUP_INTERVAL_MS);

// Allow process to exit naturally even if cleanup interval is active
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

/**
 * POST /api/download
 * Start video download and audio extraction
 */
router.post('/', async (req, res) => {
  try {
    const { url, quality = 'MEDIUM' } = req.body;

    // Validate input
    if (!url) {
      return res.status(400).json({
        error: 'Missing URL',
        message: 'URL parameter is required'
      });
    }

    // Validate URL format
    if (!downloadService.validateUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'URL must be from YouTube, TikTok, Instagram, Twitter, or Facebook'
      });
    }

    // Create unique job ID
    const jobId = uuidv4();

    // Initialize download status
    downloadQueue.set(jobId, {
      jobId,
      url,
      status: 'pending',
      progress: 0,
      startTime: new Date(),
      steps: {
        urlValidation: 'completed',
        metadata: 'pending',
        download: 'pending',
        audioExtraction: 'pending'
      }
    });

    logger.info(`Download job created: ${jobId}`, { url });

    // Start download in background (don't await)
    processDownload(jobId, url, quality).catch(error => {
      logger.error(`Background download error: ${error.message}`, { jobId });
      const job = downloadQueue.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
      }
    });

    return res.status(202).json({
      jobId,
      status: 'pending',
      message: 'Download queued for processing',
      statusUrl: `/api/download/${jobId}`
    });
  } catch (error) {
    logger.error(`Download endpoint error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/download/:jobId
 * Get status of download and audio extraction
 */
router.get('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;

    const job = downloadQueue.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Download job ${jobId} not found`
      });
    }

    // Calculate elapsed time
    const elapsedSeconds = Math.floor((Date.now() - job.startTime) / 1000);

    return res.json({
      jobId,
      status: job.status,
      progress: job.progress,
      elapsed: `${elapsedSeconds}s`,
      steps: job.steps,
      ...(job.status === 'completed' && {
        result: {
          audioPath: job.audioPath,
          audioId: job.audioId,
          duration: job.duration,
          size: job.size,
          quality: job.quality
        }
      }),
      ...(job.status === 'failed' && {
        error: job.error
      })
    });
  } catch (error) {
    logger.error(`Status endpoint error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * Background process for download and audio extraction
 * @private
 */
async function processDownload(jobId, url, quality) {
  const job = downloadQueue.get(jobId);

  try {
    // Step 1: Get metadata
    logger.info(`[${jobId}] Fetching metadata...`);
    job.steps.metadata = 'processing';
    await downloadService.getVideoMetadata(url); // Validates URL exists and is accessible
    job.steps.metadata = 'completed';
    job.progress = 25;

    // Step 2: Download video
    logger.info(`[${jobId}] Downloading video...`);
    job.steps.download = 'processing';
    const downloadResult = await downloadService.downloadVideo(url, env.uploadDir);
    job.videoPath = downloadResult.filePath; // Store for cleanup on error
    job.steps.download = 'completed';
    job.progress = 50;

    // Step 3: Extract audio
    logger.info(`[${jobId}] Extracting audio...`);
    job.steps.audioExtraction = 'processing';
    const audioResult = await audioService.extractAudio(
      downloadResult.filePath,
      env.uploadDir,
      quality
    );
    job.audioPath = audioResult.audioPath; // Store for cleanup on error
    job.steps.audioExtraction = 'completed';
    job.progress = 100;

    // Step 4: Clean up video file (we only need audio)
    await downloadService.cleanupVideo(downloadResult.filePath);

    // Update job with results
    job.status = 'completed';
    job.completedTime = new Date();

    logger.info(`[${jobId}] Download and extraction complete`, {
      duration: `${audioResult.duration.toFixed(2)}s`,
      size: `${(audioResult.size / 1024 / 1024).toFixed(2)}MB`
    });
  } catch (error) {
    logger.error(`[${jobId}] Process error: ${error.message}`, { errorCode: error.code });
    job.status = 'failed';
    job.error = error.message;
    job.errorCode = error.code;

    // Cleanup any downloaded files if they were created
    if (job.videoPath && typeof job.videoPath === 'string') {
      try {
        await downloadService.cleanupVideo(job.videoPath);
      } catch (cleanupError) {
        logger.warn(`[${jobId}] Failed to cleanup video:`, cleanupError.message);
      }
    }
    if (job.audioPath && typeof job.audioPath === 'string') {
      try {
        await audioService.cleanupAudio(job.audioPath);
      } catch (cleanupError) {
        logger.warn(`[${jobId}] Failed to cleanup audio:`, cleanupError.message);
      }
    }
  }
}

/**
 * DELETE /api/download/:jobId
 * Cancel a download job and cleanup
 */
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = downloadQueue.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Download job ${jobId} not found`
      });
    }

    // Only allow cancellation of pending/processing jobs
    if (!['pending', 'processing'].includes(job.status)) {
      return res.status(400).json({
        error: 'Cannot Cancel',
        message: `Cannot cancel ${job.status} job`
      });
    }

    // Cleanup files only if paths exist and are valid strings
    if (job.videoPath && typeof job.videoPath === 'string') {
      try {
        await downloadService.cleanupVideo(job.videoPath);
      } catch (err) {
        logger.warn(`[${jobId}] Error cleaning up video:`, err.message);
      }
    }
    if (job.audioPath && typeof job.audioPath === 'string') {
      try {
        await audioService.cleanupAudio(job.audioPath);
      } catch (err) {
        logger.warn(`[${jobId}] Error cleaning up audio:`, err.message);
      }
    }

    // Remove from queue
    downloadQueue.delete(jobId);

    logger.info(`Download job cancelled: ${jobId}`);

    return res.json({
      message: 'Download job cancelled',
      jobId
    });
  } catch (error) {
    logger.error(`Cancel endpoint error: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

module.exports = router;
