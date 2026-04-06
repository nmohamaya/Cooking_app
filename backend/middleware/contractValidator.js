/**
 * Runtime Contract Validation Middleware
 *
 * In development/staging, validates API responses against JSON Schema
 * contracts to catch drift before it reaches production.
 *
 * Disabled in production for performance — contract tests cover CI.
 *
 * Usage in routes:
 *   const { validateRecipe } = require('../middleware/contractValidator');
 *   router.get('/:id', validateRecipe, (req, res) => { ... });
 *
 * Or as response interceptor:
 *   app.use('/api/v1/extract', contractValidator.interceptExtractResponses());
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

let Ajv, addFormats, recipeValidate, jobValidate, initialized = false;

/**
 * Lazy-initialize validators (avoid loading ajv in production)
 */
function init() {
  if (initialized) return;

  try {
    Ajv = require('ajv/dist/2020');
    addFormats = require('ajv-formats');

    const contractsDir = path.join(__dirname, '..', '..', 'contracts');
    const recipeSchema = JSON.parse(fs.readFileSync(path.join(contractsDir, 'recipe.schema.json'), 'utf8'));
    const jobSchema = JSON.parse(fs.readFileSync(path.join(contractsDir, 'extraction-job.schema.json'), 'utf8'));

    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    ajv.addSchema(recipeSchema);
    ajv.addSchema(jobSchema);

    recipeValidate = ajv.getSchema('recipe.schema.json');
    jobValidate = ajv.getSchema('extraction-job.schema.json');
    initialized = true;
    logger.debug('Contract validation middleware initialized');
  } catch (err) {
    logger.warn('Contract validation middleware could not initialize', { error: err.message });
    initialized = false;
  }
}

/**
 * Check if validation should run (dev/staging only)
 */
function shouldValidate() {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'production';
}

/**
 * Validate a recipe object against the contract schema.
 * Logs warnings but does NOT block the response.
 *
 * @param {object} recipe - The recipe object to validate
 * @param {string} context - Description of where this was called (for logs)
 * @returns {{ valid: boolean, errors: Array|null }}
 */
function validateRecipeObject(recipe, context = 'unknown') {
  if (!shouldValidate()) return { valid: true, errors: null };

  init();
  if (!recipeValidate) return { valid: true, errors: null };

  const valid = recipeValidate(recipe);
  if (!valid) {
    logger.warn('Contract violation: recipe does not match schema', {
      context,
      errors: recipeValidate.errors.map(e => ({
        path: e.instancePath,
        message: e.message,
        params: e.params,
      })),
    });
  }
  return { valid, errors: valid ? null : recipeValidate.errors };
}

/**
 * Validate an extraction job response against the contract schema.
 *
 * @param {object} job - The job response object
 * @param {string} context - Description of where this was called
 * @returns {{ valid: boolean, errors: Array|null }}
 */
function validateJobObject(job, context = 'unknown') {
  if (!shouldValidate()) return { valid: true, errors: null };

  init();
  if (!jobValidate) return { valid: true, errors: null };

  const valid = jobValidate(job);
  if (!valid) {
    logger.warn('Contract violation: extraction job does not match schema', {
      context,
      errors: jobValidate.errors.map(e => ({
        path: e.instancePath,
        message: e.message,
        params: e.params,
      })),
    });
  }
  return { valid, errors: valid ? null : jobValidate.errors };
}

/**
 * Express middleware that intercepts JSON responses on extract routes
 * and validates them against the extraction-job schema.
 *
 * Does not block responses — only logs warnings.
 */
function interceptExtractResponses() {
  return (req, res, next) => {
    if (!shouldValidate()) return next();

    const originalJson = res.json.bind(res);
    res.json = function (body) {
      // Only validate GET responses that look like job status
      if (req.method === 'GET' && body && body.status && body.steps) {
        const { valid, errors } = validateJobObject(body, `GET ${req.originalUrl}`);
        if (!valid && process.env.CONTRACT_STRICT === 'true') {
          // In strict mode, add validation warnings to response
          body._contractWarnings = errors.map(e => `${e.instancePath}: ${e.message}`);
        }
      }

      // Validate recipe inside completed job results
      if (body && body.result && body.result.recipe) {
        validateRecipeObject(body.result.recipe, `${req.method} ${req.originalUrl} → result.recipe`);
      }

      return originalJson(body);
    };

    next();
  };
}

module.exports = {
  validateRecipeObject,
  validateJobObject,
  interceptExtractResponses,
};
