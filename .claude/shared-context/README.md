# Shared Agent Context

This directory contains cross-agent project knowledge that doesn't fit in CLAUDE.md
but needs to persist across agent sessions.

## What goes here

- Design decisions with non-obvious rationale
- Tuning parameters and why they were chosen
- Workarounds for known platform issues
- Patterns that agents should follow but aren't obvious from the code

## What does NOT go here

- Code documentation (that goes in the code or docs/)
- Personal preferences (those go in ~/.claude/ memory)
- Temporary task state (that goes in tasks/)
