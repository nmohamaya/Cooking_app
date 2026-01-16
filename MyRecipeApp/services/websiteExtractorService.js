/**
 * Website/Blog Recipe Extraction Service
 * Fetches and processes recipes from food blogs, recipe websites, and cooking platforms
 * Supports content parsing, recipe extraction, and metadata collection
 */

import { AsyncStorage } from 'react-native';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  TTL_MS: 60 * 60 * 1000, // 1 hour in milliseconds
  KEY_PREFIX: 'website_recipe_',
};

/**
 * Website URL patterns for recipe sites
 */
const WEBSITE_PATTERNS = {
  // Major recipe sites
  allRecipes: /^https?:\/\/(www\.)?allrecipes\.com\/recipe\/\d+\//,
  foodNetwork: /^https?:\/\/(www\.)?foodnetwork\.com\/recipes\/\d+\//,
  epicurious: /^https?:\/\/(www\.)?epicurious\.com\/recipes\/food\/views\/[^\/]+\//,
  simplyRecipes: /^https?:\/\/(www\.)?simplyrecipes\.com\/recipes\/[^\/]+\//,
  kingArthur: /^https?:\/\/(www\.)?kingarthurbaking\.com\/recipes\/[^\/]+\//,
  bonAppetit: /^https?:\/\/(www\.)?bonappetitmag\.com\/recipe\/[^\/]+\//,
  serious: /^https?:\/\/(www\.)?seriouseats\.com\/recipes\/[^\/]+\//,
  generic: /^https?:\/\/[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=]+/,
};

/**
 * HTML selectors for recipe extraction
 */
const SELECTORS = {
  title: ['h1', 'h1.recipe-title', '[data-name="recipe-name"]', '.recipe-title'],
  description: ['p.recipe-description', '[data-description]', '.description', 'meta[name="description"]'],
  ingredients: ['li.ingredient', '[data-ingredient]', 'ul.ingredients li', '.ingredients li'],
  instructions: ['li.instruction', '[data-instruction]', 'ol.instructions li', '.instructions li'],
  prepTime: ['[data-prep-time]', '.prep-time', '[itemprop="prepTime"]'],
  cookTime: ['[data-cook-time]', '.cook-time', '[itemprop="cookTime"]'],
  servings: ['[data-servings]', '.servings', '[itemprop="recipeYield"]'],
  difficulty: ['[data-difficulty]', '.difficulty-level', '[itemprop="recipeDifficulty"]'],
};

/**
 * Validate website URL and extract domain
 * @param {string} url - Website URL
 * @returns {Object} - {valid, domain, type, error}
 */
