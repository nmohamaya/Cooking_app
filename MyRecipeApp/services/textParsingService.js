/**
 * Text Parsing Service
 *
 * Parses ingredients and instructions from extracted recipe text/transcripts.
 * Uses NLP techniques and pattern matching to identify and extract recipe components
 * with confidence scoring for accuracy assessment.
 *
 * Features:
 * - Ingredient parsing with quantity/unit/item extraction
 * - Instruction parsing with step-by-step breakdown
 * - Confidence scoring based on pattern matching quality
 * - Handles various recipe formats (listed, narrative, mixed)
 * - Support for common cooking units and abbreviations
 * - Extraction of cooking methods, temperatures, and times
 */

// Common cooking units
const COOKING_UNITS = {
  // Volume
  'cup': 'cup', 'cups': 'cup', 'c': 'cup',
  'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbsp': 'tbsp', 't': 'tbsp',
  'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsp': 'tsp',
  'milliliter': 'ml', 'milliliters': 'ml', 'ml': 'ml',
  'liter': 'l', 'liters': 'l', 'l': 'l',
  'pint': 'pint', 'pints': 'pint', 'pt': 'pint',
  'gallon': 'gal', 'gallons': 'gal', 'gal': 'gal',
  'fl oz': 'fl oz', 'fluid ounce': 'fl oz',
  
  // Weight
  'gram': 'g', 'grams': 'g', 'g': 'g',
  'kilogram': 'kg', 'kilograms': 'kg', 'kg': 'kg',
  'ounce': 'oz', 'ounces': 'oz', 'oz': 'oz',
  'pound': 'lb', 'pounds': 'lb', 'lb': 'lb',
  'mg': 'mg', 'milligram': 'mg',
  
  // Count
  'piece': 'piece', 'pieces': 'piece',
  'clove': 'clove', 'cloves': 'clove',
  'stick': 'stick', 'sticks': 'stick',
  'slice': 'slice', 'slices': 'slice',
  'pinch': 'pinch', 'pinches': 'pinch',
  'dash': 'dash', 'dashes': 'dash',
};

// Common fractions
const FRACTIONS = {
  '½': 0.5, '1/2': 0.5,
  '⅓': 0.333, '1/3': 0.333,
  '⅔': 0.667, '2/3': 0.667,
  '¼': 0.25, '1/4': 0.25,
  '¾': 0.75, '3/4': 0.75,
  '⅕': 0.2, '1/5': 0.2,
  '⅖': 0.4, '2/5': 0.4,
  '⅗': 0.6, '3/5': 0.6,
  '⅘': 0.8, '4/5': 0.8,
  '⅙': 0.167, '1/6': 0.167,
  '⅚': 0.833, '5/6': 0.833,
  '⅛': 0.125, '1/8': 0.125,
  '⅜': 0.375, '3/8': 0.375,
  '⅝': 0.625, '5/8': 0.625,
  '⅞': 0.875, '7/8': 0.875,
};

// Common cooking methods
const COOKING_METHODS = [
  'bake', 'boil', 'fry', 'grill', 'roast', 'steam', 'broil', 'simmer',
  'saute', 'sauté', 'poach', 'blanch', 'braise', 'stew', 'baste',
  'microwave', 'blend', 'mix', 'stir', 'whisk', 'fold', 'knead',
  'chop', 'dice', 'mince', 'slice', 'grate', 'peel', 'cut', 'shred',
  'marinate', 'season', 'garnish', 'serve', 'cool', 'chill',
];

// Temperature patterns
const TEMPERATURE_PATTERN = /(\d{2,3})\s*(?:°|degrees?)\s*([FC]|fahrenheit|celsius|centigrade)/gi;
const TIME_PATTERN = /(\d{1,3})\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi;

/**
 * Parses ingredients from recipe text
 * @param {string} text - Raw recipe text containing ingredients
 * @returns {Promise<Array>} Array of parsed ingredients with quantities and confidence scores
 */
