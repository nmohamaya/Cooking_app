/**
 * Recipe Extraction Service
 * 
 * Main service for extracting structured recipe data from transcribed text.
 * Combines ingredient parsing, cooking steps parsing, and metadata extraction.
 * 
 * Phase 4: Recipe Extraction
 */

const winston = require('winston');
const ingredientService = require('./ingredientService');
const cookingStepsService = require('./cookingStepsService');

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
 * Parse transcribed recipe text into structured data
 * 
 * Expected input format:
 * - Title (first line or "Recipe Title" line)
 * - Ingredients section (preceded by "Ingredients:" or similar)
 * - Instructions section (preceded by "Instructions:" or similar)
 * - Optional metadata (Prep time, Cook time, Servings, etc.)
 * 
 * @param {string} transcribedText - Raw transcribed recipe text
 * @param {Object} options - Parsing options
 *   {
 *     includeConfidence: boolean (default: true),
 *     minConfidence: number (default: 0.5),
 *     strictMode: boolean (default: false) - reject parts with low confidence
 *   }
 * @returns {Promise<Object>} Structured recipe object:
 *   {
 *     success: boolean,
 *     recipe: {
 *       title: string,
 *       ingredients: Object[],
 *       instructions: Object[],
 *       metadata: Object,
 *       overallConfidence: number,
 *       extractionNotes: string[],
 *       warnings: string[]
 *     },
 *     error: string|null,
 *     processingTime: number (ms)
 *   }
 */
