---
name: mcp-tool-authoring
description: Building MCP (Model Context Protocol) tools for OpenCode plugins. Use when creating new tools, defining tool schemas, handling tool arguments, or extending the swarm plugin. Covers schema definition, context passing, error handling, and tool registration.
tags: [mcp, opencode, plugins, api-design, tool-development]
---

# MCP Tool Authoring

Build type-safe MCP tools for OpenCode plugins using the `@opencode-ai/plugin` SDK.

## Tool Definition Pattern

Define tools with `tool()` helper from `@opencode-ai/plugin`:

```typescript
import { tool } from "@opencode-ai/plugin";

export const my_tool = tool({
  description: "Clear, concise description (one sentence, action-focused)",
  args: {
    required_arg: tool.schema.string().describe("What this arg does"),
    optional_arg: tool.schema.number().optional().describe("Optional arg"),
  },
  async execute(args, ctx) {
    // Implementation
    return "Success message or JSON output";
  },
});
```

**Key rules:**

- Description: Imperative form, under 120 chars. Start with verb.
- Args: Use `tool.schema` for validation (Zod-like API)
- Execute: Return string or JSON-serializable value
- Context (`ctx`): Contains `sessionID`, `messageID`, `agent` for state tracking

## Schema Definition

Use `tool.schema` for type-safe argument validation:

### Primitives

```typescript
tool.schema.string(); // string
tool.schema.number(); // number
tool.schema.boolean(); // boolean
```

### Constraints

```typescript
tool.schema.string().min(1); // non-empty string
tool.schema.number().min(0).max(10); // range validation
tool.schema.number().int(); // integer only
tool.schema.enum(["a", "b", "c"]); // enum values
```

### Complex Types

```typescript
// Array
tool.schema.array(tool.schema.string());

// Object
tool.schema.object({
  name: tool.schema.string(),
  age: tool.schema.number().optional(),
});

// Nested
tool.schema.array(
  tool.schema.object({
    title: tool.schema.string(),
    priority: tool.schema.number().min(0).max(3),
  }),
);
```

### Optional Arguments

```typescript
args: {
  required: tool.schema.string().describe("Must provide"),
  optional: tool.schema.string().optional().describe("Can omit"),
}
```

## Context Passing

Every tool receives `ctx` with session metadata:

```typescript
interface ToolContext {
  sessionID: string;    // Unique session identifier
  messageID: string;    // Current message ID
  agent: string;        // Agent name (e.g., "Claude Code")
}

async execute(args, ctx) {
  const { sessionID, messageID, agent } = ctx;

  // Use sessionID for state persistence across tool calls
  // Use messageID for tracing/logging
  // Use agent for multi-agent coordination
}
```

### Session State Pattern

Store state keyed by `sessionID` for multi-call workflows:

```typescript
const sessionStates = new Map<string, SessionState>();

function requireState(sessionID: string): SessionState {
  const state = sessionStates.get(sessionID);
  if (!state) {
    throw new Error("Not initialized - call init first");
  }
  return state;
}

export const init_tool = tool({
  args: {
    /* ... */
  },
  async execute(args, ctx) {
    const state = {
      /* ... */
    };
    sessionStates.set(ctx.sessionID, state);
    return "Initialized";
  },
});

export const action_tool = tool({
  args: {
    /* ... */
  },
  async execute(args, ctx) {
    const state = requireState(ctx.sessionID);
    // Use state
  },
});
```

### Persistent State (CLI Bridge)

For CLI-based tools, persist state to disk:

```typescript
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const STATE_DIR = join(tmpdir(), "my-plugin-sessions");

function loadState(sessionID: string): State | null {
  const path = join(STATE_DIR, `${sessionID}.json`);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf-8"));
  }
  return null;
}

function saveState(sessionID: string, state: State): void {
  mkdirSync(STATE_DIR, { recursive: true });
  const path = join(STATE_DIR, `${sessionID}.json`);
  writeFileSync(path, JSON.stringify(state, null, 2));
}
```

## Error Handling

Return errors as strings vs throwing for different behaviors:

### Throw for Hard Failures

Agent sees error, cannot continue with invalid result:

```typescript
async execute(args, ctx) {
  if (!args.required_field) {
    throw new Error("Missing required_field");
  }

  const result = await riskyOperation();
  if (!result) {
    throw new Error("Operation failed - cannot proceed");
  }

  return result;
}
```

