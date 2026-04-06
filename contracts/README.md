# API Contracts

JSON Schema definitions for shared data structures between backend and frontend.

Both backend and frontend agents should validate against these schemas when modifying API responses or request handling.

## Schemas

| Schema | Used By | Description |
|--------|---------|-------------|
| `recipe.schema.json` | Backend: `normalizeRecipe()`, Frontend: `AddRecipeScreen` | Recipe object shape |
| `extraction-job.schema.json` | Backend: `extract.js` route, Frontend: `videoExtractionService.js` | Extraction job response |

## Rules

1. **Additive changes** (new optional fields) — safe, update schema, no coordination needed
2. **Breaking changes** (renamed/removed fields, type changes) — create a `cross-domain` issue, update schema FIRST, then update code
3. **Both agents must pass** schema validation in their tests after any contract change
