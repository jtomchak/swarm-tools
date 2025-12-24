---
"opencode-swarm-plugin": patch
---

## 🐝 Coordinator Discipline: Prohibition-First Enforcement

Coordinators kept "just doing it themselves" after compaction. Now they can't.

**The Problem:**
After context compaction, coordinators would ignore their own instructions to "spawn workers for remaining subtasks" and edit files directly. The compaction context was narrative ("do this") rather than prescriptive ("NEVER do that").

**The Fix:**

### 1. Prohibition-First Compaction Context

The `SWARM_COMPACTION_CONTEXT` now leads with explicit anti-patterns:

```markdown
### ⛔ NEVER DO THESE (Coordinator Anti-Patterns)

- ❌ **NEVER** use `edit` or `write` tools - SPAWN A WORKER
- ❌ **NEVER** run tests with `bash` - SPAWN A WORKER  
- ❌ **NEVER** implement features yourself - SPAWN A WORKER
- ❌ **NEVER** "just do it myself to save time" - NO. SPAWN A WORKER.
```

### 2. Runtime Violation Detection

`detectCoordinatorViolation()` is now wired up in `tool.execute.before`:

- Detects when coordinators call `edit`, `write`, or test commands
- Emits warnings to help coordinators self-correct
- Captures VIOLATION events for post-hoc analysis

### 3. Coordinator Context Tracking

New functions track when we're in coordinator mode:

- `setCoordinatorContext()` - Activated when `hive_create_epic` or `swarm_decompose` is called
- `isInCoordinatorContext()` - Checks if we're currently coordinating
- `clearCoordinatorContext()` - Cleared when epic is closed

**Why This Matters:**

Coordinators that do implementation work burn context, create conflicts, and defeat the purpose of swarm coordination. This fix makes the anti-pattern visible and provides guardrails to prevent it.

**Validation:**
- Check `~/.config/swarm-tools/sessions/` for VIOLATION events
- Run `coordinator-behavior.eval.ts` to score coordinator discipline
