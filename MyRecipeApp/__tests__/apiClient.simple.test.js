/**
 * API Client Service - Simplified Tests
 * Core functionality tests for backend API integration
 */

import axios from 'axios';

jest.mock('axios');

// Setup axios mock BEFORE importing service
const mockClient = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

axios.create.mockReturnValue(mockClient);

import apiClient, {
  downloadVideo,
  transcribeAudio,
  extractRecipe,
  getVideoMetadata,
  getPlatformInfo,
  getDownloadStatus,
  cancelDownload,
  setApiBaseUrl,
  setApiConfig,
  getApiConfig,
  checkApiHealth,
  getAvailablePlatforms,
  analyzeApiError,
} from '../services/apiClient';

describe('API Client Service - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadVideo', () => {
    it('should successfully download video', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          jobId: 'job_123',
          progress: 0,
          videoPath: '/videos/video.mp4',
          metadata: { duration: 120, title: 'Recipe Video' },
        },
      });

      const result = await downloadVideo('https://youtube.com/watch?v=abc');

      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job_123');
      expect(mockClient.post).toHaveBeenCalled();
    });

    it('should use custom options', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: { jobId: 'job_456', progress: 0 },
      });

      const result = await downloadVideo('https://youtube.com/watch?v=xyz', {
        platform: 'youtube',
        quality: 'high',
      });

      expect(result.success).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/download',
        expect.objectContaining({
          platform: 'youtube',
          quality: 'high',
        })
      );
    });
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe audio', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          transcript: 'Mix flour and water for dough',
          language: 'en',
          confidence: 0.95,
          duration: 60,
        },
      });

      const result = await transcribeAudio('/audio/recipe.mp3');

      expect(result.success).toBe(true);
      expect(result.transcript).toBe('Mix flour and water for dough');
      expect(result.confidence).toBe(0.95);
    });

    it('should accept language option', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          transcript: 'Mezclar harina y agua',
          language: 'es',
        },
      });

      const result = await transcribeAudio('/audio/recipe.mp3', {
        language: 'es',
      });

      expect(result.success).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/transcribe',
        expect.objectContaining({
          language: 'es',
        })
      );
    });
  });

  describe('extractRecipe', () => {
    it('should successfully extract recipe from transcript', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          recipe: {
            name: 'Bread',
            ingredients: ['flour', 'water', 'salt'],
            instructions: ['Mix', 'Knead', 'Bake'],
          },
          confidence: 0.92,
          processTime: 1500,
        },
      });

      const result = await extractRecipe(
        'Mix flour and water for dough. Knead for 10 minutes. Bake at 350F.'
      );

      expect(result.success).toBe(true);
      expect(result.recipe.name).toBe('Bread');
      expect(result.confidence).toBe(0.92);
    });

    it('should accept AI model option', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          recipe: { name: 'Test Recipe' },
          confidence: 0.9,
        },
      });

      const result = await extractRecipe('Test transcript', {
        aiModel: 'gpt-4',
      });

      expect(result.success).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith(
        '/recipes',
        expect.objectContaining({
          aiModel: 'gpt-4',
        })
      );
    });
  });

  describe('getVideoMetadata', () => {
    it('should fetch video metadata', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: {
          metadata: {
            title: 'How to Make Bread',
            description: 'A guide to making bread',
          },
          platform: 'youtube',
          duration: 1200,
        },
      });

      const result = await getVideoMetadata('https://youtube.com/watch?v=xyz');

      expect(result.success).toBe(true);
      expect(result.metadata.title).toBe('How to Make Bread');
      expect(result.platform).toBe('youtube');
    });
  });

  describe('getDownloadStatus', () => {
    it('should get download job status', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          status: 'completed',
          progress: 100,
          videoPath: '/videos/complete.mp4',
        },
      });

      const result = await getDownloadStatus('job_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
      expect(mockClient.get).toHaveBeenCalledWith('/download/job_123');
    });
  });

  describe('cancelDownload', () => {
    it('should cancel download job', async () => {
      mockClient.delete.mockResolvedValueOnce({
        data: {
          message: 'Download cancelled',
        },
      });

      const result = await cancelDownload('job_123');

      expect(result.success).toBe(true);
      expect(mockClient.delete).toHaveBeenCalledWith('/download/job_123');
    });
  });

  describe('Configuration', () => {
    it('should update API base URL', () => {
      setApiBaseUrl('http://custom-api.com');
      expect(getApiConfig().BASE_URL).toBe('http://custom-api.com');
    });

    it('should update API config', () => {
      setApiConfig({ REQUEST_LOG: false, TIMEOUT: 30000 });
      const config = getApiConfig();
      expect(config.REQUEST_LOG).toBe(false);
      expect(config.TIMEOUT).toBe(30000);
    });

    it('should return current config', () => {
      const config = getApiConfig();
      expect(config).toHaveProperty('BASE_URL');
      expect(config).toHaveProperty('TIMEOUT');
      expect(config).toHaveProperty('RETRY_ATTEMPTS');
    });
  });

  describe('checkApiHealth', () => {
    it('should check API health', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          status: 'ok',
          message: 'API is healthy',
          uptime: 3600,
        },
      });

      const result = await checkApiHealth();

      expect(result.success).toBe(true);
      expect(result.status).toBe('ok');
    });
  });

  describe('getAvailablePlatforms', () => {
    it('should return platform list', () => {
      const platforms = getAvailablePlatforms();
      expect(Array.isArray(platforms)).toBe(true);
      expect(platforms.length).toBeGreaterThan(0);
      expect(platforms).toContain('youtube');
    });
  });

  describe('analyzeApiError', () => {
    it('should identify timeout errors', () => {
      const error = new Error('timeout');
      error.code = 'ECONNABORTED';
      const analysis = analyzeApiError(error);
      expect(analysis.type).toBe('timeout');
      expect(analysis.recoverable).toBe(true);
    });

    it('should identify rate limit errors', () => {
      const error = new Error('Too Many Requests');
      error.response = { status: 429 };
      const analysis = analyzeApiError(error);
      expect(analysis.type).toBe('rate_limited');
      expect(analysis.recoverable).toBe(true);
    });

    it('should identify server errors', () => {
      const error = new Error('Server Error');
      error.response = { status: 503 };
      const analysis = analyzeApiError(error);
      expect(analysis.type).toBe('server_error');
      expect(analysis.recoverable).toBe(true);
    });

    it('should identify invalid request errors', () => {
      const error = new Error('Invalid Request');
      error.response = { status: 400 };
      const analysis = analyzeApiError(error);
      expect(analysis.type).toBe('invalid_request');
      expect(analysis.recoverable).toBe(false);
    });

    it('should identify authentication errors', () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      const analysis = analyzeApiError(error);
      expect(analysis.type).toBe('authentication');
      expect(analysis.recoverable).toBe(false);
    });

    it('should identify network errors', () => {
      const error = new Error('Network Error');
      error.code = 'ENOTFOUND';
      const analysis = analyzeApiError(error);
      expect(analysis.type).toBe('network');
      expect(analysis.recoverable).toBe(true);
    });

    it('should handle null errors gracefully', () => {
      const analysis = analyzeApiError(null);
      expect(analysis).toHaveProperty('type');
      expect(analysis).toHaveProperty('recoverable');
    });

    it('should provide helpful recommendations', () => {
      const error = new Error('Something went wrong');
      const analysis = analyzeApiError(error);
      expect(analysis).toHaveProperty('recommendation');
      expect(analysis.recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('Integration - Full Workflow', () => {
    it('should complete full video to recipe workflow', async () => {
      // Mock download
      mockClient.post.mockResolvedValueOnce({
        data: { jobId: 'job_123', progress: 0, videoPath: '/videos/video.mp4' },
      });

      const downloadResult = await downloadVideo('https://youtube.com/watch?v=xyz');
      expect(downloadResult.success).toBe(true);

      // Mock transcription
      mockClient.post.mockResolvedValueOnce({
        data: {
          transcript: 'Mix flour and water. Bake at 350F.',
          language: 'en',
          confidence: 0.95,
        },
      });

      const transcribeResult = await transcribeAudio(downloadResult.videoPath);
      expect(transcribeResult.success).toBe(true);

      // Mock extraction
      mockClient.post.mockResolvedValueOnce({
        data: {
          recipe: { name: 'Bread', ingredients: ['flour', 'water'] },
          confidence: 0.92,
        },
      });

      const extractResult = await extractRecipe(transcribeResult.transcript);
      expect(extractResult.success).toBe(true);
      expect(extractResult.recipe.name).toBe('Bread');
    });
  });
});