### Return for Graceful Degradation

Agent gets error message but can decide how to handle:

```typescript
async execute(args, ctx) {
  try {
    return await preferredMethod();
  } catch (error) {
    // Return fallback instead of throwing
    return JSON.stringify({
      available: false,
      error: error.message,
      fallback: "Use alternative approach",
    });
  }
}
```

### Custom Error Classes

Type-safe errors with metadata:

```typescript
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "ToolError";
    Object.setPrototypeOf(this, ToolError.prototype);
  }
}

async execute(args, ctx) {
  if (invalid) {
    throw new ToolError("Invalid input", 400, { field: "name" });
  }
}
```

## Tool Registration

Export tools in plugin hooks:

```typescript
import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin";
import { my_tool, another_tool } from "./tools";

export const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  return {
    tool: {
      my_tool,
      another_tool,
    },
  };
};

export default MyPlugin;
```

### Namespace Pattern

Group related tools:

```typescript
import { beadsTools } from "./beads";
import { swarmTools } from "./swarm";

export const SwarmPlugin: Plugin = async (input) => {
  return {
    tool: {
      ...beadsTools, // beads_create, beads_query, etc.
      ...swarmTools, // swarm_decompose, swarm_status, etc.
    },
  };
};
```

### Tool Lifecycle Hooks

Execute code before/after tool calls:

```typescript
export const MyPlugin: Plugin = async (input) => {
  return {
    tool: {
      /* tools */
    },

    // After tool execution
    "tool.execute.after": async (input, output) => {
      const toolName = input.tool;

      if (toolName === "close_task") {
        // Auto-cleanup
        await runCleanup();
      }

      if (toolName === "init") {
        // Track state
        trackInitialization(output.output);
      }
    },

    // Session lifecycle
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // Release resources
        await cleanup();
      }
    },
  };
};
```

## CLI Bridge Pattern

Delegate execution to external CLI (common for complex tools):

```typescript
import { spawn } from "child_process";

async function execCLI(
  command: string,
  args: string[],
  ctx: ToolContext,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        TOOL_SESSION_ID: ctx.sessionID,
        TOOL_MESSAGE_ID: ctx.messageID,
        TOOL_AGENT: ctx.agent,
      },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data;
    });
    proc.stderr.on("data", (data) => {
      stderr += data;
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Exit ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

export const cli_tool = tool({
  description: "Execute via CLI",
  args: {
    arg: tool.schema.string(),
  },
  async execute(args, ctx) {
    const output = await execCLI("my-cli", ["--arg", args.arg], ctx);
    return output;
  },
});
```

### JSON Communication

For structured CLI responses:

```typescript
async execute(args, ctx) {
  const cliArgs = ["tool", "name", "--json", JSON.stringify(args)];
  const output = await execCLI("my-cli", cliArgs, ctx);

  try {
    const result = JSON.parse(output);
    if (result.success) {
      return JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(result.error || "CLI failed");
    }
  } catch {
    // Not JSON - return raw
    return output;
  }
}
```

## Testing Tools

Test tools outside OpenCode runtime:

```typescript
import { describe, it, expect } from "vitest";
import { my_tool } from "./my-tool";

describe("my_tool", () => {
  it("validates required args", async () => {
    const ctx = {
      sessionID: "test-session",
      messageID: "test-msg",
      agent: "test-agent",
    };

    await expect(
      my_tool.execute(
        {
          /* missing required */
        },
        ctx,
      ),
    ).rejects.toThrow();
  });

  it("returns success for valid input", async () => {
    const ctx = { sessionID: "test", messageID: "msg", agent: "agent" };
    const result = await my_tool.execute({ arg: "value" }, ctx);

    expect(result).toContain("Success");
  });
});
```

### Mock Context

Reusable test context:

```typescript
function mockContext(overrides?: Partial<ToolContext>): ToolContext {
  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "test-agent",
    ...overrides,
  };
}

it("uses session state", async () => {
  const ctx = mockContext({ sessionID: "unique-session" });
  await init_tool.execute(
    {
      /* ... */
    },
    ctx,
  );
  const result = await action_tool.execute(
    {
      /* ... */
    },
    ctx,
  );
  expect(result).toBeDefined();
});
```

## Best Practices

### Descriptions

