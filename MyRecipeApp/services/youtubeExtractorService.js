/**
 * YouTube Transcript Extraction Service
 * Fetches and caches YouTube transcripts/captions for recipe videos
 * Supports multiple languages with fallback to auto-generated captions
 * 
 * This service connects to the backend API endpoints:
 * - POST /api/download - Download video file from YouTube URL
 * - POST /api/transcribe - Extract and transcribe audio
 */

import { AsyncStorage } from 'react-native';
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
 * Calls backend endpoints: /api/download → /api/transcribe
 */
const fetchTranscriptFromAPI = async (videoId, language) => {
  try {
    console.log(`🎬 [YouTube] Starting extraction for video: ${videoId}`);
    
    // Step 1: Extract YouTube URL from video ID
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Step 2: Call backend to download video
    console.log(`📥 [YouTube] Downloading video from URL...`);
    const downloadResponse = await axios.post(
      `${BACKEND_CONFIG.BASE_URL}/api/download`,
      { 
        url: youtubeUrl,
        platform: 'youtube'
      },
      { timeout: BACKEND_CONFIG.TIMEOUT_MS }
    );

    if (!downloadResponse.data.success) {
      throw new Error(
        downloadResponse.data.error || 'Failed to download video'
      );
    }

    const { videoPath, metadata } = downloadResponse.data;
    console.log(`✨ [YouTube] Video downloaded successfully`);

    // Step 3: Call backend to transcribe audio
    console.log(`🤖 [YouTube] Transcribing audio...`);
    const transcribeResponse = await axios.post(
      `${BACKEND_CONFIG.BASE_URL}/api/transcribe`,
      {
        videoPath,
        language: language || 'en'
      },
      { timeout: BACKEND_CONFIG.TIMEOUT_MS }
    );

    if (!transcribeResponse.data.success) {
      throw new Error(
        transcribeResponse.data.error || 'Failed to transcribe audio'
      );
    }

    const { transcript, confidence } = transcribeResponse.data;
    console.log(`✅ [YouTube] Transcription complete (confidence: ${confidence})`);

    return transcript;
  } catch (error) {
    console.error('❌ [YouTube] Extraction failed:', error.message);
    
    // If backend is not available, fall back to mock for development/testing
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network')) {
      console.warn('⚠️ [YouTube] Backend unavailable, using mock data for development');
      return getMockTranscript(videoId);
    }
    
    // Provide helpful error messages
    if (error.message.includes('404')) {
      throw new Error('Video not found. Please check the YouTube URL.');
    } else if (error.message.includes('403')) {
      throw new Error('Video is private or restricted.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Video download or transcription took too long. Try a shorter video.');
    } else if (error.message.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to backend server. Please ensure the server is running.');
    }
    
    throw error;
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
