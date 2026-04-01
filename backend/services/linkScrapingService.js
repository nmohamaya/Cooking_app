/**
 * Link Scraping Service
 *
 * Fetches and parses recipe data from URLs found in video descriptions.
 * Supports JSON-LD schema.org Recipe, microdata, and HTML fallback.
 */

const cheerio = require('cheerio');
const logger = require('../config/logger');

const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const USER_AGENT = 'MyRecipeApp/1.0 (Recipe Extraction Bot)';

/**
 * Scrape a recipe from a URL
 * @param {string} url - URL to scrape
 * @returns {Promise<{ success: boolean, recipe: object|null, source: string, url: string }>}
 */
async function scrapeRecipe(url) {
  try {
    logger.info('Scraping recipe from URL', { url });

    const html = await fetchPage(url);
    if (!html) {
      return { success: false, recipe: null, source: 'none', url };
    }

    const $ = cheerio.load(html);

    // Priority 1: JSON-LD structured data
    const jsonLdRecipe = extractJsonLd($);
    if (jsonLdRecipe) {
      logger.info('Recipe found via JSON-LD', { url, title: jsonLdRecipe.title });
      return { success: true, recipe: jsonLdRecipe, source: 'json-ld', url };
    }

    // Priority 2: Microdata (schema.org itemprop attributes)
    const microdataRecipe = extractMicrodata($);
    if (microdataRecipe) {
      logger.info('Recipe found via microdata', { url, title: microdataRecipe.title });
      return { success: true, recipe: microdataRecipe, source: 'microdata', url };
    }

    // Priority 3: HTML heuristic parsing
    const htmlRecipe = extractFromHtml($);
    if (htmlRecipe) {
      logger.info('Recipe found via HTML parsing', { url, title: htmlRecipe.title });
      return { success: true, recipe: htmlRecipe, source: 'html-parse', url };
    }

    logger.info('No recipe found on page', { url });
    return { success: false, recipe: null, source: 'none', url };
  } catch (error) {
    logger.error('Failed to scrape recipe', { url, error: error.message });
    return { success: false, recipe: null, source: 'error', url };
  }
}

/**
 * Fetch page HTML with safety limits
 * @param {string} url - URL to fetch
 * @returns {Promise<string|null>} HTML content or null
 */
async function fetchPage(url) {
  try {
    // SSRF protection: block private/loopback IPs
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    if (isPrivateHost(hostname)) {
      logger.warn('Blocked SSRF attempt to private/loopback address', { url, hostname });
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn('Failed to fetch page', { url, status: response.status });
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      logger.warn('Non-HTML content type', { url, contentType });
      return null;
    }

    // Check content length header if available
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_RESPONSE_SIZE) {
      logger.warn('Response too large', { url, contentLength });
      return null;
    }

    const html = await response.text();
    if (html.length > MAX_RESPONSE_SIZE) {
      logger.warn('Response body too large', { url, size: html.length });
      return null;
    }

    return html;
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.warn('Fetch timeout', { url });
    } else {
      logger.error('Fetch error', { url, error: error.message });
    }
    return null;
  }
}

/**
 * Extract recipe from JSON-LD structured data
 * @param {cheerio.CheerioAPI} $ - Cheerio instance
 * @returns {object|null} Normalized recipe or null
 */
function extractJsonLd($) {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw = $(scripts[i]).html();
      if (!raw) continue;

      const data = JSON.parse(raw);
      const recipe = findRecipeInJsonLd(data);
      if (recipe) {
        return normalizeJsonLdRecipe(recipe);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  return null;
}

/**
 * Recursively find a Recipe object in JSON-LD data
 * @param {*} data - JSON-LD data (could be object, array, or nested @graph)
 * @returns {object|null} Recipe object or null
 */
function findRecipeInJsonLd(data) {
  if (!data) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInJsonLd(item);
      if (recipe) return recipe;
    }
    return null;
  }

  if (typeof data === 'object') {
    if (data['@type'] === 'Recipe' ||
        (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
      return data;
    }
    // Check @graph array
    if (data['@graph']) {
      return findRecipeInJsonLd(data['@graph']);
    }
  }

  return null;
}

/**
 * Normalize JSON-LD recipe to our format
 * @param {object} recipe - JSON-LD Recipe object
 * @returns {object} Normalized recipe
 */
function normalizeJsonLdRecipe(recipe) {
  return {
    title: recipe.name || '',
    ingredients: normalizeIngredients(recipe.recipeIngredient),
    instructions: normalizeInstructions(recipe.recipeInstructions),
    prepTime: parseDuration(recipe.prepTime),
    cookTime: parseDuration(recipe.cookTime),
    totalTime: parseDuration(recipe.totalTime),
    servings: recipe.recipeYield ? String(recipe.recipeYield) : '',
    category: recipe.recipeCategory ? String(recipe.recipeCategory) : '',
  };
}

