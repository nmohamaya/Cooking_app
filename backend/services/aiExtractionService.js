/**
 * AI Extraction Service
 *
 * Wraps AI model calls via GitHub Models API with source-type-specific prompts.
 * Handles recipe extraction from descriptions, transcripts, and scraped content.
 *
 * Model is configurable via AI_MODEL env var (default: gpt-4o).
 * API URL is configurable via AI_API_URL env var.
 */

const axios = require('axios');
const logger = require('../config/logger');

const config = require('../config/env');
const API_URL = config.aiApiUrl;
const MODEL_NAME = config.aiModel;
const EXTRACTION_TIMEOUT = 15000; // 15 seconds

// Valid categories matching the frontend App.js CATEGORIES constant
const VALID_CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks',
  'Appetizers', 'Asian', 'Vegan', 'Vegetarian',
];

// Category inference keywords for fallback
const CATEGORY_KEYWORDS = {
  Vegan: ['vegan', 'plant-based', 'plant based', 'dairy-free', 'egg-free'],
  Vegetarian: ['vegetarian', 'veggie', 'meatless', 'meat-free'],
  Asian: ['asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'indian', 'curry', 'stir fry', 'wok', 'noodle', 'ramen', 'sushi', 'teriyaki', 'soy sauce', 'tofu', 'pad thai', 'pho', 'kimchi', 'miso'],
  Dessert: ['dessert', 'cake', 'cookie', 'pie', 'brownie', 'ice cream', 'pudding', 'chocolate', 'sweet', 'pastry'],
  Breakfast: ['breakfast', 'pancakes?', 'waffles?', 'omelette', 'oatmeal', 'smoothie', 'brunch', 'muffins?'],
  Appetizers: ['appetizer', 'starter', 'dip', 'bruschetta', 'tapas', 'finger food'],
  Snacks: ['snack', 'chips', 'popcorn', 'nuts', 'crackers'],
  Lunch: ['lunch', 'sandwich', 'wrap', 'salad', 'soup'],
  Dinner: ['dinner', 'roast', 'steak', 'main course', 'entrée'],
};

// Source-specific system prompts
const SYSTEM_PROMPTS = {
  description: `You are a recipe extraction assistant. Extract recipe information from this video description. The text may be informal, include hashtags, emojis, abbreviated measurements, and social media formatting. Interpret generously and extract what you can.

Return JSON with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")
- servings: string (e.g., "4 servings")

If multiple categories apply, choose the most specific one. If unsure, use "Dinner" as default.
If any field is not mentioned, use empty string. Be concise and clear.`,

  transcript: `You are a recipe extraction assistant. Extract recipe information from video transcripts and return it in JSON format with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")
- servings: string (e.g., "4 servings")

For category, analyze the recipe content to determine the best fit:
- Use "Breakfast" for morning meals (pancakes, eggs, oatmeal, etc.)
- Use "Lunch" or "Dinner" for main meals
- Use "Dessert" for sweet dishes (cakes, cookies, ice cream, etc.)
- Use "Snacks" for light foods (chips, nuts, popcorn, etc.)
- Use "Appetizers" for starters (dips, finger foods, etc.)
- Use "Asian" for dishes from Asian cuisines (Chinese, Japanese, Thai, Indian, etc.)
- Use "Vegan" if the recipe contains NO animal products
- Use "Vegetarian" if the recipe contains NO meat/fish but may have dairy/eggs

If multiple categories apply, choose the most specific one. If unsure, use "Dinner" as default.
If any other field is not mentioned, use empty string. Be concise and clear.`,

  scraped: `You are a recipe extraction assistant. Extract recipe information from this website content. It may include structured data, HTML fragments, or plain text from a recipe page.

Return JSON with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")
- servings: string (e.g., "4 servings")

If multiple categories apply, choose the most specific one. If unsure, use "Dinner" as default.
If any field is not mentioned, use empty string. Be concise and clear.`,

  combined: `You are a recipe extraction assistant. Here is recipe information from multiple sources for the same video. Some sources may have ingredients, others may have instructions. Merge them into a single coherent recipe.

Return JSON with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")
- servings: string (e.g., "4 servings")

If multiple categories apply, choose the most specific one. If unsure, use "Dinner" as default.
If any field is not mentioned, use empty string. Be concise and clear.`,
};

// User prompt templates per source type
const USER_PROMPTS = {
  description: (text) => `Extract the recipe from this cooking video description:\n\n${text}`,
  transcript: (text) => `Extract the recipe from this cooking video transcript:\n\n${text}`,
  scraped: (text) => `Extract the recipe from this website content:\n\n${text}`,
  combined: (text) => `Extract and merge the recipe from these multiple sources:\n\n${text}`,
};

/**
 * Extract recipe from text using AI
 * @param {string} text - Source text (description, transcript, scraped content)
 * @param {'description'|'transcript'|'scraped'|'combined'} sourceType - Type of source
 * @returns {Promise<object|null>} Extracted recipe or null
 */
async function extractRecipe(text, sourceType = 'transcript') {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN not configured in backend .env');
  }

  if (!text || text.trim().length < 20) {
    logger.debug('Text too short for AI extraction', { sourceType, length: text?.length });
    return null;
  }

  const systemPrompt = SYSTEM_PROMPTS[sourceType] || SYSTEM_PROMPTS.transcript;
  const userPrompt = (USER_PROMPTS[sourceType] || USER_PROMPTS.transcript)(text);

  try {
    logger.info('Sending to AI for recipe extraction', { sourceType, textLength: text.length });

    const response = await axios.post(
      `${API_URL}/chat/completions`,
      {
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: EXTRACTION_TIMEOUT,
      }
    );

    const content = response.data.choices[0].message.content;
    const recipe = JSON.parse(content);

    // Validate and normalize
    const normalized = normalizeRecipe(recipe);

    logger.info('AI extraction successful', {
      sourceType,
      title: normalized.title,
      hasIngredients: normalized.ingredients.length > 0,
      hasInstructions: normalized.instructions.length > 0,
    });

    return normalized;
  } catch (error) {
    logger.error('AI extraction failed', {
      sourceType,
      error: error.message,
      status: error.response?.status,
    });

    if (error.response?.status === 401) {
      throw new Error('Invalid GITHUB_TOKEN. Please check your backend .env file.');
    }
    if (error.response?.status === 429) {
      throw new Error('AI rate limit exceeded. Please wait a moment and try again.');
    }

    return null;
  }
}