export const parseIngredients = async (text) => {
  if (!text || typeof text !== 'string') {
    return { ingredients: [], confidence: 0 };
  }

  try {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const ingredients = [];
    let ingestionStarted = false;
    let instructionStarted = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect section headers
      if (/^(ingredients?|what you need|supplies?|you will need):/i.test(trimmedLine)) {
        ingestionStarted = true;
        instructionStarted = false;
        continue;
      }

      if (/^(instructions?|directions?|steps?|method|preparation|how to make):/i.test(trimmedLine)) {
        instructionStarted = true;
        ingestionStarted = false;
        continue;
      }

      // Parse if we're in ingredients section or if line looks like an ingredient
      if (ingestionStarted || isLikelyIngredientLine(trimmedLine)) {
        const parsed = parseIngredientLine(trimmedLine);
        if (parsed) {
          ingredients.push(parsed);
        }
      }
    }

    const confidence = calculateIngredientConfidence(ingredients, text);
    return { ingredients, confidence };
  } catch (error) {
    console.error('Failed to parse ingredients:', error);
    return { ingredients: [], confidence: 0, error };
  }
};

/**
 * Parses instructions from recipe text
 * @param {string} text - Raw recipe text containing instructions
 * @returns {Promise<Object>} Object with parsed instructions, steps, and confidence score
 */
export const parseInstructions = async (text) => {
  if (!text || typeof text !== 'string') {
    return { instructions: [], steps: [], confidence: 0 };
  }

  try {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const steps = [];
    let instructionsStarted = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect instruction section header
      if (/^(instructions?|directions?|steps?|method|preparation|how to make|procedure):/i.test(trimmedLine)) {
        instructionsStarted = true;
        continue;
      }

      // Skip ingredient section
      if (/^(ingredients?|what you need|supplies?|you will need):/i.test(trimmedLine)) {
        instructionsStarted = false;
        continue;
      }

      // Parse instruction lines
      if (instructionsStarted || isLikelyInstructionLine(trimmedLine)) {
        const parsed = parseInstructionStep(trimmedLine);
        if (parsed) {
          steps.push(parsed);
        }
      }
    }

    const instructions = steps.map(s => s.text).join(' ');
    const confidence = calculateInstructionConfidence(steps, text);

    return { instructions, steps, confidence };
  } catch (error) {
    console.error('Failed to parse instructions:', error);
    return { instructions: '', steps: [], confidence: 0, error };
  }
};

/**
 * Parses both ingredients and instructions from recipe text
 * @param {string} text - Raw recipe text
 * @returns {Promise<Object>} Combined parsed recipe with ingredients, instructions, and confidence
 */
export const parseRecipeText = async (text) => {
  if (!text || typeof text !== 'string') {
    return {
      ingredients: [],
      instructions: [],
      steps: [],
      servings: null,
      prepTime: null,
      cookTime: null,
      confidence: { ingredients: 0, instructions: 0, overall: 0 },
    };
  }

  try {
    // Parse main components
    const ingredientsResult = await parseIngredients(text);
    const instructionsResult = await parseInstructions(text);
    
    // Extract metadata
    const servings = extractServings(text);
    const prepTime = extractPrepTime(text);
    const cookTime = extractCookTime(text);
    const temperatures = extractTemperatures(text);
    const cookingMethods = extractCookingMethods(text);

    const overallConfidence = (
      ingredientsResult.confidence +
      instructionsResult.confidence
    ) / 2;

    return {
      ingredients: ingredientsResult.ingredients,
      instructions: instructionsResult.instructions,
      steps: instructionsResult.steps,
      servings,
      prepTime,
      cookTime,
      temperatures,
      cookingMethods,
      confidence: {
        ingredients: ingredientsResult.confidence,
        instructions: instructionsResult.confidence,
        overall: overallConfidence,
      },
    };
  } catch (error) {
    console.error('Failed to parse recipe text:', error);
    return {
      ingredients: [],
      instructions: [],
      steps: [],
      servings: null,
      prepTime: null,
      cookTime: null,
      confidence: { ingredients: 0, instructions: 0, overall: 0 },
      error,
    };
  }
};

/**
 * Parses a single ingredient line
 * @param {string} line - Single ingredient line
 * @returns {Object} Parsed ingredient with quantity, unit, and item
 */
