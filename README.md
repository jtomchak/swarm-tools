# opencode-swarm-plugin

[![npm version](https://img.shields.io/npm/v/opencode-swarm-plugin.svg)](https://www.npmjs.com/package/opencode-swarm-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe multi-agent coordination for OpenCode with beads integration and Agent Mail.

## Overview

This plugin provides structured, validated tools for multi-agent workflows in OpenCode:

- **Type-safe beads operations** - Zod-validated wrappers around the `bd` CLI with proper error handling
- **Agent Mail integration** - File reservations, async messaging, and thread coordination between agents
- **Structured outputs** - Reliable JSON responses with schema validation and retry support
- **Swarm primitives** - Task decomposition, status tracking, and parallel agent coordination

## Installation

```bash
bun add opencode-swarm-plugin
```

Add to your `opencode.jsonc`:

```json
{
  "plugins": ["opencode-swarm-plugin"]
}
```

## Prerequisites

| Requirement      | Purpose                                     |
| ---------------- | ------------------------------------------- |
| OpenCode 1.0+    | Plugin host                                 |
| Agent Mail MCP   | Multi-agent coordination (`localhost:8765`) |
| Beads CLI (`bd`) | Git-backed issue tracking                   |

### Verify Agent Mail is running

```bash
curl http://127.0.0.1:8765/health/liveness
```

### Verify beads is installed

```bash
bd --version
```

## Tools Reference

### Beads Tools

| Tool                | Description                                                         |
| ------------------- | ------------------------------------------------------------------- |
| `beads:create`      | Create a new bead with type-safe validation                         |
| `beads:create_epic` | Create epic with subtasks in one atomic operation                   |
| `beads:query`       | Query beads with filters (replaces `bd list`, `bd ready`, `bd wip`) |
| `beads:update`      | Update bead status/description/priority                             |
| `beads:close`       | Close a bead with reason                                            |
| `beads:start`       | Mark bead as in-progress (shortcut)                                 |
| `beads:ready`       | Get next ready bead (unblocked, highest priority)                   |
| `beads:sync`        | Sync beads to git and push (MANDATORY at session end)               |
| `beads:link_thread` | Link bead to Agent Mail thread                                      |

### Agent Mail Tools

| Tool                          | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `agent-mail:init`             | Initialize session (ensure project + register agent) |
| `agent-mail:send`             | Send message to other agents                         |
| `agent-mail:inbox`            | Fetch inbox (CONTEXT-SAFE: bodies excluded, limit 5) |
| `agent-mail:read_message`     | Fetch ONE message body by ID                         |
| `agent-mail:summarize_thread` | Summarize thread (PREFERRED over fetching all)       |
| `agent-mail:reserve`          | Reserve file paths for exclusive editing             |
| `agent-mail:release`          | Release file reservations                            |
| `agent-mail:ack`              | Acknowledge a message                                |
| `agent-mail:search`           | Search messages (FTS5 syntax)                        |
| `agent-mail:health`           | Check if Agent Mail server is running                |

### Schemas (for structured outputs)

The plugin exports Zod schemas for validated agent responses:

| Schema                    | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `TaskDecompositionSchema` | Decompose task into parallelizable subtasks |
| `EvaluationSchema`        | Agent self-evaluation of completed work     |
| `SwarmStatusSchema`       | Swarm progress tracking                     |
| `SwarmSpawnResultSchema`  | Result of spawning agent swarm              |
| `BeadSchema`              | Validated bead data                         |
| `EpicCreateResultSchema`  | Atomic epic creation result                 |

## Usage Examples

### Basic Bead Creation

```typescript
// Create a bug report with priority
await tools["beads:create"]({
  title: "Fix login redirect loop",
  type: "bug",
  priority: 1,
  description: "Users stuck in redirect after OAuth callback",
});
```

### Atomic Epic with Subtasks

```typescript
// Create epic and all subtasks atomically (with rollback hints on failure)
const result = await tools["beads:create_epic"]({
  epic_title: "Implement user dashboard",
  epic_description: "New dashboard with metrics and activity feed",
  subtasks: [
    {
      title: "Create dashboard layout",
      priority: 2,
      files: ["src/components/Dashboard.tsx"],
    },
    {
      title: "Add metrics API endpoint",
      priority: 2,
      files: ["src/api/metrics.ts"],
    },
    {
      title: "Build activity feed component",
      priority: 3,
      files: ["src/components/ActivityFeed.tsx"],
    },
  ],
});
```

### Agent Mail Coordination

```typescript
// 1. Initialize session
await tools["agent-mail:init"]({
  project_path: "/Users/you/project",
  task_description: "Working on auth refactor",
});
// Returns: { agent: { name: "BlueLake", ... } }

// 2. Reserve files before editing
await tools["agent-mail:reserve"]({
  paths: ["src/auth/**", "src/middleware/auth.ts"],
  reason: "bd-abc123: Auth refactor",
  ttl_seconds: 3600,
});

// 3. Check inbox (bodies excluded by default)
const messages = await tools["agent-mail:inbox"]({ limit: 5 });

// 4. Send status update to other agents
await tools["agent-mail:send"]({
  to: ["RedStone", "GreenCastle"],
  subject: "Auth refactor complete",
  body: "Finished updating the auth middleware. Ready for review.",
  thread_id: "bd-abc123",
});

// 5. Release reservations when done
await tools["agent-mail:release"]({});
```

### Swarm Workflow

```typescript
// 1. Create epic for the work
const epic = await tools["beads:create_epic"]({
  epic_title: "Add export feature",
  subtasks: [
    { title: "Export to CSV", files: ["src/export/csv.ts"] },
    { title: "Export to JSON", files: ["src/export/json.ts"] },
    { title: "Export to PDF", files: ["src/export/pdf.ts"] },
  ],
});

// 2. Each parallel agent reserves its files
// Agent 1 (BlueLake):
await tools["agent-mail:reserve"]({
  paths: ["src/export/csv.ts"],
  reason: `${epic.subtasks[0].id}: Export to CSV`,
});

// 3. Agents communicate via thread
await tools["agent-mail:send"]({
  to: ["Coordinator"],
  subject: "CSV export complete",
  body: "Implemented CSV export with streaming support.",
  thread_id: epic.epic.id,
});

// 4. Coordinator uses summarize_thread (not fetch all)
const summary = await tools["agent-mail:summarize_thread"]({
  thread_id: epic.epic.id,
  include_examples: true,
});
```

## Context Preservation

**CRITICAL**: This plugin enforces context-safe defaults to prevent session exhaustion.

### Why These Constraints Exist

| Constraint           | Default                      | Reason                                             |
| -------------------- | ---------------------------- | -------------------------------------------------- |
| Inbox limit          | 5 messages                   | Fetching 20+ messages with bodies exhausts context |
| Bodies excluded      | `include_bodies: false`      | Message bodies can be huge; fetch individually     |
| Summarize over fetch | `summarize_thread` preferred | Get key points, not raw message dump               |

### The Pattern

```typescript
// WRONG: This can dump thousands of tokens into context
const messages = await tools["agent-mail:inbox"]({
  limit: 20,
  include_bodies: true, // Plugin prevents this
});

// RIGHT: Headers only, then fetch specific messages
const headers = await tools["agent-mail:inbox"]({ limit: 5 });
const importantMessage = await tools["agent-mail:read_message"]({
  message_id: headers[0].id,
});

// BEST: Summarize threads instead of fetching all messages
const summary = await tools["agent-mail:summarize_thread"]({
  thread_id: "bd-abc123",
});
```

### Hard Caps

The plugin enforces these limits regardless of input:

- `agent-mail:inbox` - Max 5 messages, bodies always excluded
- Thread summaries use LLM mode for concise output
- File reservations auto-track for cleanup

## Integration with /swarm Command

This plugin provides the primitives used by OpenCode's `/swarm` command:

```
/swarm "Add user authentication with OAuth providers"
```

The `/swarm` command uses this plugin to:

1. **Decompose** - Break task into subtasks using `TaskDecompositionSchema`
2. **Create beads** - Use `beads:create_epic` for atomic issue creation
3. **Initialize agents** - Each agent calls `agent-mail:init`
4. **Reserve files** - Prevent conflicts with `agent-mail:reserve`
5. **Coordinate** - Agents communicate via `agent-mail:send`
6. **Track status** - Use `SwarmStatusSchema` for progress
7. **Evaluate** - Validate work with `EvaluationSchema`
8. **Cleanup** - Release reservations and sync beads

## Error Handling

The plugin provides typed errors for robust error handling:

```typescript
import {
  BeadError,
  BeadValidationError,
  AgentMailError,
  AgentMailNotInitializedError,
  FileReservationConflictError,
} from "opencode-swarm-plugin";

try {
  await tools["agent-mail:reserve"]({ paths: ["src/index.ts"] });
} catch (error) {
  if (error instanceof FileReservationConflictError) {
    console.log("Conflicts:", error.conflicts);
    // [{ path: "src/index.ts", holders: ["RedStone"] }]
  }
}
```

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Run tests
bun test

# Build for distribution
bun run build

# Clean build artifacts
bun run clean
```

## License

MIT
