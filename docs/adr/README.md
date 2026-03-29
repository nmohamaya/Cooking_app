# Architecture Decision Records (ADRs)

An Architecture Decision Record (ADR) captures a significant architectural decision made in this project, along with its context and consequences. ADRs help current and future contributors understand *why* the system is built the way it is.

We follow the [MADR](https://adr.github.io/madr/) (Markdown Any Decision Records) format.

## Template for New ADRs

Use this template when creating a new ADR. Save it as `docs/adr/NNNN-short-title.md` where NNNN is the next sequential number.

```markdown
# ADR-NNNN: Title

## Status
Proposed | Accepted | Deprecated | Superseded by ADR-NNNN

## Context
What prompted this decision.

## Decision
What we decided.

## Consequences
What follows from this decision (both positive and negative).
```

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-0001](0001-react-native-expo.md) | React Native + Expo | Accepted |
| [ADR-0002](0002-express-backend.md) | Express Backend | Accepted |
| [ADR-0003](0003-github-models-api.md) | GitHub Models API | Accepted |
| [ADR-0004](0004-asyncstorage-no-db.md) | AsyncStorage over Database | Accepted |
| [ADR-0005](0005-eas-build-android.md) | EAS Build for Android | Accepted |
| [ADR-0006](0006-multi-agent-worktrees.md) | Git Worktrees for Multi-Agent | Accepted |