function parseIngredientLine(line) {
  if (!line || line.length === 0) return null;

  // Remove common prefixes
  let cleaned = line.replace(/^[-•*]\s*/, '').trim();
  
  // Remove numbering
  cleaned = cleaned.replace(/^\d+\.\s*/, '').trim();

  // Extract quantity
  let quantity = null;
  let quantityText = null;
  let remaining = cleaned;

  // Try to match quantity patterns - be more careful with boundaries
  // Match: whole numbers, decimals, fractions, mixed numbers, unicode fractions
  const quantityMatch = cleaned.match(/^([\d.]+(?:\s+[\d/]+)?|[\d/]+|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/);
  
  if (quantityMatch && quantityMatch[1].trim()) {
    quantityText = quantityMatch[1].trim();
    quantity = parseQuantity(quantityText);
    remaining = cleaned.substring(quantityMatch[0].length).trim();
  }

  // Extract unit
  let unit = null;
  const unitMatch = remaining.match(new RegExp(`^(${Object.keys(COOKING_UNITS).join('|')})\\b`, 'i'));
  
  if (unitMatch) {
    unit = COOKING_UNITS[unitMatch[1].toLowerCase()];
    remaining = remaining.substring(unitMatch[0].length).trim();
  }

  // Remaining text is the item
  let item = remaining;

  // If no quantity/unit found, try to extract item from entire line
  if (!item || item.length === 0) {
    item = cleaned;
  }

  if (!item || item.length === 0) return null;

  const confidence = calculateSingleIngredientConfidence(quantity, unit, item);

  return {
    quantity,
    quantityText,
    unit,
    item,
    confidence,
    raw: line,
  };
}

/**
 * Parses a single instruction step
 * @param {string} line - Single instruction line
 * @returns {Object} Parsed instruction step
 */
function parseInstructionStep(line) {
  if (!line || line.length === 0) return null;

  // Remove numbering and common prefixes
  let cleaned = line.replace(/^[\d.)\-]\s*/, '').trim();
  cleaned = cleaned.replace(/^step\s+\d+:?\s*/i, '').trim();

  if (!cleaned || cleaned.length === 0) return null;

  // Extract cooking methods mentioned
  const methods = extractMethodsFromStep(cleaned);
  
  // Extract temperature if mentioned
  const temps = extractTemperaturesFromText(cleaned);
  
  // Extract time if mentioned
  const times = extractTimesFromText(cleaned);

  const confidence = calculateStepConfidence(methods, temps, times, cleaned);

  return {
    text: cleaned,
    methods,
    temperatures: temps,
    times,
    confidence,
    raw: line,
  };
}

/**
 * Parses a quantity string into a numeric value
 * @param {string} quantityStr - Quantity string (e.g., "2 1/2", "3", "½")
 * @returns {number} Parsed quantity as a number
 */
function parseQuantity(quantityStr) {
  if (!quantityStr) return null;

  const trimmed = quantityStr.trim();

  // Try to match whole number + fraction pattern like "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const [num, denom] = mixedMatch[2].split('/').map(Number);
    return whole + (num / denom);
  }

  // Try simple decimal like "1.5"
  if (trimmed.match(/^\d+\.\d+$/)) {
    const decimal = parseFloat(trimmed);
    if (!isNaN(decimal)) {
      return decimal;
    }
  }

  // Check for unicode fraction at start
  for (const [fraction, value] of Object.entries(FRACTIONS)) {
    if (trimmed.startsWith(fraction)) {
      const remaining = trimmed.substring(fraction.length).trim();
      if (remaining.length === 0) return value;
      
      const wholeNum = parseInt(remaining, 10);
      if (!isNaN(wholeNum)) {
        return wholeNum + value;
      }
    }
  }

  // Try simple fraction like "1/2"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const denom = parseInt(fractionMatch[2], 10);
    if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
      return num / denom;
    }
  }

  // Try simple integer
  const simpleNum = parseInt(trimmed, 10);
  if (!isNaN(simpleNum) && simpleNum > 0) {
    return simpleNum;
  }

  return null;
}

/**
 * Checks if a line is likely to be an ingredient
 * @param {string} line - Text line to check
 * @returns {boolean} True if line appears to be an ingredient
 */
