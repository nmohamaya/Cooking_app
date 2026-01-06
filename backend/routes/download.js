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
    const metadata = await downloadService.getVideoMetadata(url);
    job.steps.metadata = 'completed';
    job.progress = 25;

    // Step 2: Download video
    logger.info(`[${jobId}] Downloading video...`);
    job.steps.download = 'processing';
    const downloadResult = await downloadService.downloadVideo(url, env.uploadDir);
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
    job.steps.audioExtraction = 'completed';
    job.progress = 100;

    // Step 4: Clean up video file (we only need audio)
    await downloadService.cleanupVideo(downloadResult.filePath);

    // Update job with results
    job.status = 'completed';
    job.audioPath = audioResult.audioPath;
    job.audioId = audioResult.audioId;
    job.duration = audioResult.duration;
    job.size = audioResult.size;
    job.quality = quality;
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

    // Cleanup any downloaded files
    if (job.videoPath) {
      await downloadService.cleanupVideo(job.videoPath);
    }
    if (job.audioPath) {
      await audioService.cleanupAudio(job.audioPath);
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

    // Cleanup files if they exist
    if (job.videoPath) {
      await downloadService.cleanupVideo(job.videoPath);
    }
    if (job.audioPath) {
      await audioService.cleanupAudio(job.audioPath);
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
