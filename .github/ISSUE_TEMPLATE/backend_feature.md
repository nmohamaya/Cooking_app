---
name: Backend Feature
about: New feature or enhancement for the backend (routes, services, API)
title: 'feat: '
labels: enhancement, backend
assignees: ''
---

## Summary
What should be built and why.

## Agent Role
**Assigned to:** backend-dev (Opus 4.6)

## Acceptance Criteria
- [ ] 
- [ ] 
- [ ] 

## API Contract (if adding/changing endpoints)

**Method + Path:** `POST /api/...`

**Request:**
```json
{}
```

**Response (success):**
```json
{}
```

**Response (error):**
```json
{ "error": "..." }
```

## Affected Files
List key files that will be created or modified:
- `backend/services/...`
- `backend/routes/...`
- `backend/tests/...`

## Frontend Impact
Does this change require frontend updates? If yes, create a `frontend-followup` issue with the API contract above.

- [ ] No frontend changes needed
- [ ] Frontend followup issue needed (link: #)

## Test Plan
- [ ] Unit tests for new service(s)
- [ ] Route tests with Supertest
- [ ] Edge cases covered (invalid input, timeouts, etc.)
- [ ] All backend tests pass (291+ baseline)