```typescript
// ✅ Good: Action-focused, under 120 chars
"Create a new bead with type-safe validation";
"Query beads with filters (replaces bd list, bd ready, bd wip)";

// ❌ Bad: Vague, too long
"This tool helps you to create beads in the system";
"Query the beads database using various filtering mechanisms...";
```

### Arguments

```typescript
// ✅ Good: Descriptive, type-constrained
{
  title: tool.schema.string().min(1).describe("Bead title"),
  priority: tool.schema.number().min(0).max(3).optional().describe("Priority 0-3"),
}

// ❌ Bad: No validation, unclear
{
  title: tool.schema.string(),
  priority: tool.schema.number(),
}
```

### Return Values

```typescript
// ✅ Good: Consistent JSON for structured data
return JSON.stringify({ id: "bd-123", status: "open" }, null, 2);

// ✅ Good: Human-readable for simple operations
return "Created bead bd-123";

// ❌ Bad: Inconsistent format
return Math.random() > 0.5 ? { id: "bd-123" } : "Created";
```

### Error Messages

```typescript
// ✅ Good: Actionable, specific
throw new Error("Agent Mail not initialized. Call agentmail_init first.");
throw new ToolError("Invalid priority: must be 0-3", 400, {
  value: args.priority,
});

// ❌ Bad: Vague, no context
throw new Error("Failed");
throw new Error("Error");
```

## Common Patterns

### Validation Before Execution

```typescript
import { z } from "zod";

const ArgsSchema = z.object({
  id: z.string().min(1),
  priority: z.number().min(0).max(3).optional(),
});

async execute(args, ctx) {
  const validated = ArgsSchema.parse(args);
  // Type-safe: validated.id is string, validated.priority is number | undefined
}
```

### Rate Limiting

```typescript
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

async execute(args, ctx) {
  const limit = rateLimiter.get(ctx.sessionID);
  const now = Date.now();

  if (limit && limit.resetAt > now) {
    if (limit.count >= 100) {
      throw new Error(`Rate limit exceeded. Retry after ${new Date(limit.resetAt)}`);
    }
    limit.count++;
  } else {
    rateLimiter.set(ctx.sessionID, {
      count: 1,
      resetAt: now + 60_000, // 1 minute
    });
  }

  // Execute
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

async execute(args, ctx) {
  return await withRetry(() => riskyOperation(args));
}
```

### Graceful Degradation

```typescript
async execute(args, ctx) {
  // Try preferred method
  const available = await checkDependency();

  if (!available) {
    // Return fallback info instead of failing
    return JSON.stringify({
      available: false,
      error: "Dependency not running",
      fallback: "Install with: npm install -g dependency",
    });
  }

  // Normal execution
  const result = await callDependency(args);
  return JSON.stringify({ available: true, result });
}
```

## Anti-Patterns

### ❌ Overloaded Tools

Don't combine unrelated actions in one tool:

```typescript
// BAD: Does too much
const manage_item = tool({
  args: {
    action: tool.schema.enum(["create", "update", "delete", "list"]),
    // ...
  },
});

// GOOD: Separate tools
const create_item = tool({
  /* ... */
});
const update_item = tool({
  /* ... */
});
const delete_item = tool({
  /* ... */
});
```

### ❌ Hidden State

Don't rely on module-level state without sessionID:

```typescript
// BAD: Shared across sessions
let currentUser: string;

export const set_user = tool({
  async execute(args) {
    currentUser = args.name; // Leaks between sessions!
  },
});

// GOOD: Session-keyed state
const sessions = new Map<string, { user: string }>();

export const set_user = tool({
  async execute(args, ctx) {
    sessions.set(ctx.sessionID, { user: args.name });
  },
});
```

### ❌ Swallowing Errors

Don't hide errors from the agent:

```typescript
// BAD: Silent failure
async execute(args, ctx) {
  try {
    return await criticalOperation();
  } catch {
    return "Done"; // Lies!
  }
}

// GOOD: Explicit error or fallback
async execute(args, ctx) {
  try {
    return await criticalOperation();
  } catch (error) {
    throw new Error(`Critical operation failed: ${error.message}`);
  }
}
```

## Related

- OpenCode Plugin SDK: `@opencode-ai/plugin`
- Zod validation: [github.com/colinhacks/zod](https://github.com/colinhacks/zod)
- MCP spec: [modelcontextprotocol.io](https://modelcontextprotocol.io)
