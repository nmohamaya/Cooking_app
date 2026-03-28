const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { getCachedTranscription, setCachedTranscription, generateAudioHash } = require('./cacheService');
const { trackCost } = require('./costTracker');

// Configuration
const COST_PER_MINUTE = 0.0; // Free — subtitles from yt-dlp
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const SUBTITLE_TIMEOUT_MS = 60000; // 60 seconds for yt-dlp subtitle extraction

// Error codes for transcription service
const TRANSCRIPTION_ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  SUBTITLES_NOT_AVAILABLE: 'SUBTITLES_NOT_AVAILABLE',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  PROCESS_ERROR: 'PROCESS_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  YT_DLP_NOT_FOUND: 'YT_DLP_NOT_FOUND',
  // Keep legacy codes for backward compat
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  INVALID_AUDIO_FORMAT: 'INVALID_AUDIO_FORMAT',
  AUDIO_TOO_LONG: 'AUDIO_TOO_LONG',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND'
};

/**
 * Extract subtitles from a video URL using yt-dlp
 * @param {string} url - Video URL (YouTube, etc.)
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<{text: string, language: string}>}
 */
async function extractSubtitles(url, language = 'en') {
  const tempId = uuidv4();
  const tempDir = path.join(__dirname, '..', 'temp', 'subtitles');
  const tempPath = path.join(tempDir, tempId);

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const args = [
      '--write-sub',
      '--write-auto-sub',
      '--sub-lang', language,
      '--sub-format', 'vtt',
      '--skip-download',
      '-o', tempPath,
      url
    ];

    logger.debug('Spawning yt-dlp for subtitle extraction', { url, language, args });

    const proc = spawn('yt-dlp', args, { timeout: SUBTITLE_TIMEOUT_MS });

    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject({
          code: TRANSCRIPTION_ERROR_CODES.YT_DLP_NOT_FOUND,
          message: 'yt-dlp is not installed. Please install it: https://github.com/yt-dlp/yt-dlp'
        });
      } else {
        reject({
          code: TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR,
          message: `yt-dlp process error: ${err.message}`
        });
      }
    });

    proc.on('close', (code) => {
      // Look for the VTT file — yt-dlp appends language and extension
      const possibleFiles = [
        `${tempPath}.${language}.vtt`,
        `${tempPath}.${language}.auto.vtt`, // auto-generated subs have this pattern sometimes
      ];

      // Also check for any .vtt file in case naming differs
      let vttFile = null;
      for (const file of possibleFiles) {
        if (fs.existsSync(file)) {
          vttFile = file;
          break;
        }
      }

      // Fallback: find any VTT file with the tempId prefix
      if (!vttFile) {
        try {
          const files = fs.readdirSync(tempDir);
          const match = files.find(f => f.startsWith(tempId) && f.endsWith('.vtt'));
          if (match) {
            vttFile = path.join(tempDir, match);
          }
        } catch (e) {
          // ignore read errors
        }
      }

      if (!vttFile) {
        // Check stderr for common error patterns
        if (stderr.includes('Video unavailable') || stderr.includes('Private video')) {
          reject({
            code: TRANSCRIPTION_ERROR_CODES.INVALID_URL,
            message: 'Video is unavailable or private'
          });
        } else {
          reject({
            code: TRANSCRIPTION_ERROR_CODES.SUBTITLES_NOT_AVAILABLE,
            message: `No subtitles available for this video in language: ${language}. Try a video with captions enabled.`
          });
        }
        return;
      }

      try {
        const vttContent = fs.readFileSync(vttFile, 'utf-8');
        const text = parseVTT(vttContent);

        // Cleanup temp files
        cleanupSubtitleFiles(tempDir, tempId);

        if (!text || text.trim().length === 0) {
          reject({
            code: TRANSCRIPTION_ERROR_CODES.SUBTITLES_NOT_AVAILABLE,
            message: 'Subtitles file was empty. Try a different video.'
          });
          return;
        }

        resolve({
          text: text.trim(),
          language
        });
      } catch (err) {
        cleanupSubtitleFiles(tempDir, tempId);
        reject({
          code: TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR,
          message: `Failed to parse subtitle file: ${err.message}`
        });
      }
    });
  });
}

