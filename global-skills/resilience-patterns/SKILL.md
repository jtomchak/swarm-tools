---
name: resilience-patterns
description: Error recovery, retry strategies, and graceful degradation patterns. Use when handling failures, implementing retries, designing fallback strategies, or building fault-tolerant systems. Covers exponential backoff, circuit breakers, and backend fallbacks.
---

# Resilience Patterns

Error recovery, retry strategies, and graceful degradation for fault-tolerant systems.

## Core Principle

**Design for failure, not perfection.** Reduce probability of faults causing system failures by recovering gracefully, degrading functionality intelligently, and learning from patterns of failure.

## Error Classification

Classify errors before deciding recovery strategy.

### Retryable Errors (Transient)

Network and server issues that typically resolve on retry:

- Connection refused/reset (`ECONNREFUSED`, `ECONNRESET`)
- Timeouts (network, socket, aborted requests)
- Server overload (502, 503, 504 HTTP codes)
- Temporary unavailability ("unexpected error" from dependencies)

### Non-Retryable Errors (Permanent)

Logic bugs, validation failures, resource constraints:

- Authentication failures (401, 403)
- Not found errors (404)
- Validation errors (400)
- Server errors from logic bugs (500)
- Resource not found (project/agent/entity missing)

### Detection Pattern

```typescript
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("socket") ||
      message.includes("aborted")
    ) {
      return true;
    }

    // Server errors (but not 500 - usually logic bugs)
    if (error instanceof CustomError && error.code) {
      return error.code === 502 || error.code === 503 || error.code === 504;
    }

    // Recoverable unexpected errors
    if (message.includes("unexpected error")) {
      return true;
    }
  }

  return false;
}
```

## Retry Strategies

### Exponential Backoff with Jitter

Prevents thundering herd, spreads retry load.

**Formula**: `delay = min(baseDelay * 2^(attempt-1), maxDelay) ± jitter`

**Configuration**:

- `baseDelay`: Starting delay (e.g., 100ms)
- `maxDelay`: Cap on delay growth (e.g., 5000ms)
- `maxRetries`: Retry limit (e.g., 3)
- `jitterPercent`: Randomness range (e.g., 20%)

**Implementation**:

```typescript
function calculateBackoffDelay(attempt: number): number {
  if (attempt === 0) return 0;

  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (±jitterPercent%)
  const jitterRange = cappedDelay * (jitterPercent / 100);
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.round(cappedDelay + jitter);
}
```

**Example Delays** (base=100ms, max=5000ms, jitter=20%):

- Attempt 1: ~100ms ± 20ms
- Attempt 2: ~200ms ± 40ms
- Attempt 3: ~400ms ± 80ms
- Attempt 4: ~800ms ± 160ms
- Attempt 5+: ~5000ms ± 1000ms (capped)

### Retry Loop Pattern

```typescript
async function callWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Apply backoff delay (except first attempt)
    if (attempt > 0) {
      const delay = calculateBackoffDelay(attempt);
      console.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await operation();
      return result; // Success - reset failure tracking
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.warn(`Non-retryable error: ${lastError.message}`);
        throw lastError;
      }

      // Last retry exhausted
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} retries exhausted`);
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Unknown error in retry loop");
}
```

## Circuit Breaker Pattern

Stop retrying when repeated failures indicate systemic issue.

### State Machine

Track consecutive failures to decide when to stop:

```typescript
let consecutiveFailures = 0;
const failureThreshold = 3; // Circuit opens after 3 failures

// On success
consecutiveFailures = 0;

// On retryable error
consecutiveFailures++;
if (consecutiveFailures >= failureThreshold) {
  // Circuit open - attempt recovery instead of retry
  await attemptRecovery();
}
```

### Health Checks

Probe service availability before opening circuit:

```typescript
async function isServiceHealthy(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return response.ok;
  } catch {
    return false;
  }
}
```

### Recovery Actions

When circuit opens, attempt automated recovery:

```typescript
// Check health before attempting recovery
const healthy = await isServiceHealthy();
if (!healthy) {
  await restartService();
  // Reset failure counter on successful restart
  consecutiveFailures = 0;
}
```

## Graceful Degradation

Reduce functionality instead of total failure.

### Backend Fallback Pattern

Primary/secondary backend with automatic switching.

**Redis → SQLite Example**:

```typescript
async function createWithFallback(): Promise<Client> {
  const maxRetries = 3;
  const retryDelays = [100, 500, 1000]; // Exponential backoff

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const redis = new Redis(redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Don't retry internally
        lazyConnect: true,
      });

      // Test connection
      await redis.connect();
      await redis.ping();

      return new RedisClient(redis);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        // All retries exhausted - fall back to SQLite
        console.warn(
          `Redis connection failed after ${maxRetries} attempts, falling back to SQLite`,
        );
        return new SqliteClient(sqlitePath);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }
  }

  // Unreachable due to return in last attempt, but satisfies TypeScript
  return new SqliteClient(sqlitePath);
}
```

### Warn Once Pattern

Avoid log spam when degraded:

```typescript
let hasWarnedAboutFallback = false;

