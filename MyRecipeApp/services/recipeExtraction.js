import axios from 'axios';
import Constants from 'expo-constants';

// GitHub Models API Configuration
// EXPO_PUBLIC_ prefixed vars are auto-inlined by Expo into the web bundle
// Constants.expoConfig.extra works on native but not reliably on web
const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN || Constants.expoConfig?.extra?.githubToken || '';
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
            content: `You are a recipe extraction assistant. You receive information from cooking videos gathered from multiple sources (video description, captions/subtitles, audio transcription). Extract the recipe and return it as JSON with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list with quantities)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")

EXTRACTION PRIORITY:
1. VIDEO DESCRIPTION is the most reliable source — it often contains the complete recipe with exact quantities. Use this as your primary source.
2. VIDEO CAPTIONS/SUBTITLES can fill in missing details (cooking techniques, tips, timing) and cross-check the description.
3. AUDIO TRANSCRIPTION is a fallback — use it only if description and subtitles are missing.

IMPORTANT RULES:
1. ONLY use information explicitly present in the provided sources. Do NOT invent or guess ingredients, quantities, or steps.
2. Prefer the description's ingredient list and quantities over captions when both are available.
3. Use captions to add cooking details, tips, or steps not in the description.
4. Ignore promotional text (subscribe, like, social media links, hashtags).
5. If the video has multiple recipes, extract the MAIN recipe.
6. If a field is not mentioned anywhere, use empty string.
7. Include ingredient quantities when available (e.g., "2 cups flour" not just "flour").

For category:
- "Breakfast" for morning meals | "Lunch"/"Dinner" for main meals
- "Dessert" for sweet dishes | "Snacks" for light foods | "Appetizers" for starters
- "Asian" for Asian cuisines | "Vegan" if no animal products | "Vegetarian" if no meat/fish`
          },
          {
            role: 'user',
            content: `Extract the recipe from this cooking video information:\n\n${transcript}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
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
