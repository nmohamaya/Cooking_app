/**
 * API Client Service
 * Centralized service for all backend API calls with request/response logging,
 * retry logic, error handling, and service discovery
 */

import axios from 'axios';

/**
 * API Configuration
 */
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 60000, // 60 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  REQUEST_LOG: true,
  RESPONSE_LOG: true,
};

/**
 * Service endpoints mapping
 */
const ENDPOINTS = {
  // Video & Audio Processing
  DOWNLOAD_VIDEO: '/download',
  TRANSCRIBE_AUDIO: '/transcribe',
  EXTRACT_RECIPE: '/recipes',
  
  // Video Platform Specific
  YOUTUBE: '/youtube',
  TIKTOK: '/tiktok',
  INSTAGRAM: '/instagram',
  WEBSITE: '/website',
  
  // Metadata
  VIDEO_METADATA: '/metadata',
};

/**
 * Platform to endpoint mapping
 */
const PLATFORM_ENDPOINTS = {
  youtube: ENDPOINTS.YOUTUBE,
  tiktok: ENDPOINTS.TIKTOK,
  instagram: ENDPOINTS.INSTAGRAM,
  website: ENDPOINTS.WEBSITE,
};

/**
 * Initialize axios instance with default config
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MyRecipeApp/1.0',
    },
  });

  // Request interceptor for logging
  if (client.interceptors && client.interceptors.request) {
    client.interceptors.request.use(
      (config) => {
        if (API_CONFIG.REQUEST_LOG) {
          console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }
        return config;
      },
      (error) => {
        console.error('[API] Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    client.interceptors.response.use(
      (response) => {
        if (API_CONFIG.RESPONSE_LOG) {
          console.log(`[API] ${response.status} ${response.config.url}`, {
            data: response.data,
          });
        }
        return response;
      },
      (error) => {
        if (API_CONFIG.RESPONSE_LOG) {
          console.error('[API] Response Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  return client;
};

let apiClient = null;

/**
 * Get or create the API client instance
 * @returns {Object} - axios client instance
 */
const getApiClient = () => {
  if (!apiClient) {
    apiClient = createApiClient();
  }
  return apiClient;
};

/**
 * Make API request with retry logic
 * @param {Function} requestFn - Function that makes the API call
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} - Response data
 */
const makeRequestWithRetry = async (requestFn, attempt = 1) => {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    if (attempt < API_CONFIG.RETRY_ATTEMPTS && isRetryableError(error)) {
      const delay = API_CONFIG.RETRY_DELAY * attempt;
      console.warn(`[API] Retrying (attempt ${attempt + 1}/${API_CONFIG.RETRY_ATTEMPTS}) after ${delay}ms`, {
        error: error.message,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return makeRequestWithRetry(requestFn, attempt + 1);
    }

    throw error;
  }
};

/**
 * Determine if error is retryable
 * @param {Object} error - Axios error object
 * @returns {boolean}
 */
const isRetryableError = (error) => {
  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Retry on specific status codes
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.response.status);
};

/**
 * Format error response
 * @param {Object} error - Error object
 * @returns {Object} - Formatted error
 */
const formatError = (error) => {
  if (error.response) {
    return {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || error.response.statusText,
      data: error.response.data,
      error: error.message,
    };
  }

  if (error.request) {
    return {
      success: false,
      message: 'No response from server',
      error: error.message,
    };
  }

  return {
    success: false,
    message: error.message,
    error: error.message,
  };
};

/**
 * Download video from URL
 * @param {string} url - Video URL
 * @param {Object} options - Download options {platform, quality, format}
 * @returns {Promise<Object>} - {success, jobId, progress, error}
 */
