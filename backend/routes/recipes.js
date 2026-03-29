/**
 * Recipe Routes (Issue #171)
 *
 * Routes for recipe extraction operations:
 * - POST /api/recipes - Extract recipe from transcribed text (async job)
 * - GET /api/recipes/:id - Get recipe extraction job status/result
 * - PUT /api/recipes/:id - Update a completed recipe
 * - DELETE /api/recipes/:id - Cancel/remove recipe extraction job
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const { extractRecipe } = require('../services/recipeExtractionService');

// In-memory job queue for recipe extraction
const recipeJobs = new Map();

// Job cleanup configuration
const JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_QUEUE_SIZE = 1000;

// Periodic cleanup of old jobs
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of recipeJobs.entries()) {
    if (now - new Date(job.createdAt).getTime() > JOB_TTL_MS) {
      recipeJobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000); // Run every hour
cleanupInterval.unref();

/**
 * POST /api/recipes
 * Start an async recipe extraction job
 *
 * Request body:
 * {
 *   transcribedText: string (required — transcript to extract recipe from),
 *   options?: {
 *     includeConfidence?: boolean,
 *     minConfidence?: number,
 *     strictMode?: boolean
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { transcribedText, options } = req.body;

    if (!transcribedText || typeof transcribedText !== 'string' || transcribedText.trim().length === 0) {
      return res.status(400).json({
        error: 'MISSING_TEXT',
        message: 'transcribedText is required and must be a non-empty string'
      });
    }

    // Check queue capacity
    if (recipeJobs.size >= MAX_QUEUE_SIZE) {
      return res.status(503).json({
        error: 'QUEUE_FULL',
        message: 'Recipe extraction queue is full. Try again later.'
      });
    }

    const jobId = uuidv4();

    const job = {
      jobId,
      status: 'queued',
      progress: 0,
      steps: [
        { name: 'Queued', completed: true, timestamp: new Date().toISOString() },
        { name: 'Text Parsing', completed: false },
        { name: 'Ingredient Extraction', completed: false },
        { name: 'Step Extraction', completed: false }
      ],
      result: null,
      error: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    recipeJobs.set(jobId, job);

    // Process asynchronously
    processRecipeJob(jobId, transcribedText.trim(), options || {}).catch(err => {
      logger.error('Unhandled error in recipe job processing', {
        jobId,
        error: err.message
      });
    });

    logger.info('Recipe extraction job queued', { jobId });

    res.status(202).json({
      jobId,
      status: 'queued',
      message: 'Recipe extraction job queued successfully'
    });
  } catch (error) {
    logger.error('Failed to queue recipe extraction', {
      error: error.message,
      body: req.body
    });

    res.status(500).json({
      error: 'RECIPE_QUEUE_FAILED',
      message: 'Failed to queue recipe extraction job',
      details: error.message
    });
  }
});

/**
 * GET /api/recipes/:id
 * Get recipe extraction job status and result
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = recipeJobs.get(id);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Recipe extraction job not found: ${id}`
      });
    }

    const completedSteps = job.steps.filter(s => s.completed).length;
    const totalSteps = job.steps.length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    const response = {
      jobId: job.jobId,
      status: job.status,
      progress,
      steps: job.steps,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };

    if (job.result) {
      response.result = job.result;
    }

    if (job.error) {
      response.error = job.error;
    }

    res.json(response);
  } catch (error) {
    logger.error('Failed to get recipe job status', {
      error: error.message,
      id: req.params.id
    });

    res.status(500).json({
      error: 'STATUS_CHECK_FAILED',
      message: 'Failed to check job status',
      details: error.message
    });
  }
});

/**
 * PUT /api/recipes/:id
 * Update a completed recipe's fields
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = recipeJobs.get(id);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Recipe extraction job not found: ${id}`
      });
    }

    if (job.status !== 'completed' || !job.result) {
      return res.status(400).json({
        error: 'JOB_NOT_COMPLETED',
        message: 'Can only update completed recipe extraction jobs'
      });
    }

    const updates = req.body;
    const updatableFields = ['title', 'ingredients', 'instructions', 'notes'];
    const metadataFields = ['prepTime', 'cookTime', 'servings', 'difficulty'];

    const recipe = job.result.recipe || job.result;
    for (const field of updatableFields) {
      if (updates[field] !== undefined) {
        recipe[field] = updates[field];
      }
    }
    // Update metadata fields in both top-level and metadata object for consistency
    for (const field of metadataFields) {
      if (updates[field] !== undefined) {
        recipe[field] = updates[field];
        if (recipe.metadata) {
          recipe.metadata[field] = updates[field];
        }
      }
    }

    job.result.updatedAt = new Date().toISOString();

    logger.info('Recipe updated', { id, updatedFields: Object.keys(updates) });

    res.json({
      jobId: job.jobId,
      status: job.status,
      result: job.result,
      message: 'Recipe updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update recipe', {
      error: error.message,
      id: req.params.id
    });

    res.status(500).json({
      error: 'UPDATE_FAILED',
      message: 'Failed to update recipe',
      details: error.message
    });
  }
});

/**
 * DELETE /api/recipes/:id
 * Cancel or remove a recipe extraction job
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const job = recipeJobs.get(id);

    if (!job) {
      return res.status(404).json({
        error: 'JOB_NOT_FOUND',
        message: `Recipe extraction job not found: ${id}`
      });
    }

    if (job.status === 'queued' || job.status === 'processing') {
      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();
      logger.info('Recipe extraction job cancelled', { id });

      res.json({
        jobId: id,
        status: 'cancelled',
        message: 'Recipe extraction job cancelled successfully'
      });
    } else {
      recipeJobs.delete(id);
      logger.info('Recipe extraction job removed', { id });

      res.json({
        jobId: id,
        status: 'deleted',
        message: 'Recipe extraction job removed successfully'
      });
    }
  } catch (error) {
    logger.error('Failed to delete recipe job', {
      error: error.message,
      id: req.params.id
    });

    res.status(500).json({
      error: 'DELETE_FAILED',
      message: 'Failed to delete recipe job',
      details: error.message
    });
  }
});

/**
 * Process recipe extraction job asynchronously
 * @private
 */
