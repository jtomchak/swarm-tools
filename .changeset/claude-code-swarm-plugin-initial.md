---
"claude-code-swarm-plugin": minor
---

## Initial Release: Claude Code Swarm Plugin

Lightweight Claude Code plugin that delegates to the globally installed `swarm` CLI.

**Why a separate package:**
- The main `opencode-swarm-plugin` bundles native dependencies (`@libsql/client`) that cause issues when Claude Code copies plugins to its cache
- This thin wrapper (~600KB) shells out to the CLI, avoiding native module problems

**Includes:**
- MCP server with 25 tools (hive, hivemind, swarmmail, swarm orchestration)
- Slash commands: `/swarm`, `/hive`, `/inbox`, `/status`, `/handoff`
- Skills: `always-on-guidance`, `swarm-coordination`
- Agents: `coordinator`, `worker`, `background-worker`
- Lifecycle hooks for session management

**Prerequisites:**
Install the swarm CLI globally: `npm install -g opencode-swarm-plugin`
