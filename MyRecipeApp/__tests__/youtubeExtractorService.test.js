/**
 * YouTube Extractor Service Tests
 * Comprehensive test suite for YouTube transcript extraction, caching, and error handling
 */

import {
  getYoutubeTranscript,
  getAvailableLanguages,
  getYoutubeTranscriptCached,
  parseTranscriptWithTimestamps,
  clearTranscriptCache,
  clearAllTranscriptCache,
  getCacheExpiration,
  analyzeTranscriptError,
} from '../services/youtubeExtractorService';
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

describe('youtubeExtractorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.getAllKeys.mockResolvedValue([]);
  });

  describe('getYoutubeTranscript', () => {
    test('should fetch transcript for valid video ID', async () => {
      const result = await getYoutubeTranscript('dQw4w9WgXcQ');

      expect(result.success).toBe(true);
      expect(result.transcript).toBeDefined();
      expect(result.transcript.length).toBeGreaterThan(0);
      expect(result.language).toBe('en');
      expect(result.fromCache).toBe(false);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    test('should return cached transcript on second call', async () => {
      // First call
      await getYoutubeTranscript('dQw4w9WgXcQ');

      // Mock cached data
      const cachedData = {
        transcript: 'Cached transcript content',
        language: 'en',
        videoId: 'dQw4w9WgXcQ',
        cachedAt: Date.now(),
        expiresAt: Date.now() + 60 * 60 * 1000,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedData));

      // Second call
      const result = await getYoutubeTranscript('dQw4w9WgXcQ');

      expect(result.fromCache).toBe(true);
      expect(result.transcript).toBe('Cached transcript content');
    });

    test('should handle non-existent video', async () => {
      const result = await getYoutubeTranscript('not-found');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle video with no transcripts', async () => {
      const result = await getYoutubeTranscript('no-captions');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    test('should handle invalid video ID', async () => {
      const result = await getYoutubeTranscript('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    test('should handle null video ID', async () => {
      const result = await getYoutubeTranscript(null);

      expect(result.success).toBe(false);
    });

    test('should support multiple languages', async () => {
      const result = await getYoutubeTranscript('dQw4w9WgXcQ', 'es');

      expect(result.success).toBe(true);
      expect(result.language).toBe('es');
    });

    test('should cache transcript with correct TTL', async () => {
      const result = await getYoutubeTranscript('dQw4w9WgXcQ');
      const expiresAt = result.expiresAt;

      // Check that expiration is approximately 1 hour from now
      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThan(now);
      expect(expiresAt).toBeLessThanOrEqual(now + oneHourMs + 1000); // Allow 1 second margin
    });

    test('should return videoId in response', async () => {
      const result = await getYoutubeTranscript('dQw4w9WgXcQ');

      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    test('should set fromCache to false for uncached videos', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      const result = await getYoutubeTranscript('dQw4w9WgXcQ');

      expect(result.fromCache).toBe(false);
    });
  });

  describe('getAvailableLanguages', () => {
    test('should return array of language codes', async () => {
      const languages = await getAvailableLanguages('dQw4w9WgXcQ');

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    test('should include English by default', async () => {
      const languages = await getAvailableLanguages('dQw4w9WgXcQ');

      expect(languages).toContain('en');
    });

    test('should return multiple languages for multilingual videos', async () => {
      const languages = await getAvailableLanguages('multilang');

      expect(languages.length).toBeGreaterThan(1);
      expect(languages).toContain('en');
    });

    test('should handle invalid video ID', async () => {
      const languages = await getAvailableLanguages('invalid');

      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain('en');
    });

    test('should handle null video ID', async () => {
      const languages = await getAvailableLanguages(null);

      expect(languages).toEqual([]);
    });

    test('should handle empty video ID', async () => {
      const languages = await getAvailableLanguages('');

      expect(languages).toEqual([]);
    });
  });

  describe('getYoutubeTranscriptCached', () => {
    test('should return transcript with cache info', async () => {
      const result = await getYoutubeTranscriptCached('dQw4w9WgXcQ');

      expect(result.transcript).toBeDefined();
      expect(result.fromCache).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    test('should throw error for invalid video', async () => {
      await expect(getYoutubeTranscriptCached('invalid')).rejects.toThrow();
    });

    test('should throw error for video without transcripts', async () => {
      await expect(getYoutubeTranscriptCached('no-captions')).rejects.toThrow();
    });

    test('should support custom language', async () => {
      const result = await getYoutubeTranscriptCached('dQw4w9WgXcQ', 'es');

      expect(result.transcript).toBeDefined();
    });
  });

  describe('parseTranscriptWithTimestamps', () => {
    test('should parse array of transcript objects', () => {
      const transcript = [
        { text: 'Hello', start: 0, duration: 1 },
        { text: 'World', start: 1, duration: 1 },
      ];

      const result = parseTranscriptWithTimestamps(transcript);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        text: 'Hello',
        startTime: 0,
        endTime: 1,
      });
    });

    test('should handle plain text transcript', () => {
      const transcript = 'This is a plain text transcript';

      const result = parseTranscriptWithTimestamps(transcript);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('This is a plain text transcript');
      expect(result[0].startTime).toBe(0);
      expect(result[0].endTime).toBe(0);
    });

    test('should handle empty array', () => {
      const result = parseTranscriptWithTimestamps([]);

      expect(result).toEqual([]);
    });

    test('should handle null transcript', () => {
      const result = parseTranscriptWithTimestamps(null);

      expect(result).toEqual([]);
    });

    test('should handle undefined transcript', () => {
      const result = parseTranscriptWithTimestamps(undefined);

      expect(result).toEqual([]);
    });

    test('should calculate end time from start and duration', () => {
      const transcript = [{ text: 'Test', start: 10, duration: 5 }];

      const result = parseTranscriptWithTimestamps(transcript);

      expect(result[0].startTime).toBe(10);
      expect(result[0].endTime).toBe(15);
    });

    test('should handle missing duration', () => {
      const transcript = [{ text: 'Test', start: 10 }];

      const result = parseTranscriptWithTimestamps(transcript);

      expect(result[0].startTime).toBe(10);
      expect(result[0].endTime).toBe(10);
    });

    test('should handle objects without text field', () => {
      const transcript = [{ start: 0, duration: 1 }];

      const result = parseTranscriptWithTimestamps(transcript);

      expect(result[0].text).toBe('');
    });
  });

  describe('clearTranscriptCache', () => {
    test('should clear cache for specific video and language', async () => {
      await clearTranscriptCache('dQw4w9WgXcQ', 'en');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'youtube_transcript_dQw4w9WgXcQ_en'
      );
    });

    test('should clear all languages for video when language not specified', async () => {
      AsyncStorage.getAllKeys.mockResolvedValue([
        'youtube_transcript_dQw4w9WgXcQ_en',
        'youtube_transcript_dQw4w9WgXcQ_es',
        'other_key',
      ]);

      await clearTranscriptCache('dQw4w9WgXcQ');

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
      AsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(
        clearTranscriptCache('dQw4w9WgXcQ', 'en')
      ).resolves.toBeUndefined();
    });
  });

  describe('clearAllTranscriptCache', () => {
    test('should clear all cached transcripts', async () => {
      AsyncStorage.getAllKeys.mockResolvedValue([
        'youtube_transcript_vid1_en',
        'youtube_transcript_vid2_es',
        'other_key',
      ]);

      await clearAllTranscriptCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
      // Should only remove transcript cache keys
      const keysToRemove = AsyncStorage.multiRemove.mock.calls[0][0];
      expect(keysToRemove).toHaveLength(2);
    });

    test('should handle storage errors gracefully', async () => {
      AsyncStorage.getAllKeys.mockRejectedValue(new Error('Storage error'));

      await expect(clearAllTranscriptCache()).resolves.toBeUndefined();
    });
  });

  describe('getCacheExpiration', () => {
    test('should return expiration time for cached transcript', async () => {
      const expiresAt = Date.now() + 3600000;
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ expiresAt })
      );

      const result = await getCacheExpiration('dQw4w9WgXcQ', 'en');

      expect(result).toBe(expiresAt);
    });

    test('should return null if transcript not cached', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await getCacheExpiration('dQw4w9WgXcQ', 'en');

      expect(result).toBeNull();
    });

    test('should return null on cache parse error', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid json');

      const result = await getCacheExpiration('dQw4w9WgXcQ', 'en');

      expect(result).toBeNull();
    });

    test('should use default language en', async () => {
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ expiresAt: Date.now() })
      );

      await getCacheExpiration('dQw4w9WgXcQ');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        'youtube_transcript_dQw4w9WgXcQ_en'
      );
    });
  });

  describe('analyzeTranscriptError', () => {
    test('should identify network errors as retryable', () => {
      const error = new Error('Network timeout');

      const result = analyzeTranscriptError(error);

      expect(result.isRetryable).toBe(true);
      expect(result.shouldThrow).toBe(false);
    });

    test('should identify rate limit errors as retryable', () => {
      const error = new Error('429 rate limit exceeded');

      const result = analyzeTranscriptError(error);

      expect(result.isRetryable).toBe(true);
    });

    test('should identify not found as not retryable', () => {
      const error = new Error('404 not found');

      const result = analyzeTranscriptError(error);

      expect(result.isRetryable).toBe(false);
      expect(result.shouldThrow).toBe(true);
    });

    test('should identify private video errors', () => {
      const error = new Error('403 forbidden private video');

      const result = analyzeTranscriptError(error);

      expect(result.isRetryable).toBe(false);
      expect(result.message).toContain('private');
    });

    test('should provide user-friendly error messages', () => {
      const error = new Error('Network error');

      const result = analyzeTranscriptError(error);

      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
    });

    test('should handle unknown errors', () => {
      const error = new Error('Unknown error');

      const result = analyzeTranscriptError(error);

      expect(result.isRetryable).toBe(false);
      expect(result.shouldThrow).toBe(true);
    });
  });

  describe('Edge Cases and Integration', () => {
    test('should handle rapid consecutive calls', async () => {
      const promises = [
        getYoutubeTranscript('vid1'),
        getYoutubeTranscript('vid2'),
        getYoutubeTranscript('vid3'),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    test('should handle very long video IDs', async () => {
      const longId = 'a'.repeat(100);
      const result = await getYoutubeTranscript(longId);

      expect(result).toHaveProperty('success');
    });

    test('should handle special characters in transcript', async () => {
      const result = await getYoutubeTranscript('dQw4w9WgXcQ');

      expect(result.success).toBe(true);
      // Transcript may contain special characters
    });

    test('should maintain cache key uniqueness across languages', async () => {
      const result1 = await getYoutubeTranscript('dQw4w9WgXcQ', 'en');
      const result2 = await getYoutubeTranscript('dQw4w9WgXcQ', 'es');

      // Ensure they have different cache entries
      expect(result1.language).not.toBe(result2.language);
    });

    test('should handle cache expiration', async () => {
      const expiredData = {
        transcript: 'Old data',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(expiredData));

      const result = await getYoutubeTranscript('dQw4w9WgXcQ');

      // Should refetch since cache is expired
      expect(result.fromCache).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should fetch transcript within reasonable time', async () => {
      const startTime = Date.now();
      await getYoutubeTranscript('dQw4w9WgXcQ');
      const duration = Date.now() - startTime;

      // Should complete within 5 seconds (mock is instant)
      expect(duration).toBeLessThan(5000);
    });

    test('should return cached transcript faster', async () => {
      // Prime the cache
      await getYoutubeTranscript('dQw4w9WgXcQ');

      const cachedData = {
        transcript: 'Cached',
        expiresAt: Date.now() + 3600000,
      };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedData));

      const startTime = Date.now();
      await getYoutubeTranscript('dQw4w9WgXcQ');
      const duration = Date.now() - startTime;

      // Cached should be very fast
      expect(duration).toBeLessThan(100);
    });
  });
});
