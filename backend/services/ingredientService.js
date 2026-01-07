/**
 * Ingredient Service
 * 
 * Parses and normalizes ingredients from raw text.
 * Handles quantity normalization, unit conversion, and ingredient standardization.
 * 
 * Phase 4: Recipe Extraction - Step 1
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * Common unit conversions to grams (metric)
 */
const UNIT_CONVERSIONS = {
  // Volume to metric equivalents (approximate)
  'tsp': 5,           // teaspoon
  'tbsp': 15,         // tablespoon
  'cup': 240,         // cup in ml
  'ml': 1,
  'l': 1000,
  'fl oz': 30,        // fluid ounce

  // Weight
  'g': 1,             // gram
  'kg': 1000,
  'oz': 28,           // ounce
  'lb': 454,          // pound
  'mg': 0.001,

  // Cooking-specific units
  'pinch': 0.5,       // pinch in grams (approximate)
  'dash': 1,
  'stick': 113,       // butter stick
  'can': 400,         // standard can (ml/g)
  'jar': 500,         // standard jar
  'bunch': 100,       // bunch (approximate)
  'clove': 5,         // garlic clove
  'piece': 50,        // generic piece
};

/**
 * Quantity regex patterns
 */
const QUANTITY_PATTERNS = {
  // Fractions: 1/2, 3/4, etc.
  fraction: /^(\d+)\/(\d+)$/,
  
  // Ranges: 1-2, 1 to 2, etc.
  range: /^(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)$/i,
  
  // Decimals: 1.5, 2.25, etc.
  decimal: /^(\d+\.?\d*)$/,
  
  // Mixed: 1 1/2, 2 3/4, etc.
  mixed: /^(\d+)\s+(\d+)\/(\d+)$/,
};

/**
 * Parse a quantity string to a normalized decimal number
 * @param {string} quantityStr - Raw quantity string (e.g., "1 1/2", "2.5", "1-2")
 * @returns {Object} { min: number, max: number, confidence: number }
 */
function parseQuantity(quantityStr) {
  if (!quantityStr || typeof quantityStr !== 'string') {
    return { min: null, max: null, confidence: 0 };
  }

  const str = quantityStr.trim();

  // Try mixed fraction (1 1/2)
  const mixedMatch = str.match(QUANTITY_PATTERNS.mixed);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const numerator = parseFloat(mixedMatch[2]);
    const denominator = parseFloat(mixedMatch[3]);
    const value = whole + (numerator / denominator);
    return { min: value, max: value, confidence: 1.0 };
  }

  // Try simple fraction (1/2)
  const fractionMatch = str.match(QUANTITY_PATTERNS.fraction);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    const value = numerator / denominator;
    return { min: value, max: value, confidence: 1.0 };
  }

  // Try range (1-2)
  const rangeMatch = str.match(QUANTITY_PATTERNS.range);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return { min, max, confidence: 0.95 };
  }

  // Try decimal (1.5, 2, etc.)
  const decimalMatch = str.match(QUANTITY_PATTERNS.decimal);
  if (decimalMatch) {
    const value = parseFloat(decimalMatch[1]);
    return { min: value, max: value, confidence: 1.0 };
  }

  // Failed to parse
  return { min: null, max: null, confidence: 0 };
}

/**
 * Normalize unit string to standard form
 * @param {string} unitStr - Raw unit string (e.g., "tablespoon", "tbsp", "cup")
 * @returns {Object} { standardUnit: string, type: string, confidence: number }
 */
function normalizeUnit(unitStr) {
  if (!unitStr || typeof unitStr !== 'string') {
    return { standardUnit: null, type: 'unknown', confidence: 0 };
  }

  const str = unitStr.trim().toLowerCase();

  // Exact matches
  if (UNIT_CONVERSIONS[str]) {
    return {
      standardUnit: str,
      type: getUnitType(str),
      confidence: 1.0
    };
  }

  // Plural forms
  const singular = str.replace(/s$/, '');
  if (UNIT_CONVERSIONS[singular]) {
    return {
      standardUnit: singular,
      type: getUnitType(singular),
      confidence: 1.0
    };
  }

  // Common abbreviations and aliases
  const aliases = {
    'tablespoon': 'tbsp',
    'table spoon': 'tbsp',
    'teaspoon': 'tsp',
    'tea spoon': 'tsp',
    'ounce': 'oz',
    'pound': 'lb',
    'liter': 'l',
    'milliliter': 'ml',
    'gram': 'g',
    'kilogram': 'kg',
  };

  if (aliases[str] && UNIT_CONVERSIONS[aliases[str]]) {
    return {
      standardUnit: aliases[str],
      type: getUnitType(aliases[str]),
      confidence: 0.95
    };
  }

  // Fuzzy match (if in doubt, try to find similar unit)
  const similarUnit = findSimilarUnit(str);
  if (similarUnit) {
    return {
      standardUnit: similarUnit,
      type: getUnitType(similarUnit),
      confidence: 0.7
    };
  }

  return { standardUnit: null, type: 'unknown', confidence: 0 };
}

