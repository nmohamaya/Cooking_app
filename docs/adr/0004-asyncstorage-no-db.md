# ADR-0004: AsyncStorage over Database

## Status
Accepted

## Context
The app stores recipes, meal plans, and shopping lists locally on the user's device. All data is user-specific with no multi-user sharing or synchronization requirements. The question was whether to use a structured database (SQLite, Realm, WatermelonDB) or a simpler key-value storage approach.

## Decision
Use React Native AsyncStorage for all local persistence. No local database is used. Data is stored as JSON blobs keyed by data type (recipes, meal plans, shopping lists).

## Consequences
**Positive:**
- Zero setup -- AsyncStorage is available out of the box with React Native and Expo.
- Works fully offline with no server dependency for data persistence.
- No schema migrations to manage. Data format changes are handled in application code.
- Simple mental model: read JSON, modify in memory, write JSON back.

**Negative:**
- No query capabilities. All filtering, searching, and sorting happens in memory after loading the full dataset.
- Data is stored as JSON blobs, so large datasets may cause performance issues on read/write.
- Platform-specific size limits (e.g., 6 MB on some Android versions) could become a constraint as recipe collections grow.
- No relational integrity. Consistency between recipes, meal plans, and shopping lists must be enforced in application logic.