/**
 * Extract recipe from microdata attributes
 * @param {cheerio.CheerioAPI} $ - Cheerio instance
 * @returns {object|null} Normalized recipe or null
 */
function extractMicrodata($) {
  const recipeEl = $('[itemtype*="schema.org/Recipe"]');
  if (recipeEl.length === 0) return null;

  const title = recipeEl.find('[itemprop="name"]').first().text().trim();
  if (!title) return null;

  const ingredients = [];
  recipeEl.find('[itemprop="recipeIngredient"], [itemprop="ingredients"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(text);
  });

  const instructions = [];
  recipeEl.find('[itemprop="recipeInstructions"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) instructions.push(text);
  });

  if (ingredients.length === 0 && instructions.length === 0) return null;

  return {
    title,
    ingredients: ingredients.join('\n'),
    instructions: formatInstructionSteps(instructions),
    prepTime: parseDuration(recipeEl.find('[itemprop="prepTime"]').attr('content') || ''),
    cookTime: parseDuration(recipeEl.find('[itemprop="cookTime"]').attr('content') || ''),
    totalTime: '',
    servings: recipeEl.find('[itemprop="recipeYield"]').first().text().trim(),
    category: '',
  };
}

/**
 * Heuristic HTML extraction as last resort
 * @param {cheerio.CheerioAPI} $ - Cheerio instance
 * @returns {object|null} Normalized recipe or null
 */
function extractFromHtml($) {
  // Strategy 1: Heading-based section detection (most common pattern)
  // Look for headings like "Ingredients", "Instructions", "Steps", "Directions"
  const headingResult = extractByHeadings($);
  if (headingResult) return headingResult;

  // Strategy 2: CSS class-based extraction from recipe card widgets
  const classResult = extractByClasses($);
  if (classResult) return classResult;

  return null;
}

/**
 * Extract recipe by finding heading labels ("Ingredients", "Steps", etc.)
 * and collecting content after each heading until the next heading.
 * @param {cheerio.CheerioAPI} $
 * @returns {object|null}
 */
function extractByHeadings($) {
  const INGREDIENT_HEADINGS = /^ingredients$/i;
  const INSTRUCTION_HEADINGS = /^(instructions?|steps?|directions?|method|preparation|how to make)/i;

  let ingredientHeading = null;
  let instructionHeading = null;

  // Search all headings and bold labels for section markers
  $('h1, h2, h3, h4, h5, strong, b').each((_, el) => {
    const text = $(el).text().trim();
    if (!ingredientHeading && INGREDIENT_HEADINGS.test(text)) {
      ingredientHeading = $(el);
    }
    if (!instructionHeading && INSTRUCTION_HEADINGS.test(text)) {
      instructionHeading = $(el);
    }
  });

  if (!ingredientHeading && !instructionHeading) return null;

  const ingredients = ingredientHeading ? collectSectionContent($, ingredientHeading) : [];
  const instructions = instructionHeading ? collectSectionContent($, instructionHeading) : [];

  if (ingredients.length === 0 && instructions.length === 0) return null;

  // Find a page title
  const title = $('h1').first().text().trim()
    || $('h2').first().text().trim()
    || $('title').text().trim().split(/[|\-–]/).shift().trim();

  return {
    title: title || '',
    ingredients: ingredients.join('\n'),
    instructions: formatInstructionSteps(instructions),
    prepTime: '',
    cookTime: '',
    totalTime: '',
    servings: '',
    category: '',
  };
}

/**
 * Collect list items or text blocks following a heading until the next heading.
 * @param {cheerio.CheerioAPI} $
 * @param {cheerio.Cheerio} headingEl - The heading element
 * @returns {string[]} Extracted text items
 */
function collectSectionContent($, headingEl) {
  const items = [];

  // First check if the heading's parent/container has a list
  const parent = headingEl.parent();
  const siblingList = parent.find('ul, ol').first();
  if (siblingList.length > 0) {
    siblingList.find('li').each((_, li) => {
      const t = $(li).text().trim();
      if (t) items.push(t);
    });
    if (items.length > 0) return items;
  }

  // Walk siblings after the heading element
  let current = headingEl.next();
  const headingTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'STRONG']);
  let safety = 0;

  while (current.length > 0 && safety < 50) {
    safety++;
    const tag = current.prop('tagName');

    // Stop at the next heading-level element
    if (headingTags.has(tag)) {
      const text = current.text().trim();
      // Only stop if it looks like a new section heading (not a sub-step)
      if (text.length < 60) break;
    }

    // Extract from list items
    if (tag === 'UL' || tag === 'OL') {
      current.find('li').each((_, li) => {
        const t = $(li).text().trim();
        if (t) items.push(t);
      });
    } else if (tag === 'P' || tag === 'DIV' || tag === 'LI') {
      const t = current.text().trim();
      if (t) items.push(t);
    }

    current = current.next();
  }

  return items;
}

