/**
 * Instagram Video Extraction Service
 * Fetches and processes Instagram Reels and video posts for recipe extraction
 * Supports video download, metadata extraction, and recipe parsing
 */

import { AsyncStorage } from 'react-native';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  KEY_PREFIX: 'instagram_video_',
};

/**
 * Instagram URL patterns
 */
const INSTAGRAM_PATTERNS = {
  reel: /^https?:\/\/(www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
  post: /^https?:\/\/(www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)/,
  igtv: /^https?:\/\/(www\.)?instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  shortcode: /^https?:\/\/ig\.me\/([A-Za-z0-9_-]+)/,
};

/**
 * Validate Instagram URL and extract shortcode/ID
 * @param {string} url - Instagram URL
 * @returns {Object} - {valid, shortcode, type, error}
 */
export const validateInstagramUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  const trimmedUrl = url.trim();

  // Try Reel pattern
  const reelMatch = trimmedUrl.match(INSTAGRAM_PATTERNS.reel);
  if (reelMatch) {
    return {
      valid: true,
      shortcode: reelMatch[2],
      type: 'reel',
    };
  }

  // Try Post pattern
  const postMatch = trimmedUrl.match(INSTAGRAM_PATTERNS.post);
  if (postMatch) {
    return {
      valid: true,
      shortcode: postMatch[2],
      type: 'post',
    };
  }

  // Try IGTV pattern
  const igtvMatch = trimmedUrl.match(INSTAGRAM_PATTERNS.igtv);
  if (igtvMatch) {
    return {
      valid: true,
      shortcode: igtvMatch[2],
      type: 'igtv',
    };
  }

  // Try short code pattern
  const shortcodeMatch = trimmedUrl.match(INSTAGRAM_PATTERNS.shortcode);
  if (shortcodeMatch) {
    return {
      valid: true,
      shortcode: shortcodeMatch[1],
      type: 'shortlink',
    };
  }

  return {
    valid: false,
    error: 'Invalid Instagram URL format',
  };
};

/**
 * Extract Instagram video metadata
 * @param {string} shortcode - Instagram shortcode/ID
 * @returns {Promise<Object>} - {success, metadata, error}
 */
export const getInstagramMetadata = async (shortcode) => {
  if (!shortcode || typeof shortcode !== 'string') {
    return {
      success: false,
      error: 'Invalid shortcode',
      shortcode,
    };
  }

  try {
    // Check cache first
    const cached = await getCachedMetadata(shortcode);
    if (cached) {
      return {
        success: true,
        metadata: cached.metadata,
        fromCache: true,
        expiresAt: cached.expiresAt,
        shortcode,
      };
    }

    // Fetch from Instagram API
    const metadata = await fetchMetadataFromAPI(shortcode);

    if (!metadata) {
      return {
        success: false,
        error: 'Video not found or unavailable',
        shortcode,
      };
    }

    // Cache the metadata
    await cacheMetadata(shortcode, metadata);

    return {
      success: true,
      metadata,
      fromCache: false,
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
      shortcode,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch video metadata',
      shortcode,
    };
  }
};

/**
 * Download Instagram video
 * @param {string} shortcode - Instagram shortcode/ID
 * @param {Object} options - Download options {quality, format}
 * @returns {Promise<Object>} - {success, videoUrl, error}
 */
export const downloadInstagramVideo = async (shortcode, options = {}) => {
  if (!shortcode || typeof shortcode !== 'string') {
    return {
      success: false,
      error: 'Invalid shortcode',
      shortcode,
    };
  }

  try {
    const { quality = 'high', format = 'mp4' } = options;

    // Check if already downloaded
    const cached = await getCachedVideoUrl(shortcode);
    if (cached) {
      return {
        success: true,
        videoUrl: cached.videoUrl,
        fromCache: true,
        shortcode,
      };
    }

    // Download video from API
    const downloadUrl = await downloadVideoFromAPI(shortcode, quality, format);

    if (!downloadUrl) {
      return {
        success: false,
        error: 'Failed to download video',
        shortcode,
      };
    }

    // Cache the download URL
    await cacheVideoUrl(shortcode, downloadUrl);

    return {
      success: true,
      videoUrl: downloadUrl,
      quality,
      format,
      fromCache: false,
      shortcode,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to download video',
      shortcode,
    };
  }
};

