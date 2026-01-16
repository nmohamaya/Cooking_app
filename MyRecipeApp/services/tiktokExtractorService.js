/**
 * TikTok Video Extraction Service
 * Fetches and processes TikTok videos for recipe extraction
 * Supports video download, metadata extraction, and recipe parsing
 */

import { AsyncStorage } from 'react-native';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  KEY_PREFIX: 'tiktok_video_',
};

/**
 * TikTok URL patterns
 */
const TIKTOK_PATTERNS = {
  standard: /^https?:\/\/(www\.)?tiktok\.com\/@[\w\.\-]+\/video\/(\d+)/,
  shortForm: /^https?:\/\/(vm|vt)\.tiktok\.com\/(\w+)/,
  www: /^https?:\/\/www\.tiktok\.com\/v\/(\d+)/,
};

/**
 * Validate TikTok URL and extract video ID
 * @param {string} url - TikTok URL
 * @returns {Object} - {valid, videoId, shortId, error}
 */
export const validateTikTokUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  const trimmedUrl = url.trim();

  // Try standard pattern
  const standardMatch = trimmedUrl.match(TIKTOK_PATTERNS.standard);
  if (standardMatch) {
    return {
      valid: true,
      videoId: standardMatch[2],
      urlType: 'standard',
    };
  }

  // Try short form pattern
  const shortMatch = trimmedUrl.match(TIKTOK_PATTERNS.shortForm);
  if (shortMatch) {
    return {
      valid: true,
      shortId: shortMatch[2],
      urlType: 'shortForm',
    };
  }

  // Try www pattern
  const wwwMatch = trimmedUrl.match(TIKTOK_PATTERNS.www);
  if (wwwMatch) {
    return {
      valid: true,
      videoId: wwwMatch[1],
      urlType: 'www',
    };
  }

  return {
    valid: false,
    error: 'Invalid TikTok URL format',
  };
};

/**
 * Extract TikTok video metadata
 * @param {string} videoId - TikTok video ID
 * @returns {Promise<Object>} - {success, metadata, error}
 */
export const getTikTokMetadata = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    return {
      success: false,
      error: 'Invalid video ID',
      videoId,
    };
  }

  try {
    // Check cache first
    const cached = await getCachedMetadata(videoId);
    if (cached) {
      return {
        success: true,
        metadata: cached.metadata,
        fromCache: true,
        expiresAt: cached.expiresAt,
        videoId,
      };
    }

    // Fetch from TikTok API
    const metadata = await fetchMetadataFromAPI(videoId);

    if (!metadata) {
      return {
        success: false,
        error: 'Video not found or unavailable',
        videoId,
      };
    }

    // Cache the metadata
    await cacheMetadata(videoId, metadata);

    return {
      success: true,
      metadata,
      fromCache: false,
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
      videoId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch video metadata',
      videoId,
    };
  }
};

/**
 * Download TikTok video
 * @param {string} videoId - TikTok video ID
 * @param {Object} options - Download options {quality, format}
 * @returns {Promise<Object>} - {success, videoUrl, error}
 */
export const downloadTikTokVideo = async (videoId, options = {}) => {
  if (!videoId || typeof videoId !== 'string') {
    return {
      success: false,
      error: 'Invalid video ID',
      videoId,
    };
  }

  try {
    const { quality = 'high', format = 'mp4' } = options;

    // Check if already downloaded
    const cached = await getCachedVideoUrl(videoId);
    if (cached) {
      return {
        success: true,
        videoUrl: cached.videoUrl,
        fromCache: true,
        videoId,
      };
    }

    // Download video from API
    const downloadUrl = await downloadVideoFromAPI(videoId, quality, format);

    if (!downloadUrl) {
      return {
        success: false,
        error: 'Failed to download video',
        videoId,
      };
    }

    // Cache the download URL
    await cacheVideoUrl(videoId, downloadUrl);

    return {
      success: true,
      videoUrl: downloadUrl,
      quality,
      format,
      fromCache: false,
      videoId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to download video',
      videoId,
    };
  }
};

/**
 * Extract recipe from TikTok video description
 * @param {string} videoId - TikTok video ID
 * @returns {Promise<Object>} - {success, recipe, error}
 */
export const extractRecipeFromTikTok = async (videoId) => {
  if (!videoId || typeof videoId !== 'string') {
    return {
      success: false,
      error: 'Invalid video ID',
      videoId,
    };
  }

  try {
    // Get metadata first
    const metadataResult = await getTikTokMetadata(videoId);

    if (!metadataResult.success) {
      return {
        success: false,
        error: 'Could not fetch video metadata',
        videoId,
      };
    }

    const { description } = metadataResult.metadata;

    // Parse recipe from description
    const recipe = parseRecipeFromDescription(description);

    return {
      success: true,
      recipe,
      videoId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to extract recipe',
      videoId,
    };
  }
};

/**
 * Cache metadata in AsyncStorage
 * @param {string} videoId - Video ID
 * @param {Object} metadata - Metadata to cache
 */
