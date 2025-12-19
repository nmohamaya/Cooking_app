/**
 * Social Media Extractor Service
 * Handles extracting transcripts/captions from TikTok and Instagram videos
 * with caching, error handling, and fallback strategies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseRecipeLink } from './recipeExtractorService';

// Cache TTL: 1 hour (same as YouTube for consistency)
const CACHE_TTL = 3600000; // ms

// Cache key prefixes
const CACHE_PREFIX = {
  TIKTOK: 'tiktok_content_',
  INSTAGRAM: 'instagram_content_',
  AVAILABLE_METHODS: 'available_methods_'
};

/**
 * Get TikTok video content (captions/text from description)
 * @param {string} videoId - TikTok video ID
 * @returns {Promise<{success: boolean, content: string, platform: string, videoId: string, fromCache: boolean, expiresAt: number, error?: string}>}
 */
export const getTikTokContent = async (videoId) => {
  try {
    if (!videoId || typeof videoId !== 'string') {
      return {
        success: false,
        content: null,
        platform: 'tiktok',
        videoId,
        fromCache: false,
        error: 'Invalid video ID'
      };
    }

    // Check cache first
    const cachedData = await getTikTokContentCached(videoId);
    if (cachedData) {
      return {
        success: true,
        content: cachedData.content,
        platform: 'tiktok',
        videoId,
        fromCache: true,
        expiresAt: cachedData.expiresAt,
        error: null
      };
    }

    // Try to fetch from TikTok API mock
    const content = await fetchTikTokContent(videoId);
    if (!content) {
      throw new Error('Failed to fetch TikTok content');
    }

    // Cache the result
    const expiresAt = Date.now() + CACHE_TTL;
    await AsyncStorage.setItem(
      `${CACHE_PREFIX.TIKTOK}${videoId}`,
      JSON.stringify({ content, videoId, cachedAt: Date.now(), expiresAt })
    );

    return {
      success: true,
      content,
      platform: 'tiktok',
      videoId,
      fromCache: false,
      expiresAt,
      error: null
    };
  } catch (error) {
    const errorInfo = analyzeSocialMediaError(error);
    return {
      success: false,
      content: null,
      platform: 'tiktok',
      videoId,
      fromCache: false,
      error: errorInfo.message
    };
  }
};

/**
 * Get Instagram post/reel content (captions/text from description)
 * @param {string} postId - Instagram post/reel ID
 * @returns {Promise<{success: boolean, content: string, platform: string, postId: string, fromCache: boolean, expiresAt: number, error?: string}>}
 */
export const getInstagramContent = async (postId) => {
  try {
    if (!postId || typeof postId !== 'string') {
      return {
        success: false,
        content: null,
        platform: 'instagram',
        postId,
        fromCache: false,
        error: 'Invalid post ID'
      };
    }

    // Check cache first
    const cachedData = await getInstagramContentCached(postId);
    if (cachedData) {
      return {
        success: true,
        content: cachedData.content,
        platform: 'instagram',
        postId,
        fromCache: true,
        expiresAt: cachedData.expiresAt,
        error: null
      };
    }

    // Try to fetch from Instagram API mock
    const content = await fetchInstagramContent(postId);
    if (!content) {
      throw new Error('Failed to fetch Instagram content');
    }

    // Cache the result
    const expiresAt = Date.now() + CACHE_TTL;
    await AsyncStorage.setItem(
      `${CACHE_PREFIX.INSTAGRAM}${postId}`,
      JSON.stringify({ content, postId, cachedAt: Date.now(), expiresAt })
    );

    return {
      success: true,
      content,
      platform: 'instagram',
      postId,
      fromCache: false,
      expiresAt,
      error: null
    };
  } catch (error) {
    const errorInfo = analyzeSocialMediaError(error);
    return {
      success: false,
      content: null,
      platform: 'instagram',
      postId,
      fromCache: false,
      error: errorInfo.message
    };
  }
};

/**
 * Get social media content with caching (throws on error)
 * @param {string} url - Social media video/post URL
 * @returns {Promise<{content: string, platform: string, fromCache: boolean, expiresAt: number}>}
 */
export const getSocialMediaContentCached = async (url) => {
  const linkData = parseRecipeLink(url);
  
  if (!linkData.isValid) {
    throw new Error('Invalid social media URL');
  }

  if (linkData.platform === 'tiktok') {
    const result = await getTikTokContent(linkData.videoId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch TikTok content');
    }
    return {
      content: result.content,
      platform: 'tiktok',
      fromCache: result.fromCache,
      expiresAt: result.expiresAt
    };
  } else if (linkData.platform === 'instagram') {
    const result = await getInstagramContent(linkData.videoId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch Instagram content');
    }
    return {
      content: result.content,
      platform: 'instagram',
      fromCache: result.fromCache,
      expiresAt: result.expiresAt
    };
  } else {
    throw new Error('Unsupported platform');
  }
};

