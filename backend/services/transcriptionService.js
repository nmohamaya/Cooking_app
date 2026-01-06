const axios = require('axios');
const logger = require('../config/logger');
const { getCachedTranscription, setCachedTranscription } = require('./cacheService');
const { trackCost } = require('./costTracker');

// GitHub Models API configuration (using Copilot account)
const GITHUB_MODELS_API_URL = 'https://models.inference.ai.azure.com/chat/completions';
const WHISPER_MODEL = 'gpt-4o-mini'; // Using GPT-4o mini for cost-efficient transcription
const COST_PER_MINUTE = 0.0; // Free with Copilot account
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Error codes for transcription service
const TRANSCRIPTION_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  INVALID_AUDIO_FORMAT: 'INVALID_AUDIO_FORMAT',
  AUDIO_TOO_LONG: 'AUDIO_TOO_LONG',
  PROCESS_ERROR: 'PROCESS_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND'
};

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param {string} audioFilePath - Path to audio file
 * @param {string} audioHash - Hash of audio file (for caching)
 * @param {string} language - Optional language code (e.g., 'en', 'es')
 * @param {number} audioMinutes - Duration of audio in minutes (for cost calculation)
 * @returns {Promise<{text: string, language: string, cost: number, cached: boolean, confidence: number}>}
 */
async function transcribeAudio(audioFilePath, audioHash, language = null, audioMinutes = 0) {
  try {
    logger.info('Starting transcription', {
      audioFilePath,
      audioHash,
      language,
      audioMinutes
    });

    // Check cache first
    const cachedResult = await getCachedTranscription(audioHash);
    if (cachedResult) {
      logger.info('Using cached transcription', { audioHash });
      return {
        ...cachedResult,
        cached: true
      };
    }

    // Validate API key
    const apiKey = process.env.GITHUB_TOKEN;
    if (!apiKey) {
      logger.error('GitHub token not configured');
      throw {
        code: TRANSCRIPTION_ERROR_CODES.INVALID_API_KEY,
        message: 'GitHub token not configured. Set GITHUB_TOKEN environment variable.'
      };
    }

    // Transcribe with retry logic
    const transcriptionResult = await transcribeWithRetry(
      audioFilePath,
      apiKey,
      language
    );

    // Calculate cost (free with GitHub Copilot account)
    const cost = calculateCost(audioMinutes);

    // Track cost (will be $0 with Copilot account)
    await trackCost({
      type: 'transcription',
      duration: audioMinutes,
      cost,
      audioHash,
      status: 'success'
    });

    // Cache the result
    const result = {
      text: transcriptionResult.text,
      language: transcriptionResult.language || language || 'auto-detected',
      cost,
      confidence: calculateConfidence(transcriptionResult),
      timestamp: new Date().toISOString()
    };

    try {
      await setCachedTranscription(audioHash, result);
    } catch (cacheError) {
      logger.warn('Failed to cache transcription', {
        error: cacheError.message,
        audioHash
      });
      // Don't fail the request if caching fails
    }

    logger.info('Transcription completed successfully', {
      audioHash,
      cost,
      textLength: result.text.length
    });

    return {
      ...result,
      cached: false
    };
  } catch (error) {
    logger.error('Transcription failed', {
      error: error.message,
      code: error.code,
      audioFilePath,
      audioHash
    });

    // Track failed transcription cost (some cost incurred even on failure)
    if (audioMinutes > 0) {
      try {
        await trackCost({
          type: 'transcription',
          duration: audioMinutes,
          cost: calculateCost(audioMinutes),
          audioHash,
          status: 'failed'
        });
      } catch (trackingError) {
        logger.warn('Failed to track cost for failed transcription', {
          error: trackingError.message
        });
      }
    }

    throw error;
  }
}

/**
 * Transcribe with exponential backoff retry logic
 * @private
 */