/**
 * Get unit type (volume, weight, cooking-specific, etc.)
 * @param {string} unit - Normalized unit
 * @returns {string}
 */
function getUnitType(unit) {
  const volumeUnits = ['tsp', 'tbsp', 'cup', 'ml', 'l', 'fl oz'];
  const weightUnits = ['g', 'kg', 'oz', 'lb', 'mg'];
  const cookingUnits = ['pinch', 'dash', 'stick', 'can', 'jar', 'bunch', 'clove', 'piece'];

  if (volumeUnits.includes(unit)) return 'volume';
  if (weightUnits.includes(unit)) return 'weight';
  if (cookingUnits.includes(unit)) return 'cooking-specific';
  return 'unknown';
}

/**
 * Find a similar unit using string distance
 * @param {string} input - Input unit string
 * @returns {string|null} Closest matching unit or null
 */
function findSimilarUnit(input) {
  const units = Object.keys(UNIT_CONVERSIONS);
  let closest = null;
  let minDistance = Infinity;

  for (const unit of units) {
    const distance = levenshteinDistance(input, unit);
    if (distance < minDistance && distance <= 2) {
      minDistance = distance;
      closest = unit;
    }
  }

  return closest;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number}
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Parse a single ingredient string
 * Format: "quantity unit ingredient [preparation]"
 * Examples:
 *   - "2 cups flour"
 *   - "1/2 teaspoon salt"
 *   - "3 cloves garlic, minced"
 *   - "butter, softened"
 * 
 * @param {string} ingredientStr - Raw ingredient string
 * @returns {Object} Parsed ingredient with structure:
 *   {
 *     raw: string,
 *     name: string,
 *     quantity: { min: number, max: number, confidence: number },
 *     unit: { standardUnit: string, type: string, confidence: number },
 *     preparation: string[],
 *     confidence: number
 *   }
 */
function parseIngredient(ingredientStr) {
  if (!ingredientStr || typeof ingredientStr !== 'string') {
    return null;
  }

  const raw = ingredientStr.trim();
  if (!raw) return null;

  // Extract preparation notes (after commas or parentheses)
  const preparationMatches = raw.match(/[\(,]([^,\)]+)/g) || [];
  const preparation = preparationMatches
    .map(p => p.replace(/[\(,]/g, '').trim())
    .filter(p => p && p.length > 0);

  // Remove preparation notes from main string for parsing
  const withoutPrep = raw.split(/[\(,]/)[0].trim();

  // Try to extract quantity and unit
  const parts = withoutPrep.split(/\s+/);
  let quantityStr = null;
  let unitStr = null;
  let nameStartIdx = 0;

  // Check if first part is a quantity
  if (parts.length > 0) {
    const quantityResult = parseQuantity(parts[0]);
    if (quantityResult.confidence > 0) {
      quantityStr = parts[0];
      nameStartIdx = 1;

      // Check if next part is a unit
      if (parts.length > 1) {
        const unitResult = normalizeUnit(parts[1]);
        if (unitResult.confidence > 0) {
          unitStr = parts[1];
          nameStartIdx = 2;
        }
      }
    }
  }

  // Extract ingredient name (remaining parts)
  const name = parts.slice(nameStartIdx).join(' ').trim().toLowerCase();

  if (!name) {
    return null;
  }

  const quantity = parseQuantity(quantityStr || '');
  const unit = normalizeUnit(unitStr || '');

  // Calculate overall confidence
  let confidence = 0.5; // Base confidence for parsed ingredient
  confidence += quantity.confidence * 0.3;
  confidence += unit.confidence * 0.2;
  confidence = Math.min(confidence, 1.0);

  return {
    raw,
    name,
    quantity,
    unit,
    preparation,
    confidence
  };
}

/**
 * Parse multiple ingredients from an array
 * @param {string[]} ingredientStrings - Array of raw ingredient strings
 * @returns {Object[]} Array of parsed ingredients
 */
function parseIngredients(ingredientStrings) {
  if (!Array.isArray(ingredientStrings)) {
    return [];
  }

  return ingredientStrings
    .map(parseIngredient)
    .filter(Boolean); // Remove null entries
}

module.exports = {
  parseIngredient,
  parseIngredients,
  parseQuantity,
  normalizeUnit,
  UNIT_CONVERSIONS,
  QUANTITY_PATTERNS
};
