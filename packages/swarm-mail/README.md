# swarm-mail

```
                                _.------._
                               .'   .--.   '.        🐝
                              /   .'    '.   \    🐝
                             |   /   __   \   |      🐝
       🐝                    |  |   (  )   |  |  🐝
            🐝    _  _       |  |   |__|   |  |
                 ( \/ )       \  '.      .'  /    🐝
       🐝    ____/    \____    '.  '----'  .'
           /    \    /    \     '-._____.-'           🐝
          /  ()  \  /  ()  \
         |   /\   ||   /\   |     ███████╗██╗    ██╗ █████╗ ██████╗ ███╗   ███╗
         |  /__\  ||  /__\  |     ██╔════╝██║    ██║██╔══██╗██╔══██╗████╗ ████║
          \      /  \      /      ███████╗██║ █╗ ██║███████║██████╔╝██╔████╔██║
       🐝  '----'    '----'       ╚════██║██║███╗██║██╔══██║██╔══██╗██║╚██╔╝██║
                                  ███████║╚███╔███╔╝██║  ██║██║  ██║██║ ╚═╝ ██║
             🐝                   ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
                    🐝
       🐝                         ███╗   ███╗ █████╗ ██╗██╗
                                  ████╗ ████║██╔══██╗██║██║         🐝
            🐝                    ██╔████╔██║███████║██║██║
                                  ██║╚██╔╝██║██╔══██║██║██║    🐝
       🐝        🐝               ██║ ╚═╝ ██║██║  ██║██║███████╗
                                  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝       🐝
                 🐝
                             ⚡ Event Sourcing + Actor Model Primitives ⚡
```

Event sourcing and actor-model primitives for multi-agent coordination. Built on **libSQL** (embedded SQLite) with **Drizzle ORM**. Local-first, no external servers.

