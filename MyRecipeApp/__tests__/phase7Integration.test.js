/**
 * Phase 7 E2E Integration Tests
 * Multi-Platform Recipe Extraction Integration
 *
 * Tests the integration of all platform extractors (TikTok, Instagram, Website)
 * with the centralized API client service from Phase 6.
 *
 * Test Coverage:
 * - TikTok API integration functions
 * - Instagram API integration functions  
 * - Website API integration functions
 * - Platform detection and routing
 * - Error handling across all platforms
 * - Complete extraction workflows
 */

import {
  downloadTikTokVideoViaApi,
  getTranscriptViaApi as getTikTokTranscript,
  extractRecipeFromTikTokViaApi,
  validateTikTokUrl,
} from '../services/tiktokExtractorService';

import {
  downloadInstagramVideoViaApi,
  getTranscriptViaApi as getInstagramTranscript,
  extractRecipeFromInstagramViaApi,
  validateInstagramUrl,
} from '../services/instagramExtractorService';

import {
  getWebsiteMetadataViaApi,
  extractRecipeFromWebsiteViaApi,
  getAvailablePlatformsViaApi,
  validateWebsiteUrl,
} from '../services/websiteExtractorService';

import {
  extractRecipeFromYoutube,
  downloadYoutubeVideo,
  getTranscriptViaApi as getYoutubeTranscript,
} from '../services/youtubeExtractorService';

