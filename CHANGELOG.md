# Changelog

> _"In most cases, a change to an application's features also requires a change to data that it stores: perhaps a new field or record type needs to be captured, or perhaps existing data needs to be presented in a new way."_
> — Martin Kleppmann, _Designing Data-Intensive Applications_

This is a high-level overview of major releases across the swarm tools monorepo. For detailed changelogs with full context, see the individual package changelogs:

- **[opencode-swarm-plugin](./packages/opencode-swarm-plugin/CHANGELOG.md)** - OpenCode plugin with hive, swarm coordination, and skills
- **[swarm-mail](./packages/swarm-mail/CHANGELOG.md)** - Event sourcing primitives and database layer

## Format

Each release includes:
- **Version** with emoji indicators (🐝 new feature, 🔧 fix, 💥 breaking change)
- **Quote** from relevant technical literature (when the release has lore)
- **Summary** of key changes
- **Link** to package changelog for full details

---

## v0.32 - Coordinator Review Gate (Latest)

> _"This asynchronous back and forth between submitter and reviewer can add days to the process of getting changes made. Do Code Reviews Promptly!"_
> — Sam Newman, _Building Microservices_

**opencode-swarm-plugin@0.32.0**

Coordinators can now review worker output before approval via `swarm_review` and `swarm_review_feedback` tools. Includes a 3-strike rule - 3 rejections mark a task as blocked (signals an architectural problem, not "try harder").

Also cleaned up vestigial UBS scanning code that was already disabled in v0.31.

**swarm-mail@1.3.0 - The Great Drizzle Migration** 💥

```
┌─────────────────────────────────────────────────────┐
│                  BEFORE → AFTER                     │
├─────────────────────────────────────────────────────┤
│  PGlite (WASM Postgres)  →  libSQL (SQLite fork)   │
│  Raw SQL strings         →  Drizzle ORM            │
│  Implicit connections    →  Explicit adapters      │
│  Test flakiness          →  Deterministic tests    │
└─────────────────────────────────────────────────────┘
```

Complete database layer overhaul. PGlite → libSQL, raw SQL → Drizzle ORM. Tests now run in <100ms instead of 5s+. PGlite deprecated (kept only for migrations).

**Integration test coverage: 0% → 95%**. A bug that broke ALL swarm tools (`dbOverride required` error) couldn't recur undetected - 20 new integration tests now exercise the full tool → store → DB path.

