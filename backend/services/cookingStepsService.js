/**
 * Cooking Steps Service
 * 
 * Parses and extracts cooking instructions from raw text.
 * Identifies step boundaries, temperatures, timings, and techniques.
 * 
 * Phase 4: Recipe Extraction - Step 2
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
 * Common cooking temperatures (Fahrenheit to Celsius)
 */
const COMMON_TEMPS = {
  350: { celsius: 177, description: 'moderate oven' },
  375: { celsius: 190, description: 'moderately hot oven' },
  400: { celsius: 204, description: 'hot oven' },
  425: { celsius: 218, description: 'hot oven' },
  450: { celsius: 232, description: 'very hot oven' },
};

/**
 * Common cooking techniques
 */
const COOKING_TECHNIQUES = [
  'bake', 'broil', 'boil', 'simmer', 'steam', 'fry', 'saute',
  'roast', 'grill', 'toast', 'microwave', 'blend', 'mix', 'whisk',
  'fold', 'stir', 'chop', 'dice', 'mince', 'slice', 'puree',
  'knead', 'roll', 'spread', 'brush', 'season', 'marinate'
];

/**
 * Time unit patterns and conversions to seconds
 */
const TIME_UNITS = {
  second: 1,
  minute: 60,
  hour: 3600,
  sec: 1,
  min: 60,
  hr: 3600,
  s: 1,
  m: 60,
  h: 3600,
};

/**
 * Extract time duration from text
 * @param {string} timeStr - Time string (e.g., "5 minutes", "1.5 hours")
 * @returns {Object} { min: number (seconds), max: number (seconds), confidence: number }
 */
function extractTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return { min: null, max: null, confidence: 0 };
  }

  const str = timeStr.trim().toLowerCase();

  // Match patterns like "5 minutes", "1-2 hours", "30-45 min"
  const timePattern = /(\d+\.?\d*)\s*(?:-|to)?\s*(\d+\.?\d*)?\s*(second|minute|hour|sec|min|hr|s|m|h)s?/i;
  const matches = timePattern.exec(str);

  if (!matches) {
    return { min: null, max: null, confidence: 0 };
  }

  const firstNum = parseFloat(matches[1]);
  const secondNum = matches[2] ? parseFloat(matches[2]) : null;
  const unit = matches[3].toLowerCase();

  // Normalize unit
  let multiplier = TIME_UNITS[unit];
  if (!multiplier) {
    // Try matching longer form
    const longUnit = Object.keys(TIME_UNITS).find(u => unit.startsWith(u));
    multiplier = longUnit ? TIME_UNITS[longUnit] : 60; // Default to minutes
  }

  const min = firstNum * multiplier;
  const max = secondNum ? secondNum * multiplier : min;

  return {
    min,
    max,
    confidence: 1.0
  };
}

/**
 * Extract temperature from text
 * @param {string} tempStr - Temperature string (e.g., "350°F", "177°C")
 * @returns {Object} { fahrenheit: number, celsius: number, confidence: number }
 */
function extractTemperature(tempStr) {
  if (!tempStr || typeof tempStr !== 'string') {
    return { fahrenheit: null, celsius: null, confidence: 0 };
  }

  const str = tempStr.trim();

  // Match patterns like "350°F", "350F", "177°C", "177C"
  const tempPattern = /(\d+)\s*°?\s*([FC])/i;
  const matches = tempPattern.exec(str);

  if (!matches) {
    return { fahrenheit: null, celsius: null, confidence: 0 };
  }

  const temp = parseFloat(matches[1]);
  const unit = matches[2].toUpperCase();

  let fahrenheit, celsius;

  if (unit === 'F') {
    fahrenheit = temp;
    celsius = Math.round((temp - 32) * 5 / 9 * 10) / 10;
  } else {
    celsius = temp;
    fahrenheit = Math.round((temp * 9 / 5 + 32) * 10) / 10;
  }

  return {
    fahrenheit,
    celsius,
    confidence: 1.0
  };
}

/**
 * Identify cooking techniques in text
 * @param {string} stepText - Step text
 * @returns {string[]} Array of identified techniques
 */
function extractTechniques(stepText) {
  if (!stepText || typeof stepText !== 'string') {
    return [];
  }

  const text = stepText.toLowerCase();
  const found = [];

  for (const technique of COOKING_TECHNIQUES) {
    // Use word boundary to avoid partial matches (e.g., "bake" shouldn't match "baked")
    const regex = new RegExp(`\\b${technique}(ed|ing)?\\b`);
    if (regex.test(text)) {
      found.push(technique);
    }
  }

  return [...new Set(found)]; // Remove duplicates
}

/**
 * Parse a single cooking step
 * @param {string} stepText - Raw step text
 * @param {number} stepNumber - Position in recipe (1-indexed)
 * @returns {Object} Parsed step with structure:
 *   {
 *     raw: string,
 *     stepNumber: number,
 *     description: string,
 *     duration: { min: number, max: number, confidence: number },
 *     temperature: { fahrenheit: number, celsius: number, confidence: number },
 *     techniques: string[],
 *     confidence: number
 *   }
 */
