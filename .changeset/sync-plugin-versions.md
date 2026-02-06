---
"opencode-swarm-plugin": patch
"claude-code-swarm-plugin": patch
---

fix(versions): sync all plugin.json manifests via changesets lifecycle hook

plugin.json files were never updated by changesets, causing version drift:
- opencode-swarm-plugin plugin.json stuck at 0.59.5 (package.json: 0.62.0)
- claude-code-swarm-plugin plugin.json stuck at 0.59.6 (package.json: 0.60.0)
- marketplace.json stuck at 0.57.5

**Updated `sync-plugin-versions.ts`** to sync all three manifests:
- opencode-swarm-plugin/claude-plugin/.claude-plugin/plugin.json
- claude-code-swarm-plugin/.claude-plugin/plugin.json
- .claude-plugin/marketplace.json

**Added `version` lifecycle hook** to claude-code-swarm-plugin/package.json
pointing to the shared sync script so changesets bumping either package
triggers a full sync.

> "Microservices are facilitated by the ease of containerization and the
> requisitioning of compute resources, allowing for simplified hosting,
> scaling, and management." — Building Event-Driven Microservices
