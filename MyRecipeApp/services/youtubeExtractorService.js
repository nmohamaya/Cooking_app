/**
 * YouTube Transcript Extraction Service
 * Fetches and caches YouTube transcripts/captions for recipe videos
 * Supports multiple languages with fallback to auto-generated captions
 * 
 * This service connects to the backend API endpoints:
 * - POST /api/download - Download video file from YouTube URL
 * - POST /api/transcribe - Extract and transcribe audio
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  KEY_PREFIX: 'youtube_transcript_',
};

/**
 * Backend API configuration
 */
const BACKEND_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000',
  TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes for transcription
};

/**
 * Get YouTube transcript for a video
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code (default: 'en')
 * @returns {Promise<Object>} - {success, transcript, language, error}
 */
export const getYoutubeTranscript = async (videoId, language = 'en') => {
  if (!videoId || typeof videoId !== 'string') {
    return {
      success: false,
      error: 'Invalid video ID',
      videoId,
    };
  }

  try {
    // Check cache first
    const cached = await getCachedTranscript(videoId, language);
    if (cached) {
      return {
        success: true,
        transcript: cached.transcript,
        language: cached.language,
        fromCache: true,
        expiresAt: cached.expiresAt,
        videoId,
      };
    }

    // Simulate fetch from YouTube API (in production, use youtube-transcript-api)
    const transcript = await fetchTranscriptFromAPI(videoId, language);

    if (!transcript) {
      return {
        success: false,
        error: 'Video not found or transcripts not available',
        videoId,
      };
    }

    // Cache the transcript
    await cacheTranscript(videoId, language, transcript);

    return {
      success: true,
      transcript,
      language,
      fromCache: false,
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
      videoId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch transcript',
      videoId,
    };
  }
};

/**
 * Get available languages for a YouTube video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Array>} - Array of language codes
 */
export const getAvailableLanguages = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    return [];
  }

  try {
    // Simulate API call to get available languages
    const languages = await fetchAvailableLanguagesFromAPI(videoId);
    return languages || ['en'];
  } catch {
    return ['en'];
  }
};

/**
 * Get YouTube transcript with caching
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code
 * @returns {Promise<Object>} - {transcript, fromCache, expiresAt}
 */
export const getYoutubeTranscriptCached = async (videoId, language = 'en') => {
  const result = await getYoutubeTranscript(videoId, language);

  if (!result.success) {
    throw new Error(result.error);
  }

  return {
    transcript: result.transcript,
    fromCache: result.fromCache,
    expiresAt: result.expiresAt,
  };
};

/**
 * Parse transcript with timestamps
 * @param {string|Array} transcript - Transcript text or array of items
 * @returns {Array} - [{text, startTime, endTime}]
 */
export const parseTranscriptWithTimestamps = (transcript) => {
  if (!transcript) {
    return [];
  }

  // If it's an array of objects with timestamps (from API)
  if (Array.isArray(transcript)) {
    return transcript.map((item) => ({
      text: item.text || '',
      startTime: item.start || 0,
      endTime: (item.start || 0) + (item.duration || 0),
    }));
  }

  // If it's plain text, return with no timestamps
  if (typeof transcript === 'string') {
    return [
      {
        text: transcript,
        startTime: 0,
        endTime: 0,
      },
    ];
  }

  return [];
};

/**
 * Clear cached transcripts for a specific video
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code (optional)
 * @returns {Promise<void>}
 */
export const clearTranscriptCache = async (videoId, language = null) => {
  try {
    if (language) {
      const key = `${CACHE_CONFIG.KEY_PREFIX}${videoId}_${language}`;
      await AsyncStorage.removeItem(key);
    } else {
      // Clear all languages for this video
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter((key) =>
        key.startsWith(`${CACHE_CONFIG.KEY_PREFIX}${videoId}_`)
      );
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.warn(`Failed to clear cache for video ${videoId}:`, error);
  }
};

/**
 * Clear all cached transcripts
 * @returns {Promise<void>}
 */
export const clearAllTranscriptCache = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((key) =>
      key.startsWith(CACHE_CONFIG.KEY_PREFIX)
    );
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.warn('Failed to clear all transcript cache:', error);
  }
};

