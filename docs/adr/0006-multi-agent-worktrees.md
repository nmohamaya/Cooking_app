# ADR-0006: Git Worktrees for Multi-Agent

## Status
Accepted

## Context
Multiple AI coding agents (Claude Code instances) work concurrently on this codebase. Without isolation, simultaneous file edits from different agents cause conflicts, partial writes, and corrupted state. The agents need to operate independently while still contributing to the same repository.

## Decision
Use git worktrees to give each agent its own working directory on a separate branch. Each worktree is a fully independent checkout of the repository, allowing concurrent work without file-level conflicts. Agents coordinate through branches and pull requests rather than direct file access across worktrees.

## Consequences
**Positive:**
- Full filesystem isolation between agents. No risk of one agent overwriting another's in-progress changes.
- Agents can work in parallel on different features without blocking each other.
- Standard git workflow (branches, PRs, code review) applies naturally to multi-agent output.
- No additional tooling required beyond git's built-in worktree support.

**Negative:**
- Worktree management adds operational overhead (creation, cleanup, disk space).
- Agents must coordinate via branches and PRs, which introduces merge conflicts when multiple agents touch the same files.
- Shared files (CLAUDE.md, package.json, CI configuration) require careful sequencing -- later agents must rebase onto changes from earlier merged PRs.
- Each worktree consumes additional disk space for its working copy.