/**
 * Extract recipe using CSS class selectors from common recipe card plugins
 * @param {cheerio.CheerioAPI} $
 * @returns {object|null}
 */
function extractByClasses($) {
  // Only match specific recipe card classes, NOT generic page-level classes
  const selectors = [
    '.recipe-card', '.wprm-recipe', '.tasty-recipe', '.recipe-content',
    '.recipe', '#recipe',
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    if (el.length === 0) continue;

    // Skip elements that are too large (likely the whole page)
    const text = el.text().trim();
    if (text.length < 100 || text.length > 20000) continue;

    const title = el.find('h1, h2, h3, .recipe-title, [class*="title"]').first().text().trim();

    const ingredients = [];
    el.find('.ingredient, [class*="ingredient"] li, .wprm-recipe-ingredient').each((_, item) => {
      const t = $(item).text().trim();
      if (t) ingredients.push(t);
    });

    const instructions = [];
    el.find('.instruction, [class*="instruction"] li, .wprm-recipe-instruction, [class*="direction"] li, [class*="step"] li').each((_, item) => {
      const t = $(item).text().trim();
      if (t) instructions.push(t);
    });

    if (title && (ingredients.length > 0 || instructions.length > 0)) {
      return {
        title,
        ingredients: ingredients.join('\n'),
        instructions: formatInstructionSteps(instructions),
        prepTime: '',
        cookTime: '',
        totalTime: '',
        servings: '',
        category: '',
      };
    }
  }

  return null;
}

/**
 * Normalize ingredients array/string to newline-separated string
 * @param {*} ingredients - Ingredients in various formats
 * @returns {string} Newline-separated ingredients
 */
function normalizeIngredients(ingredients) {
  if (!ingredients) return '';
  if (typeof ingredients === 'string') return ingredients;
  if (Array.isArray(ingredients)) {
    return ingredients.map(i => typeof i === 'string' ? i : (i.text || i.name || String(i))).join('\n');
  }
  return '';
}

/**
 * Normalize instructions array/string to numbered steps
 * @param {*} instructions - Instructions in various formats
 * @returns {string} Numbered instruction steps
 */
function normalizeInstructions(instructions) {
  if (!instructions) return '';
  if (typeof instructions === 'string') return instructions;
  if (Array.isArray(instructions)) {
    return instructions.map((item, i) => {
      const text = typeof item === 'string' ? item : (item.text || item.name || String(item));
      return `${i + 1}. ${text}`;
    }).join('\n');
  }
  return '';
}

/**
 * Format instruction steps: strip existing "Step N" or "N." prefixes, then add clean numbering
 * @param {string[]} steps - Array of instruction text strings
 * @returns {string} Numbered instruction steps
 */
function formatInstructionSteps(steps) {
  return steps.map((s, i) => {
    // Strip existing "Step 1", "Step1", "1.", "1)" prefixes to avoid double numbering
    const cleaned = s.replace(/^step\s*\d+[.:)]?\s*/i, '').replace(/^\d+[.:)]\s*/, '').trim();
    return `${i + 1}. ${cleaned}`;
  }).join('\n');
}

/**
 * Parse ISO 8601 duration to human-readable string
 * @param {string} duration - ISO 8601 duration (e.g., "PT30M", "PT1H15M")
 * @returns {string} Human-readable duration (e.g., "30 minutes", "1 hour 15 minutes")
 */
function parseDuration(duration) {
  if (!duration || typeof duration !== 'string') return '';

  // Already human-readable
  if (/\d+\s*(min|hour|sec)/i.test(duration)) return duration;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const parts = [];

  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

  return parts.join(' ') || '';
}

/**
 * Check if a hostname resolves to a private/loopback address (SSRF protection)
 * @param {string} hostname
 * @returns {boolean}
 */
function isPrivateHost(hostname) {
  // Block loopback
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  // Block private IPv4 ranges
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^0\.0\.0\.0$/,
    /^169\.254\.\d{1,3}\.\d{1,3}$/, // link-local
  ];
  return privateRanges.some(r => r.test(hostname));
}

module.exports = {
  scrapeRecipe,
  fetchPage,
  extractJsonLd,
  extractMicrodata,
  extractFromHtml,
  parseDuration,
  normalizeIngredients,
  normalizeInstructions,
  isPrivateHost,
};