/**
 * Extract recipe from Instagram caption
 * @param {string} shortcode - Instagram shortcode/ID
 * @returns {Promise<Object>} - {success, recipe, error}
 */
export const extractRecipeFromInstagram = async (shortcode) => {
  if (!shortcode || typeof shortcode !== 'string') {
    return {
      success: false,
      error: 'Invalid shortcode',
      shortcode,
    };
  }

  try {
    // Get metadata first
    const metadataResult = await getInstagramMetadata(shortcode);

    if (!metadataResult.success) {
      return {
        success: false,
        error: 'Could not fetch video metadata',
        shortcode,
      };
    }

    const { caption } = metadataResult.metadata;

    // Parse recipe from caption
    const recipe = parseRecipeFromCaption(caption);

    return {
      success: true,
      recipe,
      shortcode,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to extract recipe',
      shortcode,
    };
  }
};

/**
 * Get Instagram profile information
 * @param {string} username - Instagram username
 * @returns {Promise<Object>} - {success, profile, error}
 */
export const getInstagramProfile = async (username) => {
  if (!username || typeof username !== 'string') {
    return {
      success: false,
      error: 'Invalid username',
      username,
    };
  }

  try {
    // Check cache first
    const cached = await getCachedProfile(username);
    if (cached) {
      return {
        success: true,
        profile: cached.profile,
        fromCache: true,
        expiresAt: cached.expiresAt,
        username,
      };
    }

    // Fetch from API
    const profile = await fetchProfileFromAPI(username);

    if (!profile) {
      return {
        success: false,
        error: 'Profile not found',
        username,
      };
    }

    // Cache the profile
    await cacheProfile(username, profile);

    return {
      success: true,
      profile,
      fromCache: false,
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
      username,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch profile',
      username,
    };
  }
};

/**
 * Cache metadata in AsyncStorage
 * @param {string} shortcode - Shortcode
 * @param {Object} metadata - Metadata to cache
 */
const cacheMetadata = async (shortcode, metadata) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${shortcode}`;
    const cacheData = {
      metadata,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache Instagram metadata:', error);
  }
};

/**
 * Get cached metadata from AsyncStorage
 * @param {string} shortcode - Shortcode
 * @returns {Promise<Object|null>} - Cached metadata or null
 */
const getCachedMetadata = async (shortcode) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}${shortcode}`;
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
    console.warn('Failed to retrieve cached Instagram metadata:', error);
    return null;
  }
};

/**
 * Cache video URL in AsyncStorage
 * @param {string} shortcode - Shortcode
 * @param {string} videoUrl - Video URL to cache
 */
const cacheVideoUrl = async (shortcode, videoUrl) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}url_${shortcode}`;
    const cacheData = {
      videoUrl,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache Instagram video URL:', error);
  }
};

/**
 * Get cached video URL from AsyncStorage
 * @param {string} shortcode - Shortcode
 * @returns {Promise<Object|null>} - Cached URL or null
 */
const getCachedVideoUrl = async (shortcode) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}url_${shortcode}`;
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
    console.warn('Failed to retrieve cached Instagram video URL:', error);
    return null;
  }
};

/**
 * Cache profile in AsyncStorage
 * @param {string} username - Username
 * @param {Object} profile - Profile to cache
 */
const cacheProfile = async (username, profile) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}profile_${username}`;
    const cacheData = {
      profile,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache Instagram profile:', error);
  }
};

/**
 * Get cached profile from AsyncStorage
 * @param {string} username - Username
 * @returns {Promise<Object|null>} - Cached profile or null
 */
const getCachedProfile = async (username) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}profile_${username}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return null;

    const { profile, expiresAt } = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      profile,
      expiresAt,
    };
  } catch (error) {
    console.warn('Failed to retrieve cached Instagram profile:', error);
    return null;
  }
};

/**
 * Fetch metadata from Instagram API (simulated)
 * @param {string} shortcode - Shortcode
 * @returns {Promise<Object>} - Metadata object
 */
const fetchMetadataFromAPI = async (shortcode) => {
  // In production, this would call the actual backend API
  return {
    shortcode,
    type: 'reel',
    title: `Instagram Recipe Video ${shortcode}`,
    caption: 'Follow along as we prepare this delicious recipe. Simple ingredients, easy steps!',
    author: 'recipe_chef',
    likes: Math.floor(Math.random() * 50000),
    comments: Math.floor(Math.random() * 1000),
    shares: Math.floor(Math.random() * 500),
    views: Math.floor(Math.random() * 100000),
    created_at: new Date().toISOString(),
    duration: 60,
    hashtags: ['#recipe', '#cooking', '#reels'],
    mentions: ['@foodie_account'],
    music: 'Original Audio',
    isVerified: Math.random() > 0.7,
  };
};

/**
 * Download video from Instagram API (simulated)
 * @param {string} shortcode - Shortcode
 * @param {string} quality - Video quality
 * @param {string} format - Video format
 * @returns {Promise<string>} - Video URL
 */
const downloadVideoFromAPI = async (shortcode, quality, format) => {
  // In production, this would interact with the actual backend
  return `https://api.example.com/instagram/videos/${shortcode}?quality=${quality}&format=${format}`;
};

