/**
 * Recipe Comparison Service
 * Provides functionality to detect duplicate or similar recipes
 */

/**
 * Calculate similarity between two strings using token-based matching
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
export const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Token-based matching for better recipe title comparison
  const tokens1 = s1.split(/\s+/).filter(t => t.length > 0);
  const tokens2 = s2.split(/\s+/).filter(t => t.length > 0);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  // Count matching tokens
  let matchCount = 0;
  for (const token1 of tokens1) {
    for (const token2 of tokens2) {
      if (token1 === token2) {
        matchCount++;
        break;
      }
    }
  }
  
  // Calculate similarity as ratio of matches to average token count
  const avgTokenCount = (tokens1.length + tokens2.length) / 2;
  return matchCount / avgTokenCount;
};

/**
 * Normalize ingredient text for comparison
 * @param {string} ingredient - Ingredient text
 * @returns {string} - Normalized ingredient text
 */
const normalizeIngredient = (ingredient) => {
  if (!ingredient) return '';
  
  return ingredient
    .toLowerCase()
    .trim()
    // Remove quantities and measurements
    .replace(/^\d+(\.\d+)?\s*(\/\d+)?\s*/g, '')
    .replace(/\b(cups?|tbsp?|tsp?|oz|ounces?|lbs?|pounds?|grams?|g|kg|ml|liters?|l)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Compare two ingredient lists
 * @param {string[]} ingredients1 - First ingredient list
 * @param {string[]} ingredients2 - Second ingredient list
 * @returns {number} - Similarity score between 0 and 1
 */
export const compareIngredients = (ingredients1, ingredients2) => {
  if (!ingredients1?.length || !ingredients2?.length) return 0;
  
  const normalized1 = ingredients1.map(normalizeIngredient).filter(i => i.length > 0);
  const normalized2 = ingredients2.map(normalizeIngredient).filter(i => i.length > 0);
  
  if (normalized1.length === 0 || normalized2.length === 0) return 0;
  
  let matchCount = 0;
  
  for (const ing1 of normalized1) {
    for (const ing2 of normalized2) {
      // Check if ingredients contain similar key words
      const words1 = ing1.split(' ');
      const words2 = ing2.split(' ');
      
      for (const word1 of words1) {
        if (word1.length > 2 && words2.some(w => w.includes(word1) || word1.includes(w))) {
          matchCount++;
          break;
        }
      }
    }
  }
  
  const avgCount = (normalized1.length + normalized2.length) / 2;
  return Math.min(matchCount / avgCount, 1);
};

/**
 * Check if a new recipe might be a duplicate of an existing one
 * @param {Object} newRecipe - The new recipe being added
 * @param {Object[]} existingRecipes - Array of existing recipes
 * @param {Object} options - Comparison options
 * @returns {Object|null} - Potential duplicate info or null
 */
export const checkForDuplicate = (newRecipe, existingRecipes, options = {}) => {
  const {
    titleThreshold = 0.7,
    ingredientThreshold = 0.6,
    combinedThreshold = 0.7,
  } = options;
  
  if (!newRecipe?.title || !existingRecipes?.length) return null;
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const existing of existingRecipes) {
    if (!existing?.title) continue;
    
    // Calculate title similarity
    const titleSimilarity = calculateStringSimilarity(newRecipe.title, existing.title);
    
    // Calculate ingredient similarity if both have ingredients
    let ingredientSimilarity = 0;
    if (newRecipe.ingredients?.length && existing.ingredients?.length) {
      ingredientSimilarity = compareIngredients(newRecipe.ingredients, existing.ingredients);
    }
    
    // Calculate combined score (weighted average)
    const hasIngredients = newRecipe.ingredients?.length && existing.ingredients?.length;
    const combinedScore = hasIngredients
      ? (titleSimilarity * 0.5 + ingredientSimilarity * 0.5)
      : titleSimilarity;
    
    // Check if this is a potential duplicate
    if (titleSimilarity >= titleThreshold || combinedScore >= combinedThreshold) {
      if (combinedScore > highestScore) {
        highestScore = combinedScore;
        bestMatch = {
          recipe: existing,
          titleSimilarity,
          ingredientSimilarity,
          combinedScore,
          matchType: titleSimilarity >= 0.9 ? 'exact' : 'similar',
        };
      }
    }
  }
  
  return bestMatch;
};

/**
 * Format duplicate detection result for display
 * @param {Object} duplicateInfo - Result from checkForDuplicate
 * @returns {string} - Human-readable message
 */
export const formatDuplicateMessage = (duplicateInfo) => {
  if (!duplicateInfo) return '';
  
  const { recipe, matchType, combinedScore } = duplicateInfo;
  const percentage = Math.round(combinedScore * 100);
  
  if (matchType === 'exact') {
    return `This recipe appears to be very similar to "${recipe.title}" (${percentage}% match). Would you like to continue adding it as a variant, or cancel?`;
  }
  
  return `Found a similar recipe: "${recipe.title}" (${percentage}% match). Would you like to continue adding it as a variant, or cancel?`;
};
