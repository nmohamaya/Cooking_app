/**
 * Recipe Completeness Scorer
 *
 * Scores recipe quality on a 0-12 scale to decide whether the extraction
 * cascade should continue to more expensive phases.
 *
 * Phase boundaries:
 *   - COMPLETE (9-12): Recipe is ready to use as-is
 *   - PARTIAL  (5-8):  Usable but could be improved by deeper extraction
 *   - INSUFFICIENT (0-4): Not enough content — trigger next phase
 */

// Valid categories matching aiExtractionService.js
const VALID_CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks',
  'Appetizers', 'Asian', 'Vegan', 'Vegetarian',
];

// Measurement patterns (imperial + metric)
const MEASUREMENT_REGEX = /\d+\s*(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|oz|ounces?|g|grams?|kg|kilograms?|ml|milliliters?|l|liters?|lbs?|pounds?|pints?|quarts?|gallons?|pinch|dash|handful)/i;

// Ordered step patterns
const ORDERED_STEP_REGEX = /^(\d+[.):\s]|step\s*\d+)/im;

// Temperature patterns — require ° symbol, "degrees", or standalone F/C after 3+ digit number
// to avoid false positives like "2 cups" matching "2 c"
const TEMPERATURE_REGEX = /\d+\s*°\s*[fFcC]|\d+\s*degrees|\b\d{3,}\s*[fFcC]\b/;

const THRESHOLDS = {
  COMPLETE: 9,
  PARTIAL: 5,
};

/**
 * Score a recipe's completeness on a 0-12 scale
 * @param {object} recipe - Recipe object with standard fields
 * @returns {{ score: number, breakdown: object, phase: string }}
 */
function scoreRecipe(recipe) {
  if (!recipe) {
    return { score: 0, breakdown: emptyBreakdown(), phase: 'insufficient' };
  }

  const title = String(recipe.title || '').trim();
  const ingredients = String(recipe.ingredients || '').trim();
  const instructions = String(recipe.instructions || '').trim();
  const prepTime = String(recipe.prepTime || '').trim();
  const cookTime = String(recipe.cookTime || '').trim();
  const servings = String(recipe.servings || '').trim();
  const category = String(recipe.category || '').trim();

  const breakdown = {
    hasTitle: title.length >= 3,
    hasIngredients: ingredients.length >= 10,
    hasMeasurements: MEASUREMENT_REGEX.test(ingredients),
    hasInstructions: instructions.length >= 10,
    hasOrderedSteps: ORDERED_STEP_REGEX.test(instructions),
    hasTime: prepTime.length > 0 || cookTime.length > 0,
    hasServings: servings.length > 0,
    hasTemperature: TEMPERATURE_REGEX.test(ingredients) || TEMPERATURE_REGEX.test(instructions),
    hasCategory: VALID_CATEGORIES.includes(category),
  };

  // Calculate score based on weighted criteria
  let score = 0;
  if (breakdown.hasTitle) score += 1;
  if (breakdown.hasIngredients) score += 2;
  if (breakdown.hasMeasurements) score += 2;
  if (breakdown.hasInstructions) score += 2;
  if (breakdown.hasOrderedSteps) score += 1;
  if (breakdown.hasTime) score += 1;
  if (breakdown.hasServings) score += 1;
  if (breakdown.hasTemperature) score += 1;
  if (breakdown.hasCategory) score += 1;

  // Determine phase
  let phase;
  if (score >= THRESHOLDS.COMPLETE) {
    phase = 'complete';
  } else if (score >= THRESHOLDS.PARTIAL) {
    phase = 'partial';
  } else {
    phase = 'insufficient';
  }

  return { score, breakdown, phase };
}

/**
 * Return an empty breakdown object (all false)
 * @returns {object}
 */
function emptyBreakdown() {
  return {
    hasTitle: false,
    hasIngredients: false,
    hasMeasurements: false,
    hasInstructions: false,
    hasOrderedSteps: false,
    hasTime: false,
    hasServings: false,
    hasTemperature: false,
    hasCategory: false,
  };
}

module.exports = {
  scoreRecipe,
  THRESHOLDS,
  VALID_CATEGORIES,
};