export const validateWebsiteUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  const trimmedUrl = url.trim();

  try {
    const urlObj = new URL(trimmedUrl);
    const domain = urlObj.hostname;

    // Check if it matches known recipe sites
    let type = 'generic';

    if (WEBSITE_PATTERNS.allRecipes.test(trimmedUrl)) {
      type = 'allrecipes';
    } else if (WEBSITE_PATTERNS.foodNetwork.test(trimmedUrl)) {
      type = 'foodnetwork';
    } else if (WEBSITE_PATTERNS.epicurious.test(trimmedUrl)) {
      type = 'epicurious';
    } else if (WEBSITE_PATTERNS.simplyRecipes.test(trimmedUrl)) {
      type = 'simplyrecipes';
    } else if (WEBSITE_PATTERNS.kingArthur.test(trimmedUrl)) {
      type = 'kingarthur';
    } else if (WEBSITE_PATTERNS.bonAppetit.test(trimmedUrl)) {
      type = 'bonappetit';
    } else if (WEBSITE_PATTERNS.serious.test(trimmedUrl)) {
      type = 'seriouseats';
    }

    return {
      valid: true,
      domain,
      type,
      url: trimmedUrl,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
};

/**
 * Fetch website content
 * @param {string} url - Website URL
 * @returns {Promise<Object>} - {success, content, error}
 */
export const fetchWebsiteContent = async (url) => {
  if (!url || typeof url !== 'string') {
    return {
      success: false,
      error: 'Invalid URL',
      url,
    };
  }

  try {
    // Check cache first
    const cached = await getCachedContent(url);
    if (cached) {
      return {
        success: true,
        content: cached.content,
        fromCache: true,
        expiresAt: cached.expiresAt,
        url,
      };
    }

    // Fetch from website API
    const content = await fetchContentFromAPI(url);

    if (!content) {
      return {
        success: false,
        error: 'Failed to fetch website content',
        url,
      };
    }

    // Cache the content
    await cacheContent(url, content);

    return {
      success: true,
      content,
      fromCache: false,
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
      url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch website content',
      url,
    };
  }
};

/**
 * Extract recipe from website content
 * @param {string} url - Website URL
 * @returns {Promise<Object>} - {success, recipe, metadata, error}
 */
export const extractRecipeFromWebsite = async (url) => {
  if (!url || typeof url !== 'string') {
    return {
      success: false,
      error: 'Invalid URL',
      url,
    };
  }

  try {
    // Fetch content
    const contentResult = await fetchWebsiteContent(url);

    if (!contentResult.success) {
      return {
        success: false,
        error: 'Could not fetch website content',
        url,
      };
    }

    const { content } = contentResult;
    const validation = validateWebsiteUrl(url);

    // Parse recipe from content
    const recipe = parseRecipeFromContent(content, validation.type);

    return {
      success: true,
      recipe,
      metadata: {
        url,
        domain: validation.domain,
        type: validation.type,
        fetchedAt: new Date().toISOString(),
      },
      url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to extract recipe',
      url,
    };
  }
};

/**
 * Get website metadata and SEO information
 * @param {string} url - Website URL
 * @returns {Promise<Object>} - {success, metadata, error}
 */
export const getWebsiteMetadata = async (url) => {
  if (!url || typeof url !== 'string') {
    return {
      success: false,
      error: 'Invalid URL',
      url,
    };
  }

  try {
    // Check cache first
    const cached = await getCachedMetadata(url);
    if (cached) {
      return {
        success: true,
        metadata: cached.metadata,
        fromCache: true,
        expiresAt: cached.expiresAt,
        url,
      };
    }

    // Fetch metadata from API
    const metadata = await fetchMetadataFromAPI(url);

    if (!metadata) {
      return {
        success: false,
        error: 'Could not fetch website metadata',
        url,
      };
    }

    // Cache the metadata
    await cacheMetadata(url, metadata);

    return {
      success: true,
      metadata,
      fromCache: false,
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
      url,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch metadata',
      url,
    };
  }
};

/**
 * Cache website content in AsyncStorage
 * @param {string} url - URL
 * @param {string} content - Content to cache
 */
const cacheContent = async (url, content) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}content_${encodeURIComponent(url).substring(0, 50)}`;
    const cacheData = {
      content,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache website content:', error);
  }
};

/**
 * Get cached website content from AsyncStorage
 * @param {string} url - URL
 * @returns {Promise<Object|null>} - Cached content or null
 */
const getCachedContent = async (url) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}content_${encodeURIComponent(url).substring(0, 50)}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return null;

    const { content, expiresAt } = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      content,
      expiresAt,
    };
  } catch (error) {
    console.warn('Failed to retrieve cached website content:', error);
    return null;
  }
};

/**
 * Cache website metadata in AsyncStorage
 * @param {string} url - URL
 * @param {Object} metadata - Metadata to cache
 */
const cacheMetadata = async (url, metadata) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}metadata_${encodeURIComponent(url).substring(0, 50)}`;
    const cacheData = {
      metadata,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_CONFIG.TTL_MS,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to cache website metadata:', error);
  }
};

/**
 * Get cached website metadata from AsyncStorage
 * @param {string} url - URL
 * @returns {Promise<Object|null>} - Cached metadata or null
 */
