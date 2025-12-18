# Test Status Report

## Summary
All unit tests passing for both packages after monorepo restructure.

## Testing Philosophy

### The Prime Directive: TDD Everything
All code changes MUST follow Test-Driven Development:
1. **Red** - Write a failing test first
2. **Green** - Write minimal code to make it pass  
3. **Refactor** - Clean up while tests stay green

No exceptions. If you're touching code, you're touching tests first.

### Test Speed Matters
Slow tests don't get run. Fast tests catch bugs early.

**Rules for fast tests:**
1. **Prefer in-memory databases** - Use `createInMemorySwarmMail()` over file-based PGLite
2. **Share instances when possible** - Use `beforeAll`/`afterAll` for expensive setup, not `beforeEach`/`afterEach`
3. **Don't skip tests** - If a test needs external services, mock them or make them optional with clear error messages
4. **Clean up after yourself** - But don't recreate the world for each test

**Anti-patterns to avoid:**
- Creating new database instances per test (slow, wasteful)
- `test.skip()` without a tracking issue
- Tests that pass by accident (no assertions, wrong assertions)
- Tests that only run in CI

### Test Tiers

| Tier | Suffix | Speed | Dependencies | When to Run |
|------|--------|-------|--------------|-------------|
| Unit | `.test.ts` | <100ms | None | Every save |
| Integration | `.integration.test.ts` | <5s | PGLite, filesystem | Pre-commit |
| E2E | `.e2e.test.ts` | <30s | External services | CI only |

### PGLite Testing Strategy

PGLite (embedded Postgres via WASM) is central to swarm-mail. Here's how to test with it:

```typescript
// GOOD: In-memory for unit tests (fast, isolated)
const swarmMail = await createInMemorySwarmMail("test-project");

// GOOD: Shared instance for related tests
describe("feature X", () => {
  let swarmMail: SwarmMailAdapter;
  
  beforeAll(async () => {
    swarmMail = await createInMemorySwarmMail("test");
  });
  
  afterAll(async () => {
    await swarmMail.close();
  });
  
  test("does thing A", async () => { /* uses swarmMail */ });
  test("does thing B", async () => { /* uses swarmMail */ });
});

// BAD: New instance per test (slow)
beforeEach(async () => {
  swarmMail = await createInMemorySwarmMail("test");
});
```

### Recovery Testing

When testing error recovery (like WASM abort from corrupted databases):
1. Create the corrupted state explicitly (don't rely on flaky failures)
2. Verify recovery actually works (call methods, check results)
3. Clean up in `afterAll`, not `afterEach`

## swarm-mail Package

**Test Command:** `bun test src/`

### Unit Tests ✅ ALL PASSING
- `src/pglite.test.ts` - 16 tests (path hashing, singleton, WASM recovery)
- `src/streams/events.test.ts` - 55 tests (event schemas)
- `src/streams/migrations.test.ts` - 15 tests (migration system)
- `src/hive/adapter.test.ts` - Hive adapter tests
- `src/daemon.test.ts` - Daemon lifecycle tests
- `src/socket-adapter.test.ts` - Socket adapter tests

### Integration Tests
- `src/streams/*.integration-test.ts` - Full event store flows
- `src/hive/*.integration-test.ts` - Hive with real PGLite

Integration tests use file-based PGLite. They may be slower but test real behavior.

## opencode-swarm-plugin Package

**Test Command:** `bun test src/`

### Unit Tests ✅ ALL PASSING
- `src/schemas/index.test.ts` - 14 tests (Zod schemas)
- `src/structured.test.ts` - 73 tests (structured output parsing)
- `src/skills.test.ts` - 38 tests (skills system)
- `src/anti-patterns.test.ts` - Anti-pattern detection
- `src/planning-guardrails.test.ts` - Planning validation
- `src/output-guardrails.test.ts` - Output validation

### Integration Tests
- `src/*.integration.test.ts` - Tests requiring swarm-mail

## Running Tests

```bash
# Run all tests (both packages)
bun turbo test

# Run specific package
bun turbo test --filter=swarm-mail
bun turbo test --filter=opencode-swarm-plugin

# Run specific test file
cd packages/swarm-mail && bun test src/pglite.test.ts

# Run with watch mode
cd packages/swarm-mail && bun test --watch src/

# Run only unit tests (fast)
bun test src/*.test.ts

# Run integration tests
bun test src/*.integration.test.ts
```

## Turbo Pipeline

Both packages integrated into turbo pipeline:
```bash
bun turbo test  # Runs all package tests with dependency ordering
```

Pipeline configuration in `turbo.json`:
- Depends on `^build` (builds dependencies first)
- Caches test results based on input files

## Notes
1. Integration tests may be slower - this is expected
2. Unit tests have zero external dependencies
3. Both packages use bun test runner
4. All test commands in package.json are correct and functional
5. PGLite WASM may fail in parallel test runs - tests handle this gracefully