export const downloadVideo = async (url, options = {}) => {
  try {
    const { platform = 'generic', quality = 'high', format = 'mp4' } = options;

    const response = await makeRequestWithRetry(() =>
      getApiClient().post(ENDPOINTS.DOWNLOAD_VIDEO, {
        url,
        platform,
        quality,
        format,
      })
    );

    return {
      success: true,
      jobId: response.jobId,
      progress: response.progress || 0,
      videoPath: response.videoPath,
      metadata: response.metadata,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Transcribe audio file
 * @param {string} audioPath - Path to audio file
 * @param {Object} options - Transcription options {language, model}
 * @returns {Promise<Object>} - {success, transcript, language, error}
 */
export const transcribeAudio = async (audioPath, options = {}) => {
  try {
    const { language = 'auto', model = 'base' } = options;

    const response = await makeRequestWithRetry(() =>
      getApiClient().post(ENDPOINTS.TRANSCRIBE_AUDIO, {
        audioPath,
        language,
        model,
      })
    );

    return {
      success: true,
      transcript: response.transcript,
      language: response.language,
      confidence: response.confidence,
      duration: response.duration,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Extract recipe from transcript
 * @param {string} transcript - Recipe transcript/text
 * @param {Object} options - Extraction options {aiModel}
 * @returns {Promise<Object>} - {success, recipe, error}
 */
export const extractRecipe = async (transcript, options = {}) => {
  try {
    const { aiModel = 'gpt-3.5-turbo' } = options;

    const response = await makeRequestWithRetry(() =>
      getApiClient().post(ENDPOINTS.EXTRACT_RECIPE, {
        transcript,
        aiModel,
      })
    );

    return {
      success: true,
      recipe: response.recipe,
      confidence: response.confidence,
      processTime: response.processTime,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Fetch video metadata
 * @param {string} url - Video URL
 * @param {string} platform - Video platform
 * @returns {Promise<Object>} - {success, metadata, error}
 */
export const getVideoMetadata = async (url, platform = 'generic') => {
  try {
    const response = await makeRequestWithRetry(() =>
      getApiClient().post(ENDPOINTS.VIDEO_METADATA, {
        url,
        platform,
      })
    );

    return {
      success: true,
      metadata: response.metadata,
      platform: response.platform,
      duration: response.duration,
      title: response.title,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Get platform-specific download info
 * @param {string} platform - Platform name (youtube, tiktok, instagram, website)
 * @param {string} url - Video URL
 * @returns {Promise<Object>} - {success, info, error}
 */
export const getPlatformInfo = async (platform, url) => {
  try {
    const endpoint = PLATFORM_ENDPOINTS[platform] || ENDPOINTS.DOWNLOAD_VIDEO;

    const response = await makeRequestWithRetry(() =>
      getApiClient().post(endpoint, {
        url,
        action: 'info',
      })
    );

    return {
      success: true,
      platform,
      info: response.info || response,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Get download job status
 * @param {string} jobId - Job ID from download response
 * @returns {Promise<Object>} - {success, status, progress, error}
 */
export const getDownloadStatus = async (jobId) => {
  try {
    const response = await makeRequestWithRetry(() =>
      getApiClient().get(`${ENDPOINTS.DOWNLOAD_VIDEO}/${jobId}`)
    );

    return {
      success: true,
      jobId,
      status: response.status,
      progress: response.progress || 0,
      videoPath: response.videoPath,
      error: response.error,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Cancel download job
 * @param {string} jobId - Job ID to cancel
 * @returns {Promise<Object>} - {success, message, error}
 */
export const cancelDownload = async (jobId) => {
  try {
    const response = await makeRequestWithRetry(() =>
      getApiClient().delete(`${ENDPOINTS.DOWNLOAD_VIDEO}/${jobId}`)
    );

    return {
      success: true,
      message: response.message || 'Download cancelled',
      jobId,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Set API base URL (for environment switching)
 * @param {string} baseUrl - New base URL
 */
export const setApiBaseUrl = (baseUrl) => {
  API_CONFIG.BASE_URL = baseUrl;
  apiClient = null;
  console.log('[API] Base URL changed to:', baseUrl);
};

/**
 * Set API configuration
 * @param {Object} config - Configuration object
 */
export const setApiConfig = (config) => {
  Object.assign(API_CONFIG, config);
  if (config.BASE_URL) {
    apiClient = null;
  }
  console.log('[API] Configuration updated:', API_CONFIG);
};

/**
 * Get current API configuration
 * @returns {Object} - Current configuration
 */
export const getApiConfig = () => {
  return { ...API_CONFIG };
};

/**
 * Check API health/availability
 * @returns {Promise<Object>} - {success, status, message}
 */
export const checkApiHealth = async () => {
  try {
    const response = await makeRequestWithRetry(() =>
      getApiClient().get('/health')
    );

    return {
      success: true,
      status: response.status || 'ok',
      message: response.message || 'API is healthy',
      uptime: response.uptime,
    };
  } catch (error) {
    return formatError(error);
  }
};

/**
 * Get available platforms
 * @returns {Array<string>} - List of supported platforms
 */
export const getAvailablePlatforms = () => {
  return Object.keys(PLATFORM_ENDPOINTS);
};

/**
 * Analyze API error and provide recommendations
 * @param {Object} error - Error object
 * @returns {Object} - {type, recoverable, recommendation}
 */
export const analyzeApiError = (error) => {
  if (!error) {
    return {
      type: 'unknown',
      recoverable: true,
      recommendation: 'Please try again',
    };
  }

  if (error.response?.status === 408 || error.code === 'ECONNABORTED') {
    return {
      type: 'timeout',
      recoverable: true,
      recommendation: 'Request timed out. Please try again.',
    };
  }

  if (error.response?.status === 429) {
    return {
      type: 'rate_limited',
      recoverable: true,
      recommendation: 'Too many requests. Please wait before trying again.',
    };
  }

  if (error.response?.status === 500 || error.response?.status === 503) {
    return {
      type: 'server_error',
      recoverable: true,
      recommendation: 'Server is having issues. Please try again later.',
    };
  }

  if (error.response?.status === 400) {
    return {
      type: 'invalid_request',
      recoverable: false,
      recommendation: error.response?.data?.message || 'Invalid request. Please check your input.',
    };
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    return {
      type: 'authentication',
      recoverable: false,
      recommendation: 'Authentication failed. Please log in again.',
    };
  }

  if (!error.response) {
    return {
      type: 'network',
      recoverable: true,
      recommendation: 'Network connection failed. Please check your internet connection.',
    };
  }

  return {
    type: 'generic',
    recoverable: true,
    recommendation: error.message || 'An error occurred. Please try again.',
  };
};

export default {
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
  getApiClient,
};
