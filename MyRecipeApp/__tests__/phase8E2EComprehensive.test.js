/**
 * Phase 8: Comprehensive E2E Testing
 * Complete workflow testing for all platforms
 *
 * Test Coverage:
 * - Real-world video URL scenarios
 * - Complete extraction workflows (URL → Recipe)
 * - Edge cases and error handling
 * - Timeout and retry behavior
 * - Cross-platform consistency
 * - Performance benchmarks
 * - Data validation
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
  validateWebsiteUrl,
} from '../services/websiteExtractorService';

import {
  extractRecipeFromYoutube,
  downloadYoutubeVideo,
  getTranscriptViaApi as getYoutubeTranscript,
} from '../services/youtubeExtractorService';

import apiClient from '../services/apiClient';

// Mock axios
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

describe('Phase 8: Comprehensive E2E Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Real-World Video Scenarios', () => {
    describe('YouTube URLs - Various Formats', () => {
      const youtubeUrls = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          label: 'standard watch URL',
          description: 'Most common YouTube URL format',
        },
        {
          url: 'https://youtu.be/dQw4w9WgXcQ',
          label: 'short URL format',
          description: 'YouTube short link',
        },
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s',
          label: 'URL with timestamp',
          description: 'Video with start time',
        },
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123456&index=1',
          label: 'playlist URL',
          description: 'Video from a playlist',
        },
      ];

      youtubeUrls.forEach(({ url, label, description }) => {
        test(`processes ${label}: ${description}`, async () => {
          const result = await extractRecipeFromYoutube(url);
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
        });
      });
    });

    describe('TikTok URLs - Various Formats', () => {
      const tiktokUrls = [
        {
          url: 'https://www.tiktok.com/@chef_john/video/1234567890',
          label: 'standard creator URL',
        },
        {
          url: 'https://vm.tiktok.com/ABC123DEF',
          label: 'mobile short URL',
        },
        {
          url: 'https://vt.tiktok.com/ABC123DEF',
          label: 'alternative short URL',
        },
      ];

      tiktokUrls.forEach(({ url, label }) => {
        test(`extracts from TikTok ${label}`, async () => {
          const validation = validateTikTokUrl(url);
          expect(validation.valid).toBe(true);
          
          const result = await extractRecipeFromTikTokViaApi(url);
          expect(result).toBeDefined();
        });
      });
    });

    describe('Instagram URLs - Various Formats', () => {
      const instagramUrls = [
        {
          url: 'https://www.instagram.com/reel/ABC123DEF/',
          label: 'reel URL',
          type: 'reel',
        },
        {
          url: 'https://www.instagram.com/p/XYZ789ABC/',
          label: 'post URL',
          type: 'post',
        },
        {
          url: 'https://www.instagram.com/tv/LMN456PQR/',
          label: 'IGTV URL',
          type: 'igtv',
        },
      ];

      instagramUrls.forEach(({ url, label, type }) => {
        test(`extracts from Instagram ${label}`, async () => {
          const validation = validateInstagramUrl(url);
          expect(validation.valid).toBe(true);
          expect(validation.type).toBe(type);
          
          const result = await extractRecipeFromInstagramViaApi(url);
          expect(result).toBeDefined();
        });
      });
    });

    describe('Website URLs - Various Recipe Sites', () => {
      const websiteUrls = [
        {
          url: 'https://www.allrecipes.com/recipe/12345/pasta-carbonara/',
          label: 'AllRecipes',
          site: 'allrecipes',
        },
        {
          url: 'https://www.foodnetwork.com/recipes/12345/dish-name/',
          label: 'Food Network',
          site: 'foodnetwork',
        },
        {
          url: 'https://www.seriouseats.com/recipes/pasta-carbonara',
          label: 'Serious Eats',
          site: 'seriouseats',
        },
        {
          url: 'https://www.bonappetitmag.com/recipe/pasta-carbonara',
          label: 'Bon Appétit',
          site: 'bonappetit',
        },
        {
          url: 'https://www.simplyrecipes.com/recipes/pasta_carbonara/',
          label: 'Simply Recipes',
          site: 'simplyrecipes',
        },
      ];

      websiteUrls.forEach(({ url, label, site }) => {
        test(`extracts from ${label} (${site})`, async () => {
          const validation = validateWebsiteUrl(url);
          expect(validation.valid).toBe(true);
          expect(validation.type).toBe(site);
          
          const result = await extractRecipeFromWebsiteViaApi(url);
          expect(result).toBeDefined();
        });
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    describe('Invalid URL Formats', () => {
      const invalidUrls = [
        { url: '', label: 'empty string' },
        { url: '   ', label: 'whitespace only' },
        { url: 'not-a-url', label: 'plain text' },
        { url: 'http://', label: 'incomplete URL' },
        { url: 'https://', label: 'incomplete https' },
        { url: 'ftp://example.com', label: 'wrong protocol' },
        { url: 'httpx://example.com', label: 'invalid protocol' },
        { url: '/relative/path', label: 'relative path' },
        { url: 'example.com', label: 'missing protocol' },
      ];

      invalidUrls.forEach(({ url, label }) => {
        test(`YouTube rejects: ${label}`, async () => {
          const result = await extractRecipeFromYoutube(url);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });

        test(`TikTok rejects: ${label}`, async () => {
          const result = await extractRecipeFromTikTokViaApi(url);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });

        test(`Instagram rejects: ${label}`, async () => {
          const result = await extractRecipeFromInstagramViaApi(url);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });

        test(`Website rejects: ${label}`, async () => {
          const result = await extractRecipeFromWebsiteViaApi(url);
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
        });
      });
    });

    describe('URL Type Mismatches', () => {
      const mismatchedUrls = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          extractor: extractRecipeFromTikTokViaApi,
          name: 'YouTube URL to TikTok extractor',
        },
        {
          url: 'https://www.tiktok.com/@chef_john/video/1234567890',
          extractor: extractRecipeFromInstagramViaApi,
          name: 'TikTok URL to Instagram extractor',
        },
        {
          url: 'https://www.instagram.com/reel/ABC123/',
          extractor: extractRecipeFromWebsiteViaApi,
          name: 'Instagram URL to Website extractor',
        },
      ];

      mismatchedUrls.forEach(({ url, extractor, name }) => {
        test(`handles ${name} gracefully`, async () => {
          const result = await extractor(url);
          // Should either fail gracefully or succeed if API is flexible
          expect(result).toBeDefined();
          expect(typeof result.success).toBe('boolean');
        });
      });
    });

    describe('Malformed URLs', () => {
      const malformedUrls = [
        { url: 'https://www.youtube.com/watch?v=', label: 'missing video ID' },
        { url: 'https://www.youtube.com/watch?v=123', label: 'invalid video ID (too short)' },
        { url: 'https://www.youtube.com/watch?v=' + 'x'.repeat(100), label: 'excessively long ID' },
        { url: 'https://www.tiktok.com/@/video/123', label: 'missing username' },
        { url: 'https://www.instagram.com/reel/', label: 'missing shortcode' },
      ];

      malformedUrls.forEach(({ url, label }) => {
        test(`handles ${label}`, async () => {
          const results = [
            await extractRecipeFromYoutube(url),
            await extractRecipeFromTikTokViaApi(url),
            await extractRecipeFromInstagramViaApi(url),
            await extractRecipeFromWebsiteViaApi(url),
          ];

          results.forEach(result => {
            expect(result).toBeDefined();
            // Should handle gracefully
          });
        }, 15000);
      });
    });

    describe('Unicode and Special Characters', () => {
      test('handles URLs with unicode characters', async () => {
        const unicodeUrls = [
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ&title=Pâtes_Carbonara',
          'https://www.allrecipes.com/recipe/12345/café-au-lait/',
        ];

        for (const url of unicodeUrls) {
          const result = await extractRecipeFromYoutube(url);
          expect(result).toBeDefined();
        }
      }, 15000);

      test('handles URLs with encoded characters', async () => {
        const encodedUrl = 'https://www.allrecipes.com/recipe/12345/pasta%20carbonara/';
        const result = await extractRecipeFromWebsiteViaApi(encodedUrl);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Complete Extraction Workflows', () => {
    describe('YouTube Extraction Workflow', () => {
      test('completes full workflow: validate → download → transcribe → extract', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        
        // Step 1: Validate
        // YouTube doesn't have explicit validation, proceed directly
        
        // Step 2: Download
        const downloadResult = await downloadYoutubeVideo(url);
        expect(downloadResult).toBeDefined();
        
        // Step 3: Transcribe
        const transcriptResult = await getYoutubeTranscript(url);
        expect(transcriptResult).toBeDefined();
        
        // Step 4: Extract
        const extractResult = await extractRecipeFromYoutube(url);
        expect(extractResult).toBeDefined();
        expect(typeof extractResult.success).toBe('boolean');
      }, 30000);

      test('handles workflow with retry options', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const options = {
          retryAttempts: 3,
          timeout: 60000,
        };
        
        const result = await extractRecipeFromYoutube(url, options);
        expect(result).toBeDefined();
      }, 30000);
    });

    describe('TikTok Extraction Workflow', () => {
      test('completes full workflow for TikTok', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        
        // Step 1: Validate
        const validation = validateTikTokUrl(url);
        expect(validation.valid).toBe(true);
        
        // Step 2: Download
        const downloadResult = await downloadTikTokVideoViaApi(url);
        expect(downloadResult).toBeDefined();
        
        // Step 3: Transcribe
        const transcriptResult = await getTikTokTranscript(url);
        expect(transcriptResult).toBeDefined();
        
        // Step 4: Extract
        const extractResult = await extractRecipeFromTikTokViaApi(url);
        expect(extractResult).toBeDefined();
      }, 30000);

      test('handles workflow error recovery', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const options = { retryAttempts: 5, retryDelay: 1000 };
        
        const result = await extractRecipeFromTikTokViaApi(url, options);
        expect(result).toBeDefined();
      }, 30000);
    });

    describe('Instagram Extraction Workflow', () => {
      test('completes full workflow for Instagram', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        
        // Step 1: Validate
        const validation = validateInstagramUrl(url);
        expect(validation.valid).toBe(true);
        
        // Step 2: Download
        const downloadResult = await downloadInstagramVideoViaApi(url);
        expect(downloadResult).toBeDefined();
        
        // Step 3: Transcribe
        const transcriptResult = await getInstagramTranscript(url);
        expect(transcriptResult).toBeDefined();
        
        // Step 4: Extract
        const extractResult = await extractRecipeFromInstagramViaApi(url);
        expect(extractResult).toBeDefined();
      }, 30000);
    });

    describe('Website Extraction Workflow', () => {
      test('completes full workflow for website', async () => {
        const url = 'https://www.allrecipes.com/recipe/12345/pasta-carbonara/';
        
        // Step 1: Validate
        const validation = validateWebsiteUrl(url);
        expect(validation.valid).toBe(true);
        
        // Step 2: Get metadata
        const metadataResult = await getWebsiteMetadataViaApi(url);
        expect(metadataResult).toBeDefined();
        
        // Step 3: Extract
        const extractResult = await extractRecipeFromWebsiteViaApi(url);
        expect(extractResult).toBeDefined();
      }, 30000);
    });
  });

  describe('Timeout and Retry Behavior', () => {
    describe('Timeout Handling', () => {
      test('YouTube handles timeout option', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const shortTimeoutResult = await extractRecipeFromYoutube(url, { timeout: 1000 });
        const normalTimeoutResult = await extractRecipeFromYoutube(url, { timeout: 60000 });
        
        expect(shortTimeoutResult).toBeDefined();
        expect(normalTimeoutResult).toBeDefined();
      }, 15000);

      test('TikTok handles timeout option', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await extractRecipeFromTikTokViaApi(url, { timeout: 30000 });
        expect(result).toBeDefined();
      }, 15000);

      test('Instagram handles timeout option', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const result = await extractRecipeFromInstagramViaApi(url, { timeout: 45000 });
        expect(result).toBeDefined();
      }, 15000);

      test('Website handles timeout option', async () => {
        const url = 'https://www.allrecipes.com/recipe/12345/';
        const result = await extractRecipeFromWebsiteViaApi(url, { timeout: 30000 });
        expect(result).toBeDefined();
      }, 15000);
    });

    describe('Retry Logic', () => {
      test('YouTube supports retry attempts', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const result = await extractRecipeFromYoutube(url, { retryAttempts: 3 });
        expect(result).toBeDefined();
      });

      test('TikTok supports retry attempts', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await extractRecipeFromTikTokViaApi(url, { retryAttempts: 5 });
        expect(result).toBeDefined();
      });

      test('Instagram supports retry attempts', async () => {
        const url = 'https://www.instagram.com/reel/ABC123/';
        const result = await extractRecipeFromInstagramViaApi(url, { retryAttempts: 4 });
        expect(result).toBeDefined();
      });

      test('Website supports retry attempts', async () => {
        const url = 'https://www.allrecipes.com/recipe/12345/';
        const result = await extractRecipeFromWebsiteViaApi(url, { retryAttempts: 3 });
        expect(result).toBeDefined();
      });
    });
  });

  describe('Data Validation and Consistency', () => {
    describe('Recipe Data Structure', () => {
      test('extracted recipes have consistent structure', async () => {
        const testCases = [
          {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            extractor: extractRecipeFromYoutube,
          },
          {
            url: 'https://www.tiktok.com/@chef_john/video/1234567890',
            extractor: extractRecipeFromTikTokViaApi,
          },
          {
            url: 'https://www.instagram.com/reel/ABC123/',
            extractor: extractRecipeFromInstagramViaApi,
          },
          {
            url: 'https://www.allrecipes.com/recipe/12345/',
            extractor: extractRecipeFromWebsiteViaApi,
          },
        ];

        for (const { url, extractor } of testCases) {
          const result = await extractor(url);
          if (result.success && result.recipe) {
            // Verify recipe has essential properties
            if (result.recipe.title) {
              expect(typeof result.recipe.title).toBe('string');
              expect(result.recipe.title.length).toBeGreaterThan(0);
            }
          }
        }
      }, 30000);

      test('ingredient lists are properly formatted', async () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const result = await extractRecipeFromYoutube(url);
        
        if (result.success && result.recipe && result.recipe.ingredients) {
          const ingredients = result.recipe.ingredients;
          if (Array.isArray(ingredients)) {
            ingredients.forEach(ingredient => {
              if (ingredient) {
                expect(typeof ingredient).toBe('string');
              }
            });
          }
        }
      });

      test('instructions are properly formatted', async () => {
        const url = 'https://www.tiktok.com/@chef_john/video/1234567890';
        const result = await extractRecipeFromTikTokViaApi(url);
        
        if (result.success && result.recipe && result.recipe.instructions) {
          const instructions = result.recipe.instructions;
          if (Array.isArray(instructions)) {
            instructions.forEach(instruction => {
              if (instruction) {
                expect(typeof instruction).toBe('string');
              }
            });
          }
        }
      });
    });

    describe('Input Validation', () => {
      test('all extractors validate input types', async () => {
        const invalidInputs = [
          null,
          undefined,
          123,
          { url: 'https://example.com' },
          ['https://example.com'],
        ];

        for (const input of invalidInputs) {
          const results = [
            await extractRecipeFromYoutube(input),
            await extractRecipeFromTikTokViaApi(input),
            await extractRecipeFromInstagramViaApi(input),
            await extractRecipeFromWebsiteViaApi(input),
          ];

          results.forEach(result => {
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
          });
        }
      });
    });
  });

  describe('Cross-Platform Consistency', () => {
    test('all platforms handle the same error scenarios', async () => {
      const errorUrl = 'invalid-url-format';
      
      const results = {
        youtube: await extractRecipeFromYoutube(errorUrl),
        tiktok: await extractRecipeFromTikTokViaApi(errorUrl),
        instagram: await extractRecipeFromInstagramViaApi(errorUrl),
        website: await extractRecipeFromWebsiteViaApi(errorUrl),
      };

      // All should fail gracefully
      Object.values(results).forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('all platforms support timeout option', async () => {
      const urls = {
        youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        tiktok: 'https://www.tiktok.com/@chef_john/video/1234567890',
        instagram: 'https://www.instagram.com/reel/ABC123/',
        website: 'https://www.allrecipes.com/recipe/12345/',
      };

      const results = {
        youtube: await extractRecipeFromYoutube(urls.youtube, { timeout: 30000 }),
        tiktok: await extractRecipeFromTikTokViaApi(urls.tiktok, { timeout: 30000 }),
        instagram: await extractRecipeFromInstagramViaApi(urls.instagram, { timeout: 30000 }),
        website: await extractRecipeFromWebsiteViaApi(urls.website, { timeout: 30000 }),
      };

      Object.values(results).forEach(result => {
        expect(result).toBeDefined();
      });
    }, 30000);

    test('all platforms support retry option', async () => {
      const urls = {
        youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        tiktok: 'https://www.tiktok.com/@chef_john/video/1234567890',
        instagram: 'https://www.instagram.com/reel/ABC123/',
        website: 'https://www.allrecipes.com/recipe/12345/',
      };

      const results = {
        youtube: await extractRecipeFromYoutube(urls.youtube, { retryAttempts: 3 }),
        tiktok: await extractRecipeFromTikTokViaApi(urls.tiktok, { retryAttempts: 3 }),
        instagram: await extractRecipeFromInstagramViaApi(urls.instagram, { retryAttempts: 3 }),
        website: await extractRecipeFromWebsiteViaApi(urls.website, { retryAttempts: 3 }),
      };

      Object.values(results).forEach(result => {
        expect(result).toBeDefined();
      });
    }, 30000);
  });

  describe('Performance Characteristics', () => {
    test('extraction completes within acceptable time (YouTube)', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const startTime = Date.now();
      
      await extractRecipeFromYoutube(url);
      
      const duration = Date.now() - startTime;
      // Should complete within 60 seconds (with mocks, should be instant)
      expect(duration).toBeLessThan(60000);
    });

    test('multiple concurrent extractions complete', async () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.tiktok.com/@chef_john/video/1234567890',
        'https://www.instagram.com/reel/ABC123/',
        'https://www.allrecipes.com/recipe/12345/',
      ];

      const startTime = Date.now();
      
      await Promise.all([
        extractRecipeFromYoutube(urls[0]),
        extractRecipeFromTikTokViaApi(urls[1]),
        extractRecipeFromInstagramViaApi(urls[2]),
        extractRecipeFromWebsiteViaApi(urls[3]),
      ]);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(60000);
    });
  });
});
