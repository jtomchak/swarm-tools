---
"opencode-swarm-plugin": minor
---

## 🔬 Research Phase: Docs Before Decomposition

Swarm coordinators now gather documentation BEFORE breaking down tasks. No more workers fumbling through outdated API assumptions.

**What's New:**

- **swarm/researcher agent** - READ-ONLY doc gatherer that discovers tools, reads lockfiles, fetches version-specific docs, and stores findings in semantic-memory
- **Pre-decomposition research** - Coordinator analyzes task → identifies tech stack → spawns researchers → injects findings into shared_context
- **On-demand research for workers** - Workers can spawn researchers when hitting unknowns mid-task
- **`--check-upgrades` flag** - Compare installed vs latest versions from npm registry

**New Tools:**

| Tool | Purpose |
|------|---------|
| `swarm_discover_tools` | Runtime discovery of available doc tools (MCP, CLI, skills) |
| `swarm_get_versions` | Parse lockfiles (npm/pnpm/yarn/bun) for installed versions |
| `swarm_spawn_researcher` | Generate researcher prompt for Task tool |
| `swarm_research_phase` | Manual trigger for research orchestration |

**Architecture:**

```
Coordinator receives task
    ↓
runResearchPhase(task, projectPath)
    ↓
  extractTechStack() → identify technologies
  discoverDocTools() → find available tools  
  getInstalledVersions() → read lockfiles
  Spawn researchers (parallel)
  Collect summaries → shared_context
    ↓
Normal decomposition with enriched context
```

**Why This Matters:**

Workers now start with version-specific documentation instead of hallucinating APIs. Researchers store detailed findings in semantic-memory, so future agents don't repeat the research.