/**
 * Get cache expiration time for a transcript
 * @param {string} videoId - YouTube video ID
 * @param {string} language - Language code
 * @returns {Promise<number|null>} - Expiration timestamp or null if not cached
 */
export const getCacheExpiration = async (videoId, language = 'en') => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${videoId}_${language}`;
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return null;
    }
    const data = JSON.parse(cached);
    return data.expiresAt || null;
  } catch {
    return null;
  }
};

// ============= Internal Helper Functions =============

/**
 * Get cached transcript from AsyncStorage
 * @private
 */
const getCachedTranscript = async (videoId, language) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${videoId}_${language}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const data = JSON.parse(cached);
    const now = Date.now();

    // Check if cache has expired
    if (data.expiresAt && now > data.expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to retrieve cached transcript:', error);
    return null;
  }
};

/**
 * Cache transcript to AsyncStorage
 * @private
 */
const cacheTranscript = async (videoId, language, transcript) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${videoId}_${language}`;
    const data = {
      transcript,
      language,
      videoId,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache transcript:', error);
  }
};

/**
 * Fetch transcript from YouTube API via backend
 * @private
 * 3-tier extraction strategy:
 * 1. Video description (most structured — often has full recipe)
 * 2. Subtitles/captions (fill gaps and cross-check)
 * 3. Audio transcription (last resort, if both above fail)
 */
