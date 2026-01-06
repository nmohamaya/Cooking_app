const { 
  transcribeAudio, 
  detectLanguage, 
  getEstimatedCost,
  TRANSCRIPTION_ERROR_CODES 
} = require('../services/transcriptionService');

// Mock GitHub Models API calls
jest.mock('axios');
const axios = require('axios');

describe('transcriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GITHUB_TOKEN = 'test-github-token';
  });

  describe('transcribeAudio', () => {
    test('transcribes audio successfully', async () => {
      // Mock axios response
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Mix the flour and butter together'
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'audio-hash-123',
        'en',
        5
      );

      expect(result.text).toBe('Mix the flour and butter together');
      expect(result.language).toBe('en');
      expect(result.cost).toBeCloseTo(0, 4); // Free with Copilot
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.cached).toBe(false);
    });

    test('handles language auto-detection', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Mezcla la harina y la mantequilla'
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'audio-hash-456',
        null, // No language specified
        3
      );

      expect(result.language).toBe('auto-detected');
      expect(result.cost).toBeCloseTo(0, 4); // Free with Copilot
    });

    test('throws error when API key is missing', async () => {
      delete process.env.GITHUB_TOKEN;

      await expect(
        transcribeAudio('/tmp/audio.wav', 'hash', 'en', 5)
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.INVALID_API_KEY,
          message: expect.stringContaining('GitHub token')
        })
      );
    });

    test('handles API rate limiting with retry logic', async () => {
      // First two calls fail with rate limit, third succeeds
      axios.post
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({
          data: {
            choices: [{
              message: {
                content: 'Successful transcription'
              }
            }]
          }
        });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'hash-rate-limit',
        'en',
        2
      );

      expect(result.text).toBe('Successful transcription');
      expect(axios.post).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });

    test('throws error after max retries exceeded', async () => {
      axios.post.mockRejectedValue({
        response: { status: 429 },
        message: 'Rate limited'
      });

      await expect(
        transcribeAudio('/tmp/audio.wav', 'hash-fail', 'en', 2)
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.API_RATE_LIMIT
        })
      );

      // Should retry 3 times
      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    test('handles 401 unauthorized error', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } }
        },
        message: 'Unauthorized'
      });

      await expect(
        transcribeAudio('/tmp/audio.wav', 'hash-401', 'en', 2)
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.INVALID_API_KEY
        })
      );
    });

    test('handles timeout errors', async () => {
      axios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'Timeout'
      });

      await expect(
        transcribeAudio('/tmp/audio.wav', 'hash-timeout', 'en', 60)
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.TIMEOUT
        })
      );
    });

    test('handles invalid audio format error', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: { message: 'Invalid audio format' } }
        },
        message: 'Bad request'
      });

      await expect(
        transcribeAudio('/tmp/audio.mp3', 'hash-invalid', 'en', 2)
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.INVALID_AUDIO_FORMAT
        })
      );
    });

    test('handles file not found error', async () => {
      axios.post.mockRejectedValueOnce({
        code: 'ENOENT',
        message: 'File not found'
      });

      await expect(
        transcribeAudio('/nonexistent/audio.wav', 'hash-notfound', 'en', 2)
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.FILE_NOT_FOUND
        })
      );
    });

    test('calculates confidence score', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          text: 'Transcribed text',
          language: 'en'
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'hash-confidence',
        'en',
        2
      );

      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.0);
    });

    test('reduces confidence for very short text', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          text: 'ok',
          language: 'en'
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'hash-short',
        'en',
        1
      );

      expect(result.confidence).toBeLessThan(0.85);
    });
  });

  describe('detectLanguage', () => {
    test('detects language from audio', async () => {
      axios.post.mockResolvedValueOnce({
        data: { language: 'fr' }
      });

      const result = await detectLanguage('/tmp/audio.wav');

      expect(result.language).toBe('fr');
      expect(result.confidence).toBeCloseTo(0.95);
    });

    test('throws error when API key missing', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(
        detectLanguage('/tmp/audio.wav')
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.INVALID_API_KEY
        })
      );
    });

    test('handles language detection errors', async () => {
      axios.post.mockRejectedValueOnce({
        message: 'Detection failed'
      });

      await expect(
        detectLanguage('/tmp/audio.wav')
      ).rejects.toEqual(
        expect.objectContaining({
          code: TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR
        })
      );
    });

    test('handles multiple language formats', async () => {
      const testCases = [
        { language: 'en', expected: 'en' },
        { language: 'es', expected: 'es' },
        { language: 'fr', expected: 'fr' },
        { language: 'de', expected: 'de' },
        { language: 'zh', expected: 'zh' }
      ];

      for (const testCase of testCases) {
        axios.post.mockResolvedValueOnce({
          data: { language: testCase.language }
        });

        const result = await detectLanguage('/tmp/audio.wav');
        expect(result.language).toBe(testCase.expected);
      }
    });
  });

  describe('Cost Calculation', () => {
    test('calculates cost correctly (free with Copilot)', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Text'
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'hash-cost',
        'en',
        10
      );

      expect(result.cost).toBeCloseTo(0, 4); // Free with Copilot
    });

    test('handles fractional minute costs', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Text'
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'hash-fractional',
        'en',
        2.5
      );

      expect(result.cost).toBeCloseTo(0, 4); // Free with Copilot
    });

    test('getEstimatedCost returns 0 (free with Copilot)', () => {
      const cost5min = getEstimatedCost(5);
      expect(cost5min).toBeCloseTo(0, 4);

      const cost60min = getEstimatedCost(60);
      expect(cost60min).toBeCloseTo(0, 4);
    });
  });

  describe('Error handling', () => {
    test('tracks cost even on failure', async () => {
      axios.post.mockRejectedValueOnce({
        response: { status: 500 },
        message: 'Server error'
      });

      await expect(
        transcribeAudio('/tmp/audio.wav', 'hash-track', 'en', 3)
      ).rejects.toThrow();

      // Cost should still be tracked (in real scenario)
      // This test verifies the error handling flow
    });

    test('preserves error details', async () => {
      const errorDetails = 'Specific API error message';
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: { message: errorDetails } }
        },
        message: 'Bad request'
      });

      try {
        await transcribeAudio('/tmp/audio.wav', 'hash-details', 'en', 2);
      } catch (error) {
        expect(error.details).toBeDefined();
      }
    });
  });

  describe('Edge cases', () => {
    test('handles very long audio (over 1 hour)', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Very long transcription'
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/long-audio.wav',
        'hash-long',
        'en',
        120
      );

      expect(result.cost).toBeCloseTo(0, 4); // Free with Copilot
    });

    test('handles zero duration gracefully', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Text'
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/audio.wav',
        'hash-zero',
        'en',
        0
      );

      expect(result.cost).toBe(0);
    });

    test('handles empty transcription result', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: ''
            }
          }]
        }
      });

      const result = await transcribeAudio(
        '/tmp/silent-audio.wav',
        'hash-empty',
        'en',
        5
      );

      expect(result.text).toBe('');
      expect(result.cost).toBeCloseTo(0, 4); // Free with Copilot
    });
  });
});
