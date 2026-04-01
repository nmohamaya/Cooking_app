/**
 * Recipe Extraction Orchestrator
 *
 * Implements a phased approach for extracting recipes from video URLs.
 *
 * Phase 1 (parallel, free, fast):
 *   1. Linked URLs in description (structured recipe data from websites)
 *   2. Video description text (via AI extraction)
 *   3. Subtitles/captions (via AI extraction)
 *
 * All three run in parallel via Promise.allSettled(). The best result
 * is selected using the recipe completeness scorer (0-12 scale).
 *
 * Phase boundaries:
 *   - Score >= 9 (COMPLETE): Return immediately
 *   - Score 5-8 (PARTIAL): Return result (future: optionally try Phase 2)
 *   - Score 0-4 (INSUFFICIENT): Future Phase 2 (video frame analysis)
 *
 * Metadata and transcript are fetched in parallel before Phase 1 sources.
 */

const logger = require('../config/logger');
const { getVideoMetadata } = require('./downloadService');
const { transcribeAudio } = require('./transcriptionService');
const { generateUrlHash } = require('./cacheService');
const descriptionAnalyzer = require('./descriptionAnalyzerService');
const linkScraper = require('./linkScrapingService');
const aiExtraction = require('./aiExtractionService');
const { scoreRecipe, THRESHOLDS } = require('./recipeCompletenessScorer');

// Minimum characters of real content for a transcript to be useful
const MIN_TRANSCRIPT_LENGTH = 50;

/**
 * Extract a recipe from a video URL using parallel Phase 1 sources
 * @param {string} url - Video URL
 * @param {object} options - Options
 * @param {string} options.language - Language code (default: 'en')
 * @param {function} options.onStepUpdate - Callback for step progress updates
 * @returns {Promise<object>} Extraction result
 */
async function extractRecipeFromVideo(url, options = {}) {
  const { language = 'en', onStepUpdate } = options;

  const result = {
    success: false,
    recipe: null,
    source: null,
    completeness: null,
    attempts: [],
    metadata: null,
  };

  const updateStep = (name, status, detail) => {
    if (onStepUpdate) {
      onStepUpdate(name, status, detail);
    }
  };

  try {
    // Pre-phase: Parallel fetch — metadata (description) + subtitles
    updateStep('Fetching video info', 'in-progress');

    const cacheKey = generateUrlHash(url, language);

    const [metadataResult, transcriptResult] = await Promise.allSettled([
      getVideoMetadata(url),
      transcribeAudio(url, cacheKey, language),
    ]);

    const metadata = metadataResult.status === 'fulfilled' ? metadataResult.value : null;
    const transcript = transcriptResult.status === 'fulfilled' ? transcriptResult.value : null;

    if (metadata) {
      result.metadata = {
        title: metadata.title,
        uploader: metadata.uploader,
        duration: metadata.duration,
      };
    }

    updateStep('Fetching video info', 'completed');

    // Analyze description once — used by both linked sites and description phases
    const analysis = (metadata && metadata.description)
      ? descriptionAnalyzer.analyze(metadata.description)
      : { hasRecipeContent: false, recipeText: '', linkedUrls: [], confidence: 0 };

    // Phase 1: Run all three sources in parallel
    const [linkedResult, descriptionResultSettled, transcriptExtractResult] = await Promise.allSettled([
      tryLinkedUrls(analysis, result, updateStep),
      tryDescription(analysis, metadata, result, updateStep),
      tryTranscript(transcript, transcriptResult, result, updateStep),
    ]);

    // Collect successful candidates and score them
    const candidates = [linkedResult, descriptionResultSettled, transcriptExtractResult]
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0 && candidates[0].score >= THRESHOLDS.PARTIAL) {
      result.success = true;
      result.recipe = candidates[0].recipe;
      result.source = candidates[0].source;
      result.completeness = candidates[0].score;

      logger.info('Recipe extracted (Phase 1)', {
        url,
        source: result.source,
        completeness: result.completeness,
        candidateCount: candidates.length,
        scores: candidates.map(c => ({ source: c.source, score: c.score })),
      });

      return result;
    }

    // All sources exhausted or insufficient
    // Future: Phase 2 (video frame analysis) would be triggered here
    if (candidates.length > 0) {
      // Return best partial result even if below threshold
      const best = candidates[0];
      result.success = true;
      result.recipe = best.recipe;
      result.source = best.source;
      result.completeness = best.score;

      logger.info('Returning best partial recipe (below threshold)', {
        url,
        source: best.source,
        completeness: best.score,
      });

      return result;
    }

    result.success = false;
    const triedSources = result.attempts
      .filter(a => a.status === 'tried')
      .map(a => a.source)
      .join(', ');
    const skippedSources = result.attempts
      .filter(a => a.status === 'skipped')
      .map(a => `${a.source} (${a.reason})`)
      .join(', ');

    logger.warn('All extraction sources exhausted', { url, triedSources, skippedSources });

    return result;
  } catch (error) {
    logger.error('Orchestrator error', { url, error: error.message });
    throw error;
  }
}

/**
 * Try extracting recipe from linked URLs in the description
 * @returns {{ recipe, source, score }|null}
 */