async function processRecipeJob(jobId, transcribedText, options) {
  const job = recipeJobs.get(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    job.startedAt = new Date().toISOString();

    // Step 1: Text parsing + ingredient extraction + step extraction
    updateJobStep(job, 'Text Parsing', true);

    // Check for cancellation before starting extraction
    if (job.status === 'cancelled') return;

    const result = await extractRecipe(transcribedText, options);

    // Check for cancellation after extraction completes
    if (job.status === 'cancelled') return;

    updateJobStep(job, 'Ingredient Extraction', true);
    updateJobStep(job, 'Step Extraction', true);

    if (!result.success) {
      throw {
        code: 'EXTRACTION_FAILED',
        message: result.error || 'Recipe extraction failed'
      };
    }

    job.result = {
      recipe: result.recipe,
      confidence: result.confidence,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString()
    };

    job.status = 'completed';
    job.completedAt = new Date().toISOString();

    logger.info('Recipe extraction job completed', {
      jobId,
      title: result.recipe?.title,
      confidence: result.confidence
    });
  } catch (error) {
    logger.error('Recipe extraction job failed', {
      jobId,
      error: error.message,
      code: error.code
    });

    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.error = {
      code: error.code || 'EXTRACTION_FAILED',
      message: error.message,
      details: error.details || null
    };
  }
}

/**
 * Update job step completion status
 * @private
 */
function updateJobStep(job, stepName, completed) {
  const step = job.steps.find(s => s.name === stepName);
  if (step) {
    step.completed = completed;
    step.timestamp = new Date().toISOString();
  }
}

module.exports = router;
