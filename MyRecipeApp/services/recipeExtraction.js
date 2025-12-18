import axios from 'axios';
import Constants from 'expo-constants';

// GitHub Models API Configuration
// In React Native/Expo, use Constants.expoConfig.extra for environment variables
// Using GitHub Models provides free access to AI models for GitHub users
const GITHUB_TOKEN = Constants.expoConfig?.extra?.githubToken || '';
const API_URL = 'https://models.inference.ai.azure.com';
const MODEL_NAME = 'gpt-4o'; // Free GitHub Models: gpt-4o, gpt-4o-mini, llama-3.1-405b, etc.
const EXTRACTION_TIMEOUT = 15000; // 15 second timeout

// Valid categories matching App.js CATEGORIES constant
const VALID_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers', 'Asian', 'Vegan', 'Vegetarian'];

// Category inference keywords
const CATEGORY_KEYWORDS = {
  Breakfast: ['breakfast', 'pancake', 'waffle', 'omelette', 'omelet', 'egg', 'toast', 'cereal', 'oatmeal', 'smoothie', 'brunch', 'muffin', 'bagel', 'morning'],
  Lunch: ['lunch', 'sandwich', 'wrap', 'salad', 'soup', 'midday'],
  Dinner: ['dinner', 'roast', 'steak', 'main course', 'entrée', 'entree', 'supper'],
  Dessert: ['dessert', 'cake', 'cookie', 'pie', 'brownie', 'ice cream', 'pudding', 'chocolate', 'sweet', 'candy', 'pastry', 'tart', 'cheesecake', 'mousse', 'custard'],
  Snacks: ['snack', 'chips', 'popcorn', 'nuts', 'trail mix', 'crackers', 'finger food', 'bite', 'nibble'],
  Appetizers: ['appetizer', 'starter', 'hors d\'oeuvre', 'dip', 'bruschetta', 'canapé', 'canape', 'tapas', 'finger food'],
  Asian: ['asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'indian', 'curry', 'stir fry', 'wok', 'noodle', 'ramen', 'sushi', 'dim sum', 'teriyaki', 'soy sauce', 'ginger', 'sesame', 'tofu', 'pad thai', 'pho', 'kimchi', 'miso', 'wasabi'],
  Vegan: ['vegan', 'plant-based', 'plant based', 'no dairy', 'dairy-free', 'egg-free', 'no eggs', 'no meat', 'no animal'],
  Vegetarian: ['vegetarian', 'veggie', 'meatless', 'no meat', 'meat-free'],
};

/**
 * Infer category from recipe title and ingredients
 * @param {string} title - Recipe title
 * @param {string} ingredients - Recipe ingredients
 * @returns {string} Inferred category or 'Dinner' as default
 */
export const inferCategoryFromContent = (title = '', ingredients = '') => {
  const content = `${title} ${ingredients}`.toLowerCase();
  
  // Check for specific categories first (more specific wins)
  // Priority order: Vegan > Vegetarian > Asian > Dessert > Breakfast > Appetizers > Snacks > Lunch > Dinner
  const priorityOrder = ['Vegan', 'Vegetarian', 'Asian', 'Dessert', 'Breakfast', 'Appetizers', 'Snacks', 'Lunch', 'Dinner'];
  
  for (const category of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[category];
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Dinner'; // Default fallback
};

/**
 * Parse and format error messages for user-friendly display
 * @param {Error} error - The error object
 * @returns {Object} { message: string, canRetry: boolean }
 */
export const parseExtractionError = (error) => {
  const errorMessage = error.message || '';
  const errorResponse = error.response?.data?.error?.message || error.response?.data?.message || '';
  
  // Check for specific error types
  if (errorMessage.includes('timeout') || error.code === 'ECONNABORTED') {
    return {
      message: 'Request timed out. The AI service is taking too long to respond. Please try again.',
      canRetry: true,
      errorType: 'timeout'
    };
  }
  
  if (errorMessage.includes('Network Error') || error.code === 'ERR_NETWORK') {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      canRetry: true,
      errorType: 'network'
    };
  }
  
  if (error.response?.status === 401 || errorResponse.includes('unauthorized') || errorResponse.includes('invalid') && errorResponse.includes('token')) {
    return {
      message: 'Invalid GitHub token. Please check your GITHUB_TOKEN in the .env file.',
      canRetry: false,
      errorType: 'auth'
    };
  }
  
  if (error.response?.status === 429) {
    return {
      message: 'Too many requests. Please wait a moment and try again.',
      canRetry: true,
      errorType: 'rate_limit'
    };
  }
  
  if (error.response?.status >= 500) {
    return {
      message: 'The AI service is temporarily unavailable. Please try again later.',
      canRetry: true,
      errorType: 'server'
    };
  }
  
  // Generic error
  return {
    message: `Failed to extract recipe: ${errorMessage || 'Unknown error'}`,
    canRetry: true,
    errorType: 'unknown'
  };
};

/**
 * Extract recipe from cooking video URL
 * @param {string} videoUrl - URL of the cooking video (TikTok, YouTube, etc.)
 * @returns {Promise<Object>} Extracted recipe data
 */
export const extractRecipeFromVideo = async (videoUrl) => {
  try {
    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token not configured. Please add GITHUB_TOKEN to .env file.');
    }

    // Step 1: Get video transcript
    // Note: For MVP, we'll use a simplified approach
    // In production, you'd need to download video, extract audio, then transcribe
    const transcript = await getVideoTranscript(videoUrl);

    // Step 2: Extract recipe using GPT-4
    const recipe = await extractRecipeFromTranscript(transcript);

    return recipe;
  } catch (error) {
    console.error('Recipe extraction error:', error);
    throw error;
  }
};

