---
"opencode-swarm-plugin": patch
"swarm-mail": patch
---

Fix hivemind memory CLI pointing at wrong database

The `swarm memory` CLI commands (stats, find, store, etc.) were connecting to a per-project `streams.db` in `/tmp/` instead of the global `~/.config/swarm-tools/swarm.db` where all memories actually live. This caused `swarm memory stats` to show 0 and `swarm memory find` to return no results.

Also fixes libSQL `COUNT(*)` returning 0 on tables with F32_BLOB vector columns — replaced with `COUNT(id)` across all memory-touching code paths.
