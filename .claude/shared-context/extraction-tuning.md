# Extraction Pipeline Tuning Decisions

## Description Analyzer Confidence Threshold
- **Value:** 0.25 (score 5/20)
- **Why:** Lower threshold catches recipe-adjacent descriptions (ingredient lists without full instructions). Higher values missed videos where the description only had ingredients and a link to the full recipe.
- **Set in:** `backend/services/descriptionAnalyzerService.js`

## Completeness Scorer Thresholds
- **COMPLETE:** 9 out of 12
- **PARTIAL:** 5 out of 12
- **Why:** 9 ensures the recipe has ingredients with measurements AND instructions with steps. 5 allows recipes that have ingredients but no measurements (common in casual cooking videos).
- **Set in:** `backend/services/recipeCompletenessScorer.js`

## Temperature Regex
- **Pattern:** Requires `°` symbol or `degrees` or 3+ digit number before F/C
- **Why:** Without the `°` requirement, "2 cups" matched as "2 c" (temperature). The 3-digit rule catches `350F` without false-positiving on `2c` or `1f`.
- **Set in:** `backend/services/recipeCompletenessScorer.js`

## AI Extraction Timeout
- **Value:** 15 seconds
- **Why:** GitHub Models API typically responds in 3-8 seconds. 15s gives headroom for cold starts without blocking the user too long.
- **Set in:** `backend/services/aiExtractionService.js`

## HTML Parser Strategy Order
- **Order:** Heading-based extraction first, then CSS class-based
- **Why:** Heading-based ("Ingredients", "Steps") works on most recipe sites regardless of CSS framework. Class-based (`.wprm-recipe`, `.tasty-recipe`) is plugin-specific. Previous order used `[class*="recipe"]` which matched page bodies on sites like recipe30.com, merging ingredients and instructions.
- **Set in:** `backend/services/linkScrapingService.js`
