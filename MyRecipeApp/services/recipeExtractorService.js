/**
 * Recipe Link Extraction Service
 * Validates and parses recipe video links from multiple platforms (YouTube, TikTok, Instagram)
 * This is the foundation service for the recipe extraction feature
 */

/**
 * Supported platforms
 */
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
};

/**
 * URL regex patterns for each platform
 */
const URL_PATTERNS = {
  youtube: [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ],
  tiktok: [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/(\d+)/,
    /(?:https?:\/\/)?vt\.tiktok\.com\/([\w]+)/,
    /(?:https?:\/\/)?m\.tiktok\.com\/v\/(\d+)/,
    /(?:https?:\/\/)?vm\.tiktok\.com\/([\w]+)/,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/v\/(\d+)/,
  ],
  instagram: [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([\w-]+)/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/([\w-]+)/,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reels\/([\w-]+)/,
    /(?:https?:\/\/)?instagram\.com\/s\/([\w=-]+)/,
  ],
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid format
 */
const isValidUrl = (url) => {
  try {
    // Normalize to lowercase for URL validation
    new URL(url.toLowerCase());
    return true;
  } catch {
    // Try adding protocol if missing
    try {
      new URL(`https://${url.toLowerCase()}`);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Parse recipe link and extract metadata
 * @param {string} url - Recipe link to parse
 * @returns {Object} - Parsed metadata {platform, videoId, url, isValid, error}
 */
export const parseRecipeLink = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Invalid URL: URL must be a non-empty string',
    };
  }

  const trimmedUrl = url.trim();

  if (!isValidUrl(trimmedUrl)) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  const platform = getPlatformFromUrl(trimmedUrl);

  if (!platform) {
    return {
      isValid: false,
      error: 'Unsupported platform. Please use YouTube, TikTok, or Instagram links.',
      url: trimmedUrl,
    };
  }

  let videoId = null;

  if (platform === PLATFORMS.YOUTUBE) {
    const validation = validateYoutubeUrl(trimmedUrl);
    if (!validation.isValid) {
      return {
        isValid: false,
        platform,
        error: validation.error,
        url: trimmedUrl,
      };
    }
    videoId = validation.videoId;
  } else if (platform === PLATFORMS.TIKTOK) {
    const validation = validateTiktokUrl(trimmedUrl);
    if (!validation.isValid) {
      return {
        isValid: false,
        platform,
        error: validation.error,
        url: trimmedUrl,
      };
    }
    videoId = validation.videoId;
  } else if (platform === PLATFORMS.INSTAGRAM) {
    const validation = validateInstagramUrl(trimmedUrl);
    if (!validation.isValid) {
      return {
        isValid: false,
        platform,
        error: validation.error,
        url: trimmedUrl,
      };
    }
    videoId = validation.postId;
  }

  return {
    isValid: true,
    platform,
    videoId,
    url: normalizeRecipeUrl(trimmedUrl),
  };
};

/**
 * Detect platform from URL
 * @param {string} url - URL to check
 * @returns {string|null} - Platform name or null if not recognized
 */
export const getPlatformFromUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const lowerUrl = url.toLowerCase();

  if (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('youtube')
  ) {
    return PLATFORMS.YOUTUBE;
  }

  if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vm.tiktok') || lowerUrl.includes('vt.tiktok')) {
    return PLATFORMS.TIKTOK;
  }

  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagram')) {
    return PLATFORMS.INSTAGRAM;
  }

  return null;
};

/**
 * Normalize recipe URL
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
export const normalizeRecipeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let normalized = url.trim().toLowerCase();

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // Remove query parameters and fragments
  const urlObj = new URL(normalized);
  const cleanUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;

  return cleanUrl;
};

/**
 * Validate YouTube URL
 * @param {string} url - YouTube URL to validate
 * @returns {Object} - Validation result {isValid, videoId, error}
 */
export const validateYoutubeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Invalid YouTube URL',
    };
  }

  // Create case-insensitive patterns
  const caseInsensitivePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?youtu\.be\/watch\?v=([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of caseInsensitivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      // YouTube video IDs are always 11 characters
      if (videoId.length === 11) {
        return {
          isValid: true,
          videoId,
        };
      }
    }
  }

  return {
    isValid: false,
    error: 'Invalid YouTube URL format or video ID',
  };
};

/**
 * Validate TikTok URL
 * @param {string} url - TikTok URL to validate
 * @returns {Object} - Validation result {isValid, videoId, error}
 */
export const validateTiktokUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Invalid TikTok URL',
    };
  }

  // Create case-insensitive patterns
  const caseInsensitivePatterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/(\d+)/i,
    /(?:https?:\/\/)?vt\.tiktok\.com\/([\w]+)/i,
    /(?:https?:\/\/)?m\.tiktok\.com\/v\/(\d+)/i,
    /(?:https?:\/\/)?vm\.tiktok\.com\/([\w]+)/i,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/v\/(\d+)/i,
  ];

  for (const pattern of caseInsensitivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      if (videoId && videoId.length > 0) {
        return {
          isValid: true,
          videoId,
        };
      }
    }
  }

  return {
    isValid: false,
    error: 'Invalid TikTok URL format or video ID',
  };
};

/**
 * Validate Instagram URL
 * @param {string} url - Instagram URL to validate
 * @returns {Object} - Validation result {isValid, postId, error}
 */
export const validateInstagramUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'Invalid Instagram URL',
    };
  }

  // Create case-insensitive patterns for matching
  const caseInsensitivePatterns = [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([\w-]+)/i,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/([\w-]+)/i,
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reels\/([\w-]+)/i,
    /(?:https?:\/\/)?instagram\.com\/s\/([\w=-]+)/i,
  ];

  for (const pattern of caseInsensitivePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const postId = match[1];
      if (postId && postId.length > 0) {
        return {
          isValid: true,
          postId,
        };
      }
    }
  }

  return {
    isValid: false,
    error: 'Invalid Instagram URL format or post ID',
  };
};

/**
 * Check if URL is a valid recipe link (any supported platform)
 * @param {string} url - URL to check
 * @returns {boolean} - True if URL is valid recipe link
 */
export const isValidRecipeLink = (url) => {
  const result = parseRecipeLink(url);
  return result.isValid === true;
};