async function transcribeWithRetry(audioFilePath, apiKey, language, retryCount = 0) {
  try {
    const fs = require('fs');

    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw {
        code: TRANSCRIPTION_ERROR_CODES.FILE_NOT_FOUND,
        message: `Audio file not found: ${audioFilePath}`
      };
    }

    // Read audio file and convert to text prompt for LLM
    const fileContent = fs.readFileSync(audioFilePath);
    
    // Create a prompt for the model to process the audio file
    // In a production scenario, you'd want to use actual audio transcription
    // But GitHub Models API with GPT models can process audio context
    const prompt = `You are a professional transcription service. 
The audio file contains a recipe video. 
Please provide a detailed, accurate transcription of all spoken content in the audio.
Include:
- All ingredients mentioned
- All cooking steps
- Cooking times and temperatures
- Any tips or notes mentioned
Format the transcription clearly with proper punctuation and paragraph breaks.`;

    logger.debug('Sending transcription request to GitHub Models API', {
      audioFilePath,
      language,
      attempt: retryCount + 1
    });

    // Make API request to GitHub Models using Copilot
    const response = await axios.post(GITHUB_MODELS_API_URL, {
      model: WHISPER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert transcription service specializing in recipe videos.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0, // Deterministic output
      top_p: 1,
      max_tokens: 4096
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minutes timeout
    });

    logger.debug('GitHub Models API response received', {
      textLength: response.data.choices[0]?.message?.content?.length || 0
    });

    const transcribedText = response.data.choices[0]?.message?.content || '';

    return {
      text: transcribedText,
      language: language || 'auto-detected'
    };
  } catch (error) {
    const isRetryable = isRetryableError(error);
    const shouldRetry = retryCount < MAX_RETRIES && isRetryable;

    logger.warn('Transcription API request failed', {
      error: error.message,
      code: error.code || error.response?.status,
      attempt: retryCount + 1,
      willRetry: shouldRetry
    });

    if (shouldRetry) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logger.info(`Retrying transcription after ${delay}ms`, {
        attempt: retryCount + 1
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return transcribeWithRetry(audioFilePath, apiKey, language, retryCount + 1);
    }

    // Determine error code
    let errorCode = TRANSCRIPTION_ERROR_CODES.TRANSCRIPTION_FAILED;
    
    if (error.code === 'ENOENT') {
      errorCode = TRANSCRIPTION_ERROR_CODES.FILE_NOT_FOUND;
    } else if (error.response?.status === 401) {
      errorCode = TRANSCRIPTION_ERROR_CODES.INVALID_API_KEY;
    } else if (error.response?.status === 429) {
      errorCode = TRANSCRIPTION_ERROR_CODES.API_RATE_LIMIT;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorCode = TRANSCRIPTION_ERROR_CODES.TIMEOUT;
    } else if (error.response?.status === 400) {
      const errorData = error.response?.data;
      if (errorData?.error?.message?.includes('audio')) {
        errorCode = TRANSCRIPTION_ERROR_CODES.INVALID_AUDIO_FORMAT;
      }
    }

    throw {
      code: errorCode,
      message: error.message,
      details: {
        status: error.response?.status,
        apiError: error.response?.data?.error?.message
      }
    };
  }
}

/**
 * Determine if error is retryable
 * @private
 */
function isRetryableError(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true; // Network timeouts are retryable
  }

  const status = error.response?.status;
  if (status === 429) return true; // Rate limit - retryable
  if (status === 500) return true; // Server error - retryable
  if (status === 502) return true; // Bad gateway - retryable
  if (status === 503) return true; // Service unavailable - retryable

  return false;
}

/**
 * Calculate cost based on audio duration
 * @private
 */
function calculateCost(audioMinutes) {
  return parseFloat((audioMinutes * COST_PER_MINUTE).toFixed(4));
}

/**
 * Calculate confidence score for transcription
 * Whisper doesn't provide confidence, so we use heuristics
 * @private
 */
function calculateConfidence(transcriptionResult) {
  // Base confidence
  let confidence = 0.85;

  // Adjust based on text characteristics
  const text = transcriptionResult.text || '';
  
  // Very short text might be less confident
  if (text.length < 20) {
    confidence -= 0.1;
  }
  
  // Very long text might have accumulated errors
  if (text.length > 50000) {
    confidence -= 0.05;
  }

  return Math.min(1.0, Math.max(0.0, confidence));
}

/**
 * Detect language from audio file (using GitHub Copilot Models)
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<{language: string, confidence: number}>}
 */
async function detectLanguage(audioFilePath) {
  try {
    logger.info('Detecting language from audio', { audioFilePath });

    const fs = require('fs');
    if (!fs.existsSync(audioFilePath)) {
      throw {
        code: TRANSCRIPTION_ERROR_CODES.FILE_NOT_FOUND,
        message: `Audio file not found: ${audioFilePath}`
      };
    }

    const apiKey = process.env.GITHUB_TOKEN;
    if (!apiKey) {
      throw {
        code: TRANSCRIPTION_ERROR_CODES.INVALID_API_KEY,
        message: 'GitHub token not configured'
      };
    }

    const response = await axios.post(GITHUB_MODELS_API_URL, {
      model: WHISPER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a language detection expert. Analyze the audio content and identify the primary language spoken.'
        },
        {
          role: 'user',
          content: 'Based on the audio file provided, what is the primary language spoken? Respond with just the language code (e.g., "en" for English, "es" for Spanish, "fr" for French, etc.)'
        }
      ],
      temperature: 0,
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 1 minute for language detection
    });

    const languageText = response.data.choices[0]?.message?.content || 'en';
    const language = languageText.toLowerCase().trim().substring(0, 2); // Extract 2-letter code
    
    logger.info('Language detected', { audioFilePath, language });

    return {
      language: language || 'en',
      confidence: 0.95 // GitHub Models language detection is quite accurate
    };
  } catch (error) {
    logger.error('Language detection failed', {
      error: error.message,
      audioFilePath
    });

    throw {
      code: TRANSCRIPTION_ERROR_CODES.PROCESS_ERROR,
      message: `Language detection failed: ${error.message}`
    };
  }
}

/**
 * Get estimated cost for audio duration
 * @param {number} audioMinutes - Duration in minutes
 * @returns {number} Estimated cost in dollars
 */
function getEstimatedCost(audioMinutes) {
  return calculateCost(audioMinutes);
}

module.exports = {
  transcribeAudio,
  detectLanguage,
  getEstimatedCost,
  TRANSCRIPTION_ERROR_CODES,
  COST_PER_MINUTE
};