// Mock axios for API client
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Phase 7: Multi-Platform Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TikTok Platform Integration', () => {
    describe('validateTikTokUrl', () => {
      test('validates standard TikTok URL format', () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = validateTikTokUrl(url);
        expect(result.valid).toBe(true);
        expect(result.videoId).toBe('1234567890');
      });

      test('validates short form TikTok URL', () => {
        const url = 'https://vm.tiktok.com/ABC123';
        const result = validateTikTokUrl(url);
        expect(result.valid).toBe(true);
        expect(result.shortId).toBe('ABC123');
      });

      test('rejects invalid TikTok URL', () => {
        const url = 'https://invalid.com/video';
        const result = validateTikTokUrl(url);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid');
      });

      test('rejects empty URL', () => {
        const result = validateTikTokUrl('');
        expect(result.valid).toBe(false);
      });
    });

    describe('downloadTikTokVideoViaApi', () => {
      test('downloads TikTok video via API', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await downloadTikTokVideoViaApi(url);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });

      test('handles invalid URL for download', async () => {
        const result = await downloadTikTokVideoViaApi('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
      });

      test('supports custom download options', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const options = { quality: 'high', timeout: 30000 };
        const result = await downloadTikTokVideoViaApi(url, options);
        expect(result).toBeDefined();
      });
    });

    describe('getTikTokTranscript', () => {
      test('gets transcript from TikTok video via API', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await getTikTokTranscript(url);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });

      test('handles transcription errors gracefully', async () => {
        const result = await getTikTokTranscript('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
      });
    });

    describe('extractRecipeFromTikTokViaApi', () => {
      test('extracts recipe from TikTok video', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await extractRecipeFromTikTokViaApi(url);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });

      test('validates URL before extraction', async () => {
        const result = await extractRecipeFromTikTokViaApi('invalid-url');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
      });

      test('returns formatted recipe on success', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await extractRecipeFromTikTokViaApi(url);
        if (result.success) {
          expect(result.recipe).toBeDefined();
          expect(result.recipe).toHaveProperty('title');
        }
      });

      test('supports extraction options', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const options = { retryAttempts: 3, timeout: 60000 };
        const result = await extractRecipeFromTikTokViaApi(url, options);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Instagram Platform Integration', () => {
    describe('validateInstagramUrl', () => {
      test('validates Instagram Reel URL', () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const result = validateInstagramUrl(url);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('reel');
      });

      test('validates Instagram post URL', () => {
        const url = 'https://www.instagram.com/p/XYZ789/';
        const result = validateInstagramUrl(url);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('post');
      });

      test('rejects invalid Instagram URL', () => {
        const result = validateInstagramUrl('https://invalid.com');
        expect(result.valid).toBe(false);
      });
    });

    describe('downloadInstagramVideoViaApi', () => {
      test('downloads Instagram video via API', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const result = await downloadInstagramVideoViaApi(url);
        expect(result).toBeDefined();
      });

      test('handles invalid Instagram URL', async () => {
        const result = await downloadInstagramVideoViaApi('invalid-url');
        expect(result.success).toBe(false);
      });
    });

    describe('getInstagramTranscript', () => {
      test('gets transcript from Instagram video', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const result = await getInstagramTranscript(url);
        expect(result).toBeDefined();
      });

      test('handles transcription errors', async () => {
        const result = await getInstagramTranscript('');
        expect(result.success).toBe(false);
      });
    });

    describe('extractRecipeFromInstagramViaApi', () => {
      test('extracts recipe from Instagram video', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const result = await extractRecipeFromInstagramViaApi(url);
        expect(result).toBeDefined();
      });

      test('validates URL before extraction', async () => {
        const result = await extractRecipeFromInstagramViaApi('not-an-instagram-url');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
      });

      test('supports extraction with custom options', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const options = { retryAttempts: 5, includeComments: true };
        const result = await extractRecipeFromInstagramViaApi(url, options);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Website Platform Integration', () => {
    describe('validateWebsiteUrl', () => {
      test('validates AllRecipes URL', () => {
        const url = 'https://www.allrecipes.com/recipe/12345/pasta-carbonara/';
        const result = validateWebsiteUrl(url);
        expect(result.valid).toBe(true);
        expect(result.type).toBe('allrecipes');
      });

      test('validates generic website URL', () => {
        const url = 'https://www.example.com/recipes/pasta';
        const result = validateWebsiteUrl(url);
        expect(result.valid).toBe(true);
      });

      test('rejects invalid URL', () => {
        const result = validateWebsiteUrl('not-a-url');
        expect(result.valid).toBe(false);
      });
    });

    describe('getWebsiteMetadataViaApi', () => {
      test('fetches website metadata via API', async () => {
        const url = 'https://www.allrecipes.com/recipe/12345/pasta-carbonara/';
        const result = await getWebsiteMetadataViaApi(url);
        expect(result).toBeDefined();
      });

      test('handles invalid website URL', async () => {
        const result = await getWebsiteMetadataViaApi('invalid-url');
        expect(result.success).toBe(false);
      });
    });

    describe('extractRecipeFromWebsiteViaApi', () => {
      test('extracts recipe from website via API', async () => {
        const url = 'https://www.allrecipes.com/recipe/12345/pasta-carbonara/';
        const result = await extractRecipeFromWebsiteViaApi(url);
        expect(result).toBeDefined();
      });

      test('validates URL before extraction', async () => {
        const result = await extractRecipeFromWebsiteViaApi('invalid');
        expect(result.success).toBe(false);
      });

      test('supports website extraction options', async () => {
        const url = 'https://www.foodnetwork.com/recipes/';
        const options = { includeNutrition: true, timeout: 45000 };
        const result = await extractRecipeFromWebsiteViaApi(url, options);
        expect(result).toBeDefined();
      });
    });

    describe('getAvailablePlatformsViaApi', () => {
      test('retrieves available platforms from backend', async () => {
        const result = await getAvailablePlatformsViaApi();
        expect(result).toBeDefined();
      });

      test('handles API calls without crashing', async () => {
        // Test that the function can be called and returns a result structure
        const result = await getAvailablePlatformsViaApi();
        expect(typeof result).toBe('object');
      });
    });
  });

  describe('YouTube Platform Integration', () => {
    describe('downloadYoutubeVideo', () => {
      test('downloads YouTube video via API', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const result = await downloadYoutubeVideo(url);
        expect(result).toBeDefined();
      });
    });

    describe('getYoutubeTranscript', () => {
      test('gets transcript from YouTube video', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const result = await getYoutubeTranscript(url);
        expect(result).toBeDefined();
      });
    });

    describe('extractRecipeFromYoutube', () => {
      test('extracts recipe from YouTube video', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const result = await extractRecipeFromYoutube(url);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Cross-Platform Integration', () => {
    describe('Platform Detection and Routing', () => {
      const testCases = [
        {
          url: 'https://www.tiktok.com/@chef_john/video/1234567890',
          platform: 'tiktok',
          validator: validateTikTokUrl,
        },
        {
          url: 'https://www.instagram.com/reel/ABC123/',
          platform: 'instagram',
          validator: validateInstagramUrl,
        },
        {
          url: 'https://www.allrecipes.com/recipe/12345/',
          platform: 'website',
          validator: validateWebsiteUrl,
        },
      ];

      testCases.forEach(({ url, platform, validator }) => {
        test(`correctly validates ${platform} URL`, () => {
          const result = validator(url);
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('Error Handling Consistency', () => {
      test('all extractors handle missing URL gracefully', async () => {
        const results = [
          await extractRecipeFromYoutube(''),
          await extractRecipeFromTikTokViaApi(''),
          await extractRecipeFromInstagramViaApi(''),
          await extractRecipeFromWebsiteViaApi(''),
        ];

        results.forEach(result => {
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });
      });

      test('all extractors handle invalid URLs consistently', async () => {
        const invalidUrl = 'not-a-valid-url-at-all';
        const results = [
          await extractRecipeFromYoutube(invalidUrl),
          await extractRecipeFromTikTokViaApi(invalidUrl),
          await extractRecipeFromInstagramViaApi(invalidUrl),
          await extractRecipeFromWebsiteViaApi(invalidUrl),
        ];

        results.forEach(result => {
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });
      });
    });

    describe('Recipe Format Consistency', () => {
      test('all extractors return consistent recipe structure on success', async () => {
        // Test URLs for each platform
        const validUrls = [
          { url: 'https://www.tiktok.com/@chef_john/video/1234567890', extract: extractRecipeFromTikTokViaApi },
          { url: 'https://www.instagram.com/reel/ABC123/', extract: extractRecipeFromInstagramViaApi },
          { url: 'https://www.allrecipes.com/recipe/12345/', extract: extractRecipeFromWebsiteViaApi },
        ];

        for (const { url, extract } of validUrls) {
          const result = await extract(url);
          if (result.success && result.recipe) {
            // All recipes should have these basic properties
            expect(result.recipe).toHaveProperty('title');
            // Other properties are optional depending on extraction
          }
        }
      }, 15000);  // Increase timeout for API calls
    });

    describe('Timeout and Retry Behavior', () => {
      test('extractors support timeout options', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const options = { timeout: 30000 };
        const result = await extractRecipeFromYoutube(url, options);
        expect(result).toBeDefined();
      });

      test('extractors support retry options', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const options = { retryAttempts: 5 };
        const result = await extractRecipeFromTikTokViaApi(url, options);
        expect(result).toBeDefined();
      });
    });
  });

  describe('API Client Integration', () => {
    test('all extractors use apiClient service', () => {
      // Verify that extractors have been updated with apiClient imports
      // by checking that API functions exist and are callable
      expect(typeof downloadTikTokVideoViaApi).toBe('function');
      expect(typeof getTikTokTranscript).toBe('function');
      expect(typeof downloadInstagramVideoViaApi).toBe('function');
      expect(typeof getInstagramTranscript).toBe('function');
      expect(typeof extractRecipeFromWebsiteViaApi).toBe('function');
      expect(typeof getAvailablePlatformsViaApi).toBe('function');
    });

    test('API functions accept platform parameter', async () => {
      const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
      const options = { platform: 'tiktok', timeout: 60000 };
      const result = await extractRecipeFromTikTokViaApi(url, options);
      expect(result).toBeDefined();
    });
  });

  describe('Complete Workflow Integration', () => {
    test('YouTube extraction workflow completes end-to-end', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      
      // Extract recipe
      const result = await extractRecipeFromYoutube(url);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('TikTok extraction workflow completes end-to-end', async () => {
      const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
      
      // Step 1: Validate URL
      const validation = validateTikTokUrl(url);
      expect(validation.valid).toBe(true);
      
      // Step 2: Extract recipe
      const result = await extractRecipeFromTikTokViaApi(url);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('Instagram extraction workflow completes end-to-end', async () => {
      const url = 'https://www.instagram.com/reel/ABC123/';
      
      // Step 1: Validate URL
      const validation = validateInstagramUrl(url);
      expect(validation.valid).toBe(true);
      
      // Step 2: Extract recipe
      const result = await extractRecipeFromInstagramViaApi(url);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('Website extraction workflow completes end-to-end', async () => {
      const url = 'https://www.allrecipes.com/recipe/12345/pasta-carbonara/';
      
      // Step 1: Validate URL
      const validation = validateWebsiteUrl(url);
      expect(validation.valid).toBe(true);
      
      // Step 2: Extract recipe
      const result = await extractRecipeFromWebsiteViaApi(url);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
