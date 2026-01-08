/**
 * YouTube Transcript Extraction Service - API Integrated
 * Fetches and caches YouTube transcripts/captions for recipe videos
 * Integrates with backend API for transcript extraction and recipe parsing
 */

import { AsyncStorage } from 'react-native';
import apiClient from './apiClient';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  KEY_PREFIX: 'youtube_transcript_',
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
 * Fetch transcript from YouTube API
 * @private
 * In production, this would use youtube-transcript-api or similar
 */
const fetchTranscriptFromAPI = async (videoId, language) => {
  // Mock implementation - in production use actual API
  // Example using youtube-transcript-api:
  // const { getTranscript } = require('youtube-transcript-api');
  // return await getTranscript(videoId, { lang: language });

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

// ============= API Integration Functions =============

/**
 * Extract recipe from YouTube video using backend API
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<Object>} - {success, recipe, confidence, error}
 */
export const extractRecipeFromYoutube = async (youtubeUrl) => {
  if (!youtubeUrl || typeof youtubeUrl !== 'string') {
    return {
      success: false,
      error: 'Invalid YouTube URL',
    };
  }

  try {
    // Step 1: Download video
    const downloadResult = await apiClient.downloadVideo(youtubeUrl, {
      platform: 'youtube',
    });

    if (!downloadResult.success) {
      return {
        success: false,
        error: downloadResult.message || 'Failed to download video',
      };
    }

    // Step 2: Transcribe audio
    const transcriptResult = await apiClient.transcribeAudio(
      downloadResult.videoPath || youtubeUrl,
      { language: 'auto' }
    );

    if (!transcriptResult.success) {
      return {
        success: false,
        error: transcriptResult.message || 'Failed to transcribe',
      };
    }

    // Step 3: Extract recipe
    const recipeResult = await apiClient.extractRecipe(
      transcriptResult.transcript,
      { aiModel: 'gpt-3.5-turbo' }
    );

    if (!recipeResult.success) {
      return {
        success: false,
        error: recipeResult.message || 'Failed to extract recipe',
      };
    }

    return {
      success: true,
      recipe: recipeResult.recipe,
      confidence: recipeResult.confidence,
      transcript: transcriptResult.transcript,
      language: transcriptResult.language,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to extract recipe from YouTube',
    };
  }
};

/**
 * Download YouTube video via backend API
 * @param {string} youtubeUrl - YouTube video URL
 * @param {Object} options - Download options {quality}
 * @returns {Promise<Object>} - {success, jobId, progress, error}
 */
export const downloadYoutubeVideo = async (youtubeUrl, options = {}) => {
  if (!youtubeUrl || typeof youtubeUrl !== 'string') {
    return {
      success: false,
      error: 'Invalid YouTube URL',
    };
  }

  try {
    const { quality = 'high' } = options;

    const result = await apiClient.downloadVideo(youtubeUrl, {
      platform: 'youtube',
      quality,
    });

    return result.success
      ? {
          success: true,
          jobId: result.jobId,
          progress: result.progress,
          videoPath: result.videoPath,
        }
      : {
          success: false,
          error: result.message || 'Download failed',
        };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to download YouTube video',
    };
  }
};

/**
 * Get transcript using backend transcription API
 * @param {string} youtubeUrl - YouTube video URL or path to audio
 * @param {Object} options - Options {language}
 * @returns {Promise<Object>} - {success, transcript, language, error}
 */
export const getTranscriptViaApi = async (youtubeUrl, options = {}) => {
  if (!youtubeUrl) {
    return {
      success: false,
      error: 'Invalid input',
    };
  }

  try {
    const { language = 'auto' } = options;

    const result = await apiClient.transcribeAudio(youtubeUrl, { language });

    return result.success
      ? {
          success: true,
          transcript: result.transcript,
          language: result.language,
          confidence: result.confidence,
        }
      : {
          success: false,
          error: result.message || 'Transcription failed',
        };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to get transcript',
    };
  }
};
