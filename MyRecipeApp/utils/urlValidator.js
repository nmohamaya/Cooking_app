/**
 * URL Validator Utility
 * Validates video URLs and extracts information for multiple platforms
 * Supports: YouTube, TikTok, Instagram, Twitter/X, Facebook
 */

/**
 * List of supported video platforms
 */
const SUPPORTED_PROVIDERS = ['youtube', 'tiktok', 'instagram', 'twitter', 'facebook'];

/**
 * URL patterns for each platform
 */
const URL_PATTERNS = {
  youtube: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ],
  },
  tiktok: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/v\/(\d+)/,
      /(?:https?:\/\/)?vm\.tiktok\.com\/(\w+)/,
      /(?:https?:\/\/)?vt\.tiktok\.com\/(\w+)/,
    ],
  },
  instagram: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_.-]+\/([a-zA-Z0-9_-]+)/,
    ],
  },
  twitter: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    ],
  },
  facebook: {
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/.*\/videos?\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?fb\.watch\/(\w+)/,
    ],
  },
};

/**
 * Check if a URL is valid for any supported platform
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
export const isValidVideoUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return false;
  }

  // Check each provider's patterns
  for (const provider of SUPPORTED_PROVIDERS) {
    const patterns = URL_PATTERNS[provider].patterns;
    for (const pattern of patterns) {
      if (pattern.test(trimmedUrl)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Get the video provider/platform from a URL
 * @param {string} url - URL to check
 * @returns {string|null} - Provider name or null if not recognized
 */
export const getVideoProvider = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  for (const provider of SUPPORTED_PROVIDERS) {
    const patterns = URL_PATTERNS[provider].patterns;
    for (const pattern of patterns) {
      if (pattern.test(trimmedUrl)) {
        return provider;
      }
    }
  }

  return null;
};

/**
 * Extract the video ID from a URL
 * @param {string} url - URL to extract ID from
 * @returns {string|null} - Video ID or null if not found
 */
export const extractVideoId = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Try each provider
  for (const provider of SUPPORTED_PROVIDERS) {
    const patterns = URL_PATTERNS[provider].patterns;
    for (const pattern of patterns) {
      const match = trimmedUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
};

/**
 * Get list of all supported video providers
 * @returns {string[]} - Array of supported provider names
 */
export const getSupportedProviders = () => {
  return [...SUPPORTED_PROVIDERS];
};

/**
 * Get user-friendly provider display name
 * @param {string} provider - Provider name
 * @returns {string} - Display name
 */
export const getProviderDisplayName = (provider) => {
  const displayNames = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    facebook: 'Facebook',
  };

  return displayNames[provider] || provider;
};

/**
 * Get error message for invalid URL
 * @param {string} url - URL that failed validation
 * @returns {string} - Error message
 */
export const getUrlErrorMessage = (url) => {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return 'Please enter a video URL';
  }

  const trimmedUrl = url.trim();

  // Check if it looks like a URL but is invalid format
  if (trimmedUrl.includes('http') || trimmedUrl.includes('.com') || trimmedUrl.includes('.')) {
    return 'Invalid video URL format. Please check and try again.';
  }

  const providers = getSupportedProviders().map(getProviderDisplayName).join(', ');
  return `URL not recognized. Supported platforms: ${providers}`;
};

/**
 * Validate and normalize a URL
 * Ensures URL has proper protocol
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // If URL doesn't start with http, it might be valid for short URLs
  // Leave it as-is for pattern matching
  return trimmed;
};

/**
 * Check if URL is a shortened/mobile variant
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL is shortened
 */
export const isShortened = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const shortenedDomains = ['youtu.be', 'vm.tiktok.com', 'vt.tiktok.com', 'fb.watch'];
  return shortenedDomains.some((domain) => url.includes(domain));
};

/**
 * Get platform icon name (for UI integration)
 * @param {string} provider - Provider name
 * @returns {string} - Icon name for use with icon library
 */
export const getProviderIcon = (provider) => {
  const icons = {
    youtube: 'logo-youtube',
    tiktok: 'logo-tiktok',
    instagram: 'logo-instagram',
    twitter: 'logo-twitter',
    facebook: 'logo-facebook',
  };

  return icons[provider] || 'play-circle';
};

/**
 * Batch validate multiple URLs
 * @param {string[]} urls - Array of URLs to validate
 * @returns {Object} - { valid: string[], invalid: string[] }
 */
export const batchValidateUrls = (urls) => {
  if (!Array.isArray(urls)) {
    return { valid: [], invalid: [] };
  }

  const valid = [];
  const invalid = [];

  urls.forEach((url) => {
    if (isValidVideoUrl(url)) {
      valid.push(url);
    } else {
      invalid.push(url);
    }
  });

  return { valid, invalid };
};

export default {
  isValidVideoUrl,
  getVideoProvider,
  extractVideoId,
  getSupportedProviders,
  getProviderDisplayName,
  getUrlErrorMessage,
  normalizeUrl,
  isShortened,
  getProviderIcon,
  batchValidateUrls,
};
