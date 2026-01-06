/**
 * Download Service (Phase 2 - Issue #111)
 * 
 * Handles video download from YouTube, TikTok, and other platforms
 * using yt-dlp library
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');
const env = require('../config/env');
const { v4: uuidv4 } = require('uuid');

/**
 * Validates video URL format
 * @param {string} url - Video URL
 * @returns {boolean} - True if URL is valid
 */
const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const urlPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\//,
    /^https?:\/\/youtu\.be\//,
    /^https?:\/\/(www\.)?tiktok\.com\//,
    /^https?:\/\/(www\.)?instagram\.com\//,
    /^https?:\/\/(www\.)?twitter\.com\//,
    /^https?:\/\/(www\.)?x\.com\//,
    /^https?:\/\/(www\.)?facebook\.com\//,
  ];

  return urlPatterns.some(pattern => pattern.test(url));
};

/**
 * Downloads video from URL using yt-dlp
 * @param {string} url - Video URL
 * @param {string} outputDir - Directory to save video
 * @returns {Promise<{filePath: string, filename: string, metadata: object}>}
 */
const downloadVideo = async (url, outputDir = env.uploadDir) => {
  try {
    // Validate URL
    if (!validateUrl(url)) {
      const error = new Error('Invalid video URL');
      error.code = 'INVALID_URL';
      throw error;
    }

    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });

    // Generate unique ID for this download
    const downloadId = uuidv4();
    const filename = `video_${downloadId}.mp4`;
    const filePath = path.join(outputDir, filename);

    logger.info(`Starting download: ${url}`, { downloadId });

    return new Promise((resolve, reject) => {
      // Use yt-dlp to download video
      // Note: yt-dlp must be installed separately: pip install yt-dlp
      const ytDlp = spawn('yt-dlp', [
        '-f', 'best[ext=mp4]', // Download best MP4 format
        '-o', filePath,
        '--socket-timeout', '30', // 30 second timeout
        '--fragment-retries', '3',
        url
      ]);

      let stderr = '';
      let stdout = '';

      ytDlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.debug(`yt-dlp stderr: ${data.toString().trim()}`);
      });

      ytDlp.on('close', async (code) => {
        if (code === 0) {
          try {
            // Verify file exists and has content
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
              throw new Error('Downloaded file is empty');
            }

            logger.info(`Download complete: ${filename}`, {
              downloadId,
              size: stats.size,
              sizeInMB: (stats.size / 1024 / 1024).toFixed(2)
            });

            resolve({
              filePath,
              filename,
              downloadId,
              size: stats.size,
              url
            });
          } catch (error) {
            reject(error);
          }
        } else {
          // Extract error message from yt-dlp output
          let errorMessage = 'Video download failed';
          
          if (stderr.includes('Video unavailable')) {
            errorMessage = 'Video is unavailable or private';
          } else if (stderr.includes('403')) {
            errorMessage = 'Access denied to video (may be geoblocked)';
          } else if (stderr.includes('404')) {
            errorMessage = 'Video not found';
          } else if (stderr.includes('too long')) {
            errorMessage = `Video is too long (max ${env.maxVideoDurationHours} hour)`;
          }

          const error = new Error(errorMessage);
          error.code = 'DOWNLOAD_FAILED';
          error.ytDlpCode = code;
          logger.error(`Download failed: ${errorMessage}`, { downloadId, code, stderr });
          reject(error);
        }
      });

      ytDlp.on('error', (error) => {
        logger.error(`yt-dlp process error: ${error.message}`, { downloadId });
        const err = new Error('Video download service error');
        err.code = 'PROCESS_ERROR';
        err.originalError = error;
        reject(err);
      });

      // Set timeout for entire download process
      const timeout = setTimeout(() => {
        ytDlp.kill();
        logger.warn(`Download timeout after ${env.videoTimeoutMinutes} minutes`, { downloadId });
        const error = new Error(`Download timeout after ${env.videoTimeoutMinutes} minutes`);
        error.code = 'DOWNLOAD_TIMEOUT';
        reject(error);
      }, env.videoTimeoutMinutes * 60 * 1000);

      ytDlp.on('close', () => clearTimeout(timeout));
    });
  } catch (error) {
    logger.error(`Download error: ${error.message}`, { url });
    throw error;
  }
};

/**
 * Cleans up downloaded video file
 * @param {string} filePath - Path to file to delete
 */
const cleanupVideo = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info(`Cleaned up video: ${filePath}`);
  } catch (error) {
    logger.warn(`Failed to cleanup video: ${error.message}`, { filePath });
  }
};

/**
 * Gets video metadata (duration, title, etc.)
 * @param {string} url - Video URL
 * @returns {Promise<{duration: number, title: string, uploader: string}>}
 */
const getVideoMetadata = async (url) => {
  try {
    if (!validateUrl(url)) {
      throw new Error('Invalid video URL');
    }

    logger.info(`Fetching metadata: ${url}`);

    return new Promise((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', [
        '--dump-json',
        '--socket-timeout', '30',
        url
      ]);

      let output = '';
      let stderr = '';

      ytDlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytDlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytDlp.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output);
            const duration = metadata.duration || 0;

            // Check if video is too long
            if (duration > env.maxVideoDurationHours * 3600) {
              throw new Error(`Video is too long (${(duration / 3600).toFixed(2)} hours, max ${env.maxVideoDurationHours})`);
            }

            logger.info(`Metadata fetched: ${metadata.title}`, {
              duration: `${(duration / 60).toFixed(2)}min`,
              title: metadata.title
            });

            resolve({
              duration,
              title: metadata.title || 'Unknown',
              uploader: metadata.uploader || 'Unknown',
              uploadDate: metadata.upload_date,
              url
            });
          } catch (error) {
            reject(error);
          }
        } else {
          const error = new Error('Failed to fetch video metadata');
          error.code = 'METADATA_ERROR';
          reject(error);
        }
      });

      ytDlp.on('error', (error) => {
        const err = new Error('Metadata fetch service error');
        err.code = 'PROCESS_ERROR';
        reject(err);
      });

      // Set timeout
      const timeout = setTimeout(() => {
        ytDlp.kill();
        const error = new Error('Metadata fetch timeout');
        error.code = 'METADATA_TIMEOUT';
        reject(error);
      }, 30000); // 30 second timeout

      ytDlp.on('close', () => clearTimeout(timeout));
    });
  } catch (error) {
    logger.error(`Metadata error: ${error.message}`, { url });
    throw error;
  }
};

module.exports = {
  downloadVideo,
  cleanupVideo,
  getVideoMetadata,
  validateUrl
};