const fetchTranscriptFromAPI = async (videoId, language) => {
  try {
    console.log(`🎬 [YouTube] Starting 3-tier extraction for video: ${videoId}`);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    let description = '';
    let subtitles = '';
    let videoTitle = '';

    // === TIER 1 & 2: Fetch description and subtitles in parallel ===
    console.log(`📋 [YouTube] Fetching video description and subtitles in parallel...`);
    
    const [metadataResult, subtitleResult] = await Promise.allSettled([
      // Tier 1: Video description
      axios.post(
        `${BACKEND_CONFIG.BASE_URL}/api/download/metadata`,
        { url: youtubeUrl },
        { timeout: 30000 }
      ),
      // Tier 2: Subtitles/captions
      axios.post(
        `${BACKEND_CONFIG.BASE_URL}/api/download/subtitles`,
        { url: youtubeUrl, language: language || 'en' },
        { timeout: 60000 }
      ),
    ]);

    // Process description result
    if (metadataResult.status === 'fulfilled' && metadataResult.value.data.success) {
      description = metadataResult.value.data.description || '';
      videoTitle = metadataResult.value.data.title || '';
      console.log(`✅ [YouTube] Description obtained (${description.length} chars), title: "${videoTitle}"`);
    } else {
      const err = metadataResult.status === 'rejected' 
        ? metadataResult.reason?.message 
        : 'No description available';
      console.log(`⚠️ [YouTube] Description unavailable: ${err}`);
    }

    // Process subtitle result
    if (subtitleResult.status === 'fulfilled' && subtitleResult.value.data.success) {
      subtitles = subtitleResult.value.data.transcript || '';
      console.log(`✅ [YouTube] Subtitles obtained (${subtitles.length} chars)`);
    } else {
      const err = subtitleResult.status === 'rejected'
        ? subtitleResult.reason?.message
        : subtitleResult.value?.data?.error || 'No subtitles available';
      console.log(`⚠️ [YouTube] Subtitles unavailable: ${err}`);
    }

    // === Build combined transcript from available sources ===
    if (description || subtitles) {
      let combined = '';
      
      if (videoTitle) {
        combined += `VIDEO TITLE: ${videoTitle}\n\n`;
      }
      
      if (description) {
        combined += `VIDEO DESCRIPTION:\n${description}\n\n`;
      }
      
      if (subtitles) {
        combined += `VIDEO CAPTIONS/SUBTITLES:\n${subtitles}\n`;
      }

      console.log(`✅ [YouTube] Combined transcript ready (${combined.length} chars from ${description ? 'description' : ''}${description && subtitles ? ' + ' : ''}${subtitles ? 'subtitles' : ''})`);
      return combined;
    }

    // === TIER 3: Fall back to download + audio transcription ===
    console.log(`🔄 [YouTube] No description or subtitles available. Falling back to audio transcription...`);
    
    console.log(`📥 [YouTube] Starting video download...`);
    const downloadResponse = await axios.post(
      `${BACKEND_CONFIG.BASE_URL}/api/download`,
      { 
        url: youtubeUrl,
        platform: 'youtube'
      },
      { timeout: 30000 }
    );

    const downloadJobId = downloadResponse.data.jobId;
    if (!downloadJobId) {
      throw new Error('Backend did not return a download job ID');
    }
    console.log(`📥 [YouTube] Download job started: ${downloadJobId}`);

    // Poll download job until completed
    const downloadResult = await pollJobStatus(
      `${BACKEND_CONFIG.BASE_URL}/api/download/${downloadJobId}`,
      'Download',
      BACKEND_CONFIG.TIMEOUT_MS
    );

    const audioPath = downloadResult.result?.audioPath;
    const audioDuration = downloadResult.result?.duration;
    if (!audioPath) {
      throw new Error('Download completed but no audio path returned');
    }
    console.log(`✅ [YouTube] Video downloaded and audio extracted: ${audioPath}`);

    // Start transcription job
    console.log(`🤖 [YouTube] Starting transcription...`);
    const audioMinutes = audioDuration ? audioDuration / 60 : 15;
    const transcribeResponse = await axios.post(
      `${BACKEND_CONFIG.BASE_URL}/api/transcribe`,
      {
        audioFilePath: audioPath,
        language: language || 'en',
        audioMinutes: Math.ceil(audioMinutes)
      },
      { timeout: 30000 }
    );

    const transcribeJobId = transcribeResponse.data.jobId;
    if (!transcribeJobId) {
      throw new Error('Backend did not return a transcription job ID');
    }
    console.log(`🤖 [YouTube] Transcription job started: ${transcribeJobId}`);

    // Poll transcription job until completed
    const transcribeResult = await pollJobStatus(
      `${BACKEND_CONFIG.BASE_URL}/api/transcribe/${transcribeJobId}`,
      'Transcription',
      BACKEND_CONFIG.TIMEOUT_MS
    );

    const transcript = transcribeResult.result?.text;
    if (!transcript) {
      throw new Error('Transcription completed but no text returned');
    }
    console.log(`✅ [YouTube] Transcription complete (${transcript.length} chars)`);

    return `VIDEO TITLE: ${videoTitle || 'Unknown'}\n\nAUDIO TRANSCRIPTION:\n${transcript}`;
  } catch (error) {
    console.error('❌ [YouTube] Extraction failed:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network')) {
      console.warn('⚠️ [YouTube] Backend unavailable, using mock data for development');
      return getMockTranscript(videoId);
    }
    
    if (error.message.includes('404')) {
      throw new Error('Video not found. Please check the YouTube URL.');
    } else if (error.message.includes('403')) {
      throw new Error('Video is private or restricted.');
    } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      throw new Error('Video extraction took too long. Try a shorter video.');
    } else if (error.message.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to backend server. Please ensure the server is running.');
    }
    
    throw error;
  }
};

/**
 * Poll a job status endpoint until completion or failure
 * @private
 * @param {string} statusUrl - Full URL to poll
 * @param {string} label - Label for logging (e.g., 'Download', 'Transcription')
 * @param {number} timeoutMs - Maximum time to wait
 * @returns {Promise<Object>} - Completed job data
 */