async function tryLinkedUrls(analysis, result, updateStep) {
  if (analysis.linkedUrls.length === 0) {
    updateStep('Checking linked sites', 'skipped', 'No links in description');
    result.attempts.push({ source: 'linked-urls', status: 'skipped', reason: 'no links found' });
    return null;
  }

  updateStep('Checking linked sites', 'in-progress');
  const urlsToTry = analysis.linkedUrls.slice(0, 3);

  for (const linkedUrl of urlsToTry) {
    result.attempts.push({ source: 'linked-url', url: linkedUrl, status: 'tried' });

    try {
      const scraped = await linkScraper.scrapeRecipe(linkedUrl);

      if (scraped.success && scraped.recipe) {
        let recipe = null;

        logger.debug('Scraped recipe data', {
          linkedUrl,
          source: scraped.source,
          title: scraped.recipe.title,
          ingredientsLength: scraped.recipe.ingredients?.length,
          instructionsLength: scraped.recipe.instructions?.length,
          ingredientsPreview: String(scraped.recipe.ingredients || '').substring(0, 200),
          instructionsPreview: String(scraped.recipe.instructions || '').substring(0, 200),
        });

        // If scraper returned structured data, check if it's complete enough
        if (scraped.recipe.title && (scraped.recipe.ingredients || scraped.recipe.instructions)) {
          if (aiExtraction.isValidRecipe(scraped.recipe)) {
            recipe = aiExtraction.normalizeRecipe(scraped.recipe);
          }
        }

        // Raw content — send to AI for extraction
        if (!recipe) {
          const rawText = [
            `Title: ${scraped.recipe.title || 'Unknown'}`,
            '',
            '--- INGREDIENTS ---',
            scraped.recipe.ingredients || '(none)',
            '',
            '--- INSTRUCTIONS ---',
            scraped.recipe.instructions || '(none)',
          ].join('\n');
          try {
            recipe = await aiExtraction.extractRecipe(rawText, 'scraped');
          } catch (err) {
            logger.warn('AI extraction from scraped content failed', { linkedUrl, error: err.message });
          }
        }

        if (recipe && aiExtraction.isValidRecipe(recipe)) {
          const { score } = scoreRecipe(recipe);
          const hostname = safeHostname(linkedUrl);
          updateStep('Checking linked sites', 'completed', `Recipe found on ${hostname}`);
          logger.info('Recipe extracted from linked URL', { linkedUrl, score, source: scraped.source });
          return { recipe, source: `linked-url:${scraped.source}`, score };
        }
      }
    } catch (err) {
      logger.warn('Linked URL scraping failed', { linkedUrl, error: err.message });
    }
  }

  updateStep('Checking linked sites', 'completed', 'No recipe found in linked sites');
  return null;
}

/**
 * Try extracting recipe from description text via AI
 * @returns {{ recipe, source, score }|null}
 */
async function tryDescription(analysis, metadata, result, updateStep) {
  if (!metadata || !metadata.description) {
    updateStep('Checking description', 'skipped', 'No description available');
    result.attempts.push({ source: 'description', status: 'skipped', reason: 'no description' });
    return null;
  }

  updateStep('Checking description', 'in-progress');

  if (!analysis.hasRecipeContent) {
    result.attempts.push({ source: 'description', status: 'no-recipe-content' });
    updateStep('Checking description', 'completed', 'No recipe content detected');
    return null;
  }

  result.attempts.push({ source: 'description', status: 'tried' });

  try {
    const recipe = await aiExtraction.extractRecipe(analysis.recipeText, 'description');

    if (aiExtraction.isValidRecipe(recipe)) {
      const { score } = scoreRecipe(recipe);
      updateStep('Checking description', 'completed', 'Recipe found in description');
      logger.info('Recipe extracted from description', { title: recipe.title, score });
      return { recipe, source: 'description', score };
    }
  } catch (err) {
    result.attempts[result.attempts.length - 1].error = err.message;
    logger.warn('AI extraction from description failed', { error: err.message });
  }

  updateStep('Checking description', 'completed', 'No recipe found');
  return null;
}

/**
 * Try extracting recipe from transcript/captions via AI
 * @returns {{ recipe, source, score }|null}
 */
async function tryTranscript(transcript, transcriptResult, result, updateStep) {
  if (!transcript || !transcript.text) {
    const reason = transcriptResult.status === 'rejected'
      ? transcriptResult.reason?.message || 'extraction failed'
      : 'no transcript';
    updateStep('Extracting captions', 'skipped', reason);
    result.attempts.push({ source: 'transcript', status: 'skipped', reason });
    return null;
  }

  updateStep('Extracting captions', 'in-progress');

  const cleanedTranscript = transcript.text
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanedTranscript.length < MIN_TRANSCRIPT_LENGTH) {
    updateStep('Extracting captions', 'completed', 'No meaningful captions found');
    result.attempts.push({ source: 'transcript', status: 'insufficient', length: cleanedTranscript.length });
    return null;
  }

  result.attempts.push({ source: 'transcript', status: 'tried' });

  try {
    const recipe = await aiExtraction.extractRecipe(transcript.text, 'transcript');

    if (aiExtraction.isValidRecipe(recipe)) {
      const { score } = scoreRecipe(recipe);
      updateStep('Extracting captions', 'completed', 'Recipe found in captions');
      logger.info('Recipe extracted from transcript', { title: recipe.title, score });
      return { recipe, source: 'transcript', score };
    }
  } catch (err) {
    result.attempts[result.attempts.length - 1].error = err.message;
    logger.warn('AI extraction from transcript failed', { error: err.message });
  }

  updateStep('Extracting captions', 'completed', 'Could not extract recipe from captions');
  return null;
}

/**
 * Safely extract hostname from a URL string
 * @param {string} urlStr
 * @returns {string}
 */
function safeHostname(urlStr) {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
}

module.exports = {
  extractRecipeFromVideo,
};
