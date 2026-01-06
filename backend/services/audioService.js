/**
 * Audio Service (Phase 2 - Issue #111)
 * 
 * Extracts audio from video files using ffmpeg
 * Supports various audio formats and quality levels
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Audio quality presets
 */
const AUDIO_QUALITY = {
  LOW: { bitrate: '64k', sampleRate: '16000' },     // Transcription only
  MEDIUM: { bitrate: '128k', sampleRate: '16000' },  // Transcription + quality
  HIGH: { bitrate: '192k', sampleRate: '44100' }     // Full quality
};

/**
 * Extracts audio from video file using ffmpeg
 * @param {string} videoPath - Path to video file
 * @param {string} outputDir - Directory to save audio
 * @param {string} quality - Audio quality preset (LOW|MEDIUM|HIGH)
 * @returns {Promise<{audioPath: string, filename: string, duration: number, size: number}>}
 */
const extractAudio = async (videoPath, outputDir, quality = 'MEDIUM') => {
  try {
    // Validate inputs
    if (!videoPath || !outputDir) {
      throw new Error('Video path and output directory are required');
    }

    // Verify video file exists
    await fs.stat(videoPath);

    // Get quality settings
    const qualitySettings = AUDIO_QUALITY[quality] || AUDIO_QUALITY.MEDIUM;

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    // Generate unique filename
    const audioId = uuidv4();
    const filename = `audio_${audioId}.wav`;
    const audioPath = path.join(outputDir, filename);

    logger.info(`Extracting audio: ${path.basename(videoPath)}`, { audioId, quality });

    return new Promise((resolve, reject) => {
      // Use ffmpeg to extract audio
      // Note: ffmpeg must be installed separately
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // PCM 16-bit audio
        '-ar', qualitySettings.sampleRate, // Sample rate
        '-ac', '1', // Mono
        '-q:a', '9', // Quality
        audioPath
      ]);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        // Log ffmpeg progress (contains timing info)
        const line = data.toString().trim();
        if (line.includes('time=')) {
          logger.debug(`ffmpeg progress: ${line}`);
        }
      });

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          try {
            // Verify audio file exists and has content
            const stats = await fs.stat(audioPath);
            if (stats.size === 0) {
              throw new Error('Extracted audio file is empty');
            }

            // Extract duration from ffmpeg output
            const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
            let duration = 0;
            if (durationMatch) {
              const hours = parseInt(durationMatch[1]);
              const minutes = parseInt(durationMatch[2]);
              const seconds = parseFloat(durationMatch[3]);
              duration = hours * 3600 + minutes * 60 + seconds;
            }

            logger.info(`Audio extraction complete: ${filename}`, {
              audioId,
              size: stats.size,
              sizeInMB: (stats.size / 1024 / 1024).toFixed(2),
              duration: `${duration.toFixed(2)}s`
            });

            resolve({
              audioPath,
              filename,
              audioId,
              duration,
              size: stats.size,
              quality
            });
          } catch (error) {
            reject(error);
          }
        } else {
          let errorMessage = 'Audio extraction failed';

          if (stderr.includes('No such file')) {
            errorMessage = 'Input file not found';
          } else if (stderr.includes('Invalid data found')) {
            errorMessage = 'Invalid or corrupted video file';
          } else if (stderr.includes('Unknown encoder')) {
            errorMessage = 'ffmpeg audio codec not available';
          }

          const error = new Error(errorMessage);
          error.code = 'EXTRACTION_FAILED';
          error.ffmpegCode = code;
          logger.error(`Audio extraction failed: ${errorMessage}`, { audioId, code });
          reject(error);
        }
      });

      ffmpeg.on('error', (error) => {
        logger.error(`ffmpeg process error: ${error.message}`, { audioId });
        const err = new Error('Audio extraction service error');
        err.code = 'PROCESS_ERROR';
        err.originalError = error;
        reject(err);
      });

      // Set timeout for extraction (10 minutes max)
      const timeout = setTimeout(() => {
        ffmpeg.kill();
        logger.warn(`Audio extraction timeout`, { audioId });
        const error = new Error('Audio extraction timeout (10 min max)');
        error.code = 'EXTRACTION_TIMEOUT';
        reject(error);
      }, 10 * 60 * 1000);

      ffmpeg.on('close', () => clearTimeout(timeout));
    });
  } catch (error) {
    logger.error(`Audio extraction error: ${error.message}`, { videoPath });
    throw error;
  }
};

/**
 * Gets audio duration from file
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds
 */
const getAudioDuration = async (audioPath) => {
  try {
    logger.info(`Fetching audio duration: ${path.basename(audioPath)}`);

    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1:noescapekeys=1',
        audioPath
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          logger.info(`Audio duration: ${duration.toFixed(2)}s`);
          resolve(duration);
        } else {
          const error = new Error('Failed to get audio duration');
          error.code = 'DURATION_ERROR';
          reject(error);
        }
      });

      ffprobe.on('error', (error) => {
        const err = new Error('Audio duration fetch service error');
        err.code = 'PROCESS_ERROR';
        reject(err);
      });

      // Set timeout
      const timeout = setTimeout(() => {
        ffprobe.kill();
        reject(new Error('Audio duration fetch timeout'));
      }, 30000);

      ffprobe.on('close', () => clearTimeout(timeout));
    });
  } catch (error) {
    logger.error(`Duration error: ${error.message}`, { audioPath });
    throw error;
  }
};

/**
 * Cleans up audio file
 * @param {string} audioPath - Path to file to delete
 */
const cleanupAudio = async (audioPath) => {
  try {
    await fs.unlink(audioPath);
    logger.info(`Cleaned up audio: ${audioPath}`);
  } catch (error) {
    logger.warn(`Failed to cleanup audio: ${error.message}`, { audioPath });
  }
};

module.exports = {
  extractAudio,
  getAudioDuration,
  cleanupAudio,
  AUDIO_QUALITY
};