/**
 * Get available extraction methods for a video/post
 * Some platforms may have multiple extraction methods (e.g., captions, description, comments)
 * @param {string} videoId - Video/post ID
 * @param {string} platform - Platform name (tiktok or instagram)
 * @returns {Promise<Array<string>>} - Available methods: ['captions', 'description', 'comments']
 */
export const getAvailableExtractionMethods = async (videoId, platform) => {
  try {
    const cacheKey = `${CACHE_PREFIX.AVAILABLE_METHODS}${platform}_${videoId}`;
    
    // Check cache
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.expiresAt > Date.now()) {
        return data.methods;
      }
    }

    // Mock data - in reality would check actual platform for available methods
    let methods = [];
    if (platform === 'tiktok') {
      // TikTok typically has: descriptions, hashtags, sounds
      methods = ['description', 'hashtags'];
    } else if (platform === 'instagram') {
      // Instagram typically has: captions, hashtags, comments
      methods = ['caption', 'hashtags'];
    }

    // Cache for TTL
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        methods,
        expiresAt: Date.now() + CACHE_TTL
      })
    );

    return methods;
  } catch (error) {
    console.warn(`Failed to get available extraction methods: ${error.message}`);
    return [];
  }
};

/**
 * Clear cached TikTok content
 * @param {string} videoId - Optional video ID to clear specific cache
 */
export const clearTikTokCache = async (videoId) => {
  try {
    if (videoId) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX.TIKTOK}${videoId}`);
    } else {
      // Clear all TikTok cache
      const keys = await AsyncStorage.getAllKeys();
      const tikTokKeys = keys.filter(key => key.startsWith(CACHE_PREFIX.TIKTOK));
      await AsyncStorage.multiRemove(tikTokKeys);
    }
  } catch (error) {
    console.warn(`Failed to clear TikTok cache: ${error.message}`);
  }
};

/**
 * Clear cached Instagram content
 * @param {string} postId - Optional post ID to clear specific cache
 */
export const clearInstagramCache = async (postId) => {
  try {
    if (postId) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX.INSTAGRAM}${postId}`);
    } else {
      // Clear all Instagram cache
      const keys = await AsyncStorage.getAllKeys();
      const instaKeys = keys.filter(key => key.startsWith(CACHE_PREFIX.INSTAGRAM));
      await AsyncStorage.multiRemove(instaKeys);
    }
  } catch (error) {
    console.warn(`Failed to clear Instagram cache: ${error.message}`);
  }
};

/**
 * Clear all social media cache
 */
export const clearAllSocialMediaCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const socialKeys = keys.filter(key => 
      key.startsWith(CACHE_PREFIX.TIKTOK) || 
      key.startsWith(CACHE_PREFIX.INSTAGRAM) ||
      key.startsWith(CACHE_PREFIX.AVAILABLE_METHODS)
    );
    await AsyncStorage.multiRemove(socialKeys);
  } catch (error) {
    console.warn('Failed to clear all social media cache:', error);
  }
};

/**
 * Get cache expiration time
 * @param {string} id - Video/post ID
 * @param {string} platform - Platform name
 * @returns {Promise<number|null>} - Expiration timestamp or null if not cached
 */
