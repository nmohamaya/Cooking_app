---
name: Cross-Domain Feature
about: Feature spanning both backend and frontend (requires coordination)
title: 'feat: '
labels: enhancement, cross-domain
assignees: ''
---

## Summary
What should be built and why. Explain how backend and frontend interact.

## Agent Role
**Coordinated by:** tech-lead (Opus 4.6)
**Backend work:** backend-dev (Opus 4.6)
**Frontend work:** frontend-dev (Sonnet 4.6)

## Implementation Phases

### Phase 1: Backend (PR #___) 
- [ ] Implement API endpoint(s)
- [ ] Write backend tests
- [ ] Document API contract below
- [ ] Merge before Phase 2 starts

### Phase 2: Frontend (PR #___)
- [ ] Wire UI to new API
- [ ] Write frontend tests
- [ ] Verify end-to-end

## API Contract

**Method + Path:** `POST /api/...`

**Request:**
```json
{}
```

**Response (success):**
```json
{}
```

## Affected Files

**Backend:**
- `backend/services/...`
- `backend/routes/...`

**Frontend:**
- `MyRecipeApp/services/...`
- `MyRecipeApp/components/...`
- `MyRecipeApp/screens/...`

## Acceptance Criteria
- [ ] 
- [ ] 
- [ ] 

## Test Plan
- [ ] Backend tests pass (291+ baseline)
- [ ] Frontend tests pass (1,131+ baseline)
- [ ] End-to-end manual test on Android + Web
- [ ] `npx expo install --check` passes