[📖 Full v0.32 changelog](./packages/opencode-swarm-plugin/CHANGELOG.md#0320)

---

## v0.31 - Smart ID Resolution

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE: hive_close(id="opencode-swarm-monorepo-lf2p4u-mjcadqq3fb9")  │
│  AFTER:  hive_close(id="mjcadqq3fb9")                                 │
└─────────────────────────────────────────────────────────────┘
```

**opencode-swarm-plugin@0.31.0**

Git-style partial hash resolution for cell IDs. Use just the hash portion instead of the full `project-name-epoch-hash` ID. Includes smart matching (exact, prefix, suffix, substring) with helpful error messages for ambiguous matches.

**Auto-sync at key events**: `hive_create_epic`, `swarm_complete`, and `process.beforeExit` now sync cells to git automatically. Fixes race conditions where spawned workers couldn't see cells created by coordinator.

**Removed arbitrary subtask limits**: No more 10-subtask cap. The LLM decides based on task complexity.

[📖 Full v0.31 changelog](./packages/opencode-swarm-plugin/CHANGELOG.md#0310)

---

## v0.30 - The Great bd CLI Purge

**opencode-swarm-plugin@0.30.0**

The `bd` CLI is officially dead. Long live `HiveAdapter`!

- `swarm init` rewritten to use `ensureHiveDirectory()` and `getHiveAdapter()` directly (no shell-outs)
- Auto-sync removed from plugin index (users should call `hive_sync` explicitly)
- Plugin template updated with swarm detection confidence levels (HIGH/MEDIUM/LOW/NONE)
- Error handling fixed - actual error messages now propagate to agents

**opencode-swarm-plugin@0.30.3 - Semantic Memory Consolidation**

> _"Simplicity is the ultimate sophistication."_
> — Leonardo da Vinci

Semantic memory moved into swarm-mail. Includes automatic migration from legacy `~/.semantic-memory/` format, preserving all tags and timestamps.

[📖 Full v0.30 changelog](./packages/opencode-swarm-plugin/CHANGELOG.md#0300)

---

## v0.29 - Cell IDs Now Wear Their Project Colors

> _"We may fantasize about being International Men of Mystery, but our code needs to be mundane and clear. One of the most important parts of clear code is good names."_
> — Martin Fowler, _Refactoring_

**opencode-swarm-plugin@0.29.0**

Cell IDs finally know where they came from. Instead of anonymous `bd-xxx` prefixes, new cells proudly display their project name: `swarm-mail-lf2p4u-abc123`.

Reads `package.json` name field, slugifies for safe IDs, falls back to `cell-` prefix if no package.json. Backward compatible - existing `bd-*` IDs still work.

[📖 Full v0.29 changelog](./packages/opencode-swarm-plugin/CHANGELOG.md#0290)

---

## v0.26-0.28 - Daemon Mode & PGLite Safety

**swarm-mail@1.0.0 - The Daemon Awakens** 💥

PGlite is single-connection. Multiple processes = corruption. We learned this the hard way.

**Daemon mode is now the default.** First process starts an in-process `PGLiteSocketServer`, all others connect via PostgreSQL wire protocol. Multiple processes? No problem. They all talk to the same daemon.

**9x faster tests**: Shared test server pattern - tests share one PGlite instance and TRUNCATE between runs instead of creating new instances (~500ms WASM startup eliminated).

**swarm-mail@1.0.0 minor - WAL Safety: The Checkpoint That Saved the Hive**

PGlite's Write-Ahead Log nearly ate our lunch. 930 WAL files, 930MB uncommitted transactions, one WASM OOM crash → pdf-brain lost 359 documents.

New `checkpoint()`, `checkWalHealth()`, and `getWalStats()` methods. Automatic checkpoints after migrations and batch operations. Monitors WAL size with 100MB threshold.

[📖 Full daemon/WAL changelog](./packages/swarm-mail/CHANGELOG.md#100)

---

## v0.25 - Socratic Planning & Worker Survival

**opencode-swarm-plugin@0.25.0**

**Socratic Planning Phase**: Default mode asks clarifying questions before decomposition. Escape hatches for experienced users: `--fast`, `--auto`, `--confirm-only` flags.

**Worker Survival Checklist**: 9-step mandatory flow - workers now follow strict initialization sequence:
1. `swarmmail_init`
2. `semantic-memory_find`
3. `skills_use`
4. `swarmmail_reserve` (workers reserve their own files)
5. Do work
6. Auto-checkpoint at 25/50/75% milestones
7. Store learnings via `semantic-memory`
8. `swarm_complete`

[📖 Full v0.25 changelog](./packages/opencode-swarm-plugin/CHANGELOG.md#0250)

---

## v0.23-0.24 - Changesets & Publishing

**opencode-swarm-plugin@0.23.0**

Added changesets workflow with OIDC publish via GitHub Actions. Independent package versioning with semantic memory test isolation (`TEST_SEMANTIC_MEMORY_COLLECTION` env var prevents test pollution).

[📖 Full v0.23 changelog](./packages/opencode-swarm-plugin/CHANGELOG.md#0230)

---

## Earlier Releases

For releases before v0.23, see the [full opencode-swarm-plugin changelog](./packages/opencode-swarm-plugin/CHANGELOG.md).

---

## Contributing

When adding changesets, **pack them with lore**. Changesets aren't just version bumps - they're the story of the release. Pull quotes from relevant technical literature, explain WHY changes matter, include code examples, and make them scannable.

See [AGENTS.md](./AGENTS.md#publishing-changesets--bun) for the full publishing workflow.