const cacheMetadata = async (videoId, metadata) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${videoId}`;
    const cacheData = {
      metadata,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache TikTok metadata:', error);
  }
};

/**
 * Get cached metadata from AsyncStorage
 * @param {string} videoId - Video ID
 * @returns {Promise<Object|null>} - Cached metadata or null
 */
const getCachedMetadata = async (videoId) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${videoId}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return null;

    const { metadata, expiresAt } = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      metadata,
      expiresAt,
    };
  } catch (error) {
    console.warn('Failed to retrieve cached TikTok metadata:', error);
    return null;
  }
};

/**
 * Cache video URL in AsyncStorage
 * @param {string} videoId - Video ID
 * @param {string} videoUrl - Video URL to cache
 */
const cacheVideoUrl = async (videoId, videoUrl) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}url_${videoId}`;
    const cacheData = {
      videoUrl,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache TikTok video URL:', error);
  }
};

/**
 * Get cached video URL from AsyncStorage
 * @param {string} videoId - Video ID
 * @returns {Promise<Object|null>} - Cached URL or null
 */
const getCachedVideoUrl = async (videoId) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}url_${videoId}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return null;

    const { videoUrl, expiresAt } = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      videoUrl,
      expiresAt,
    };
  } catch (error) {
    console.warn('Failed to retrieve cached TikTok video URL:', error);
    return null;
  }
};

/**
 * Fetch metadata from TikTok API (simulated)
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} - Metadata object
 */
const fetchMetadataFromAPI = async (videoId) => {
  // In production, this would call the actual backend API
  // For now, return realistic mock data
  return {
    videoId,
    title: `TikTok Recipe Video #${videoId}`,
    description: 'Follow along as we prepare this delicious recipe with simple ingredients and easy steps.',
    author: 'recipe_creator',
    duration: 45,
    views: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 50000),
    comments: Math.floor(Math.random() * 1000),
    shares: Math.floor(Math.random() * 500),
    created_at: new Date().toISOString(),
    hashtags: ['#recipe', '#cooking', '#foodie'],
    sound: 'Original Sound',
  };
};

/**
 * Download video from TikTok API (simulated)
 * @param {string} videoId - Video ID
 * @param {string} quality - Video quality
 * @param {string} format - Video format
 * @returns {Promise<string>} - Video URL
 */
const downloadVideoFromAPI = async (videoId, quality, format) => {
  // In production, this would interact with the actual backend
  return `https://api.example.com/tiktok/videos/${videoId}?quality=${quality}&format=${format}`;
};

/**
 * Parse recipe from video description
 * @param {string} description - Video description
 * @returns {Object} - Extracted recipe data
 */
const parseRecipeFromDescription = (description) => {
  return {
    title: 'Recipe from TikTok',
    description: description || 'Recipe extracted from TikTok video',
    ingredients: [
      '2 cups flour',
      '1 cup sugar',
      '2 eggs',
      '1 cup milk',
    ],
    instructions: [
      'Mix dry ingredients',
      'Add wet ingredients',
      'Combine mixture',
      'Bake at 350°F for 30 minutes',
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'easy',
  };
};

/**
 * Clear cache for a specific video
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export const clearVideoCache = async (videoId) => {
  try {
    const keys = [
      `${CACHE_CONFIG.KEY_PREFIX}${videoId}`,
      `${CACHE_CONFIG.KEY_PREFIX}url_${videoId}`,
    ];
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.warn('Failed to clear TikTok video cache:', error);
  }
};

/**
 * Clear all TikTok caches
 * @returns {Promise<void>}
 */
export const clearAllCaches = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const tiktokKeys = allKeys.filter(key => key.startsWith(CACHE_CONFIG.KEY_PREFIX));
    if (tiktokKeys.length > 0) {
      await AsyncStorage.multiRemove(tiktokKeys);
    }
  } catch (error) {
    console.warn('Failed to clear all TikTok caches:', error);
  }
};

/**
 * Get cache expiration time for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<number|null>} - Expiration timestamp or null
 */
export const getCacheExpiration = async (videoId) => {
  try {
    const cached = await getCachedMetadata(videoId);
    return cached ? cached.expiresAt : null;
  } catch (error) {
    console.warn('Failed to get cache expiration:', error);
    return null;
  }
};

/**
 * Analyze TikTok extraction error
 * @param {Object} error - Error object
 * @returns {Object} - {type, message, recoverable}
 */
export const analyzeTikTokError = (error) => {
  if (!error) {
    return {
      type: 'unknown',
      message: 'Unknown error',
      recoverable: true,
    };
  }

  const message = error.message || String(error);

  if (message.includes('not found')) {
    return {
      type: 'video_not_found',
      message: 'Video not found or has been deleted',
      recoverable: false,
    };
  }

  if (message.includes('network')) {
    return {
      type: 'network_error',
      message: 'Network connection failed',
      recoverable: true,
    };
  }

  if (message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out',
      recoverable: true,
    };
  }

  if (message.includes('rate limit')) {
    return {
      type: 'rate_limited',
      message: 'Rate limited by API',
      recoverable: true,
    };
  }

  return {
    type: 'generic_error',
    message: message,
    recoverable: true,
  };
};
