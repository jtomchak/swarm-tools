---
name: testing-strategies
description: Testing patterns for TypeScript/Bun projects with vitest. Use when writing unit tests, integration tests, or testing async/swarm operations. Covers mocking, test organization, fixtures, and testing MCP tools.
tags:
  - testing
  - vitest
  - typescript
  - integration
tools:
  - Read
  - Write
  - Bash
---

# Testing Strategies

Testing patterns for TypeScript projects using vitest. Focused on unit tests, integration tests, and testing async/distributed operations.

## Test Organization

### File Naming

**Unit tests**: `*.test.ts` alongside source

```
src/
  skills.ts
  skills.test.ts
```

**Integration tests**: `*.integration.test.ts` with separate config

```
src/
  swarm.ts
  swarm.integration.test.ts
vitest.integration.config.ts
```

### Test Structure

Use `describe` blocks for logical grouping. Nest deeply when needed.

```typescript
describe("parseFrontmatter", () => {
  it("parses valid frontmatter with all fields", () => {
    const result = parseFrontmatter(VALID_SKILL_MD);
    expect(result).not.toBeNull();
    expect(result.metadata.name).toBe("test-skill");
  });

  it("returns null for missing name value", () => {
    const result = parseFrontmatter(INVALID_FRONTMATTER_MD);
    expect(result.metadata.name).toBeNull();
  });
});
```

### Lifecycle Hooks

**beforeEach/afterEach**: Reset state between tests

```typescript
describe("discoverSkills", () => {
  beforeEach(() => {
    cleanupTestSkillsDir();
    setupTestSkillsDir();
    invalidateSkillsCache(); // Clear caches!
  });

  afterEach(() => {
    cleanupTestSkillsDir();
    invalidateSkillsCache();
  });
});
```

**beforeAll/afterAll**: Setup/teardown shared resources

```typescript
describe("swarm_status", () => {
  let beadsAvailable = false;

  beforeAll(async () => {
    beadsAvailable = await isBeadsAvailable();
  });
});
```

## Vitest Basics

### Assertions

```typescript
// Equality
expect(result).toBe(expected);
expect(result).toEqual(expected); // Deep equality for objects

// Truthiness
expect(result).toBeTruthy();
expect(result).toBeFalsy();
expect(result).toBeDefined();
expect(result).toBeNull();

// Collections
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty("key");
expect(object).toHaveProperty("key", "value");

// Strings
expect(string).toContain("substring");
expect(string).toMatch(/regex/);

// Numbers
expect(num).toBeGreaterThan(5);
expect(num).toBeGreaterThanOrEqual(5);
expect(num).toBeLessThan(10);

// Exceptions
expect(() => dangerousFn()).toThrow();
expect(() => dangerousFn()).toThrow("specific message");
```

### Conditional Tests

**Skip tests when dependencies unavailable**:

```typescript
it.skipIf(!agentMailAvailable)("reports progress to Agent Mail", async () => {
  // Test that requires Agent Mail
});
```

**Only run specific tests**:

```typescript
it.only("focus on this test", () => {
  // Only this test runs
});
```

## Test Fixtures

### Unique Temp Directories

Avoid collisions between test runs:

```typescript
const TEST_RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const TEST_DIR = join(process.cwd(), `.test-skills-${TEST_RUN_ID}`);
```

### Setup/Teardown Helpers

```typescript
function setupTestSkillsDir() {
  mkdirSync(SKILLS_DIR, { recursive: true });
  mkdirSync(join(SKILLS_DIR, "test-skill"), { recursive: true });
  writeFileSync(join(SKILLS_DIR, "test-skill", "SKILL.md"), VALID_SKILL_MD);
}

function cleanupTestSkillsDir() {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}
```

### Fixture Constants

Keep test data at top of file for reuse:

```typescript
const VALID_SKILL_MD = `---
name: test-skill
description: A test skill for unit testing
tags:
  - testing
---

# Test Skill