if (!hasWarnedAboutFallback) {
  console.warn(`Primary backend unavailable, using fallback`);
  hasWarnedAboutFallback = true;
}
```

### Feature Toggles

Disable non-essential features when degraded:

```typescript
const available = await checkPrimaryBackend();
if (!available) {
  return {
    error: "Primary backend not available",
    available: false,
    hint: "Start primary backend or continue with reduced functionality",
    fallback: "Operating in degraded mode - some features unavailable",
  };
}
```

## Server Recovery

Automated restart for unrecoverable states.

### Recovery State Machine

```typescript
let consecutiveFailures = 0;
let lastRestartAttempt = 0;
let isRestarting = false;

const RECOVERY_CONFIG = {
  failureThreshold: 1, // Restart after 1 "unexpected error"
  restartCooldownMs: 10000, // 10 second cooldown between restarts
  enabled: true, // Can disable via env var
};
```

### Restart Cooldown

Prevent restart loops:

```typescript
async function restartServer(): Promise<boolean> {
  // Prevent concurrent restarts
  if (isRestarting) {
    console.warn("Restart already in progress");
    return false;
  }

  // Respect cooldown
  const now = Date.now();
  if (now - lastRestartAttempt < RECOVERY_CONFIG.restartCooldownMs) {
    const waitSec = Math.ceil(
      (RECOVERY_CONFIG.restartCooldownMs - (now - lastRestartAttempt)) / 1000,
    );
    console.warn(`Restart cooldown active, wait ${waitSec}s`);
    return false;
  }

  isRestarting = true;
  lastRestartAttempt = now;

  try {
    // Kill existing process
    // Start new process
    // Wait for health check
    consecutiveFailures = 0;
    return true;
  } catch (error) {
    console.error("Restart failed:", error);
    return false;
  } finally {
    isRestarting = false;
  }
}
```

### Aggressive Recovery

Restart immediately on specific error patterns:

```typescript
const isUnexpectedError = errorMessage.includes("unexpected error");
if (isUnexpectedError && !restartAttempted && RECOVERY_CONFIG.enabled) {
  console.warn("Unexpected error detected, restarting server immediately...");
  restartAttempted = true;
  const restarted = await restartServer();

  if (restarted) {
    // Clear caches
    availabilityCache = null;
    consecutiveFailures = 0;

    // Small delay for server to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Don't count this as a retry attempt - retry immediately
    attempt--;
    continue;
  }
}
```

## Self-Healing Patterns

Automatic re-registration after server restarts.

### Not Found Detection

Server restart loses in-memory state:

```typescript
function isProjectNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("project") &&
      (message.includes("not found") || message.includes("does not exist"))
    );
  }
  return false;
}

function isAgentNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("agent") &&
      (message.includes("not found") || message.includes("does not exist"))
    );
  }
  return false;
}
```

### Auto-Init Wrapper

Re-register after detecting lost state:

```typescript
async function callWithAutoInit<T>(
  toolName: string,
  args: { project_key: string; agent_name?: string },
  options?: { taskDescription?: string; maxReregistrationAttempts?: number },
): Promise<T> {
  const maxAttempts = options?.maxReregistrationAttempts ?? 1;
  let reregistrationAttempts = 0;

  while (true) {
    try {
      return await call<T>(toolName, args);
    } catch (error) {
      const isProjectError = isProjectNotFoundError(error);
      const isAgentError = isAgentNotFoundError(error);

      if (!isProjectError && !isAgentError) {
        throw error; // Not recoverable
      }

      if (reregistrationAttempts >= maxAttempts) {
        console.error(`Exhausted ${maxAttempts} re-registration attempt(s)`);
        throw error;
      }

      reregistrationAttempts++;
      console.warn(
        `Detected "not found", re-registering (attempt ${reregistrationAttempts})...`,
      );

      // Re-register project first (always needed)
      await reRegisterProject(args.project_key);

      // Re-register agent if needed
      if (args.agent_name) {
        await reRegisterAgent(
          args.project_key,
          args.agent_name,
          options?.taskDescription,
        );
      }

      console.warn(`Retrying ${toolName} after re-registration...`);
      // Loop continues to retry
    }
  }
}
```

## Rate Limiting Resilience

Handle rate limit errors with informative feedback.

### Rate Limit Detection

```typescript
class RateLimitExceededError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly remaining: number,
    public readonly resetAt: number,
  ) {
    const resetDate = new Date(resetAt);
    const waitMs = Math.max(0, resetAt - Date.now());
    const waitSec = Math.ceil(waitMs / 1000);

    super(
      `Rate limit exceeded for ${endpoint}. ` +
        `${remaining} remaining. ` +
        `Retry in ${waitSec}s (at ${resetDate.toISOString()})`,
    );
    this.name = "RateLimitExceededError";
  }
}
```

### Pre-Check Pattern

Check rate limit before making request:

```typescript
async function checkRateLimit(agent: string, endpoint: string): Promise<void> {
  const result = await rateLimiter.checkLimit(agent, endpoint);
  if (!result.allowed) {
    throw new RateLimitExceededError(
      endpoint,
      result.remaining,
      result.resetAt,
    );
  }
}

