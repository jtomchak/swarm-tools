---
"swarm-mail": patch
---

## ⚠️ PGlite Deprecated - libSQL is the Future

PGlite support is now deprecated and will be removed in the next major version.

**What changed:**
- Added deprecation warnings to all PGlite-related functions
- `createInMemorySwarmMail()` now uses libSQL by default
- `getSwarmMailPGlite()` logs deprecation notice on first use

**Migration path:**
- New projects: Use `createInMemorySwarmMail()` or `getSwarmMailLibSQL()` 
- Existing PGlite databases: Run `migratePGliteToLibSQL()` to migrate your data
- The migration utility preserves all events, projections, and metadata

**Why the change:**
libSQL (SQLite-compatible) provides better performance, stability, and ecosystem support. PGlite was experimental and is no longer actively maintained.

**Timeline:**
- Current (v0.x): PGlite works with deprecation warnings
- Next major (v1.0): PGlite support removed entirely

Start migrating now to avoid breaking changes in v1.0.
