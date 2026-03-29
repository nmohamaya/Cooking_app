# ADR-0003: GitHub Models API

## Status
Accepted

## Context
The app needs AI capabilities to extract structured recipe data (ingredients, cooking steps, metadata) from video transcripts. The project originally used OpenAI GPT-4o-mini for transcription and extraction. Issue #165 migrated the transcription service to the GitHub Copilot Models API with Claude 3.5 Haiku to consolidate API access and reduce costs.

## Decision
Use the GitHub Copilot Models API with Claude 3.5 Haiku as the AI model for recipe extraction from transcripts. Authentication uses the existing GITHUB_TOKEN, eliminating the need for a separate API key.

## Consequences
**Positive:**
- No separate API key management -- leverages the existing GitHub token used for repository access.
- Good extraction quality for recipe parsing tasks at lower cost than larger models.
- Consolidated vendor relationship through GitHub.

**Negative:**
- Tied to GitHub token availability and rate limits. If the token expires or GitHub changes access policies, the AI pipeline breaks.
- Model selection and versioning is controlled by GitHub, not the project. Model upgrades or deprecations happen on GitHub's schedule.
- Less flexibility than direct API access to model providers (e.g., cannot fine-tune or select specific model versions).
