# ADR-0002: Express Backend

## Status
Accepted

## Context
The app needs a backend API to handle video downloading, audio extraction, AI-powered transcription, and recipe extraction. These operations involve coordinating multiple services and returning structured recipe data to the frontend. The team already works in JavaScript on the frontend.

## Decision
Use Node.js with Express 4.18 for the backend API server. This keeps the entire stack in JavaScript and allows sharing knowledge, tooling, and patterns between frontend and backend development.

## Consequences
**Positive:**
- Same language across the entire stack reduces context switching and enables code sharing.
- Large npm ecosystem for video processing, HTTP handling, and file management.
- Simple deployment model -- a single Node.js process serves the API.
- Express is well-understood with extensive documentation and community support.

**Negative:**
- Node.js is single-threaded. CPU-intensive operations like audio processing must be offloaded to external tools or worker processes to avoid blocking the event loop.
- Express 4.x is mature but aging. Express 5.x may require migration effort in the future.
- No built-in type safety. Runtime errors from malformed data require defensive coding and thorough input validation.