export const getCacheExpiration = async (id, platform) => {
  try {
    const prefix = platform === 'tiktok' ? CACHE_PREFIX.TIKTOK : CACHE_PREFIX.INSTAGRAM;
    const cached = await AsyncStorage.getItem(`${prefix}${id}`);
    if (cached) {
      const data = JSON.parse(cached);
      return data.expiresAt;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to get cache expiration: ${error.message}`);
    return null;
  }
};

/**
 * Check if cached data is still valid (not expired)
 * @param {string} id - Video/post ID
 * @param {string} platform - Platform name
 * @returns {Promise<boolean>} - True if cache is valid, false if expired or not found
 */
export const isCacheValid = async (id, platform) => {
  try {
    const expiresAt = await getCacheExpiration(id, platform);
    if (!expiresAt) return false;
    return expiresAt > Date.now();
  } catch (error) {
    console.warn(`Failed to check cache validity: ${error.message}`);
    return false;
  }
};

/**
 * Parse content for key phrases and metadata
 * Extract hashtags, mentions, and potential recipe ingredients
 * @param {string} content - Text content to parse
 * @returns {Object} - {hashtags: [], mentions: [], keywords: []}
 */
export const parseContentMetadata = (content) => {
  if (!content || typeof content !== 'string') {
    return { hashtags: [], mentions: [], keywords: [] };
  }

  // Extract hashtags (#word)
  const hashtagMatch = content.match(/#\w+/g) || [];
  const hashtags = hashtagMatch.map(tag => tag.substring(1));

  // Extract mentions (@username)
  const mentionMatch = content.match(/@\w+/g) || [];
  const mentions = mentionMatch.map(mention => mention.substring(1));

  // Extract potential recipe keywords
  const recipeKeywords = [
    'recipe', 'ingredient', 'cup', 'tablespoon', 'teaspoon', 'salt', 'pepper',
    'flour', 'sugar', 'butter', 'egg', 'milk', 'mix', 'cook', 'bake', 'fry',
    'boil', 'simmer', 'minutes', 'hours', 'degree', 'heat', 'oven', 'stove',
    'baking', 'homemade', 'dessert', 'chocolate', 'chip', 'cookies'
  ];
  const contentLower = content.toLowerCase();
  const keywords = recipeKeywords.filter(keyword => contentLower.includes(keyword));

  return { hashtags, mentions, keywords };
};

// ============================================================================
// INTERNAL/PRIVATE FUNCTIONS
// ============================================================================

/**
 * Fetch TikTok content (API mock)
 * @private
 */
async function fetchTikTokContent(videoId) {
  // Mock API call - replace with real API when available
  // For now, return sample content
  
  if (!videoId || videoId.length < 3) {
    throw new Error('Invalid TikTok video ID');
  }

  // Simulate API call
  return `TikTok Video Recipe - ${videoId}: 
    #recipe #cooking #viral
    Ingredients: 2 cups flour, 1 cup sugar, butter, eggs
    Instructions: Mix dry ingredients, combine with wet ingredients, bake at 350°F for 25-30 minutes
    @chefexample #foodtiktok`;
}

/**
 * Fetch Instagram content (API mock)
 * @private
 */
async function fetchInstagramContent(postId) {
  // Mock API call - replace with real API when available
  
  if (!postId || postId.length < 3) {
    throw new Error('Invalid Instagram post ID');
  }

  // Simulate API call
  return `Instagram Recipe Post - ${postId}:
    🍳 Classic Chocolate Chip Cookies
    Caption: Just made these amazing cookies! 🍪
    #recipe #baking #homemade #dessert
    Ingredients: flour, butter, sugar, eggs, vanilla, chocolate chips
    Method: Mix, fold in chips, bake 12-14 minutes at 375°F`;
}

/**
 * Get cached TikTok content if valid
 * @private
 */
async function getTikTokContentCached(videoId) {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX.TIKTOK}${videoId}`);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if not expired
      if (data.expiresAt > Date.now()) {
        return data;
      }
      // Remove expired cache
      await AsyncStorage.removeItem(`${CACHE_PREFIX.TIKTOK}${videoId}`);
    }
    return null;
  } catch (error) {
    console.warn('Failed to retrieve cached TikTok content:', error);
    return null;
  }
}

/**
 * Get cached Instagram content if valid
 * @private
 */
async function getInstagramContentCached(postId) {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX.INSTAGRAM}${postId}`);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if not expired
      if (data.expiresAt > Date.now()) {
        return data;
      }
      // Remove expired cache
      await AsyncStorage.removeItem(`${CACHE_PREFIX.INSTAGRAM}${postId}`);
    }
    return null;
  } catch (error) {
    console.warn('Failed to retrieve cached Instagram content:', error);
    return null;
  }
}

/**
 * Analyze social media errors and provide user-friendly messages
 * @private
 */
function analyzeSocialMediaError(error) {
  const message = error?.message || '';

  if (message.includes('private') || message.includes('restricted')) {
    return {
      isRetryable: false,
      shouldThrow: true,
      message: 'This post is private or restricted. Unable to extract content.'
    };
  } else if (message.includes('not found') || message.includes('404')) {
    return {
      isRetryable: false,
      shouldThrow: true,
      message: 'Video or post not found. Please check the URL.'
    };
  } else if (message.includes('network') || message.includes('timeout')) {
    return {
      isRetryable: true,
      shouldThrow: false,
      message: 'Network error. Please try again.'
    };
  } else if (message.includes('rate limit') || message.includes('429')) {
    return {
      isRetryable: true,
      shouldThrow: false,
      message: 'Rate limit reached. Please wait a moment and try again.'
    };
  } else {
    return {
      isRetryable: false,
      shouldThrow: true,
      message: 'Failed to extract content from this post.'
    };
  }
}