Content here.
`;

const MINIMAL_SKILL_MD = `---
name: minimal-skill
description: Minimal skill
---

Just the basics.
`;
```

## Mocking Patterns

### Mock External Services

```typescript
const mockContext = {
  sessionID: `test-session-${Date.now()}`,
  messageID: `test-message-${Date.now()}`,
  agent: "test-agent",
  abort: new AbortController().signal,
};
```

### Check Service Availability

```typescript
async function isAgentMailAvailable(): Promise<boolean> {
  try {
    const url = process.env.AGENT_MAIL_URL || AGENT_MAIL_URL;
    const response = await fetch(`${url}/health/liveness`);
    return response.ok;
  } catch {
    return false;
  }
}

async function isBeadsAvailable(): Promise<boolean> {
  try {
    const result = await Bun.$`bd --version`.quiet().nothrow();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}
```

### Conditional Test Execution

```typescript
describe("swarm_status (integration)", () => {
  let beadsAvailable = false;

  beforeAll(async () => {
    beadsAvailable = await isBeadsAvailable();
  });

  it.skipIf(!beadsAvailable)("returns status for epic", async () => {
    // Test logic
  });
});
```

## Testing Async Operations

### Promises

```typescript
it("generates valid decomposition prompt", async () => {
  const result = await swarm_decompose.execute(
    {
      task: "Add user authentication",
      max_subtasks: 3,
    },
    mockContext,
  );

  const parsed = JSON.parse(result);
  expect(parsed).toHaveProperty("prompt");
});
```

### Error Handling

```typescript
it("rejects invalid JSON", async () => {
  const result = await swarm_validate_decomposition.execute(
    { response: "not valid json {" },
    mockContext,
  );

  const parsed = JSON.parse(result);
  expect(parsed.valid).toBe(false);
  expect(parsed.error).toContain("Invalid JSON");
});

it("throws for non-existent epic", async () => {
  try {
    await swarm_status.execute(
      {
        epic_id: "bd-nonexistent",
        project_key: TEST_PROJECT_PATH,
      },
      mockContext,
    );
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error && "operation" in error) {
      expect((error as { operation: string }).operation).toBe("query_subtasks");
    }
  }
});
```

## Testing Zod Schemas

### Valid Cases

```typescript
it("validates a complete bead", () => {
  const bead = {
    id: "bd-abc123",
    title: "Fix the thing",
    type: "bug",
    status: "open",
    priority: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };
  expect(() => BeadSchema.parse(bead)).not.toThrow();
});
```

### Invalid Cases

```typescript
it("rejects invalid priority", () => {
  const bead = {
    id: "bd-abc123",
    title: "Fix the thing",
    type: "bug",
    status: "open",
    priority: 5, // Invalid: max is 3
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };
  expect(() => BeadSchema.parse(bead)).toThrow();
});
```

### Enum Validation

```typescript
it("accepts all valid types", () => {
  const types = ["bug", "feature", "task", "epic", "chore"];
  for (const type of types) {
    expect(() => BeadTypeSchema.parse(type)).not.toThrow();
  }
});
```

### Default Values

```typescript
it("validates minimal create args with defaults", () => {
  const args = { title: "New bead" };
  const result = BeadCreateArgsSchema.parse(args);
  expect(result.title).toBe("New bead");
  expect(result.type).toBe("task"); // default
  expect(result.priority).toBe(2); // default
});
```

## Integration Test Config

Create separate vitest config for integration tests:

```typescript
// vitest.integration.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 30000, // Integration tests may be slower
    hookTimeout: 30000,
    // Run serially to avoid race conditions
    sequence: {
      concurrent: false,
    },
  },
});
```

Run with:

```bash
vitest --config vitest.integration.config.ts
```

## Testing MCP Tools

### Tool Execute Pattern

MCP tools implement `execute(args, context)`:

```typescript
const result = await swarm_decompose.execute(
  {
    task: "Add OAuth authentication",
    max_subtasks: 3,
  },
  mockContext,
);

const parsed = JSON.parse(result);
expect(parsed).toHaveProperty("prompt");
```