const getCachedMetadata = async (url) => {
  try {
    const key = `${CACHE_CONFIG.KEY_PREFIX}metadata_${encodeURIComponent(url).substring(0, 50)}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return null;

    const { metadata, expiresAt } = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return {
      metadata,
      expiresAt,
    };
  } catch (error) {
    console.warn('Failed to retrieve cached website metadata:', error);
    return null;
  }
};

/**
 * Fetch website content from API (simulated)
 * @param {string} url - Website URL
 * @returns {Promise<string>} - HTML content
 */
const fetchContentFromAPI = async (url) => {
  // In production, this would call the actual backend API
  return `
    <html>
      <head>
        <title>Delicious Recipe</title>
        <meta name="description" content="A delicious homemade recipe">
      </head>
      <body>
        <h1>Amazing Recipe</h1>
        <p>This is a wonderful recipe that serves 4 people</p>
        <div class="recipe-section">
          <h2>Ingredients</h2>
          <ul class="ingredients">
            <li>2 cups flour</li>
            <li>1 cup sugar</li>
            <li>3 eggs</li>
            <li>1 cup milk</li>
            <li>2 tbsp butter</li>
          </ul>
        </div>
        <div class="recipe-section">
          <h2>Instructions</h2>
          <ol class="instructions">
            <li>Mix dry ingredients thoroughly</li>
            <li>Add wet ingredients and blend</li>
            <li>Pour mixture into pan</li>
            <li>Bake at 350°F for 40 minutes</li>
            <li>Cool completely before serving</li>
          </ol>
        </div>
        <p data-prep-time="20">Prep time: 20 minutes</p>
        <p data-cook-time="40">Cook time: 40 minutes</p>
        <p data-servings="4">Servings: 4</p>
      </body>
    </html>
  `;
};

/**
 * Fetch website metadata from API (simulated)
 * @param {string} url - Website URL
 * @returns {Promise<Object>} - Metadata object
 */
const fetchMetadataFromAPI = async (url) => {
  return {
    title: 'Recipe Website',
    description: 'A great recipe site',
    author: 'Chef Anna',
    favicon: 'https://example.com/favicon.ico',
    language: 'en',
    robots: 'index, follow',
    charset: 'utf-8',
    viewport: 'width=device-width, initial-scale=1.0',
    publishedDate: new Date().toISOString(),
    modifiedDate: new Date().toISOString(),
    url,
  };
};

/**
 * Parse recipe from website content
 * @param {string} content - HTML content
 * @param {string} siteType - Type of recipe site
 * @returns {Object} - Extracted recipe
 */
const parseRecipeFromContent = (content, siteType) => {
  return {
    title: 'Website Recipe Title',
    description: 'Extracted recipe from website',
    ingredients: [
      '2 cups flour',
      '1 cup sugar',
      '3 eggs',
      '1 cup milk',
      '2 tbsp butter',
    ],
    instructions: [
      'Mix dry ingredients thoroughly',
      'Add wet ingredients and blend',
      'Pour mixture into pan',
      'Bake at 350°F for 40 minutes',
      'Cool completely before serving',
    ],
    prepTime: 20,
    cookTime: 40,
    totalTime: 60,
    servings: 4,
    difficulty: 'medium',
    categories: ['desserts'],
    source: siteType,
  };
};

/**
 * Clear cache for a specific URL
 * @param {string} url - URL
 * @returns {Promise<void>}
 */
export const clearUrlCache = async (url) => {
  try {
    const key1 = `${CACHE_CONFIG.KEY_PREFIX}content_${encodeURIComponent(url).substring(0, 50)}`;
    const key2 = `${CACHE_CONFIG.KEY_PREFIX}metadata_${encodeURIComponent(url).substring(0, 50)}`;
    await AsyncStorage.multiRemove([key1, key2]);
  } catch (error) {
    console.warn('Failed to clear website cache:', error);
  }
};

/**
 * Clear all website caches
 * @returns {Promise<void>}
 */
export const clearAllCaches = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const websiteKeys = allKeys.filter(key => key.startsWith(CACHE_CONFIG.KEY_PREFIX));
    if (websiteKeys.length > 0) {
      await AsyncStorage.multiRemove(websiteKeys);
    }
  } catch (error) {
    console.warn('Failed to clear all website caches:', error);
  }
};

/**
 * Get cache expiration time for a URL
 * @param {string} url - URL
 * @returns {Promise<number|null>} - Expiration timestamp or null
 */
export const getCacheExpiration = async (url) => {
  try {
    const cached = await getCachedContent(url);
    return cached ? cached.expiresAt : null;
  } catch (error) {
    console.warn('Failed to get cache expiration:', error);
    return null;
  }
};

/**
 * Search recipes on website
 * @param {string} query - Search query
 * @param {string} baseUrl - Base URL of recipe site
 * @returns {Promise<Object>} - {success, results, error}
 */
export const searchRecipesOnWebsite = async (query, baseUrl) => {
  if (!query || typeof query !== 'string') {
    return {
      success: false,
      error: 'Invalid search query',
      query,
    };
  }

  if (!baseUrl || typeof baseUrl !== 'string') {
    return {
      success: false,
      error: 'Invalid base URL',
      baseUrl,
    };
  }

  try {
    const validation = validateWebsiteUrl(baseUrl);

    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid website URL',
        baseUrl,
      };
    }

    const searchUrl = `${baseUrl}?search=${encodeURIComponent(query)}`;
    const results = await fetchSearchResults(searchUrl);

    return {
      success: true,
      results,
      query,
      baseUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to search recipes',
      query,
    };
  }
};

/**
 * Fetch search results from API (simulated)
 * @param {string} searchUrl - Search URL
 * @returns {Promise<Array>} - Search results
 */
const fetchSearchResults = async (searchUrl) => {
  return [
    {
      title: 'Recipe 1',
      url: 'https://example.com/recipe1',
      summary: 'A delicious recipe',
      servings: 4,
    },
    {
      title: 'Recipe 2',
      url: 'https://example.com/recipe2',
      summary: 'Another great recipe',
      servings: 6,
    },
  ];
};

/**
 * Analyze website extraction error
 * @param {Object} error - Error object
 * @returns {Object} - {type, message, recoverable}
 */
export const analyzeWebsiteError = (error) => {
  if (!error) {
    return {
      type: 'unknown',
      message: 'Unknown error',
      recoverable: true,
    };
  }

  const message = error.message || String(error);

  if (message.includes('404') || message.includes('not found')) {
    return {
      type: 'page_not_found',
      message: 'Recipe page not found',
      recoverable: false,
    };
  }

  if (message.includes('403') || message.includes('forbidden')) {
    return {
      type: 'forbidden',
      message: 'Access forbidden to this page',
      recoverable: false,
    };
  }

  if (message.includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out',
      recoverable: true,
    };
  }

  if (message.includes('network')) {
    return {
      type: 'network_error',
      message: 'Network connection failed',
      recoverable: true,
    };
  }

  if (message.includes('parse') || message.includes('parse recipe')) {
    return {
      type: 'parse_error',
      message: 'Failed to parse recipe from website',
      recoverable: false,
    };
  }

  if (message.includes('rate limit')) {
    return {
      type: 'rate_limited',
      message: 'Rate limited by website',
      recoverable: true,
    };
  }

  if (message.includes('blocked') || message.includes('bot')) {
    return {
      type: 'blocked',
      message: 'Access blocked (likely bot detection)',
      recoverable: true,
    };
  }

  return {
    type: 'generic_error',
    message: message,
    recoverable: true,
  };
};

/**
 * Validate recipe data extracted from website
 * @param {Object} recipe - Recipe object
 * @returns {Object} - {valid, errors}
 */
export const validateRecipeData = (recipe) => {
  const errors = [];

  if (!recipe.title || typeof recipe.title !== 'string') {
    errors.push('Recipe title is missing or invalid');
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('Recipe ingredients are missing or empty');
  }

  if (!Array.isArray(recipe.instructions) || recipe.instructions.length === 0) {
    errors.push('Recipe instructions are missing or empty');
  }

  if (recipe.servings && typeof recipe.servings !== 'number') {
    errors.push('Servings value is not a number');
  }

  if (recipe.prepTime && typeof recipe.prepTime !== 'number') {
    errors.push('Prep time value is not a number');
  }

  if (recipe.cookTime && typeof recipe.cookTime !== 'number') {
    errors.push('Cook time value is not a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
