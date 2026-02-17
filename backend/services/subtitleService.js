/**
 * Subtitle Extraction Service
 * 
 * Extracts auto-generated captions/subtitles from YouTube videos using yt-dlp.
 * This is much faster than downloading + transcribing audio and works for
 * any video with auto-generated captions.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');
const env = require('../config/env');
const { v4: uuidv4 } = require('uuid');

/**
 * Extract subtitles/captions from a YouTube video URL
 * @param {string} url - YouTube video URL
 * @param {string} language - Desired language code (default: 'en')
 * @returns {Promise<{text: string, language: string, source: string}>}
 */
const extractSubtitles = async (url, language = 'en') => {
  const jobId = uuidv4();
  const outputTemplate = path.join(env.uploadDir, `subs_${jobId}`);

  try {
    // Ensure output directory exists
    await fs.mkdir(env.uploadDir, { recursive: true });

    logger.info(`[${jobId}] Extracting subtitles for: ${url}`, { language });

    // Try to get subtitles in the requested language
    // yt-dlp auto-translated subs use format like "en-ORIG" where ORIG is the original language
    // We use a regex pattern to match any variant of the requested language
    const subtitleFile = await downloadSubtitles(url, outputTemplate, language, jobId);

    if (!subtitleFile) {
      logger.warn(`[${jobId}] No subtitles found for language: ${language}`);
      return {
        success: false,
        error: `No captions available for this video in ${language}`,
        language,
      };
    }

    // Parse the VTT file into plain text
    const vttContent = await fs.readFile(subtitleFile, 'utf-8');
    const plainText = parseVttToText(vttContent);

    // Clean up the subtitle file
    try {
      await fs.unlink(subtitleFile);
    } catch (e) {
      logger.warn(`[${jobId}] Failed to cleanup subtitle file: ${e.message}`);
    }

    if (!plainText || plainText.trim().length === 0) {
      return {
        success: false,
        error: 'Subtitles were empty or could not be parsed',
        language,
      };
    }

    logger.info(`[${jobId}] Subtitles extracted successfully`, {
      textLength: plainText.length,
      language,
    });

    return {
      success: true,
      text: plainText,
      language,
      source: 'youtube-captions',
    };
  } catch (error) {
    logger.error(`[${jobId}] Subtitle extraction failed: ${error.message}`);

    // Clean up any leftover files
    try {
      const dir = path.dirname(outputTemplate);
      const prefix = path.basename(outputTemplate);
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.startsWith(prefix)) {
          await fs.unlink(path.join(dir, file));
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    throw error;
  }
};

/**
 * Download subtitles using yt-dlp
 * @private
 * @returns {Promise<string|null>} Path to downloaded subtitle file, or null if unavailable
 */
const downloadSubtitles = async (url, outputTemplate, language, jobId) => {
  // Try multiple subtitle language patterns from most specific to broadest
  // YouTube auto-translated subs use formats like "en-sq" (English from Albanian)
  const patterns = [
    `${language}`,                           // Manual subs: "en"
    `${language}-${language}`,               // Auto-gen same lang: "en-en"
    `${language}-*`,                         // Auto-translated from any lang: "en-*"
    `${language}.*`,                         // Any variant: "en.xxx"
  ];

  for (const pattern of patterns) {
    logger.debug(`[${jobId}] Trying subtitle pattern: ${pattern}`);
    const result = await tryDownloadSubtitles(url, outputTemplate, pattern, jobId);
    if (result) {
      return result;
    }
  }

  return null;
};

/**
 * Attempt to download subtitles with a specific language pattern
 * @private
 */
const tryDownloadSubtitles = (url, outputTemplate, langPattern, jobId) => {
  return new Promise((resolve, reject) => {
    const args = [
      '--js-runtimes', 'node',
      '--write-auto-sub',
      '--write-subs',        // Also try manual subs
      '--sub-lang', langPattern,
      '--sub-format', 'vtt',
      '--skip-download',
      '--socket-timeout', '30',
      '-o', outputTemplate,
      url,
    ];

    logger.debug(`[${jobId}] Running yt-dlp for subtitles`, { pattern: langPattern });

    const ytDlp = spawn('yt-dlp', args);

    let stderr = '';
    let stdout = '';
    let completed = false;

    ytDlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytDlp.on('close', async (code) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);

      // Even with exit code 0, check if subtitle file was actually created
      try {
        const dir = path.dirname(outputTemplate);
        const prefix = path.basename(outputTemplate);
        const files = await fs.readdir(dir);
        const subFile = files.find(
          (f) => f.startsWith(prefix) && f.endsWith('.vtt')
        );

        if (subFile) {
          const fullPath = path.join(dir, subFile);
          const stats = await fs.stat(fullPath);
          if (stats.size > 0) {
            logger.info(`[${jobId}] Subtitle file downloaded: ${subFile} (${stats.size} bytes)`);
            resolve(fullPath);
            return;
          }
        }

        // No subtitle file found - resolve null to try next pattern
        if (stderr.includes('no subtitles') || stderr.includes('There are no subtitles')) {
          logger.info(`[${jobId}] No subtitles available for pattern: ${langPattern}`);
          resolve(null);
        } else if (code !== 0) {
          logger.debug(`[${jobId}] yt-dlp exited with code ${code} for pattern: ${langPattern}`);
          resolve(null); // Resolve null so pattern loop continues
        } else {
          resolve(null);
        }
      } catch (error) {
        resolve(null); // Don't reject, let pattern loop continue
      }
    });

    ytDlp.on('error', (error) => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      logger.debug(`[${jobId}] yt-dlp process error for pattern ${langPattern}: ${error.message}`);
      resolve(null); // Don't reject, let pattern loop continue
    });

    const timeout = setTimeout(() => {
      if (completed) return;
      completed = true;
      ytDlp.kill();
      resolve(null); // Don't reject on timeout, let pattern loop continue
    }, 30000);
  });
};