const pollJobStatus = async (statusUrl, label, timeoutMs) => {
  const pollInterval = 3000; // Poll every 3 seconds
  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed > timeoutMs) {
      throw new Error(`${label} timed out after ${Math.round(elapsed / 1000)}s`);
    }

    // Wait before polling
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    try {
      const response = await axios.get(statusUrl, { timeout: 10000 });
      const job = response.data;

      console.log(`⏳ [${label}] Status: ${job.status}, Progress: ${job.progress}%`);

      if (job.status === 'completed') {
        return job;
      }

      if (job.status === 'failed') {
        throw new Error(
          job.error?.message || job.error || `${label} failed on server`
        );
      }

      // Continue polling for 'pending', 'processing', 'queued' statuses
    } catch (error) {
      // If it's our own thrown error (from failed status), rethrow
      if (error.message.includes('failed on server') || error.message.includes('timed out')) {
        throw error;
      }
      // Network errors during polling - log and retry
      console.warn(`⚠️ [${label}] Poll error (will retry): ${error.message}`);
    }
  }
};

/**
 * Get mock transcript for testing/development
 * @private
 */
const getMockTranscript = (videoId) => {
  // For testing, simulate various scenarios
  if (videoId === 'invalid' || videoId === 'not-found') {
    return null;
  }

  if (videoId === 'no-captions') {
    return null;
  }

  // Return mock transcript
  return `Welcome to today's recipe video! Today we're making delicious chocolate chip cookies.

INGREDIENTS:
2 and 1/4 cups all-purpose flour
1 teaspoon baking soda
1 teaspoon salt
1 cup butter, softened
3/4 cup granulated sugar
3/4 cup packed brown sugar
2 large eggs
2 teaspoons vanilla extract
2 cups chocolate chips

INSTRUCTIONS:
First, preheat your oven to 375 degrees Fahrenheit.
In a small bowl, combine the flour, baking soda, and salt.
In a larger bowl, beat the butter and both sugars together until creamy.
Add the eggs and vanilla extract to the butter mixture and beat well.
Gradually stir in the flour mixture until just combined.
Fold in the chocolate chips.
Drop rounded tablespoons of dough onto baking sheets.
Bake for 9 to 11 minutes or until golden brown.
Cool on baking sheets for 2 minutes, then transfer to wire racks.
Enjoy your homemade cookies!`;
};

/**
 * Fetch available languages for a video
 * @private
 */
const fetchAvailableLanguagesFromAPI = async (videoId) => {
  // Mock implementation
  if (videoId === 'multilang') {
    return ['en', 'es', 'fr', 'de'];
  }
  return ['en'];
};

/**
 * Handle API errors and determine if they're retryable
 * @param {Error} error - The error to check
 * @returns {Object} - {isRetryable, shouldThrow, message}
 */
export const analyzeTranscriptError = (error) => {
  const message = error.message || '';

  // Network errors - retryable
  if (message.includes('Network') || message.includes('timeout')) {
    return {
      isRetryable: true,
      shouldThrow: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }

  // 429 - Rate limited - retryable
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      isRetryable: true,
      shouldThrow: false,
      message: 'Rate limited. Please try again in a few moments.',
    };
  }

  // 404 - Not found - not retryable
  if (message.includes('404') || message.includes('not found')) {
    return {
      isRetryable: false,
      shouldThrow: true,
      message: 'Video not found. Please check the link and try again.',
    };
  }

  // 403 - Forbidden/Private - not retryable
  if (message.includes('403') || message.includes('private')) {
    return {
      isRetryable: false,
      shouldThrow: true,
      message: 'This video is private or restricted. Try another video.',
    };
  }

  // Generic error - not retryable
  return {
    isRetryable: false,
    shouldThrow: true,
    message: 'Failed to fetch transcript. Please try again.',
  };
};

/**
 * Download YouTube video via API
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} - {success, videoPath, metadata, error}
 */
