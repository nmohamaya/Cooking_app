/**
 * URL Validator Tests
 * Comprehensive test coverage for video URL validation across multiple platforms
 */

import {
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
} from '../urlValidator';

describe('urlValidator', () => {
  // ========== isValidVideoUrl Tests ==========
  describe('isValidVideoUrl', () => {
    // YouTube tests
    it('should validate standard YouTube URL', () => {
      expect(isValidVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube URL without www', () => {
      expect(isValidVideoUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube shortened URL (youtu.be)', () => {
      expect(isValidVideoUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube URL without protocol', () => {
      expect(isValidVideoUrl('youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube embed URL', () => {
      expect(isValidVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });

    // TikTok tests
    it('should validate TikTok URL', () => {
      expect(isValidVideoUrl('https://www.tiktok.com/@username/video/1234567890')).toBe(true);
    });

    it('should validate TikTok shortened URL (vm.tiktok.com)', () => {
      expect(isValidVideoUrl('https://vm.tiktok.com/abc123xyz')).toBe(true);
    });

    it('should validate TikTok shortened URL (vt.tiktok.com)', () => {
      expect(isValidVideoUrl('https://vt.tiktok.com/abc123xyz')).toBe(true);
    });

    // Instagram tests
    it('should validate Instagram post URL', () => {
      expect(isValidVideoUrl('https://www.instagram.com/p/abc123xyz')).toBe(true);
    });

    it('should validate Instagram reel URL', () => {
      expect(isValidVideoUrl('https://www.instagram.com/reel/abc123xyz')).toBe(true);
    });

    // Twitter/X tests
    it('should validate Twitter URL', () => {
      expect(isValidVideoUrl('https://twitter.com/user/status/1234567890')).toBe(true);
    });

    it('should validate X (formerly Twitter) URL', () => {
      expect(isValidVideoUrl('https://x.com/user/status/1234567890')).toBe(true);
    });

    // Facebook tests
    it('should validate Facebook video URL', () => {
      expect(isValidVideoUrl('https://www.facebook.com/user/videos/1234567890')).toBe(true);
    });

    it('should validate Facebook watch URL (fb.watch)', () => {
      expect(isValidVideoUrl('https://fb.watch/abc123xyz/')).toBe(true);
    });

    // Invalid URL tests
    it('should reject invalid URL', () => {
      expect(isValidVideoUrl('https://example.com/video')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidVideoUrl('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidVideoUrl(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidVideoUrl(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(isValidVideoUrl(123)).toBe(false);
      expect(isValidVideoUrl({})).toBe(false);
      expect(isValidVideoUrl([])).toBe(false);
    });

    it('should reject URL with whitespace only', () => {
      expect(isValidVideoUrl('   ')).toBe(false);
    });
  });

  // ========== getVideoProvider Tests ==========
  describe('getVideoProvider', () => {
    it('should identify YouTube provider', () => {
      expect(getVideoProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    });

    it('should identify TikTok provider', () => {
      expect(getVideoProvider('https://www.tiktok.com/@username/video/1234567890')).toBe('tiktok');
    });

    it('should identify Instagram provider', () => {
      expect(getVideoProvider('https://www.instagram.com/p/abc123xyz')).toBe('instagram');
    });

    it('should identify Twitter provider', () => {
      expect(getVideoProvider('https://twitter.com/user/status/1234567890')).toBe('twitter');
    });

    it('should identify X provider', () => {
      expect(getVideoProvider('https://x.com/user/status/1234567890')).toBe('twitter');
    });

    it('should identify Facebook provider', () => {
      expect(getVideoProvider('https://www.facebook.com/user/videos/1234567890')).toBe('facebook');
    });

    it('should return null for invalid URL', () => {
      expect(getVideoProvider('https://example.com/video')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getVideoProvider('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(getVideoProvider(null)).toBeNull();
    });
  });

  // ========== extractVideoId Tests ==========
  describe('extractVideoId', () => {
    it('should extract YouTube video ID', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract YouTube ID from youtu.be', () => {
      expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract TikTok video ID', () => {
      expect(extractVideoId('https://www.tiktok.com/@username/video/1234567890')).toBe('1234567890');
    });

    it('should extract TikTok shortened ID', () => {
      expect(extractVideoId('https://vm.tiktok.com/abc123xyz')).toBe('abc123xyz');
    });

    it('should extract Instagram post ID', () => {
      expect(extractVideoId('https://www.instagram.com/p/abc123xyz')).toBe('abc123xyz');
    });

    it('should extract Twitter status ID', () => {
      expect(extractVideoId('https://twitter.com/user/status/1234567890')).toBe('1234567890');
    });

    it('should extract Facebook video ID', () => {
      expect(extractVideoId('https://www.facebook.com/user/videos/1234567890')).toBe('1234567890');
    });

    it('should return null for invalid URL', () => {
      expect(extractVideoId('https://example.com/video')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(extractVideoId(null)).toBeNull();
    });

    it('should handle URLs with extra parameters', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toBe('dQw4w9WgXcQ');
    });
  });

  // ========== getSupportedProviders Tests ==========
  describe('getSupportedProviders', () => {
    it('should return array of supported providers', () => {
      const providers = getSupportedProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBe(5);
    });

    it('should include all expected providers', () => {
      const providers = getSupportedProviders();
      expect(providers).toContain('youtube');
      expect(providers).toContain('tiktok');
      expect(providers).toContain('instagram');
      expect(providers).toContain('twitter');
      expect(providers).toContain('facebook');
    });
  });

  // ========== getProviderDisplayName Tests ==========
  describe('getProviderDisplayName', () => {
    it('should return YouTube display name', () => {
      expect(getProviderDisplayName('youtube')).toBe('YouTube');
    });

    it('should return TikTok display name', () => {
      expect(getProviderDisplayName('tiktok')).toBe('TikTok');
    });

    it('should return Instagram display name', () => {
      expect(getProviderDisplayName('instagram')).toBe('Instagram');
    });

    it('should return Twitter display name', () => {
      expect(getProviderDisplayName('twitter')).toBe('Twitter/X');
    });

    it('should return Facebook display name', () => {
      expect(getProviderDisplayName('facebook')).toBe('Facebook');
    });

    it('should return provider name for unknown provider', () => {
      expect(getProviderDisplayName('unknown')).toBe('unknown');
    });
  });

  // ========== getUrlErrorMessage Tests ==========
  describe('getUrlErrorMessage', () => {
    it('should return message for empty input', () => {
      expect(getUrlErrorMessage('')).toContain('enter');
    });

    it('should return message for null input', () => {
      expect(getUrlErrorMessage(null)).toContain('enter');
    });

    it('should return format error for http-like URL', () => {
      const message = getUrlErrorMessage('https://example.com/video');
      expect(message).toContain('Invalid');
      expect(message).toContain('format');
    });

    it('should suggest platforms for unrecognized URL', () => {
      const message = getUrlErrorMessage('not-a-url');
      expect(message).toContain('YouTube');
      expect(message).toContain('TikTok');
    });
  });

  // ========== normalizeUrl Tests ==========
  describe('normalizeUrl', () => {
    it('should trim whitespace from URL', () => {
      expect(normalizeUrl('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ')).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    });

    it('should handle empty string', () => {
      expect(normalizeUrl('')).toBe('');
    });

    it('should handle null input', () => {
      expect(normalizeUrl(null)).toBe('');
    });

    it('should return normalized URL unchanged if properly formatted', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(normalizeUrl(url)).toBe(url);
    });
  });

  // ========== isShortened Tests ==========
  describe('isShortened', () => {
    it('should identify youtu.be as shortened', () => {
      expect(isShortened('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should identify vm.tiktok.com as shortened', () => {
      expect(isShortened('https://vm.tiktok.com/abc123')).toBe(true);
    });

    it('should identify vt.tiktok.com as shortened', () => {
      expect(isShortened('https://vt.tiktok.com/abc123')).toBe(true);
    });

    it('should identify fb.watch as shortened', () => {
      expect(isShortened('https://fb.watch/abc123/')).toBe(true);
    });

    it('should return false for non-shortened URL', () => {
      expect(isShortened('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    });

    it('should handle null input', () => {
      expect(isShortened(null)).toBe(false);
    });
  });

  // ========== getProviderIcon Tests ==========
  describe('getProviderIcon', () => {
    it('should return YouTube icon', () => {
      expect(getProviderIcon('youtube')).toBe('logo-youtube');
    });

    it('should return TikTok icon', () => {
      expect(getProviderIcon('tiktok')).toBe('logo-tiktok');
    });

    it('should return Instagram icon', () => {
      expect(getProviderIcon('instagram')).toBe('logo-instagram');
    });

    it('should return Twitter icon', () => {
      expect(getProviderIcon('twitter')).toBe('logo-twitter');
    });

    it('should return Facebook icon', () => {
      expect(getProviderIcon('facebook')).toBe('logo-facebook');
    });

    it('should return default icon for unknown provider', () => {
      expect(getProviderIcon('unknown')).toBe('play-circle');
    });
  });

  // ========== batchValidateUrls Tests ==========
  describe('batchValidateUrls', () => {
    it('should separate valid and invalid URLs', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://invalid.com/video',
        'https://www.tiktok.com/@username/video/1234567890',
      ];
      const result = batchValidateUrls(urls);
      expect(result.valid.length).toBe(2);
      expect(result.invalid.length).toBe(1);
    });

    it('should handle empty array', () => {
      const result = batchValidateUrls([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('should handle non-array input', () => {
      const result = batchValidateUrls('not an array');
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('should handle all invalid URLs', () => {
      const urls = ['invalid1', 'invalid2', 'invalid3'];
      const result = batchValidateUrls(urls);
      expect(result.valid.length).toBe(0);
      expect(result.invalid.length).toBe(3);
    });

    it('should handle all valid URLs', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.tiktok.com/@username/video/1234567890',
        'https://twitter.com/user/status/1234567890',
      ];
      const result = batchValidateUrls(urls);
      expect(result.valid.length).toBe(3);
      expect(result.invalid.length).toBe(0);
    });
  });

  // ========== Edge Cases ==========
  describe('Edge cases', () => {
    it('should handle URLs with special characters', () => {
      expect(isValidVideoUrl('https://www.youtube.com/watch?v=abc_123-XYZ')).toBe(true);
    });

    it('should handle URLs with multiple query parameters', () => {
      expect(isValidVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s&list=ABC')).toBe(true);
    });

    it('should not validate with typos in domain', () => {
      expect(isValidVideoUrl('https://youtubee.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    });

    it('should handle case-insensitive URLs', () => {
      expect(isValidVideoUrl('HTTPS://WWW.YOUTUBE.COM/WATCH?V=dQw4w9WgXcQ')).toBe(false); // Pattern is case-sensitive by design
    });
  });
});