/**
 * Normalize and validate AI extraction result
 * @param {object} recipe - Raw AI output
 * @returns {object} Normalized recipe
 */
function normalizeRecipe(recipe) {
  if (!recipe) return { title: '', category: 'Dinner', ingredients: '', instructions: '', prepTime: '', cookTime: '', servings: '' };
  const title = String(recipe.title || '').trim();
  const ingredients = String(recipe.ingredients || '').trim();
  const instructions = String(recipe.instructions || '').trim();

  // Validate category
  let category = String(recipe.category || '').trim();
  if (!VALID_CATEGORIES.includes(category)) {
    category = inferCategory(title, ingredients);
  }

  return {
    title,
    category,
    ingredients,
    instructions,
    prepTime: String(recipe.prepTime || '').trim(),
    cookTime: String(recipe.cookTime || '').trim(),
    servings: String(recipe.servings || '').trim(),
  };
}

/**
 * Infer category from recipe content when AI returns invalid category
 * @param {string} title - Recipe title
 * @param {string} ingredients - Recipe ingredients
 * @returns {string} Inferred category
 */
function inferCategory(title = '', ingredients = '') {
  const content = `${title} ${ingredients}`.toLowerCase();

  // Priority order ensures specific categories match first
  const priorityOrder = ['Vegan', 'Vegetarian', 'Asian', 'Dessert', 'Breakfast', 'Appetizers', 'Snacks', 'Lunch', 'Dinner'];

  for (const category of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      // Use word boundary to avoid substring matches (e.g., "pancake" matching "cake")
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(content)) {
        return category;
      }
    }
  }

  return 'Dinner';
}

/**
 * Check if a recipe is valid (has enough content to be useful)
 * @param {object} recipe - Recipe object
 * @returns {boolean} True if recipe has meaningful content
 */
function isValidRecipe(recipe) {
  if (!recipe || !recipe.title) return false;
  // Must have at least ingredients OR instructions
  const hasIngredients = Boolean(recipe.ingredients && recipe.ingredients.trim().length > 10);
  const hasInstructions = Boolean(recipe.instructions && recipe.instructions.trim().length > 10);
  return hasIngredients || hasInstructions;
}

module.exports = {
  extractRecipe,
  isValidRecipe,
  normalizeRecipe,
  inferCategory,
  VALID_CATEGORIES,
};