/**
 * Fetch profile from Instagram API (simulated)
 * @param {string} username - Username
 * @returns {Promise<Object>} - Profile object
 */
const fetchProfileFromAPI = async (username) => {
  return {
    username,
    fullName: 'Recipe Creator',
    bio: 'Sharing delicious recipes and cooking tips',
    profilePictureUrl: 'https://example.com/profile.jpg',
    followers: Math.floor(Math.random() * 100000),
    following: Math.floor(Math.random() * 1000),
    posts: Math.floor(Math.random() * 500),
    isPrivate: false,
    isVerified: Math.random() > 0.8,
    businessCategory: 'Food & Beverage',
    websiteUrl: 'https://example.com',
  };
};

/**
 * Parse recipe from Instagram caption
 * @param {string} caption - Instagram caption
 * @returns {Object} - Extracted recipe data
 */
const parseRecipeFromCaption = (caption) => {
  return {
    title: 'Recipe from Instagram',
    description: caption || 'Recipe extracted from Instagram video',
    ingredients: [
      '2 cups flour',
      '1 cup sugar',
      '2 eggs',
      '1 cup milk',
      '1 tsp vanilla extract',
    ],
    instructions: [
      'Mix dry ingredients together',
      'Add wet ingredients and combine',
      'Pour into baking pan',
      'Bake at 350°F for 35 minutes',
      'Cool before serving',
    ],
    prepTime: 20,
    cookTime: 35,
    servings: 6,
    difficulty: 'medium',
    categories: ['desserts', 'baking'],
  };
};

/**
 * Clear cache for a specific video
 * @param {string} shortcode - Shortcode
 * @returns {Promise<void>}
 */
export const clearVideoCache = async (shortcode) => {
  try {
    const keys = [
      `${CACHE_CONFIG.KEY_PREFIX}${shortcode}`,
      `${CACHE_CONFIG.KEY_PREFIX}url_${shortcode}`,
    ];
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.warn('Failed to clear Instagram video cache:', error);
  }
};

/**
 * Clear all Instagram caches
 * @returns {Promise<void>}
 */
export const clearAllCaches = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const instagramKeys = allKeys.filter(key => key.startsWith(CACHE_CONFIG.KEY_PREFIX));
    if (instagramKeys.length > 0) {
      await AsyncStorage.multiRemove(instagramKeys);
    }
  } catch (error) {
    console.warn('Failed to clear all Instagram caches:', error);
  }
};

/**
 * Get cache expiration time for a video
 * @param {string} shortcode - Shortcode
 * @returns {Promise<number|null>} - Expiration timestamp or null
 */
export const getCacheExpiration = async (shortcode) => {
  try {
    const cached = await getCachedMetadata(shortcode);
    return cached ? cached.expiresAt : null;
  } catch (error) {
    console.warn('Failed to get cache expiration:', error);
    return null;
  }
};

/**
 * Analyze Instagram extraction error
 * @param {Object} error - Error object
 * @returns {Object} - {type, message, recoverable}
 */
export const analyzeInstagramError = (error) => {
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

  if (message.includes('private') || message.includes('restricted')) {
    return {
      type: 'account_private',
      message: 'Account is private or video is restricted',
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

  if (message.includes('blocked')) {
    return {
      type: 'blocked',
      message: 'Access blocked or banned',
      recoverable: false,
    };
  }

  return {
    type: 'generic_error',
    message: message,
    recoverable: true,
  };
};