function isLikelyIngredientLine(line) {
  // Check for quantity patterns
  if (/^\d+[\d/\s.-]*(?:cup|tbsp|tsp|oz|lb|g|ml|l|piece|clove)/.test(line.toLowerCase())) {
    return true;
  }

  // Check for common ingredient starters
  if (/^[-•*]\s+\d/.test(line)) {
    return true;
  }

  // Check for bullet points
  if (/^[-•*]/.test(line) && line.length > 5) {
    return true;
  }

  // Check for ingredient-like pattern (common food words)
  const ingredientKeywords = ['salt', 'pepper', 'flour', 'sugar', 'butter', 'egg', 'milk', 'cream', 'oil', 'vanilla', 'water', 'lemon', 'garlic', 'onion', 'tomato', 'cheese', 'meat', 'chicken', 'beef', 'fish', 'rice', 'pasta', 'bread', 'yeast'];
  if (ingredientKeywords.some(word => line.toLowerCase().includes(word)) && line.length > 3) {
    return true;
  }

  return false;
}

/**
 * Checks if a line is likely to be an instruction
 * @param {string} line - Text line to check
 * @returns {boolean} True if line appears to be an instruction
 */
function isLikelyInstructionLine(line) {
  // Check for step numbering
  if (/^\d+[\.)]\s+/.test(line)) {
    return true;
  }

  // Check for cooking method verbs
  const lowerLine = line.toLowerCase();
  if (COOKING_METHODS.some(method => {
    const regex = new RegExp(`\\b${method}\\b`);
    return regex.test(lowerLine);
  })) {
    return true;
  }

  // Check for common instruction starters
  if (/^(add|mix|combine|stir|heat|bake|fry|cook|place|pour|spread|fold|whisk|beat|blend|season|sprinkle|top|garnish|serve)\\b/i.test(line)) {
    return true;
  }

  return false;
}

/**
 * Extracts serving size from recipe text
 * @param {string} text - Recipe text
 * @returns {number} Number of servings or null
 */
