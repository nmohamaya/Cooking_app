# Domain Dependency Graph

Shows which backend services the frontend depends on and vice versa.
Agents should check this before modifying shared contracts.

## Frontend → Backend Dependencies

```
MyRecipeApp/                              backend/
┌──────────────────────┐                  ┌──────────────────────────────┐
│ services/            │                  │ routes/                      │
│  videoExtraction     │──── POST ──────▶│  extract.js                  │
│  Service.js          │──── GET ───────▶│   POST /api/extract          │
│                      │──── DELETE ────▶│   GET  /api/extract/:id      │
│                      │                  │   DELETE /api/extract/:id    │
│                      │                  │                              │
│  apiClient.js        │──── POST ──────▶│  recipes.js                  │
│                      │──── GET ───────▶│   POST /api/recipes          │
│                      │──── PUT ───────▶│   GET  /api/recipes/:id      │
│                      │                  │   PUT  /api/recipes/:id      │
│                      │                  │                              │
│  recipeExtraction.js │── direct AI ───▶│  (GitHub Models API)         │
│                      │   (no backend)   │                              │
└──────────────────────┘                  └──────────────────────────────┘
```

## Backend Internal Dependencies

```
routes/extract.js
  └── services/recipeExtractionOrchestrator.js
        ├── services/downloadService.js (getVideoMetadata)
        ├── services/transcriptionService.js (transcribeAudio → subtitles)
        ├── services/descriptionAnalyzerService.js (analyze description)
        ├── services/linkScrapingService.js (scrape linked URLs)
        ├── services/aiExtractionService.js (AI recipe extraction)
        ├── services/recipeCompletenessScorer.js (score recipe quality)
        └── services/cacheService.js (URL hash for caching)

routes/recipes.js
  └── services/recipeExtractionService.js
        ├── services/ingredientService.js (parse ingredients)
        └── services/cookingStepsService.js (parse instructions)

config/
  ├── env.js (all environment variables)
  └── logger.js (Winston logger, used everywhere)
```

## Shared Data Contracts

### Recipe Object Shape
Both frontend and backend must agree on this shape:

```javascript
{
  title: string,        // Recipe name
  category: string,     // One of: Breakfast, Lunch, Dinner, Dessert, Snacks,
                         //         Appetizers, Asian, Vegan, Vegetarian
  ingredients: string,   // Newline-separated list
  instructions: string,  // Numbered steps
  prepTime: string,      // e.g., "15 minutes"
  cookTime: string,      // e.g., "30 minutes"
  servings: string,      // e.g., "4 servings" (added in PR #202)
}
```

### Extraction Job Response Shape
Returned by `GET /api/extract/:id`:

```javascript
{
  status: 'processing' | 'completed' | 'failed',
  steps: [
    { name: string, status: 'pending'|'in-progress'|'completed'|'skipped'|'failed',
      detail?: string, timestamp?: string }
  ],
  result?: {
    recipe: RecipeObject,
    source: string,       // e.g., "linked-url:json-ld", "description", "transcript"
    completeness: number, // 0-12 score (added in PR #202)
    metadata: { title, uploader, duration },
    attempts: [...],
    timestamp: string,
  },
  error?: string,
}
```

## Rules for Changing Contracts

1. **Additive changes** (new optional fields): safe, no coordination needed
2. **Breaking changes** (renamed/removed fields, type changes): create a `cross-domain` issue
3. **New endpoints**: backend implements first, then creates `frontend-followup` issue
4. **Removed endpoints**: deprecate first (log warnings), remove in next release