// Record after successful request
await recordRateLimitedRequest(agent, endpoint);
```

## Timeout Handling

Abort long-running operations.

### AbortController Pattern

```typescript
async function callWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
```

## Context Preservation

Prevent context exhaustion from retries/errors.

### Hard Caps

Enforce limits on unbounded operations:

```typescript
const MAX_INBOX_LIMIT = 5; // HARD CAP
const limit = Math.min(args.limit || MAX_INBOX_LIMIT, MAX_INBOX_LIMIT);
```

### Prefer Summaries

Avoid fetching full content when headers suffice:

```typescript
// ALWAYS use include_bodies: false for inbox
const messages = await call<MessageHeader[]>("fetch_inbox", {
  project_key: state.projectKey,
  agent_name: state.agentName,
  limit: 5,
  include_bodies: false, // MANDATORY - never include bodies
});

// Use dedicated endpoint for single message bodies
await call("get_message", { message_id });

// Use summarization instead of fetching all messages
const summary = await call<ThreadSummary>("summarize_thread", {
  project_key: state.projectKey,
  thread_id: args.thread_id,
  include_examples: false,
});
```

## Anti-Patterns

### Avoid

- **Infinite retries** - Always set max retry limit
- **No backoff** - Immediate retries cause thundering herd
- **Retrying non-retryable errors** - Wastes time, delays failure detection
- **Silent degradation** - Always log when falling back
- **No circuit breaker** - Retrying when system is down compounds issues
- **Restart loops** - Use cooldown to prevent rapid restart cycles
- **Ignoring timeout errors** - Timeouts are retryable, handle them
- **Fixed delays** - Use exponential backoff, not fixed intervals
- **Missing jitter** - Synchronized retries create load spikes

## Configuration

Make resilience configurable via environment variables:

```typescript
const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
  baseDelayMs: parseInt(process.env.BASE_DELAY_MS || "100"),
  maxDelayMs: parseInt(process.env.MAX_DELAY_MS || "5000"),
  timeoutMs: parseInt(process.env.TIMEOUT_MS || "10000"),
  jitterPercent: 20,
};

const RECOVERY_CONFIG = {
  failureThreshold: 1,
  restartCooldownMs: 10000,
  enabled: process.env.AUTO_RESTART !== "false",
};
```

## Testing Resilience

### Fault Injection

Test error handling by simulating failures:

```typescript
// Simulate network errors
if (Math.random() < 0.3) {
  throw new Error("ECONNRESET");
}

// Simulate rate limiting
if (requestCount > limit) {
  throw new RateLimitExceededError(endpoint, 0, Date.now() + 60000);
}

// Simulate server restart (lost state)
if (simulateRestart) {
  throw new Error("Project not found");
}
```

### Reset Test State

Provide reset functions for clean test isolation:

```typescript
export function resetRecoveryState(): void {
  consecutiveFailures = 0;
  lastRestartAttempt = 0;
  isRestarting = false;
}

export function resetFallbackWarning(): void {
  hasWarnedAboutFallback = false;
}
```

## References

- Agent Mail module (`agent-mail.ts`): Retry logic, server recovery, auto-init
- Rate Limiter module (`rate-limiter.ts`): Backend fallback (Redis → SQLite)
- Storage module (`storage.ts`): Storage fallback (semantic-memory → in-memory)
- _Designing Data-Intensive Applications_ by Martin Kleppmann: Fault tolerance, exactly-once semantics