function extractServings(text) {
  const match = text.match(/(?:serves?|servings?|yield|makes?)\s*:?\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extracts prep time from recipe text
 * @param {string} text - Recipe text
 * @returns {number} Prep time in minutes or null
 */
function extractPrepTime(text) {
  const match = text.match(/prep\s+time\s*:?\s*(\d+)\s*(?:minutes?|mins?)/i);
  if (match) return parseInt(match[1], 10);
  
  // Try alternative format
  const altMatch = text.match(/preparation\s*:?\s*(\d+)\s*(?:minutes?|mins?)/i);
  return altMatch ? parseInt(altMatch[1], 10) : null;
}

/**
 * Extracts cook time from recipe text
 * @param {string} text - Recipe text
 * @returns {number} Cook time in minutes or null
 */
function extractCookTime(text) {
  const match = text.match(/cook\s+time\s*:?\s*(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
  if (match) {
    const value = parseInt(match[1], 10);
    const isHours = /hours?|hrs?/i.test(match[0]);
    return isHours ? value * 60 : value;
  }
  
  return null;
}

/**
 * Extracts all temperatures from recipe text
 * @param {string} text - Recipe text
 * @returns {Array} Array of temperature objects
 */
function extractTemperatures(text) {
  const temps = [];
  let match;
  
  while ((match = TEMPERATURE_PATTERN.exec(text)) !== null) {
    temps.push({
      value: parseInt(match[1], 10),
      unit: match[2].charAt(0).toUpperCase(),
      raw: match[0],
    });
  }

  return temps;
}

/**
 * Extracts temperatures from a single step
 * @param {string} text - Step text
 * @returns {Array} Array of temperatures
 */
function extractTemperaturesFromText(text) {
  const temps = [];
  let match;
  const pattern = /(\d{2,3})\s*(?:°|degrees?)\s*([FC]|fahrenheit|celsius|centigrade)/gi;
  
  while ((match = pattern.exec(text)) !== null) {
    temps.push({
      value: parseInt(match[1], 10),
      unit: match[2].charAt(0).toUpperCase(),
      raw: match[0],
    });
  }

  return temps;
}

/**
 * Extracts cooking methods from recipe text
 * @param {string} text - Recipe text
 * @returns {Array} Array of cooking methods found
 */
function extractCookingMethods(text) {
  const methods = new Set();
  const lowerText = text.toLowerCase();

  for (const method of COOKING_METHODS) {
    const regex = new RegExp(`\\b${method}\\b`, 'g');
    if (regex.test(lowerText)) {
      methods.add(method);
    }
  }

  return Array.from(methods);
}

/**
 * Normalizes text by removing accents
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extracts cooking methods from a single step
 * @param {string} text - Step text
 * @returns {Array} Array of cooking methods
 */
function extractMethodsFromStep(text) {
  const methods = [];
  const lowerText = normalizeText(text.toLowerCase());

  for (const method of COOKING_METHODS) {
    const normalizedMethod = normalizeText(method.toLowerCase());
    const regex = new RegExp(`\\b${normalizedMethod}\\b`, 'i');
    if (regex.test(lowerText) && !methods.includes(method)) {
      methods.push(method);
    }
  }

  return methods;
}

/**
 * Extracts times from a single step
 * @param {string} text - Step text
 * @returns {Array} Array of time objects
 */
function extractTimesFromText(text) {
  const times = [];
  let match;
  const pattern = /(\d{1,3})\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi;

  while ((match = pattern.exec(text)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[0].match(/minutes?|mins?|hours?|hrs?|seconds?|secs?/i)[0];
    
    let minutes = value;
    if (/hours?|hrs?/i.test(unit)) {
      minutes = value * 60;
    } else if (/seconds?|secs?/i.test(unit)) {
      minutes = value / 60;
    }

    times.push({
      value,
      unit: unit.toLowerCase(),
      minutes: Math.round(minutes * 100) / 100,
      raw: match[0],
    });
  }

  return times;
}

/**
 * Calculates confidence score for ingredient parsing
 * @param {Array} ingredients - Parsed ingredients
 * @param {string} text - Original text
 * @returns {number} Confidence score 0-1
 */
function calculateIngredientConfidence(ingredients, text) {
  if (ingredients.length === 0) return 0;

  let confidenceSum = 0;
  for (const ingredient of ingredients) {
    confidenceSum += ingredient.confidence;
  }

  const avgConfidence = confidenceSum / ingredients.length;
  
  // Boost confidence if we found a reasonable number of ingredients
  let boost = 1;
  if (ingredients.length >= 5 && ingredients.length <= 25) {
    boost = 1.1;
  }

  return Math.min(avgConfidence * boost, 1);
}

/**
 * Calculates confidence for a single ingredient
 * @param {number} quantity - Parsed quantity
 * @param {string} unit - Parsed unit
 * @param {string} item - Ingredient item
 * @returns {number} Confidence score 0-1
 */
function calculateSingleIngredientConfidence(quantity, unit, item) {
  let confidence = 0.6; // Base confidence

  if (quantity !== null) confidence += 0.15;
  if (unit !== null) confidence += 0.15;
  if (item && item.length > 2) confidence += 0.1;

  return Math.min(confidence, 1);
}

/**
 * Calculates confidence score for instruction parsing
 * @param {Array} steps - Parsed instruction steps
 * @param {string} text - Original text
 * @returns {number} Confidence score 0-1
 */
function calculateInstructionConfidence(steps, text) {
  if (steps.length === 0) return 0;

  let confidenceSum = 0;
  for (const step of steps) {
    confidenceSum += step.confidence;
  }

  const avgConfidence = confidenceSum / steps.length;

  // Boost confidence if we found a reasonable number of steps
  let boost = 1;
  if (steps.length >= 3 && steps.length <= 20) {
    boost = 1.1;
  }

  return Math.min(avgConfidence * boost, 1);
}

/**
 * Calculates confidence for a single instruction step
 * @param {Array} methods - Cooking methods found
 * @param {Array} temps - Temperatures found
 * @param {Array} times - Times found
 * @param {string} text - Step text
 * @returns {number} Confidence score 0-1
 */
function calculateStepConfidence(methods, temps, times, text) {
  let confidence = 0.6; // Base confidence

  if (methods.length > 0) confidence += 0.15;
  if (temps.length > 0) confidence += 0.1;
  if (times.length > 0) confidence += 0.1;
  if (text && text.length > 10) confidence += 0.05;

  return Math.min(confidence, 1);
}

/**
 * Validates parsed recipe content
 * @param {Object} recipe - Parsed recipe object
 * @returns {boolean} True if recipe appears valid
 */
export const isValidParsedRecipe = (recipe) => {
  if (!recipe) return false;

  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasInstructions = recipe.steps && recipe.steps.length > 0;
  const hasReasonableConfidence = recipe.confidence && recipe.confidence.overall >= 0.5;

  return hasIngredients && hasInstructions && hasReasonableConfidence;
};

export default {
  parseIngredients,
  parseInstructions,
  parseRecipeText,
  isValidParsedRecipe,
};