/**
 * Parse VTT (WebVTT) subtitle content into plain text
 * Strips timestamps, headers, and deduplicates overlapping caption lines
 * @param {string} vttContent - Raw VTT file content
 * @returns {string} Plain text transcript
 */
function parseVTT(vttContent) {
  if (!vttContent || typeof vttContent !== 'string') {
    return '';
  }

  const lines = vttContent.split('\n');
  const textLines = [];
  let previousLine = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip WEBVTT header and metadata
    if (trimmed === 'WEBVTT' || trimmed.startsWith('Kind:') || trimmed.startsWith('Language:')) continue;

    // Skip NOTE blocks
    if (trimmed.startsWith('NOTE')) continue;

    // Skip timestamp lines (e.g., "00:00:01.000 --> 00:00:04.000")
    if (/^\d{2}:\d{2}:\d{2}[\.,]\d{3}\s*-->/.test(trimmed)) continue;

    // Skip numeric cue identifiers
    if (/^\d+$/.test(trimmed)) continue;

    // Strip VTT formatting tags like <c>, </c>, <b>, etc.
    let cleanLine = trimmed
      .replace(/<[^>]+>/g, '')  // Remove HTML/VTT tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    if (!cleanLine) continue;

    // Deduplicate: YouTube auto-captions often repeat lines across overlapping segments
    if (cleanLine === previousLine) continue;

    textLines.push(cleanLine);
    previousLine = cleanLine;
  }

  return textLines.join('\n');
}

/**
 * Cleanup subtitle temp files
 * @private
 */
function cleanupSubtitleFiles(tempDir, tempId) {
  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file.startsWith(tempId)) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    }
  } catch (err) {
    logger.warn('Failed to cleanup subtitle temp files', { error: err.message, tempId });
  }
}

/**
 * Transcribe video by extracting subtitles from URL
 * This is the main entry point — replaces the old audio-based transcription
 *
 * @param {string} url - Video URL to extract subtitles from
 * @param {string} cacheKey - Cache key (URL hash)
 * @param {string} language - Language code (default: 'en')
 * @param {number} audioMinutes - Duration in minutes (for cost tracking, optional)
 * @returns {Promise<{text: string, language: string, cost: number, cached: boolean, confidence: number}>}
 */
async function transcribeAudio(url, cacheKey, language = null, audioMinutes = 0) {
  try {
    logger.info('Starting subtitle extraction', { url, cacheKey, language });

    // Check cache first
    const cachedResult = await getCachedTranscription(cacheKey);
    if (cachedResult) {
      logger.info('Using cached transcription', { cacheKey });
      return {
        ...cachedResult,
        cached: true
      };
    }

    // Extract subtitles with retry logic
    const subtitleResult = await extractWithRetry(url, language || 'en');

    // Calculate cost (free — subtitle extraction via yt-dlp)
    const cost = calculateCost(audioMinutes);

    // Track cost
    await trackCost({
      type: 'transcription',
      duration: audioMinutes,
      cost,
      audioHash: cacheKey,
      status: 'success'
    });

    // Cache the result
    const result = {
      text: subtitleResult.text,
      language: subtitleResult.language || language || 'en',
      cost,
      confidence: calculateConfidence(subtitleResult),
      timestamp: new Date().toISOString()
    };

    try {
      await setCachedTranscription(cacheKey, result);
    } catch (cacheError) {
      logger.warn('Failed to cache transcription', {
        error: cacheError.message,
        cacheKey
      });
    }

    logger.info('Subtitle extraction completed successfully', {
      cacheKey,
      cost,
      textLength: result.text.length
    });

    return {
      ...result,
      cached: false
    };
  } catch (error) {
    logger.error('Subtitle extraction failed', {
      error: error.message,
      code: error.code,
      url,
      cacheKey
    });

    // Track failed attempt
    if (audioMinutes > 0) {
      try {
        await trackCost({
          type: 'transcription',
          duration: audioMinutes,
          cost: calculateCost(audioMinutes),
          audioHash: cacheKey,
          status: 'failed'
        });
      } catch (trackingError) {
        logger.warn('Failed to track cost for failed transcription', {
          error: trackingError.message
        });
      }
    }

    throw error;
  }
}

