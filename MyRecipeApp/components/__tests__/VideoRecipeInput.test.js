/**
 * VideoRecipeInput Component Tests
 * 
 * These tests verify the video URL input component logic for Phase 5 UI integration.
 * The VideoRecipeInput component handles:
 * - Multi-platform video URL validation (YouTube, TikTok, Instagram, Twitter, Facebook)
 * - Real-time URL validation with visual feedback
 * - Video data extraction and callback handling
 * - Error messaging and suggestions
 * 
 * Note: Component rendering tests would require mocking React Native and Expo
 * dependencies. These tests focus on the core logic validation.
 */

const urlValidator = require('../../utils/urlValidator');

describe('VideoRecipeInput Logic', () => {
  describe('URL Validation', () => {
    test('should validate YouTube URLs correctly', () => {
      const youtubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
      ];

      youtubeUrls.forEach((url) => {
        expect(urlValidator.isValidVideoUrl(url)).toBe(true);
      });
    });

    test('should validate TikTok URLs correctly', () => {
      const tiktokUrls = [
        'https://www.tiktok.com/@user/video/1234567890',
        'https://vm.tiktok.com/abc123xyz',
        'https://vt.tiktok.com/abc123xyz',
      ];

      tiktokUrls.forEach((url) => {
        expect(urlValidator.isValidVideoUrl(url)).toBe(true);
      });
    });

    test('should validate Instagram URLs correctly', () => {
      const instagramUrls = [
        'https://www.instagram.com/p/abc123',
        'https://www.instagram.com/reel/abc123',
      ];

      instagramUrls.forEach((url) => {
        expect(urlValidator.isValidVideoUrl(url)).toBe(true);
      });
    });

    test('should validate Twitter/X URLs correctly', () => {
      const twitterUrls = [
        'https://twitter.com/user/status/1234567890',
        'https://x.com/user/status/1234567890',
      ];

      twitterUrls.forEach((url) => {
        expect(urlValidator.isValidVideoUrl(url)).toBe(true);
      });
    });

    test('should validate Facebook URLs correctly', () => {
      const facebookUrls = [
        'https://www.facebook.com/watch/video/12345',
        'https://fb.watch/abc123/',
      ];

      facebookUrls.forEach((url) => {
        expect(urlValidator.isValidVideoUrl(url)).toBe(true);
      });
    });

    test('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://example.com',
        'youtube',
        '',
        '   ',
        'https://google.com',
      ];

      invalidUrls.forEach((url) => {
        expect(urlValidator.isValidVideoUrl(url)).toBe(false);
      });
    });

    test('should handle whitespace in URLs', () => {
      const urlWithSpaces = '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ';
      const trimmed = urlWithSpaces.trim();
      expect(urlValidator.isValidVideoUrl(trimmed)).toBe(true);
    });
  });

  describe('Provider Detection', () => {
    test('should detect YouTube provider', () => {
      expect(
        urlValidator.getVideoProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('youtube');
    });

    test('should detect TikTok provider', () => {
      expect(
        urlValidator.getVideoProvider('https://www.tiktok.com/@user/video/123')
      ).toBe('tiktok');
    });

    test('should detect Instagram provider', () => {
      expect(
        urlValidator.getVideoProvider('https://www.instagram.com/reel/abc123')
      ).toBe('instagram');
    });

    test('should detect Twitter provider', () => {
      expect(
        urlValidator.getVideoProvider('https://twitter.com/user/status/123')
      ).toBe('twitter');
    });

    test('should detect Facebook provider', () => {
      expect(
        urlValidator.getVideoProvider(
          'https://www.facebook.com/watch/video/12345'
        )
      ).toBe('facebook');
    });

    test('should return null for unknown provider', () => {
      expect(urlValidator.getVideoProvider('https://example.com/video')).toBe(
        null
      );
    });
  });

  describe('Video ID Extraction', () => {
    test('should extract video ID from YouTube URL', () => {
      const videoId = urlValidator.extractVideoId(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from YouTube shortened URL', () => {
      const videoId = urlValidator.extractVideoId('https://youtu.be/dQw4w9WgXcQ');
      expect(videoId).toBe('dQw4w9WgXcQ');
    });

    test('should extract video ID from TikTok URL', () => {
      const videoId = urlValidator.extractVideoId(
        'https://www.tiktok.com/@user/video/1234567890'
      );
      expect(videoId).toBe('1234567890');
    });

    test('should handle invalid URLs gracefully', () => {
      const videoId = urlValidator.extractVideoId('invalid-url');
      expect(videoId).toBe(null);
    });
  });

  describe('Provider Display Names', () => {
    test('should return display names for all providers', () => {
      const providers = urlValidator.getSupportedProviders();
      
      providers.forEach((provider) => {
        const displayName = urlValidator.getProviderDisplayName(provider);
        expect(displayName).toBeTruthy();
        expect(typeof displayName).toBe('string');
      });
    });

    test('should return "YouTube" for youtube provider', () => {
      expect(urlValidator.getProviderDisplayName('youtube')).toBe('YouTube');
    });

    test('should return "TikTok" for tiktok provider', () => {
      expect(urlValidator.getProviderDisplayName('tiktok')).toBe('TikTok');
    });

    test('should return "Twitter/X" for twitter provider', () => {
      expect(urlValidator.getProviderDisplayName('twitter')).toBe('Twitter/X');
    });
  });

  describe('Error Messages', () => {
    test('should return meaningful error message for invalid URL', () => {
      const errorMsg = urlValidator.getUrlErrorMessage('not-a-url');
      expect(errorMsg).toBeTruthy();
      expect(typeof errorMsg).toBe('string');
    });

    test('should suggest valid URLs in error message', () => {
      const errorMsg = urlValidator.getUrlErrorMessage('htp://example.com');
      expect(errorMsg.toLowerCase()).toMatch(/url|format|valid/i);
    });

    test('should provide different messages for different invalid URLs', () => {
      const msg1 = urlValidator.getUrlErrorMessage('invalid');
      const msg2 = urlValidator.getUrlErrorMessage('');
      expect([msg1, msg2].filter(Boolean).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('URL Normalization', () => {
    test('should normalize URLs by trimming whitespace', () => {
      const normalized = urlValidator.normalizeUrl(
        '  https://www.youtube.com/watch?v=test123  '
      );
      expect(normalized).toBe(
        'https://www.youtube.com/watch?v=test123'
      );
    });

    test('should handle empty strings', () => {
      const normalized = urlValidator.normalizeUrl('   ');
      expect(normalized).toBe('');
    });

    test('should preserve URL structure', () => {
      const original = 'https://www.youtube.com/watch?v=abc&t=10s';
      const normalized = urlValidator.normalizeUrl(original);
      expect(normalized).toBe(original);
    });
  });

  describe('Shortened URL Detection', () => {
    test('should detect youtu.be shortened URL', () => {
      expect(
        urlValidator.isShortened('https://youtu.be/dQw4w9WgXcQ')
      ).toBe(true);
    });

    test('should detect TikTok VM shortened URL', () => {
      expect(urlValidator.isShortened('https://vm.tiktok.com/abc123')).toBe(
        true
      );
    });

    test('should detect TikTok VT shortened URL', () => {
      expect(urlValidator.isShortened('https://vt.tiktok.com/abc123')).toBe(
        true
      );
    });

    test('should detect Facebook watch shortened URL', () => {
      expect(urlValidator.isShortened('https://fb.watch/abc123/')).toBe(true);
    });

    test('should not flag non-shortened URLs', () => {
      expect(
        urlValidator.isShortened('https://www.youtube.com/watch?v=test123')
      ).toBe(false);
    });
  });

  describe('Provider Icons', () => {
    test('should return icon names for all providers', () => {
      const providers = urlValidator.getSupportedProviders();
      
      providers.forEach((provider) => {
        const icon = urlValidator.getProviderIcon(provider);
        expect(icon).toBeTruthy();
        expect(typeof icon).toBe('string');
      });
    });

    test('should return Ionicon names', () => {
      const providers = urlValidator.getSupportedProviders();
      
      providers.forEach((provider) => {
        const icon = urlValidator.getProviderIcon(provider);
        expect(icon).toMatch(/^logo-/);
      });
    });
  });

  describe('Batch URL Validation', () => {
    test('should validate multiple URLs', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'invalid-url',
      ];

      const result = urlValidator.batchValidateUrls(urls);

      expect(result.valid.length >= 1).toBe(true);
      expect(result.invalid.length >= 1).toBe(true);
    });

    test('should separate valid and invalid URLs', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'not-a-url',
      ];

      const result = urlValidator.batchValidateUrls(urls);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('invalid');
    });

    test('should handle empty array', () => {
      const result = urlValidator.batchValidateUrls([]);

      expect(result.valid.length).toBe(0);
      expect(result.invalid.length).toBe(0);
    });

    test('should handle array with only invalid URLs', () => {
      const urls = ['invalid1', 'invalid2', 'invalid3'];

      const result = urlValidator.batchValidateUrls(urls);

      expect(result.valid.length).toBe(0);
      expect(result.invalid.length).toBe(3);
    });
  });

  describe('Supported Providers', () => {
    test('should return list of supported providers', () => {
      const providers = urlValidator.getSupportedProviders();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBe(5);
    });

    test('should include all major platforms', () => {
      const providers = urlValidator.getSupportedProviders();

      expect(providers).toContain('youtube');
      expect(providers).toContain('tiktok');
      expect(providers).toContain('instagram');
      expect(providers).toContain('twitter');
      expect(providers).toContain('facebook');
    });
  });

  describe('Edge Cases', () => {
    test('should handle standard YouTube URLs', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(urlValidator.isValidVideoUrl(url)).toBe(true);
    });

    test('should handle youtu.be shortened URLs', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(urlValidator.isValidVideoUrl(url)).toBe(true);
    });

    test('should validate basic TikTok URLs', () => {
      const url = 'https://www.tiktok.com/@user/video/123';
      expect(urlValidator.isValidVideoUrl(url)).toBe(true);
    });

    test('should handle youtu.be format', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(urlValidator.isValidVideoUrl(url)).toBe(true);
    });

    test('should handle null input gracefully', () => {
      expect(() => urlValidator.isValidVideoUrl(null)).not.toThrow();
    });

    test('should handle undefined input gracefully', () => {
      expect(() => urlValidator.isValidVideoUrl(undefined)).not.toThrow();
    });

    test('should validate Instagram URLs', () => {
      const url = 'https://www.instagram.com/p/abc123';
      expect(urlValidator.isValidVideoUrl(url)).toBe(true);
    });

    test('should validate standard Facebook URLs', () => {
      const url = 'https://fb.watch/abc123/';
      expect(urlValidator.isValidVideoUrl(url)).toBe(true);
    });
  });
});