/**
 * Parse VTT subtitle content into plain text
 * Removes timestamps, duplicate lines, and formatting
 * @private
 * @param {string} vttContent - Raw VTT file content
 * @returns {string} - Plain text transcript
 */
const parseVttToText = (vttContent) => {
  const lines = vttContent.split('\n');
  const textLines = [];
  const seenLines = new Set();

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip VTT header, empty lines, timestamps, and metadata
    if (
      !trimmed ||
      trimmed === 'WEBVTT' ||
      trimmed.startsWith('Kind:') ||
      trimmed.startsWith('Language:') ||
      trimmed.includes('-->') ||
      /^\d+$/.test(trimmed) // Sequence numbers
    ) {
      continue;
    }

    // Remove HTML tags and formatting
    const cleaned = trimmed
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();

    // Skip empty lines and duplicates
    if (cleaned && !seenLines.has(cleaned)) {
      seenLines.add(cleaned);
      textLines.push(cleaned);
    }
  }

  return textLines.join('\n');
};

/**
 * Check if subtitles are available for a video
 * @param {string} url - Video URL
 * @param {string} language - Language code
 * @returns {Promise<boolean>}
 */
const hasSubtitles = async (url, language = 'en') => {
  return new Promise((resolve) => {
    const ytDlp = spawn('yt-dlp', [
      '--js-runtimes', 'node',
      '--list-subs',
      '--socket-timeout', '15',
      url,
    ]);

    let stdout = '';
    let completed = false;

    ytDlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytDlp.on('close', () => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      // Check if any English subtitles are listed
      const hasLang = stdout.includes(`${language}-`) || stdout.includes(`${language} `);
      resolve(hasLang);
    });

    ytDlp.on('error', () => {
      if (completed) return;
      completed = true;
      clearTimeout(timeout);
      resolve(false);
    });

    const timeout = setTimeout(() => {
      if (completed) return;
      completed = true;
      ytDlp.kill();
      resolve(false);
    }, 15000);
  });
};

module.exports = {
  extractSubtitles,
  hasSubtitles,
  parseVttToText,
};
