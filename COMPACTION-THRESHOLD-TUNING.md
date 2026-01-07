# Compaction Threshold Tuning

## Problem Statement

Research findings showed surprisingly low compaction event counts:
- `detection_complete`: 4 events
- `context_injected`: 3 events

Either sessions were too short, or compaction wasn't triggering when it should. Since our compaction hook is **REACTIVE** (called BY OpenCode when compaction happens), we can't control WHEN compaction occurs, but we can:

1. Make our DETECTION more sensitive (lower thresholds)
2. Add INSTRUMENTATION to expose when compaction would be beneficial

## Threshold Changes

### 1. Agent Registration (LOWERED)

**Before:** 1 registered agent = LOW confidence (message count required)
**After:** 1 registered agent = MEDIUM confidence

**Rationale:** Single agent registration indicates coordinator setup. This is swarm initialization, not noise.

**Code:**
```typescript
// TUNED: Single agent registration = medium confidence (coordinator setup)
if (health.stats.agents > 0) {
  mediumConfidence = true;
  reasons.push(`${health.stats.agents} registered agents`);
}
```

### 2. Recent Activity Window (NARROWED)

**Before:** 1 hour window for "recent" cell updates
**After:** 30 minute window

**Rationale:** Active swarm sessions have tight coordination loops. 1 hour is too wide - we were missing active work within the session.

**Code:**
```typescript
// MEDIUM: Recently updated cells (TUNED: 30min window, was 1 hour)
const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
const recentCells = cells.filter((c) => c.updated_at > thirtyMinutesAgo);
if (recentCells.length > 0) {
  mediumConfidence = true;
  reasons.push(`${recentCells.length} cells updated in last 30 minutes`);
}
```

### 3. Session Tool Call Boosting (NEW)

**Before:** Relied on hive state, ignored session evidence
**After:** Tool calls in session boost confidence even with empty hive

**Boosts:**
- `swarmmail_init` detected → MEDIUM confidence (coordinator initializing)
- `hive_create_epic` detected → MEDIUM confidence (epic created, before subtasks)
- `swarm_spawn_subtask` detected → HIGH confidence (workers spawned)

**Rationale:** Session messages are ground truth. If the session shows swarm tool calls, it's a swarm session regardless of current hive state.

**Code:**
```typescript
// TUNED: Boost from agent name (swarmmail_init) = medium confidence
if (scannedState.agentName && effectiveConfidence === "none") {
  effectiveConfidence = "medium";
  detection.reasons.push("coordinator initialized (swarmmail_init)");
}

// TUNED: Boost from epic creation = medium confidence (before subtasks exist)
if (scannedState.epicId && effectiveConfidence === "none") {
  effectiveConfidence = "medium";
  detection.reasons.push("epic created (hive_create_epic)");
}
```

### 4. Compaction Recommendation Metrics (NEW)

**What:** Log when compaction SHOULD happen based on swarm activity signals

**Thresholds:**
- 3+ open subtasks → compaction recommended
- 2+ active reservations → compaction recommended
- 2+ registered agents → compaction recommended

**Use Case:** This data can be used to tune OpenCode's compaction thresholds externally.

**Code:**
```typescript
const compactionSignals: string[] = [];
let compactionRecommended = false;

if (openSubtasksCount >= 3) {
  compactionSignals.push(`${openSubtasksCount} open subtasks`);
  compactionRecommended = true;
}
if (activeReservationsCount >= 2) {
  compactionSignals.push(`${activeReservationsCount} active reservations`);
  compactionRecommended = true;
}
if (registeredAgentsCount >= 2) {
  compactionSignals.push(`${registeredAgentsCount} registered agents`);
  compactionRecommended = true;
}

if (compactionRecommended) {
  log.info(
    {
      compaction_recommended: true,
      reasons: compactionSignals,
      open_subtasks: openSubtasksCount,
      active_reservations: activeReservationsCount,
      registered_agents: registeredAgentsCount,
    },
    "compaction recommended",
  );
}
```

**Output Example:**
```json
{
  "level": "info",
  "module": "compaction",
  "compaction_recommended": true,
  "reasons": ["3 active reservations", "2 registered agents"],
  "open_subtasks": 0,
  "active_reservations": 3,
  "registered_agents": 2,
  "msg": "compaction recommended"
}
```

## Test Coverage

All threshold changes are TDD-verified:

**New tests:** `src/compaction-threshold.test.ts` (8 tests)
- Single open subtask detection
- Single agent registration detection
- 30-minute activity window
- Session tool call boosting (swarmmail_init, hive_create_epic, swarm_spawn_subtask)
- Compaction recommendation metrics

**Existing tests:** `src/zz-compaction-hook.test.ts` (50 tests)
- All pass - no regressions

## Impact

**Expected outcome:** Higher compaction event capture rates.

**Before tuning:** Waiting for multiple subtasks, 1-hour windows, ignoring early coordinator activity
**After tuning:** Detect single subtask, 30-min windows, boost from session evidence

**Monitoring:** Check `~/.config/swarm-tools/logs/compaction.1log` for:
- Increased `"compaction recommended": true` logs
- More `"context_injected": true` completions
- Earlier detection (medium confidence from swarmmail_init/hive_create_epic)

## Future Work

Our compaction hook is REACTIVE - we can't control WHEN OpenCode triggers compaction. If we want PROACTIVE compaction:

**Option 1:** OpenCode plugin API enhancement
- Expose `requestCompaction()` function to plugins
- Allow plugins to trigger compaction based on custom logic

**Option 2:** External instrumentation
- Use `compaction_recommended` logs to build external tooling
- Alert when swarm sessions exceed thresholds without compaction
- Feed data back to OpenCode team for default threshold tuning

**Option 3:** Session middleware
- Intercept tool calls at the plugin level
- Count swarm tool calls, maintain session state
- Recommend compaction via user-visible notice

## Related Files

- `packages/opencode-swarm-plugin/src/compaction-hook.ts` - Detection logic
- `packages/opencode-swarm-plugin/src/compaction-threshold.test.ts` - Threshold tests
- `packages/opencode-swarm-plugin/src/zz-compaction-hook.test.ts` - Existing tests
- `packages/opencode-swarm-plugin/src/compaction-observability.ts` - Metrics collection

## References

- Research cell: `mjp7za3jtvn` (Tune compaction thresholds)
- Epic: `mk471w7luln` (Swarm Analytics Deep Dive & Improvements)