**[🌐 swarmtools.ai](https://swarmtools.ai)** | **[📖 Full Documentation](https://swarmtools.ai/docs)**

## What is swarm-mail?

A TypeScript library providing:

1. **Event Store** - Append-only log with automatic projection updates (agents, messages, file reservations)
2. **Actor Primitives** - DurableMailbox, DurableLock, DurableCursor, DurableDeferred (Effect-TS based)
3. **Hive** - Git-synced work item tracker (cells, epics, dependencies)
4. **Semantic Memory** - Vector embeddings for persistent agent learnings (Ollama + pgvector)

```
┌─────────────────────────────────────────────────────────────┐
│                     SWARM MAIL STACK                        │
├─────────────────────────────────────────────────────────────┤
│  COORDINATION                                               │
│  ├── HiveAdapter - Work item tracking (cells, epics)       │
│  └── ask<Req, Res>() - Request/Response (RPC-style)        │
│                                                             │
│  PATTERNS                                                   │
│  ├── DurableMailbox - Actor inbox with typed envelopes     │
│  └── DurableLock - CAS-based mutual exclusion              │
│                                                             │
│  PRIMITIVES                                                 │
│  ├── DurableCursor - Checkpointed stream reader            │
│  └── DurableDeferred - Distributed promise                 │
│                                                             │
│  MEMORY                                                     │
│  └── Semantic Memory - Vector embeddings (pgvector/Ollama) │
│                                                             │
│  STORAGE                                                    │
│  └── libSQL (Embedded SQLite via Drizzle ORM)              │
└─────────────────────────────────────────────────────────────┘
```

## Install

```bash
bun add swarm-mail
```

## Quick Start

```typescript
import { getSwarmMailLibSQL } from "swarm-mail";

// Create swarm mail instance (libSQL + Drizzle)
const swarmMail = await getSwarmMailLibSQL("/my/project");

// Append events
await swarmMail.appendEvent({
  type: "agent_registered",
  agent_name: "WorkerA",
  task_description: "Implementing auth",
  timestamp: Date.now(),
});

// Query projections
const agents = await swarmMail.getAgents();
const messages = await swarmMail.getInbox("WorkerA", { limit: 5 });

// Clean shutdown
await swarmMail.close();
```

## Core APIs

### Event Store

Append-only event log with automatic projection updates:

```typescript
import { getSwarmMailLibSQL } from "swarm-mail";

const swarmMail = await getSwarmMailLibSQL("/my/project");

// Append events
await swarmMail.appendEvent({
  type: "message_sent",
  from: "WorkerA",
  to: ["WorkerB"],
  subject: "Task complete",
  body: "Auth flow implemented",
  timestamp: Date.now(),
});

// Query inbox
const messages = await swarmMail.getInbox("WorkerB", { 
  limit: 5,
  unreadOnly: true 
});

// Get thread
const thread = await swarmMail.getThread("epic-123");

// Check file reservations
const conflicts = await swarmMail.checkConflicts([
  "src/auth.ts"
], "WorkerA");
```

### Hive (Work Item Tracker)

Git-synced work item tracking with cells and epics:

```typescript
import { createHiveAdapter } from "swarm-mail";

const hive = await createHiveAdapter({ 
  projectPath: "/my/project" 
});

// Create cell
const cell = await hive.createCell({
  title: "Add OAuth",
  type: "feature",
  priority: 2,
});

// Query cells
const open = await hive.queryCells({ status: "open" });
const ready = await hive.queryCells({ ready: true });

// Update cell
await hive.updateCell(cell.id, { 
  status: "in_progress",
  description: "Implementing Google OAuth flow"
});

// Close cell
await hive.closeCell(cell.id, "Completed: OAuth implemented");
```

### Semantic Memory

Vector embeddings for persistent agent learnings:

```typescript
import { createSemanticMemory } from "swarm-mail";

const memory = await createSemanticMemory("/my/project");

// Store a learning
const { id } = await memory.store(
  "OAuth refresh tokens need 5min buffer before expiry to avoid race conditions",
  { tags: "auth,tokens,debugging" }
);

// Search by meaning (vector similarity)
const results = await memory.find("token refresh issues", { limit: 5 });

// Get memory by ID
const mem = await memory.get(id);

// Validate (resets decay timer)
await memory.validate(id);

// Check Ollama health
const health = await memory.checkHealth();
// { ollama: true, model: "mxbai-embed-large" }
```

> **Note:** Requires [Ollama](https://ollama.ai/) for vector embeddings. Falls back to full-text search if unavailable.
>
> ```bash
> ollama pull mxbai-embed-large
> ```

### Custom Database Setup

Bring your own libSQL database:

```typescript
import { createLibSQLAdapter } from "swarm-mail";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

// Create libSQL client
const client = createClient({
  url: "file:///my/custom/path/swarm.db"
});

const db = drizzle(client);

// Create adapter
const swarmMail = createLibSQLAdapter(db, "/my/project");

// Use as normal
await swarmMail.appendEvent({
  type: "agent_registered",
  agent_name: "CustomAgent",
  timestamp: Date.now(),
});
```

## Event Types

```typescript
type SwarmMailEvent =
  | { type: "agent_registered"; agent_name: string; task_description?: string }
  | {
      type: "message_sent";
      from: string;
      to: string[];
      subject: string;
      body: string;
      thread_id?: string;
    }
  | { type: "message_read"; message_id: number; agent_name: string }
  | {
      type: "file_reserved";
      agent_name: string;
      paths: string[];
      exclusive: boolean;
      reason?: string;
    }
  | { type: "file_released"; agent_name: string; paths: string[] }
  | {
      type: "swarm_checkpointed";
      epic_id: string;
      progress: number;
      state: object;
    }
  | { type: "decomposition_generated"; epic_id: string; subtasks: object[] }
  | {
      type: "subtask_outcome";
      bead_id: string;
      success: boolean;
      duration_ms: number;
    };
```

## Projections

Materialized views automatically updated from events:

| Projection          | Description                        |
| ------------------- | ---------------------------------- |
| `agents`            | Active agents per project          |
| `messages`          | Agent inbox/outbox with recipients |
| `file_reservations` | Current file locks with TTL        |
| `swarm_contexts`    | Checkpoint state for recovery      |
| `eval_records`      | Outcome data for learning          |

## Testing

For tests, use in-memory instances:

```typescript
import { createInMemorySwarmMail } from "swarm-mail";

describe("my feature", () => {
  let swarmMail: SwarmMailAdapter;

  beforeAll(async () => {
    swarmMail = await createInMemorySwarmMail("test");
  });

  afterAll(async () => {
    await swarmMail.close();
  });

  test("appends events", async () => {
    const result = await swarmMail.appendEvent({
      type: "agent_registered",
      agent_name: "TestAgent",
      timestamp: Date.now(),
    });
    
    expect(result.id).toBeGreaterThan(0);
  });
});
```

## Architecture

- **Event Sourcing** - Append-only log, projections are derived
- **Local-first** - libSQL embedded SQLite, no external servers
- **Type-safe** - TypeScript with Zod validation and Drizzle ORM
- **Effect-TS** - Composable, testable actor primitives
- **Git-synced** - Hive cells stored as JSON + git for team coordination

## Migration from v0.31

If you're migrating from PGLite-based swarm-mail:

```typescript
// OLD (v0.31)
import { getSwarmMail } from "swarm-mail";
const swarmMail = await getSwarmMail("/my/project");

// NEW (v0.32+)
import { getSwarmMailLibSQL } from "swarm-mail";
const swarmMail = await getSwarmMailLibSQL("/my/project");
```

**Key changes:**
- Storage backend: PGLite → libSQL (SQLite-compatible)
- ORM: Raw SQL → Drizzle ORM
- Main export: `getSwarmMailLibSQL` (was `getSwarmMail`)
- Semantic memory: Embedded (was standalone MCP server)

See [CHANGELOG.md](./CHANGELOG.md) for full migration guide.

## API Reference

For complete API documentation, see [swarmtools.ai/docs](https://swarmtools.ai/docs).

### SwarmMailAdapter

```typescript
interface SwarmMailAdapter {
  // Events
  appendEvent(event: SwarmMailEvent): Promise<{ id: number; sequence: number }>;
  getEvents(options?: {
    limit?: number;
    after?: number;
  }): Promise<StoredEvent[]>;

  // Agents
  getAgents(): Promise<Agent[]>;
  getAgent(name: string): Promise<Agent | null>;

  // Messages
  getInbox(agent: string, options?: InboxOptions): Promise<Message[]>;
  getMessage(id: number): Promise<Message | null>;
  getThread(threadId: string): Promise<Message[]>;

  // Reservations
  getReservations(): Promise<Reservation[]>;
  getReservationsForAgent(agent: string): Promise<Reservation[]>;
  checkConflicts(paths: string[], excludeAgent?: string): Promise<Conflict[]>;

  // Swarm Context
  getSwarmContext(epicId: string): Promise<SwarmContext | null>;

  // Debug
  debugEvents(options?: DebugOptions): Promise<DebugEvent[]>;
  debugAgent(name: string): Promise<AgentDebugInfo>;
}
```

## Resources

- **Documentation:** [swarmtools.ai/docs](https://swarmtools.ai/docs)
- **Architecture:** [SWARM-CONTEXT.md](../../SWARM-CONTEXT.md)
- **Examples:** [examples/](../../examples/)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)

## License

MIT