### JSON Output Validation

Many tools return JSON strings:

```typescript
it("returns expected schema", async () => {
  const result = await swarm_plan_prompt.execute(
    {
      task: "Some task",
      max_subtasks: 5,
      query_cass: false,
    },
    mockContext,
  );

  const parsed = JSON.parse(result);
  expect(parsed).toHaveProperty("expected_schema", "BeadTree");
  expect(parsed).toHaveProperty("validation_note");
  expect(parsed.schema_hint).toHaveProperty("epic");
  expect(parsed.schema_hint).toHaveProperty("subtasks");
});
```

## Edge Cases

Test boundary conditions:

```typescript
describe("edge cases", () => {
  it("handles non-existent directory gracefully", async () => {
    setSkillsProjectDirectory("/non/existent/path");
    invalidateSkillsCache();

    const skills = await discoverSkills();
    expect(skills instanceof Map).toBe(true);
  });

  it("handles empty skills directory", async () => {
    mkdirSync(SKILLS_DIR, { recursive: true });
    setSkillsProjectDirectory(TEST_DIR);
    invalidateSkillsCache();

    const skills = await discoverSkills();
    expect(skills instanceof Map).toBe(true);
  });

  it("returns null for empty name", async () => {
    const skill = await getSkill("");
    expect(skill).toBeNull();
  });
});
```

## End-to-End Tests

Full workflow tests combining multiple operations:

```typescript
it("creates epic, reports progress, completes subtask", async () => {
  // 1. Setup
  await mcpCall("ensure_project", { human_key: uniqueProjectKey });
  const agent = await mcpCall("register_agent", {
    project_key: uniqueProjectKey,
    program: "opencode-test",
    model: "test",
  });

  // 2. Create epic
  const epicResult = await Bun.$`bd create "Feature" -t epic --json`.quiet();
  const epic = JSON.parse(epicResult.stdout.toString());

  // 3. Report progress
  await swarm_progress.execute(
    {
      project_key: uniqueProjectKey,
      agent_name: agent.name,
      bead_id: subtask.id,
      status: "in_progress",
    },
    ctx,
  );

  // 4. Complete
  const result = await swarm_complete.execute(
    {
      project_key: uniqueProjectKey,
      agent_name: agent.name,
      bead_id: subtask.id,
      summary: "Done",
    },
    ctx,
  );

  expect(result.success).toBe(true);
});
```

## Common Patterns

### Test Data Validation

```typescript
it("includes confidence score and reasoning", async () => {
  const result = await swarm_select_strategy.execute(
    { task: "Implement dashboard" },
    mockContext,
  );
  const parsed = JSON.parse(result);

  expect(parsed).toHaveProperty("strategy");
  expect(parsed).toHaveProperty("confidence");
  expect(typeof parsed.confidence).toBe("number");
  expect(parsed.confidence).toBeGreaterThanOrEqual(0);
  expect(parsed.confidence).toBeLessThanOrEqual(1);
});
```

### Array/Collection Testing

```typescript
it("includes alternatives with scores", async () => {
  const result = await swarm_select_strategy.execute(
    { task: "Build module" },
    mockContext,
  );
  const parsed = JSON.parse(result);

  expect(parsed.alternatives).toBeInstanceOf(Array);
  expect(parsed.alternatives.length).toBe(2);

  for (const alt of parsed.alternatives) {
    expect(alt).toHaveProperty("strategy");
    expect(alt).toHaveProperty("score");
    expect(typeof alt.score).toBe("number");
  }
});
```

### String Content Testing

```typescript
it("includes context in prompt when provided", async () => {
  const result = await swarm_decompose.execute(
    {
      task: "Refactor API",
      context: "Using Next.js App Router",
    },
    mockContext,
  );

  const parsed = JSON.parse(result);
  expect(parsed.prompt).toContain("Next.js App Router");
  expect(parsed.prompt).toContain("Additional Context");
});
```
