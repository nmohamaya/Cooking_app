import axios from 'axios';
import Constants from 'expo-constants';

// GitHub Models API Configuration
// In React Native/Expo, use Constants.expoConfig.extra for environment variables
// Using GitHub Models provides free access to AI models for GitHub users
const GITHUB_TOKEN = Constants.expoConfig?.extra?.githubToken || '';
const API_URL = 'https://models.inference.ai.azure.com';
const MODEL_NAME = 'gpt-4o'; // Free GitHub Models: gpt-4o, gpt-4o-mini, llama-3.1-405b, etc.

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
- category: string (cuisine type)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")

If any field is not mentioned in the transcript, use empty string. Be concise and clear.`
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
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const recipe = JSON.parse(content);

    // Validate and normalize the response
    return {
      title: String(recipe.title || ''),
      category: String(recipe.category || ''),
      ingredients: String(recipe.ingredients || ''),
      instructions: String(recipe.instructions || ''),
      prepTime: String(recipe.prepTime || ''),
      cookTime: String(recipe.cookTime || ''),
    };
  } catch (error) {
    console.error('GPT extraction error:', error);
    throw new Error(`Failed to extract recipe: ${error.message}`);
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
