/**
 * Video Extraction Service
 *
 * Frontend client for the backend /api/extract route.
 * Handles the full extraction cascade (description → transcript → linked sites)
 * with job polling and progress tracking.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const POLL_INTERVAL = 1500; // 1.5 seconds
const MAX_POLL_ATTEMPTS = 120; // 3 minutes max (120 * 1.5s)

/**
 * Start a recipe extraction job and poll until completion
 * @param {string} url - Video URL
 * @param {object} options - Options
 * @param {string} options.language - Language code (default: 'en')
 * @param {function} options.onStepUpdate - Callback for step progress updates
 * @param {function} options.onProgress - Callback for overall progress (0-100)
 * @returns {Promise<object>} Extraction result with recipe
 */
export async function extractRecipeFromVideo(url, options = {}) {
  const { language = 'en', onStepUpdate, onProgress, onJobCreated } = options;

  // Step 1: Queue the extraction job
  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, language }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Failed to start extraction (${response.status})`);
  }

  const { jobId } = await response.json();

  if (onJobCreated) onJobCreated(jobId);

  // Step 2: Poll for result
  return pollForResult(jobId, { onStepUpdate, onProgress });
}

/**
 * Poll for extraction job result
 * @param {string} jobId - Job ID
 * @param {object} callbacks - Progress callbacks
 * @returns {Promise<object>} Extraction result
 */
async function pollForResult(jobId, { onStepUpdate, onProgress }) {
  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;

    const response = await fetch(`${API_BASE}/extract/${jobId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Extraction job not found. The server may have restarted.');
      }
      throw new Error(`Failed to check extraction status (${response.status})`);
    }

    const job = await response.json();

    // Update progress callbacks
    if (onProgress) {
      onProgress(job.progress || 0);
    }
    if (onStepUpdate && job.steps) {
      onStepUpdate(job.steps);
    }

    // Check terminal states
    if (job.status === 'completed' && job.result) {
      return {
        success: true,
        recipe: job.result.recipe,
        source: job.result.source,
        metadata: job.result.metadata,
        attempts: job.result.attempts,
      };
    }

    if (job.status === 'failed') {
      const errorMsg = job.error?.message || 'Extraction failed';
      const error = new Error(errorMsg);
      error.attempts = job.error?.attempts;
      error.code = job.error?.code;
      throw error;
    }

    if (job.status === 'cancelled') {
      throw new Error('Extraction was cancelled');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error('Extraction timed out. Please try again.');
}

/**
 * Cancel an extraction job
 * @param {string} jobId - Job ID to cancel
 */
export async function cancelExtraction(jobId) {
  try {
    await fetch(`${API_BASE}/extract/${jobId}`, { method: 'DELETE' });
  } catch (error) {
    console.warn('Failed to cancel extraction:', error.message);
  }
}
