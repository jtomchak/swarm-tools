---
"opencode-swarm-plugin": patch
"swarm-mail": patch
---

## 🔍 hive_cells Now Returns All Matches for Partial IDs

> "Tune and test your metadata by comparing it with the tone, coverage, and trends of your searchers' common queries."
> — *Search Analytics for Your Site*

Previously, `hive_cells({ id: "mjonid" })` would throw an "Ambiguous ID" error when multiple cells matched. This was hostile UX for a **query tool** — users expect to see all matches, not be forced to guess more characters.

```
     ┌──────────────────────────────────────┐
     │  BEFORE: "Ambiguous ID" error 💀     │
     │                                      │
     │  > hive_cells({ id: "mjonid" })      │
     │  Error: multiple cells match         │
     │                                      │
     ├──────────────────────────────────────┤
     │  AFTER: Returns all matches 🎯       │
     │                                      │
     │  > hive_cells({ id: "mjonid" })      │
     │  [                                   │
     │    { id: "...-mjonidihuyq", ... },   │
     │    { id: "...-mjonidimchs", ... },   │
     │    { id: "...-mjonidioq28", ... },   │
     │    ...13 cells total                 │
     │  ]                                   │
     └──────────────────────────────────────┘
```

**What changed:**
- Added `findCellsByPartialId()` — returns `Cell[]` instead of throwing
- `hive_cells` now uses this for partial ID lookups
- `resolvePartialId()` still throws for tools that need exactly one cell (hive_update, hive_close, etc.)

**Why it matters:**
- Query tools should return results, not errors
- Partial ID search is now actually useful for exploration
- Consistent with how `grep` and other search tools behave