/**
 * Extract subtitles with exponential backoff retry logic
 * @private
 */
async function extractWithRetry(url, language, retryCount = 0) {
  try {
    return await extractSubtitles(url, language);
  } catch (error) {
    const isRetryable = isRetryableError(error);
    const shouldRetry = retryCount < MAX_RETRIES && isRetryable;

    logger.warn('Subtitle extraction failed', {
      error: error.message,
      code: error.code,
      attempt: retryCount + 1,
      willRetry: shouldRetry
    });

    if (shouldRetry) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logger.info(`Retrying subtitle extraction after ${delay}ms`, {
        attempt: retryCount + 1
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return extractWithRetry(url, language, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Determine if error is retryable
 * @private
 */
function isRetryableError(error) {
  // Network/process errors are retryable
  if (error.code === TRANSCRIPTION_ERROR_CODES.TIMEOUT) return true;
  if (error.code === TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR) return true;

  // Subtitles not available is NOT retryable
  if (error.code === TRANSCRIPTION_ERROR_CODES.SUBTITLES_NOT_AVAILABLE) return false;
  if (error.code === TRANSCRIPTION_ERROR_CODES.INVALID_URL) return false;
  if (error.code === TRANSCRIPTION_ERROR_CODES.YT_DLP_NOT_FOUND) return false;

  return false;
}

/**
 * Calculate cost based on audio duration
 * @private
 */
function calculateCost(audioMinutes) {
  return parseFloat((audioMinutes * COST_PER_MINUTE).toFixed(4));
}

/**
 * Calculate confidence score for subtitle extraction
 * Real captions are highly reliable
 * @private
 */
function calculateConfidence(subtitleResult) {
  let confidence = 0.92; // Higher base confidence than LLM — these are real captions

  const text = subtitleResult.text || '';

  // Very short text might be less confident
  if (text.length < 20) {
    confidence -= 0.1;
  }

  // Very long text is fine — real captions scale well
  if (text.length > 50000) {
    confidence -= 0.02;
  }

  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Detect available subtitle languages for a URL using yt-dlp
 * @param {string} url - Video URL
 * @returns {Promise<{language: string, confidence: number}>}
 */
async function detectLanguage(url) {
  try {
    logger.info('Detecting available subtitle languages', { url });

    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', ['--list-subs', '--skip-download', url], {
        timeout: 30000
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      proc.on('error', (err) => {
        if (err.code === 'ENOENT') {
          reject({
            code: TRANSCRIPTION_ERROR_CODES.YT_DLP_NOT_FOUND,
            message: 'yt-dlp is not installed'
          });
        } else {
          reject({
            code: TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR,
            message: `Language detection failed: ${err.message}`
          });
        }
      });

      proc.on('close', () => {
        // Parse yt-dlp --list-subs output to find available languages
        // Look for lines like "en   English" or "en-auto  English (auto-generated)"
        const langMatch = stdout.match(/^([a-z]{2})(?:-auto)?\s+/m);
        const language = langMatch ? langMatch[1] : 'en';

        resolve({
          language,
          confidence: langMatch ? 0.95 : 0.5
        });
      });
    });
  } catch (error) {
    logger.error('Language detection failed', {
      error: error.message,
      url
    });

    throw {
      code: TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR,
      message: `Language detection failed: ${error.message}`
    };
  }
}

/**
 * Get estimated cost for transcription
 * @param {number} audioMinutes - Duration in minutes
 * @returns {number} Estimated cost in dollars (always 0 for subtitle extraction)
 */
function getEstimatedCost(audioMinutes) {
  return calculateCost(audioMinutes);
}

module.exports = {
  transcribeAudio,
  extractSubtitles,
  parseVTT,
  detectLanguage,
  getEstimatedCost,
  TRANSCRIPTION_ERROR_CODES,
  COST_PER_MINUTE
};
