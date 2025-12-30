---
"opencode-swarm-plugin": minor
---

## 🧠 Hivemind Tools Now Accessible

> "The palest ink is better than the best memory." — Chinese Proverb

Wired the hivemind unified memory system through CLI and plugin wrapper, making it accessible to OpenCode agents.

**CLI Commands Added:**
```bash
swarm memory store <info> [--tags]     # Store a learning
swarm memory find <query> [--limit]    # Search memories (semantic + FTS)
swarm memory get <id>                  # Get specific memory
swarm memory remove <id>               # Delete memory
swarm memory validate <id>             # Reset 90-day decay timer
swarm memory stats                     # Database statistics
swarm memory index                     # Index AI session directories
swarm memory sync                      # Sync to .hive/memories.jsonl
```

**Plugin Wrapper Tools:**
- `hivemind_store` - Store learnings with tags
- `hivemind_find` - Search across all memories and sessions
- `hivemind_get` - Retrieve specific memory by ID
- `hivemind_remove` - Delete outdated memories
- `hivemind_validate` - Confirm accuracy (resets decay)
- `hivemind_stats` - Memory database health
- `hivemind_index` - Index session directories
- `hivemind_sync` - Git-sync memories

**To update your plugin:**
```bash
swarm setup --reinstall
```

**Why this matters:**
- Agents can now query past learnings before starting work
- Learnings persist across sessions with 90-day decay
- Semantic search finds relevant memories even with different wording
- Git-synced memories enable team knowledge sharing
