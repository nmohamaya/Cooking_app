/**
 * Recipe Extraction Orchestrator
 *
 * Implements the fallback cascade for extracting recipes from video URLs.
 * Priority order:
 *   1. Video description (via yt-dlp metadata)
 *   2. Subtitles/captions (via yt-dlp subtitle extraction)
 *   3. Links in description (scrape recipe websites)
 *
 * Levels 1 and 2 run in parallel, results processed in priority order.
 */

const logger = require('../config/logger');
const { getVideoMetadata } = require('./downloadService');
const { transcribeAudio } = require('./transcriptionService');
const { generateUrlHash } = require('./cacheService');
const descriptionAnalyzer = require('./descriptionAnalyzerService');
const linkScraper = require('./linkScrapingService');
const aiExtraction = require('./aiExtractionService');

// Minimum characters of real content for a transcript to be useful
const MIN_TRANSCRIPT_LENGTH = 50;

/**
 * Extract a recipe from a video URL using the fallback cascade
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
    attempts: [],
    metadata: null,
  };

  const updateStep = (name, status, detail) => {
    if (onStepUpdate) {
      onStepUpdate(name, status, detail);
    }
  };

  try {
    // Phase 1: Parallel fetch — metadata (description) + subtitles
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

    // Phase 2: Try description (Level 1)
    if (metadata && metadata.description) {
      updateStep('Checking description', 'in-progress');
      const analysis = descriptionAnalyzer.analyze(metadata.description);

      if (analysis.hasRecipeContent) {
        result.attempts.push({ source: 'description', status: 'tried' });

        try {
          const recipe = await aiExtraction.extractRecipe(analysis.recipeText, 'description');

          if (aiExtraction.isValidRecipe(recipe)) {
            result.success = true;
            result.recipe = recipe;
            result.source = 'description';
            updateStep('Checking description', 'completed', 'Recipe found in description');
            logger.info('Recipe extracted from description', { url, title: recipe.title });
            return result;
          }
        } catch (err) {
          result.attempts[result.attempts.length - 1].error = err.message;
          logger.warn('AI extraction from description failed', { url, error: err.message });
        }
      }

      if (!result.attempts.some(a => a.source === 'description' && a.status === 'tried')) {
        result.attempts.push({ source: 'description', status: 'no-recipe-content' });
      }
      updateStep('Checking description', 'completed', 'No recipe found');
    } else {
      updateStep('Checking description', 'skipped', 'No description available');
      result.attempts.push({ source: 'description', status: 'skipped', reason: 'no description' });
    }

    // Phase 3: Try transcript (Level 2)
    if (transcript && transcript.text) {
      updateStep('Extracting captions', 'in-progress');

      const cleanedTranscript = transcript.text
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanedTranscript.length >= MIN_TRANSCRIPT_LENGTH) {
        result.attempts.push({ source: 'transcript', status: 'tried' });

        try {
          const recipe = await aiExtraction.extractRecipe(transcript.text, 'transcript');

          if (aiExtraction.isValidRecipe(recipe)) {
            result.success = true;
            result.recipe = recipe;
            result.source = 'transcript';
            updateStep('Extracting captions', 'completed', 'Recipe found in captions');
            logger.info('Recipe extracted from transcript', { url, title: recipe.title });
            return result;
          }
        } catch (err) {
          result.attempts[result.attempts.length - 1].error = err.message;
          logger.warn('AI extraction from transcript failed', { url, error: err.message });
        }

        updateStep('Extracting captions', 'completed', 'Could not extract recipe from captions');
      } else {
        updateStep('Extracting captions', 'completed', 'No meaningful captions found');
        result.attempts.push({ source: 'transcript', status: 'insufficient', length: cleanedTranscript.length });
      }
    } else {
      const reason = transcriptResult.status === 'rejected'
        ? transcriptResult.reason?.message || 'extraction failed'
        : 'no transcript';
      updateStep('Extracting captions', 'skipped', reason);
      result.attempts.push({ source: 'transcript', status: 'skipped', reason });
    }

    // Phase 4: Try linked URLs from description (Level 3)
    const descAnalysis = metadata?.description
      ? descriptionAnalyzer.analyze(metadata.description)
      : { linkedUrls: [] };

    if (descAnalysis.linkedUrls.length > 0) {
      updateStep('Checking linked sites', 'in-progress');

      const urlsToTry = descAnalysis.linkedUrls.slice(0, 3); // Max 3 links

      for (const linkedUrl of urlsToTry) {
        result.attempts.push({ source: 'linked-url', url: linkedUrl, status: 'tried' });

        const scraped = await linkScraper.scrapeRecipe(linkedUrl);

        if (scraped.success && scraped.recipe) {
          // If scraper returned structured data, check if it's complete enough
          if (scraped.recipe.title && (scraped.recipe.ingredients || scraped.recipe.instructions)) {
            // Structured data is already a recipe — use it directly or enhance with AI
            if (aiExtraction.isValidRecipe(scraped.recipe)) {
              result.success = true;
              result.recipe = aiExtraction.normalizeRecipe(scraped.recipe);
              result.source = `linked-url:${scraped.source}`;
              const hostname = safeHostname(linkedUrl);
              updateStep('Checking linked sites', 'completed', `Recipe found on ${hostname}`);
              logger.info('Recipe extracted from linked URL', { url, linkedUrl, source: scraped.source });
              return result;
            }
          }

          // Raw content — send to AI for extraction
          const rawText = `Title: ${scraped.recipe.title}\nIngredients:\n${scraped.recipe.ingredients}\nInstructions:\n${scraped.recipe.instructions}`;
          try {
            const recipe = await aiExtraction.extractRecipe(rawText, 'scraped');
            if (aiExtraction.isValidRecipe(recipe)) {
              result.success = true;
              result.recipe = recipe;
              result.source = `linked-url:${scraped.source}`;
              updateStep('Checking linked sites', 'completed', `Recipe found on ${safeHostname(linkedUrl)}`);
              logger.info('Recipe extracted from linked URL via AI', { url, linkedUrl });
              return result;
            }
          } catch (err) {
            logger.warn('AI extraction from scraped content failed', { linkedUrl, error: err.message });
          }
        }
      }

      updateStep('Checking linked sites', 'completed', 'No recipe found in linked sites');
    } else {
      updateStep('Checking linked sites', 'skipped', 'No links in description');
      result.attempts.push({ source: 'linked-urls', status: 'skipped', reason: 'no links found' });
    }

    // All sources exhausted
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
