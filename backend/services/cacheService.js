const crypto = require('crypto');
const logger = require('../config/logger');

// In-memory cache for transcriptions
// In production, consider using Redis for distributed caching
const transcriptionCache = new Map();

// Cache configuration
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const MAX_CACHE_SIZE = 10000; // Maximum number of cached items

/**
 * Generate hash for audio file (for cache key)
 * In production, this would use actual file content hash
 * @param {string} audioFilePath - Path to audio file
 * @returns {string} Hash of the audio file
 */
function generateAudioHash(audioFilePath) {
  return crypto
    .createHash('sha256')
    .update(audioFilePath)
    .digest('hex');
}

/**
 * Get cached transcription result
 * @param {string} audioHash - Hash of audio file
 * @returns {Promise<?Object>} Cached transcription or null if not found/expired
 */
async function getCachedTranscription(audioHash) {
  try {
    if (!audioHash) {
      return null;
    }

    const cached = transcriptionCache.get(audioHash);

    if (!cached) {
      logger.debug('Cache miss', { audioHash });
      return null;
    }

    // Check if cache has expired
    if (Date.now() - cached.cachedAt > CACHE_TTL) {
      logger.debug('Cache expired', { audioHash });
      transcriptionCache.delete(audioHash);
      return null;
    }

    logger.info('Cache hit', {
      audioHash,
      age: Date.now() - cached.cachedAt
    });

    // Update last accessed time
    cached.lastAccessedAt = Date.now();
    cached.accessCount = (cached.accessCount || 0) + 1;

    return {
      text: cached.text,
      language: cached.language,
      cost: cached.cost,
      confidence: cached.confidence,
      timestamp: cached.timestamp
    };
  } catch (error) {
    logger.error('Cache retrieval failed', {
      error: error.message,
      audioHash
    });

    return null;
  }
}

/**
 * Store transcription result in cache
 * @param {string} audioHash - Hash of audio file
 * @param {Object} transcriptionResult - Transcription result to cache
 * @returns {Promise<void>}
 */
async function setCachedTranscription(audioHash, transcriptionResult) {
  try {
    if (!audioHash) {
      throw new Error('Audio hash is required');
    }

    // Check cache size and evict if necessary
    if (transcriptionCache.size >= MAX_CACHE_SIZE) {
      evictOldestCacheEntry();
    }

    const cacheEntry = {
      text: transcriptionResult.text,
      language: transcriptionResult.language,
      cost: transcriptionResult.cost,
      confidence: transcriptionResult.confidence,
      timestamp: transcriptionResult.timestamp,
      cachedAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0
    };

    transcriptionCache.set(audioHash, cacheEntry);

    logger.info('Transcription cached', {
      audioHash,
      textLength: transcriptionResult.text.length,
      cacheSize: transcriptionCache.size
    });
  } catch (error) {
    logger.error('Cache storage failed', {
      error: error.message,
      audioHash
    });

    throw {
      code: 'CACHE_ERROR',
      message: `Failed to cache transcription: ${error.message}`
    };
  }
}

/**
 * Evict oldest cache entry based on LRU (Least Recently Used) strategy
 * @private
 */
function evictOldestCacheEntry() {
  let oldestKey = null;
  let oldestTime = Infinity;

  for (const [key, value] of transcriptionCache.entries()) {
    const accessTime = value.lastAccessedAt || value.cachedAt;
    if (accessTime < oldestTime) {
      oldestTime = accessTime;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    transcriptionCache.delete(oldestKey);
    logger.debug('Cache entry evicted (LRU)', { removedKey: oldestKey });
  }
}

/**
 * Clear cache entry
 * @param {string} audioHash - Hash of audio file
 * @returns {Promise<void>}
 */
async function clearCacheEntry(audioHash) {
  try {
    if (transcriptionCache.has(audioHash)) {
      transcriptionCache.delete(audioHash);
      logger.info('Cache entry cleared', { audioHash });
    }
  } catch (error) {
    logger.error('Cache clear failed', {
      error: error.message,
      audioHash
    });

    throw error;
  }
}

/**
 * Clear all cache
 * @returns {Promise<void>}
 */
async function clearAllCache() {
  try {
    const previousSize = transcriptionCache.size;
    transcriptionCache.clear();

    logger.info('All cache cleared', { previousSize });
  } catch (error) {
    logger.error('Clear all cache failed', {
      error: error.message
    });

    throw error;
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  let totalSavings = 0;
  let totalAccesses = 0;

  for (const value of transcriptionCache.values()) {
    totalAccesses += value.accessCount || 0;
    totalSavings += (value.cost || 0) * (value.accessCount || 0);
  }

  return {
    size: transcriptionCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMs: CACHE_TTL,
    totalAccesses,
    totalSavings: parseFloat(totalSavings.toFixed(4)),
    averageSavingsPerItem: transcriptionCache.size > 0
      ? parseFloat((totalSavings / transcriptionCache.size).toFixed(4))
      : 0
  };
}

module.exports = {
  generateAudioHash,
  getCachedTranscription,
  setCachedTranscription,
  clearCacheEntry,
  clearAllCache,
  getCacheStats
};
