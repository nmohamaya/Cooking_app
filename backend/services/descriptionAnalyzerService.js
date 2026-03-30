/**
 * Description Analyzer Service
 *
 * Analyzes video descriptions for recipe content and extracts URLs.
 * Used as the first fallback level in the extraction cascade.
 */

const logger = require('../config/logger');

// Measurement words that indicate recipe content
const MEASUREMENT_WORDS = [
  'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds', 'gram', 'grams', 'kg',
  'ml', 'liter', 'liters', 'quart', 'pint', 'gallon',
  'pinch', 'dash', 'handful', 'bunch', 'clove', 'cloves', 'slice', 'slices',
];

// Cooking action verbs
const COOKING_VERBS = [
  'bake', 'fry', 'sauté', 'saute', 'boil', 'simmer', 'roast', 'grill', 'broil',
  'steam', 'stir', 'mix', 'blend', 'whisk', 'chop', 'dice', 'mince', 'slice',
  'marinate', 'season', 'preheat', 'knead', 'fold', 'braise', 'poach', 'sear',
  'caramelize', 'deglaze', 'reduce', 'strain', 'garnish',
];

// Temperature indicators
const TEMPERATURE_PATTERNS = [
  /\d+\s*°?\s*[fF]/,           // 350F, 350°F, 350 F
  /\d+\s*°?\s*[cC]/,           // 180C, 180°C
  /\d+\s*degrees/i,            // 350 degrees
];

// Numbered step patterns
const STEP_PATTERNS = [
  /^(?:step\s*)?\d+[.):\s]/im, // "Step 1:", "1.", "1)"
  /^\d+\.\s+\w/m,              // "1. Preheat..."
];

// URL extraction regex
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

/**
 * Analyze a video description for recipe content
 * @param {string} description - Video description text
 * @returns {{ hasRecipeContent: boolean, recipeText: string, linkedUrls: string[], confidence: number }}
 */
function analyze(description) {
  if (!description || typeof description !== 'string') {
    return {
      hasRecipeContent: false,
      recipeText: '',
      linkedUrls: [],
      confidence: 0,
    };
  }

  const text = description.trim();
  const lowerText = text.toLowerCase();

  // Extract URLs from description
  const linkedUrls = extractUrls(text);

  // Score recipe indicators
  let score = 0;

  // Count measurement words
  const measurementCount = MEASUREMENT_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return count + (lowerText.match(regex) || []).length;
  }, 0);
  score += Math.min(measurementCount * 2, 10); // Cap at 10

  // Count cooking verbs
  const verbCount = COOKING_VERBS.reduce((count, verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, 'gi');
    return count + (lowerText.match(regex) || []).length;
  }, 0);
  score += Math.min(verbCount * 2, 10); // Cap at 10

  // Check for temperature indicators
  const hasTemperature = TEMPERATURE_PATTERNS.some(pattern => pattern.test(text));
  if (hasTemperature) score += 3;

  // Check for numbered steps
  const hasSteps = STEP_PATTERNS.some(pattern => pattern.test(text));
  if (hasSteps) score += 3;

  // Check for "ingredients" or "instructions" section headers
  if (/\bingredients?\b/i.test(text)) score += 4;
  if (/\binstructions?\b/i.test(text)) score += 4;
  if (/\bdirections?\b/i.test(text)) score += 3;
  if (/\brecipe\b/i.test(text)) score += 2;
  if (/\bserv(es?|ings?)\b/i.test(text)) score += 2;

  // Check for common fraction patterns (1/2, 3/4, etc.)
  const fractionCount = (text.match(/\b\d+\/\d+\b/g) || []).length;
  score += Math.min(fractionCount * 2, 6);

  // Normalize score to 0-1 confidence
  const confidence = Math.min(score / 20, 1);
  const hasRecipeContent = confidence >= 0.25; // Threshold: at least 5/20 score

  logger.debug('Description analysis complete', {
    score,
    confidence,
    hasRecipeContent,
    measurementCount,
    verbCount,
    hasTemperature,
    hasSteps,
    urlCount: linkedUrls.length,
    descriptionLength: text.length,
  });

  return {
    hasRecipeContent,
    recipeText: text,
    linkedUrls,
    confidence,
  };
}

/**
 * Extract URLs from text, filtering out common non-recipe links
 * @param {string} text - Text to extract URLs from
 * @returns {string[]} Array of URLs
 */
function extractUrls(text) {
  const urls = text.match(URL_REGEX) || [];

  // Filter out social media profile links, donation links, etc.
  const excludePatterns = [
    /twitter\.com\/\w+$/i,
    /instagram\.com\/\w+\/?$/i,
    /facebook\.com\/\w+\/?$/i,
    /tiktok\.com\/@\w+\/?$/i,
    /youtube\.com\/(c|channel|user)\//i,
    /patreon\.com/i,
    /ko-fi\.com/i,
    /buymeacoffee\.com/i,
    /bit\.ly/i,
    /amzn\.to/i,
    /amazon\.\w+\/.*(?:affiliate|tag=)/i,
  ];

  return urls.filter(url => {
    return !excludePatterns.some(pattern => pattern.test(url));
  });
}

module.exports = {
  analyze,
  extractUrls,
};
