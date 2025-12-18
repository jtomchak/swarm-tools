---
"swarm-mail": patch
"opencode-swarm-plugin": patch
---

Fix cells view migration not being applied

The v7 migration (cellsViewMigration) that creates the `cells` view was added after
swarm-mail@0.3.0 was published. This caused `hive_sync` to fail with
"relation cells does not exist" because the JSONL export queries the `cells` view.

This patch ensures the v7 migration is included in the published package.