function parseStep(stepText, stepNumber = 1) {
  if (!stepText || typeof stepText !== 'string') {
    return null;
  }

  const raw = stepText.trim();
  if (!raw) return null;

  // Remove step numbering prefixes (e.g., "1. ", "Step 1: ")
  let description = raw.replace(/^(?:step\s+)?\d+[\.\)\:]\s*/i, '').trim();

  // Extract duration
  const durationPattern = /(\d+\.?\d*)\s*(?:-|to)?\s*(?:\d+\.?\d*)?\s*(second|minute|hour|sec|min|hr|s|m|h)s?/i;
  const durationMatch = durationPattern.exec(raw);
  let duration = { min: null, max: null, confidence: 0 };
  if (durationMatch) {
    duration = extractTime(durationMatch[0]);
  }

  // Extract temperature
  const tempPattern = /(\d+)\s*°?\s*([FC])/i;
  const tempMatch = tempPattern.exec(raw);
  let temperature = { fahrenheit: null, celsius: null, confidence: 0 };
  if (tempMatch) {
    temperature = extractTemperature(tempMatch[0]);
  }

  // Extract techniques
  const techniques = extractTechniques(raw);

  // Calculate confidence based on extracted features
  let confidence = 0.7; // Base confidence
  if (duration.confidence > 0) confidence += 0.1;
  if (temperature.confidence > 0) confidence += 0.1;
  if (techniques.length > 0) confidence += 0.1;
  confidence = Math.min(confidence, 1.0);

  return {
    raw,
    stepNumber,
    description,
    duration,
    temperature,
    techniques,
    confidence
  };
}

/**
 * Parse cooking steps from text
 * Handles both numbered steps and newline-separated steps
 * @param {string|string[]} stepsText - Raw steps text or array of strings
 * @returns {Object[]} Array of parsed steps
 */
function parseSteps(stepsText) {
  if (!stepsText) {
    return [];
  }

  let stepsList;

  if (Array.isArray(stepsText)) {
    stepsList = stepsText;
  } else if (typeof stepsText === 'string') {
    // Split by newlines or numbered list markers
    stepsList = stepsText
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  } else {
    return [];
  }

  return stepsList
    .map((step, idx) => parseStep(step, idx + 1))
    .filter(Boolean); // Remove null entries
}

/**
 * Extract metadata from instructions text
 * Looks for common patterns like "Prep time:", "Cook time:", "Serves:"
 * @param {string} instructionsText - Full instructions text
 * @returns {Object} Extracted metadata:
 *   {
 *     prepTime: { min: number, max: number, confidence: number },
 *     cookTime: { min: number, max: number, confidence: number },
 *     totalTime: { min: number, max: number, confidence: number },
 *     servings: number,
 *     difficulty: string
 *   }
 */
function extractMetadata(instructionsText) {
  if (!instructionsText || typeof instructionsText !== 'string') {
    return {
      prepTime: { min: null, max: null, confidence: 0 },
      cookTime: { min: null, max: null, confidence: 0 },
      totalTime: { min: null, max: null, confidence: 0 },
      servings: null,
      difficulty: null
    };
  }

  const text = instructionsText.toLowerCase();
  const metadata = {
    prepTime: { min: null, max: null, confidence: 0 },
    cookTime: { min: null, max: null, confidence: 0 },
    totalTime: { min: null, max: null, confidence: 0 },
    servings: null,
    difficulty: null
  };

  // Extract prep time
  const prepMatch = /prep\s+time[:\s]+(.+?)(?:\n|$)/i.exec(instructionsText);
  if (prepMatch) {
    metadata.prepTime = extractTime(prepMatch[1]);
  }

  // Extract cook time
  const cookMatch = /cook\s+time[:\s]+(.+?)(?:\n|$)/i.exec(instructionsText);
  if (cookMatch) {
    metadata.cookTime = extractTime(cookMatch[1]);
  }

  // Extract total time
  const totalMatch = /total\s+time[:\s]+(.+?)(?:\n|$)/i.exec(instructionsText);
  if (totalMatch) {
    metadata.totalTime = extractTime(totalMatch[1]);
  }

  // Extract servings
  const servingsMatch = /(?:serves?|yield)\s*[:\s]*(\d+)/i.exec(instructionsText);
  if (servingsMatch) {
    metadata.servings = parseInt(servingsMatch[1]);
  }

  // Extract difficulty
  const difficultyMatch = /difficulty\s*[:\s]*(easy|medium|hard|advanced)/i.exec(instructionsText);
  if (difficultyMatch) {
    metadata.difficulty = difficultyMatch[1].toLowerCase();
  }

  return metadata;
}

module.exports = {
  parseStep,
  parseSteps,
  extractTime,
  extractTemperature,
  extractTechniques,
  extractMetadata,
  COOKING_TECHNIQUES,
  TIME_UNITS
};