export const downloadYoutubeVideo = async (url) => {
  try {
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'Invalid URL',
      };
    }

    const downloadResponse = await axios.post(
      `${BACKEND_CONFIG.BASE_URL}/api/download`,
      { 
        url,
        platform: 'youtube'
      },
      { timeout: BACKEND_CONFIG.TIMEOUT_MS }
    );

    return {
      success: downloadResponse.data.success,
      videoPath: downloadResponse.data.videoPath,
      metadata: downloadResponse.data.metadata,
      error: downloadResponse.data.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to download video',
    };
  }
};

/**
 * Get YouTube transcript via API (alias for getYoutubeTranscript)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} - {success, transcript, error}
 */
export const getTranscriptViaApi = async (videoId) => {
  return getYoutubeTranscript(videoId, 'en');
};

/**
 * Extract recipe from YouTube video
 * @param {string} url - YouTube URL
 * @param {Object} options - Options (timeout, etc.)
 * @returns {Promise<Object>} - {success, recipe, transcript, error}
 */
export const extractRecipeFromYoutube = async (url, options = {}) => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        success: false,
        error: 'Invalid YouTube URL',
      };
    }

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch || !videoIdMatch[1]) {
      return {
        success: false,
        error: 'Invalid YouTube URL format',
      };
    }

    const videoId = videoIdMatch[1];

    // Get transcript
    const transcriptResult = await getYoutubeTranscript(videoId);
    if (!transcriptResult.success) {
      return {
        success: false,
        error: transcriptResult.error,
      };
    }

    // For now, return the transcript as the recipe
    // In a real app, this would parse the transcript to extract recipe details
    return {
      success: true,
      recipe: {
        title: `Recipe from YouTube Video ${videoId}`,
        transcript: transcriptResult.transcript,
        sourceUrl: url,
        extractedAt: new Date().toISOString(),
      },
      transcript: transcriptResult.transcript,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to extract recipe from YouTube',
    };
  }
};

/**
 * Get YouTube content (transcript and metadata) for recipe extraction
 * This is the main function called by the RecipeLinkExtractionModal
 * @param {string} url - YouTube URL
 * @returns {Promise<Object|null>} - Content object or null on failure
 */
export const getYouTubeContent = async (url) => {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error('[YouTube] Invalid URL provided');
      return null;
    }

    console.log('[YouTube] Extracting content from:', url);

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch || !videoIdMatch[1]) {
      console.error('[YouTube] Could not extract video ID from URL');
      return null;
    }

    const videoId = videoIdMatch[1];
    console.log('[YouTube] Video ID:', videoId);

    // Get transcript via backend API
    const transcriptResult = await getYoutubeTranscript(videoId);
    
    if (!transcriptResult.success) {
      console.error('[YouTube] Failed to get transcript:', transcriptResult.error);
      return null;
    }

    console.log('[YouTube] Transcript retrieved successfully');

    // Return content in format expected by RecipeLinkExtractionModal
    return {
      url,
      videoId,
      title: `Recipe from YouTube Video ${videoId}`,
      content: transcriptResult.transcript,
      caption: transcriptResult.transcript,
      platform: 'youtube',
      extractedAt: new Date().toISOString(),
      language: transcriptResult.language || 'en',
    };
  } catch (error) {
    console.error('[YouTube] Error extracting content:', error.message);
    return null;
  }
};

/**
 * Default export for importing as youtubeExtractorService object
 */
export const youtubeExtractorService = {
  getYoutubeTranscript,
  getAvailableLanguages,
  getYoutubeTranscriptCached,
  parseTranscriptWithTimestamps,
  clearTranscriptCache,
  clearAllTranscriptCache,
  getCacheExpiration,
  analyzeTranscriptError,
  downloadYoutubeVideo,
  getTranscriptViaApi,
  extractRecipeFromYoutube,
  getYouTubeContent,
};
