/**
 * Recipe Extractor Service Tests
 * Comprehensive test suite for link validation and parsing
 */

import {
  parseRecipeLink,
  getPlatformFromUrl,
  normalizeRecipeUrl,
  validateYoutubeUrl,
  validateTiktokUrl,
  validateInstagramUrl,
  isValidRecipeLink,
  PLATFORMS,
} from '../services/recipeExtractorService';

describe('recipeExtractorService', () => {
  describe('getPlatformFromUrl', () => {
    test('should detect YouTube platform from youtube.com URL', () => {
      expect(getPlatformFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        PLATFORMS.YOUTUBE
      );
    });

    test('should detect YouTube platform from youtu.be URL', () => {
      expect(getPlatformFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(PLATFORMS.YOUTUBE);
    });

    test('should detect YouTube platform from youtube URL without protocol', () => {
      expect(getPlatformFromUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe(PLATFORMS.YOUTUBE);
    });

    test('should detect TikTok platform from tiktok.com URL', () => {
      expect(getPlatformFromUrl('https://www.tiktok.com/@username/video/123456789')).toBe(
        PLATFORMS.TIKTOK
      );
    });

    test('should detect TikTok platform from vt.tiktok.com URL', () => {
      expect(getPlatformFromUrl('https://vt.tiktok.com/abc123def/')).toBe(PLATFORMS.TIKTOK);
    });

    test('should detect TikTok platform from vm.tiktok.com URL', () => {
      expect(getPlatformFromUrl('https://vm.tiktok.com/abc123/')).toBe(PLATFORMS.TIKTOK);
    });

    test('should detect Instagram platform from instagram.com URL', () => {
      expect(getPlatformFromUrl('https://www.instagram.com/p/abc123def/')).toBe(
        PLATFORMS.INSTAGRAM
      );
    });

    test('should detect Instagram platform from instagram reel URL', () => {
      expect(getPlatformFromUrl('https://www.instagram.com/reel/abc123def/')).toBe(
        PLATFORMS.INSTAGRAM
      );
    });

    test('should return null for unknown platform', () => {
      expect(getPlatformFromUrl('https://vimeo.com/123456789')).toBeNull();
    });

    test('should return null for empty string', () => {
      expect(getPlatformFromUrl('')).toBeNull();
    });

    test('should return null for null', () => {
      expect(getPlatformFromUrl(null)).toBeNull();
    });

    test('should be case insensitive', () => {
      expect(getPlatformFromUrl('HTTPS://YOUTUBE.COM/WATCH?V=dQw4w9WgXcQ')).toBe(
        PLATFORMS.YOUTUBE
      );
    });
  });

  describe('normalizeRecipeUrl', () => {
    test('should add https protocol to URL without protocol', () => {
      const result = normalizeRecipeUrl('youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toContain('https://');
    });

    test('should remove query parameters from YouTube URL', () => {
      const result = normalizeRecipeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
      expect(result).not.toContain('?');
      expect(result).toContain('youtube.com/watch');
    });

    test('should remove fragments from URL', () => {
      const result = normalizeRecipeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ#comments');
      expect(result).not.toContain('#');
    });

    test('should trim whitespace', () => {
      const result = normalizeRecipeUrl('  https://youtube.com/watch?v=dQw4w9WgXcQ  ');
      expect(result).not.toContain(' ');
    });

    test('should return empty string for null', () => {
      expect(normalizeRecipeUrl(null)).toBe('');
    });

    test('should return empty string for empty string', () => {
      expect(normalizeRecipeUrl('')).toBe('');
    });

    test('should preserve pathname for TikTok short URLs', () => {
      const result = normalizeRecipeUrl('https://vt.tiktok.com/abc123def/');
      expect(result).toContain('vt.tiktok.com');
    });
  });

  describe('validateYoutubeUrl', () => {
    test('should validate standard YouTube URL', () => {
      const result = validateYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should validate YouTube short URL (youtu.be)', () => {
      const result = validateYoutubeUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should validate YouTube short URL without protocol', () => {
      const result = validateYoutubeUrl('youtu.be/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should validate YouTube embed URL', () => {
      const result = validateYoutubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should validate YouTube mobile URL', () => {
      const result = validateYoutubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should validate YouTube /v/ format', () => {
      const result = validateYoutubeUrl('https://youtube.com/v/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should reject invalid YouTube URL', () => {
      const result = validateYoutubeUrl('https://www.youtube.com/watch?v=invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject URL with missing video ID', () => {
      const result = validateYoutubeUrl('https://www.youtube.com/watch?v=');
      expect(result.isValid).toBe(false);
    });

    test('should reject non-YouTube URL', () => {
      const result = validateYoutubeUrl('https://vimeo.com/123456');
      expect(result.isValid).toBe(false);
    });

    test('should reject null', () => {
      const result = validateYoutubeUrl(null);
      expect(result.isValid).toBe(false);
    });

    test('should reject empty string', () => {
      const result = validateYoutubeUrl('');
      expect(result.isValid).toBe(false);
    });

    test('should handle YouTube URL with extra parameters', () => {
      const result = validateYoutubeUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLxxx'
      );
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });
  });

  describe('validateTiktokUrl', () => {
    test('should validate standard TikTok URL', () => {
      const result = validateTiktokUrl('https://www.tiktok.com/@username/video/123456789');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('123456789');
    });

    test('should validate TikTok short URL (vt.tiktok.com)', () => {
      const result = validateTiktokUrl('https://vt.tiktok.com/abc123def/');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('abc123def');
    });

    test('should validate TikTok short URL (vm.tiktok.com)', () => {
      const result = validateTiktokUrl('https://vm.tiktok.com/abc123/');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('abc123');
    });

    test('should validate TikTok mobile URL', () => {
      const result = validateTiktokUrl('https://m.tiktok.com/v/123456789');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('123456789');
    });

    test('should validate TikTok /v/ format', () => {
      const result = validateTiktokUrl('https://www.tiktok.com/v/123456789');
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('123456789');
    });

    test('should reject invalid TikTok URL', () => {
      const result = validateTiktokUrl('https://www.tiktok.com/@username/video/');
      expect(result.isValid).toBe(false);
    });

    test('should reject non-TikTok URL', () => {
      const result = validateTiktokUrl('https://instagram.com/p/abc123def');
      expect(result.isValid).toBe(false);
    });

    test('should reject null', () => {
      const result = validateTiktokUrl(null);
      expect(result.isValid).toBe(false);
    });

    test('should reject empty string', () => {
      const result = validateTiktokUrl('');
      expect(result.isValid).toBe(false);
    });

    test('should handle TikTok URL with parameters', () => {
      const result = validateTiktokUrl('https://vt.tiktok.com/abc123def/?lang=en');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateInstagramUrl', () => {
    test('should validate standard Instagram post URL', () => {
      const result = validateInstagramUrl('https://www.instagram.com/p/abc123def/');
      expect(result.isValid).toBe(true);
      expect(result.postId).toBe('abc123def');
    });

    test('should validate Instagram reel URL (reel)', () => {
      const result = validateInstagramUrl('https://www.instagram.com/reel/abc123def/');
      expect(result.isValid).toBe(true);
      expect(result.postId).toBe('abc123def');
    });

    test('should validate Instagram reel URL (reels)', () => {
      const result = validateInstagramUrl('https://www.instagram.com/reels/abc123def/');
      expect(result.isValid).toBe(true);
      expect(result.postId).toBe('abc123def');
    });

    test('should validate Instagram share URL', () => {
      const result = validateInstagramUrl('https://www.instagram.com/s/aGF1dGV1ciBkZQ==/');
      expect(result.isValid).toBe(true);
      expect(result.postId).toBe('aGF1dGV1ciBkZQ==');
    });

    test('should reject invalid Instagram URL', () => {
      const result = validateInstagramUrl('https://www.instagram.com/username/');
      expect(result.isValid).toBe(false);
    });

    test('should reject Instagram URL with missing post ID', () => {
      const result = validateInstagramUrl('https://www.instagram.com/p/');
      expect(result.isValid).toBe(false);
    });

    test('should reject non-Instagram URL', () => {
      const result = validateInstagramUrl('https://facebook.com/photo.php?fbid=123');
      expect(result.isValid).toBe(false);
    });

    test('should reject null', () => {
      const result = validateInstagramUrl(null);
      expect(result.isValid).toBe(false);
    });

    test('should reject empty string', () => {
      const result = validateInstagramUrl('');
      expect(result.isValid).toBe(false);
    });

    test('should handle Instagram URL with parameters', () => {
      const result = validateInstagramUrl('https://www.instagram.com/p/abc123def/?utm_source=ig_web');
      expect(result.isValid).toBe(true);
    });
  });

  describe('parseRecipeLink', () => {
    test('should parse valid YouTube link', () => {
      const result = parseRecipeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(PLATFORMS.YOUTUBE);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.url).toBeDefined();
    });

    test('should parse valid TikTok link', () => {
      const result = parseRecipeLink('https://www.tiktok.com/@username/video/123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(PLATFORMS.TIKTOK);
      expect(result.videoId).toBe('123456789');
    });

    test('should parse valid Instagram link', () => {
      const result = parseRecipeLink('https://www.instagram.com/reel/abc123def/');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(PLATFORMS.INSTAGRAM);
      expect(result.videoId).toBe('abc123def');
    });

    test('should add protocol to link without protocol', () => {
      const result = parseRecipeLink('youtu.be/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(PLATFORMS.YOUTUBE);
    });

    test('should reject invalid URL format', () => {
      const result = parseRecipeLink('not a valid url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject unsupported platform', () => {
      const result = parseRecipeLink('https://vimeo.com/123456789');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });

    test('should reject null', () => {
      const result = parseRecipeLink(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject empty string', () => {
      const result = parseRecipeLink('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject non-string input', () => {
      const result = parseRecipeLink(12345);
      expect(result.isValid).toBe(false);
    });

    test('should handle YouTube link with whitespace', () => {
      const result = parseRecipeLink('  https://youtu.be/dQw4w9WgXcQ  ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe(PLATFORMS.YOUTUBE);
    });

    test('should handle invalid video ID for YouTube', () => {
      const result = parseRecipeLink('https://www.youtube.com/watch?v=short');
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe(PLATFORMS.YOUTUBE);
    });

    test('should normalize URL in result', () => {
      const result = parseRecipeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
      expect(result.isValid).toBe(true);
      expect(result.url).not.toContain('&t=10s');
    });
  });

  describe('isValidRecipeLink', () => {
    test('should return true for valid YouTube link', () => {
      expect(isValidRecipeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    test('should return true for valid TikTok link', () => {
      expect(isValidRecipeLink('https://www.tiktok.com/@username/video/123456789')).toBe(true);
    });

    test('should return true for valid Instagram link', () => {
      expect(isValidRecipeLink('https://www.instagram.com/reel/abc123def/')).toBe(true);
    });

    test('should return false for invalid link', () => {
      expect(isValidRecipeLink('not a link')).toBe(false);
    });

    test('should return false for unsupported platform', () => {
      expect(isValidRecipeLink('https://vimeo.com/123456')).toBe(false);
    });

    test('should return false for null', () => {
      expect(isValidRecipeLink(null)).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(isValidRecipeLink('')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    test('should handle YouTube URL with multiple query parameters', () => {
      const result = parseRecipeLink(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=PLxxx&index=1'
      );
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should handle Instagram URL with dashes in post ID', () => {
      const result = parseRecipeLink('https://www.instagram.com/p/ABC-123_def/');
      expect(result.isValid).toBe(true);
    });

    test('should handle TikTok URL with mixed case', () => {
      const result = parseRecipeLink('HTTPS://WWW.TIKTOK.COM/@Username/video/123456789');
      expect(result.isValid).toBe(true);
    });

    test('should handle URL with international characters in username', () => {
      // Note: This might depend on how URLs are handled
      const result = getPlatformFromUrl('https://www.instagram.com/@user_123/');
      expect(result).toBe(PLATFORMS.INSTAGRAM);
    });

    test('should reject malformed YouTube short URL', () => {
      const result = parseRecipeLink('https://youtu.be/');
      expect(result.isValid).toBe(false);
    });

    test('should reject TikTok URL with invalid format', () => {
      const result = parseRecipeLink('https://tiktok.com/invalid');
      expect(result.isValid).toBe(false);
    });

    test('should handle YouTube URL case insensitivity', () => {
      const result = parseRecipeLink('HTTPS://YOUTU.BE/dQw4w9WgXcQ');
      expect(result.isValid).toBe(true);
    });
  });
});