async function extractRecipe(transcribedText, options = {}) {
  const startTime = Date.now();

  try {
    if (!transcribedText || typeof transcribedText !== 'string') {
      return {
        success: false,
        recipe: null,
        error: 'Input must be a non-empty string',
        processingTime: Date.now() - startTime
      };
    }

    const opts = {
      includeConfidence: options.includeConfidence !== false,
      minConfidence: options.minConfidence || 0.5,
      strictMode: options.strictMode || false
    };

    const recipe = {
      title: '',
      ingredients: [],
      instructions: [],
      metadata: {
        prepTime: null,
        cookTime: null,
        totalTime: null,
        servings: null,
        difficulty: null
      },
      overallConfidence: 0,
      extractionNotes: [],
      warnings: []
    };

    // Parse sections
    const { title, ingredientsSection, instructionsSection } = parseSections(transcribedText);

    recipe.title = title;

    // Extract ingredients
    if (ingredientsSection) {
      const ingredients = ingredientService.parseIngredients(
        ingredientsSection.split('\n').map(s => s.trim()).filter(Boolean)
      );
      
      recipe.ingredients = ingredients.filter(ing => ing.confidence >= opts.minConfidence);
      
      if (ingredients.length > recipe.ingredients.length) {
        recipe.warnings.push(
          `Filtered out ${ingredients.length - recipe.ingredients.length} ingredients below confidence threshold`
        );
      }

      if (recipe.ingredients.length === 0 && ingredients.length > 0) {
        recipe.extractionNotes.push('No ingredients met minimum confidence threshold');
      }
    } else {
      recipe.warnings.push('Could not identify ingredients section');
    }

    // Extract instructions
    if (instructionsSection) {
      const instructions = cookingStepsService.parseSteps(instructionsSection);
      
      recipe.instructions = instructions.filter(step => step.confidence >= opts.minConfidence);
      
      if (instructions.length > recipe.instructions.length) {
        recipe.warnings.push(
          `Filtered out ${instructions.length - recipe.instructions.length} steps below confidence threshold`
        );
      }

      if (recipe.instructions.length === 0 && instructions.length > 0) {
        recipe.extractionNotes.push('No steps met minimum confidence threshold');
      }
    } else {
      recipe.warnings.push('Could not identify instructions section');
    }

    // Extract metadata
    recipe.metadata = cookingStepsService.extractMetadata(instructionsSection || transcribedText);

    // Calculate overall confidence
    recipe.overallConfidence = calculateOverallConfidence(recipe);

    // Add validation notes
    if (!recipe.title || recipe.title.length === 0) {
      recipe.warnings.push('Could not extract recipe title');
    }

    if (recipe.ingredients.length === 0) {
      recipe.warnings.push('No ingredients extracted');
    }

    if (recipe.instructions.length === 0) {
      recipe.warnings.push('No cooking instructions extracted');
    }

    if (opts.strictMode && recipe.overallConfidence < opts.minConfidence) {
      return {
        success: false,
        recipe,
        error: `Overall confidence (${recipe.overallConfidence.toFixed(2)}) below minimum (${opts.minConfidence})`,
        processingTime: Date.now() - startTime
      };
    }

    // Remove confidence scores if not requested
    if (!opts.includeConfidence) {
      recipe.ingredients.forEach(ing => delete ing.confidence);
      recipe.ingredients.forEach(ing => {
        delete ing.quantity.confidence;
        delete ing.unit.confidence;
      });
      recipe.instructions.forEach(step => delete step.confidence);
      recipe.instructions.forEach(step => {
        delete step.duration.confidence;
        delete step.temperature.confidence;
      });
      delete recipe.overallConfidence;
    }

    logger.info('Recipe extraction successful', {
      title: recipe.title,
      ingredients: recipe.ingredients.length,
      steps: recipe.instructions.length,
      confidence: recipe.overallConfidence,
      processingTime: Date.now() - startTime
    });

    return {
      success: true,
      recipe,
      error: null,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    logger.error('Recipe extraction failed', {
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime
    });

    return {
      success: false,
      recipe: null,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Parse main sections from transcribed text
 * @param {string} text - Raw transcribed text
 * @returns {Object} { title, ingredientsSection, instructionsSection }
 */
function parseSections(text) {
  const result = {
    title: '',
    ingredientsSection: '',
    instructionsSection: ''
  };

  // Split into lines but preserve structure
  const allLines = text.split('\n');
  const trimmedLines = allLines.map(l => l.trim());
  
  let ingredientsStartIdx = -1;
  let instructionsStartIdx = -1;

  // Find section markers in trimmed lines
  for (let i = 0; i < trimmedLines.length; i++) {
    const line = trimmedLines[i].toLowerCase();
    
    if (ingredientsStartIdx === -1 && /^ingredients?:?$/.test(line)) {
      ingredientsStartIdx = i;
    } else if (instructionsStartIdx === -1 && /^(instructions?|directions?|steps?):?$/.test(line)) {
      instructionsStartIdx = i;
    }
  }

  // Extract title
  if (ingredientsStartIdx > 0) {
    result.title = trimmedLines.slice(0, ingredientsStartIdx).filter(l => l.length > 0).join(' ');
  } else if (instructionsStartIdx > 0) {
    result.title = trimmedLines.slice(0, Math.min(1, instructionsStartIdx)).filter(l => l.length > 0).join(' ');
  } else {
    result.title = trimmedLines.find(l => l.length > 0) || '';
  }

  // Extract ingredients section
  if (ingredientsStartIdx >= 0) {
    const endIdx = instructionsStartIdx > ingredientsStartIdx ? instructionsStartIdx : trimmedLines.length;
    result.ingredientsSection = trimmedLines
      .slice(ingredientsStartIdx + 1, endIdx)
      .filter(l => l.length > 0)
      .join('\n');
  }

  // Extract instructions section
  if (instructionsStartIdx >= 0) {
    result.instructionsSection = trimmedLines
      .slice(instructionsStartIdx + 1)
      .filter(l => l.length > 0)
      .join('\n');
  }

  return result;
}

/**
 * Calculate overall confidence score for recipe
 * @param {Object} recipe - Parsed recipe object
 * @returns {number} Confidence score 0-1
 */
function calculateOverallConfidence(recipe) {
  let weights = 0;
  let score = 0;

  // Title weight
  if (recipe.title && recipe.title.length > 0) {
    score += 0.2;
    weights += 0.2;
  }

  // Ingredients weight
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    const avgIngredientConfidence = recipe.ingredients.reduce((sum, ing) => sum + (ing.confidence || 0.5), 0) / recipe.ingredients.length;
    score += avgIngredientConfidence * 0.4;
    weights += 0.4;
  }

  // Instructions weight
  if (recipe.instructions && recipe.instructions.length > 0) {
    const avgInstructionConfidence = recipe.instructions.reduce((sum, step) => sum + (step.confidence || 0.5), 0) / recipe.instructions.length;
    score += avgInstructionConfidence * 0.3;
    weights += 0.3;
  }

  // Metadata weight
  if (recipe.metadata && (recipe.metadata.servings || (recipe.metadata.cookTime && recipe.metadata.cookTime.min) || (recipe.metadata.prepTime && recipe.metadata.prepTime.min))) {
    score += 0.1;
    weights += 0.1;
  }

  // Return weighted average, minimum 0
  return weights > 0 ? Math.max(0, score / weights) : 0;
}

/**
 * Format recipe for display
 * @param {Object} recipe - Parsed recipe
 * @returns {string} Human-readable recipe text
 */
function formatRecipe(recipe) {
  let output = [];

  output.push(`# ${recipe.title || 'Untitled Recipe'}\n`);

  if (recipe.metadata && recipe.metadata.servings) {
    output.push(`Servings: ${recipe.metadata.servings}`);
  }
  if (recipe.metadata && recipe.metadata.prepTime && recipe.metadata.prepTime.min) {
    output.push(`Prep time: ${formatDuration(recipe.metadata.prepTime)}`);
  }
  if (recipe.metadata && recipe.metadata.cookTime && recipe.metadata.cookTime.min) {
    output.push(`Cook time: ${formatDuration(recipe.metadata.cookTime)}`);
  }

  output.push('\n## Ingredients\n');
  if (recipe.ingredients && recipe.ingredients.length > 0) {
    recipe.ingredients.forEach(ing => {
      const qty = ing.quantity.min ? `${ing.quantity.min}${ing.quantity.max !== ing.quantity.min ? '-' + ing.quantity.max : ''}` : '';
      const unit = ing.unit.standardUnit || '';
      output.push(`- ${[qty, unit, ing.name].filter(Boolean).join(' ')}`);
      if (ing.preparation && ing.preparation.length > 0) {
        output.push(`, ${ing.preparation.join(', ')}`);
      }
    });
  }

  output.push('\n## Instructions\n');
  if (recipe.instructions && recipe.instructions.length > 0) {
    recipe.instructions.forEach(step => {
      output.push(`${step.stepNumber}. ${step.description}`);
    });
  }

  if (recipe.warnings && recipe.warnings.length > 0) {
    output.push('\n## Extraction Notes\n');
    recipe.warnings.forEach(w => {
      output.push(`- ${w}`);
    });
  }

  return output.join('\n');
}

/**
 * Format duration object to readable string
 * @param {Object} duration - { min, max } in seconds
 * @returns {string}
 */
function formatDuration(duration) {
  if (!duration.min) return 'unknown';

  const formatSeconds = (secs) => {
    if (secs < 60) return `${Math.round(secs)}s`;
    if (secs < 3600) return `${Math.round(secs / 60)}m`;
    const hours = Math.floor(secs / 3600);
    const mins = Math.round((secs % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (duration.max && duration.max !== duration.min) {
    return `${formatSeconds(duration.min)}-${formatSeconds(duration.max)}`;
  }
  return formatSeconds(duration.min);
}

module.exports = {
  extractRecipe,
  parseSections,
  calculateOverallConfidence,
  formatRecipe,
  formatDuration
};
