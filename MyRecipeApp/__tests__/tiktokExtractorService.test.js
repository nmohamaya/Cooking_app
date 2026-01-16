/**
 * TikTok Extractor Service Tests
 * Comprehensive test suite for TikTok video extraction, caching, and error handling
 */

import {
  validateTikTokUrl,
  getTikTokMetadata,
  downloadTikTokVideo,
  extractRecipeFromTikTok,
  clearVideoCache,
  clearAllCaches,
  getCacheExpiration,
  analyzeTikTokError,
} from '../services/tiktokExtractorService';
import { AsyncStorage } from 'react-native';

// Mock AsyncStorage
jest.mock('react-native', () => ({
  AsyncStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    multiRemove: jest.fn(),
    getAllKeys: jest.fn(),
  },
}));

describe('tiktokExtractorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue([]);
  });

  describe('validateTikTokUrl', () => {
    test('should validate standard TikTok URL', () => {
      const url = 'https://www.tiktok.com/@username/video/1234567890';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(true);
      expect(result.videoId).toBe('1234567890');
      expect(result.urlType).toBe('standard');
    });

    test('should validate short TikTok URL (vm.tiktok.com)', () => {
      const url = 'https://vm.tiktok.com/ZSdxxxxx';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(true);
      expect(result.shortId).toBe('ZSdxxxxx');
      expect(result.urlType).toBe('shortForm');
    });

    test('should validate short TikTok URL (vt.tiktok.com)', () => {
      const url = 'https://vt.tiktok.com/ZSdxxxxx';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(true);
      expect(result.shortId).toBe('ZSdxxxxx');
      expect(result.urlType).toBe('shortForm');
    });

    test('should validate www pattern TikTok URL', () => {
      const url = 'https://www.tiktok.com/v/1234567890';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(true);
      expect(result.videoId).toBe('1234567890');
      expect(result.urlType).toBe('www');
    });

    test('should reject invalid TikTok URL', () => {
      const url = 'https://invalid.com/video/123';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject null/undefined URL', () => {
      expect(validateTikTokUrl(null).valid).toBe(false);
      expect(validateTikTokUrl(undefined).valid).toBe(false);
    });

    test('should trim whitespace from URL', () => {
      const url = '  https://www.tiktok.com/@username/video/1234567890  ';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(true);
      expect(result.videoId).toBe('1234567890');
    });

    test('should handle URL without protocol', () => {
      const url = 'www.tiktok.com/@username/video/1234567890';
      const result = validateTikTokUrl(url);

      expect(result.valid).toBe(false);
    });
  });

  describe('getTikTokMetadata', () => {
    test('should fetch metadata for valid video ID', async () => {
      const result = await getTikTokMetadata('1234567890');

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.videoId).toBe('1234567890');
      expect(result.metadata.title).toBeDefined();
      expect(result.metadata.description).toBeDefined();
      expect(result.metadata.author).toBeDefined();
      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.fromCache).toBe(false);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    test('should return cached metadata on second call', async () => {
      const videoId = '1234567890';
      const mockMetadata = {
        videoId,
        title: 'Test Video',
        description: 'Test Description',
      };

      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          metadata: mockMetadata,
          expiresAt: Date.now() + 3600000,
        })
      );

      const result = await getTikTokMetadata(videoId);

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(true);
    });

    test('should return error for invalid video ID', async () => {
      const result = await getTikTokMetadata(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should include metadata fields', async () => {
      const result = await getTikTokMetadata('1234567890');

      const { metadata } = result;
      expect(metadata).toHaveProperty('videoId');
      expect(metadata).toHaveProperty('title');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('author');
      expect(metadata).toHaveProperty('duration');
      expect(metadata).toHaveProperty('views');
      expect(metadata).toHaveProperty('likes');
      expect(metadata).toHaveProperty('comments');
      expect(metadata).toHaveProperty('shares');
      expect(metadata).toHaveProperty('created_at');
      expect(metadata).toHaveProperty('hashtags');
      expect(metadata).toHaveProperty('sound');
    });

    test('should handle cache expiration', async () => {
      const videoId = '1234567890';
      const expiredCache = JSON.stringify({
        metadata: { videoId, title: 'Expired' },
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      });

      AsyncStorage.getItem.mockResolvedValueOnce(expiredCache);
      AsyncStorage.removeItem.mockResolvedValueOnce(null);

      const result = await getTikTokMetadata(videoId);

      expect(result.success).toBe(true);
      expect(result.metadata.title).not.toBe('Expired');
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('downloadTikTokVideo', () => {
    test('should download video for valid video ID', async () => {
      const result = await downloadTikTokVideo('1234567890');

      expect(result.success).toBe(true);
      expect(result.videoUrl).toBeDefined();
      expect(result.videoUrl).toContain('1234567890');
      expect(result.quality).toBe('high');
      expect(result.format).toBe('mp4');
      expect(result.fromCache).toBe(false);
    });

    test('should download with custom quality', async () => {
      const result = await downloadTikTokVideo('1234567890', {
        quality: 'low',
        format: 'mp4',
      });

      expect(result.success).toBe(true);
      expect(result.quality).toBe('low');
    });

    test('should cache downloaded video URL', async () => {
      AsyncStorage.setItem.mockResolvedValueOnce(null);

      const result = await downloadTikTokVideo('1234567890');

      expect(result.success).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should return cached video URL on second call', async () => {
      const videoId = '1234567890';
      const mockUrl = 'https://api.example.com/video';

      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          videoUrl: mockUrl,
          expiresAt: Date.now() + 3600000,
        })
      );

      const result = await downloadTikTokVideo(videoId);

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(true);
      expect(result.videoUrl).toBe(mockUrl);
    });

    test('should return error for invalid video ID', async () => {
      const result = await downloadTikTokVideo(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('extractRecipeFromTikTok', () => {
    test('should extract recipe for valid video ID', async () => {
      const result = await extractRecipeFromTikTok('1234567890');

      expect(result.success).toBe(true);
      expect(result.recipe).toBeDefined();
      expect(result.recipe.title).toBeDefined();
      expect(result.recipe.ingredients).toBeDefined();
      expect(result.recipe.instructions).toBeDefined();
      expect(result.recipe.ingredients.length).toBeGreaterThan(0);
      expect(result.recipe.instructions.length).toBeGreaterThan(0);
    });

    test('should return recipe with all fields', async () => {
      const result = await extractRecipeFromTikTok('1234567890');

      const { recipe } = result;
      expect(recipe).toHaveProperty('title');
      expect(recipe).toHaveProperty('description');
      expect(recipe).toHaveProperty('ingredients');
      expect(recipe).toHaveProperty('instructions');
      expect(recipe).toHaveProperty('prepTime');
      expect(recipe).toHaveProperty('cookTime');
      expect(recipe).toHaveProperty('servings');
      expect(recipe).toHaveProperty('difficulty');
    });

    test('should handle recipe extraction error', async () => {
      const result = await extractRecipeFromTikTok(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should include video ID in result', async () => {
      const videoId = '1234567890';
      const result = await extractRecipeFromTikTok(videoId);

      expect(result.videoId).toBe(videoId);
    });
  });

  describe('clearVideoCache', () => {
    test('should clear cache for specific video', async () => {
      AsyncStorage.multiRemove.mockResolvedValueOnce(null);

      await clearVideoCache('1234567890');

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
      const keysToRemove = AsyncStorage.multiRemove.mock.calls[0][0];
      expect(keysToRemove.length).toBeGreaterThan(0);
    });

    test('should handle clear cache error gracefully', async () => {
      AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('Storage error'));

      // Should not throw
      await expect(clearVideoCache('1234567890')).resolves.toBeUndefined();
    });
  });

  describe('clearAllCaches', () => {
    test('should clear all TikTok caches', async () => {
      AsyncStorage.getAllKeys.mockResolvedValueOnce([
        'tiktok_video_123',
        'tiktok_video_456',
        'other_key_789',
      ]);
      AsyncStorage.multiRemove.mockResolvedValueOnce(null);

      await clearAllCaches();

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
      const keysToRemove = AsyncStorage.multiRemove.mock.calls[0][0];
      expect(keysToRemove).toContain('tiktok_video_123');
      expect(keysToRemove).toContain('tiktok_video_456');
      expect(keysToRemove).not.toContain('other_key_789');
    });

    test('should handle empty cache', async () => {
      AsyncStorage.getAllKeys.mockResolvedValueOnce([]);

      await clearAllCaches();

      expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
    });
  });

  describe('getCacheExpiration', () => {
    test('should return cache expiration time', async () => {
      const expiration = Date.now() + 3600000;
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          metadata: { videoId: '123' },
          expiresAt: expiration,
        })
      );

      const result = await getCacheExpiration('123');

      expect(result).toBe(expiration);
    });

    test('should return null for missing cache', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await getCacheExpiration('123');

      expect(result).toBeNull();
    });

    test('should handle cache expiration errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await getCacheExpiration('123');

      expect(result).toBeNull();
    });
  });

  describe('analyzeTikTokError', () => {
    test('should identify video not found error', () => {
      const error = new Error('Video not found');
      const result = analyzeTikTokError(error);

      expect(result.type).toBe('video_not_found');
      expect(result.recoverable).toBe(false);
    });

    test('should identify network error', () => {
      const error = new Error('network connection failed');
      const result = analyzeTikTokError(error);

      expect(result.type).toBe('network_error');
      expect(result.recoverable).toBe(true);
    });

    test('should identify timeout error', () => {
      const error = new Error('Request timeout');
      const result = analyzeTikTokError(error);

      expect(result.type).toBe('timeout');
      expect(result.recoverable).toBe(true);
    });

    test('should identify rate limit error', () => {
      const error = new Error('rate limit exceeded - please try again');
      const result = analyzeTikTokError(error);

      expect(result.type).toBe('rate_limited');
      expect(result.recoverable).toBe(true);
    });

    test('should handle unknown error', () => {
      const error = new Error('Some unknown error');
      const result = analyzeTikTokError(error);

      expect(result.type).toBe('generic_error');
      expect(result.recoverable).toBe(true);
    });

    test('should handle null error', () => {
      const result = analyzeTikTokError(null);

      expect(result.type).toBe('unknown');
      expect(result.recoverable).toBe(true);
    });

    test('should handle string error', () => {
      const result = analyzeTikTokError('String error message');

      expect(result.type).toBe('generic_error');
      expect(result.message).toBe('String error message');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow: validate -> fetch metadata -> download -> extract', async () => {
      const url = 'https://www.tiktok.com/@username/video/1234567890';

      // Validate URL
      const validation = validateTikTokUrl(url);
      expect(validation.valid).toBe(true);

      // Get metadata
      const metadata = await getTikTokMetadata(validation.videoId);
      expect(metadata.success).toBe(true);

      // Download video
      const download = await downloadTikTokVideo(validation.videoId);
      expect(download.success).toBe(true);

      // Extract recipe
      const recipe = await extractRecipeFromTikTok(validation.videoId);
      expect(recipe.success).toBe(true);
    });

    test('should cache results across multiple operations', async () => {
      const videoId = '1234567890';

      // First call - should hit API
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      AsyncStorage.setItem.mockResolvedValueOnce(null);
      const result1 = await getTikTokMetadata(videoId);
      expect(result1.fromCache).toBe(false);

      // Simulate cache hit
      AsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify({
          metadata: result1.metadata,
          expiresAt: Date.now() + 3600000,
        })
      );

      // Second call - should use cache
      const result2 = await getTikTokMetadata(videoId);
      expect(result2.fromCache).toBe(true);
    });
  });
});