/**
 * Get transcript from video URL
 * For MVP: This is a placeholder. In production, you would:
 * 1. Download video or extract audio URL
 * 2. Use OpenAI Whisper API to transcribe
 */
const getVideoTranscript = async (videoUrl) => {
  // TODO: Implement actual video transcription
  // For now, return a mock transcript for testing
  // You'll need to integrate with:
  // - yt-dlp or similar to extract audio URL
  // - OpenAI Whisper API to transcribe audio
  
  throw new Error(
    'Video transcription not yet implemented. ' +
    'For MVP, please manually paste the video transcript or description. ' +
    'Full implementation requires backend service to handle video processing.'
  );
};

/**
 * Extract recipe from transcript using GPT-4
 * @param {string} transcript - Video transcript
 * @returns {Promise<Object>} Parsed recipe data
 */
export const extractRecipeFromTranscript = async (transcript) => {
  if (!GITHUB_TOKEN) {
    const error = new Error('GitHub token not configured. Please add GITHUB_TOKEN to .env file.');
    error.errorType = 'auth';
    throw error;
  }

  try {
    const response = await axios.post(
      `${API_URL}/chat/completions`,
      {
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: `You are a recipe extraction assistant. Extract recipe information from video transcripts and return it in JSON format with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")

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
If any other field is not mentioned, use empty string. Be concise and clear.`
          },
          {
            role: 'user',
            content: `Extract the recipe from this cooking video transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: EXTRACTION_TIMEOUT
      }
    );

    const content = response.data.choices[0].message.content;
    const recipe = JSON.parse(content);

    // Get title and ingredients for fallback inference
    const title = String(recipe.title || '');
    const ingredients = String(recipe.ingredients || '');
    
    // Validate category - use AI result if valid, otherwise infer from content
    let category = String(recipe.category || '');
    if (!VALID_CATEGORIES.includes(category)) {
      console.warn(`Invalid or empty category "${category}" detected, inferring from content`);
      category = inferCategoryFromContent(title, ingredients);
    }

    // Validate and normalize the response
    return {
      title: title,
      category: category,
      ingredients: ingredients,
      instructions: String(recipe.instructions || ''),
      prepTime: String(recipe.prepTime || ''),
      cookTime: String(recipe.cookTime || ''),
    };
  } catch (error) {
    console.error('GPT extraction error:', error);
    // Re-throw with parsed error for better UI handling
    const parsedError = parseExtractionError(error);
    const enhancedError = new Error(parsedError.message);
    enhancedError.canRetry = parsedError.canRetry;
    enhancedError.errorType = parsedError.errorType;
    throw enhancedError;
  }
};

/**
 * Extract recipe from manual text input (for MVP/testing)
 * @param {string} text - Recipe description or transcript
 * @returns {Promise<Object>} Parsed recipe data
 */
export const extractRecipeFromText = async (text) => {
  return extractRecipeFromTranscript(text);
};
