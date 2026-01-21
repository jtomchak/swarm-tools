# Swarm: Language-Agnostic Architecture and Process Guide

This document describes how the Swarm system works at a protocol and architecture level. It is intentionally language-agnostic so you can implement a compatible system in Ruby (or any other language). The details are derived from the current Swarm implementation in this repository.

The goals of the system are:
- Break large tasks into parallel subtasks with clear ownership
- Prevent edit conflicts (reservations or worktrees)
- Coordinate multiple agents with durable messaging and event sourcing
- Preserve state across context compaction or session loss
- Learn from outcomes and improve future decompositions

---

## 1. Terminology and Core Concepts

- Swarm: The overall multi-agent coordination process.
- Coordinator: The orchestrator agent. Decomposes work and spawns workers. Never edits files.
- Worker: A sub-agent that implements a specific subtask within a defined scope.
- Researcher: A sub-agent that fetches external information and summarizes it.
- Hive: Git-backed work tracking system with epics and cells.
- Cell: A single work item (task, bug, feature, chore). Cells can be nested (epic -> child subtasks).
- Swarm Mail: Event-sourced coordination layer (messages, reservations, checkpoints, outcomes).
- Hivemind: Unified memory system (learnings + session history + semantic search).
- Skills: Reusable instruction bundles loaded on demand.
- Compaction: Context compression event in the host LLM environment; Swarm must resume cleanly.

Legacy naming note:
- Some APIs still use `bead_id` to refer to a cell ID for backward compatibility. A Ruby port can surface `cell_id` internally but should remain compatible with `bead_id` in external protocols.

Naming rules are important: use the Hive metaphor consistently (Hive, Cell, Swarm, Swarm Mail).

---

## 2. High-Level Architecture

Swarm is built as a set of cooperating subsystems. These are independent but share a common event store.

```
                    +-------------------------+
                    |       Coordinator       |
                    |  (decompose, spawn,     |
                    |   monitor, review)      |
                    +-----------+-------------+
                                |
                 +--------------+------------------+
                 |                                 |
        +--------v--------+               +--------v--------+
        |     Worker A    |               |     Worker B    |
        | (reserved files)|               | (reserved files)|
        +--------+--------+               +--------+--------+
                 |                                 |
                 +-------------+-------------------+
                               |
                     +---------v---------+
                     |     Swarm Mail    |
                     | (events, messages,
                     |  reservations,     |
                     |  checkpoints)      |
                     +---------+---------+
                               |
                     +---------v---------+
                     |       Hive         |
                     | (cells, epics,     |
                     |  status, history)  |
                     +---------+---------+
                               |
                     +---------v---------+
                     |     Hivemind      |
                     | (memory + search) |
                     +-------------------+
```

Key architectural properties:
- Event sourcing is the source of truth (events are immutable, projections are derived)
- Hive is both a database projection and a git-synced JSONL export
- Coordination is durable: all state is recoverable by replaying events
- Coordinator is intentionally constrained to enforce proper delegation

---

## 3. Storage Model (Critical)

### 3.1 Single Global Database

All Swarm data lives in a single global libSQL database:

- `~/.config/swarm-tools/swarm.db`

Do not create per-project databases. In tests only, use in-memory databases.

If you implement this in Ruby, treat the global DB as the authoritative state for:
- Events
- Messages
- Reservations and locks
- Memory and embeddings
- Session indexes

### 3.2 Hive JSONL (Git Sync)

Hive also mirrors its state to `.hive/` as JSONL for git syncing. This is separate from the event store.

- `.hive/issues.jsonl` (cells)
- `.hive/memories.jsonl` (memory sync)

The JSONL format mirrors the canonical cell fields. It is used for offline and cross-project sync.

### 3.3 Event Sourcing

All operational state is stored as events. Projections are rebuilt by folding over events.

Benefits:
- Audit trail
- Deterministic recovery
- Learning data for analytics
- Reliable resumption after compaction

---

## 4. Roles and Guardrails

### 4.1 Coordinator

The coordinator orchestrates. It never implements. This is enforced at runtime.

Coordinator responsibilities:
- Decompose the task into independent subtasks
- Create epics and subtask cells
- Spawn workers and (optionally) researchers
- Monitor progress and inbox
- Review completed work
- Close the epic when all subtasks are complete

Coordinator constraints:
- Must not edit or write files
- Must not reserve files
- Must not run tests
- Must not fetch external docs directly (spawn researcher)

### 4.2 Worker

The worker implements a subtask. It owns its reserved files.

Worker responsibilities:
- Initialize Swarm Mail
- Query Hivemind before coding
- Load relevant skills
- Reserve files
- Perform work using TDD (red -> green -> refactor)
- Report progress at milestones
- Store learnings in Hivemind if needed
- Call swarm_complete when done

### 4.3 Researcher

Researcher is a worker subtype that only gathers external information.

Responsibilities:
- Fetch docs or external sources
- Summarize into a clear, actionable response
- Return findings to coordinator via Swarm Mail

---

## 5. Tool Taxonomy (API Surface)

The Swarm tool API is organized into namespaces. A Ruby implementation should preserve these names and semantics.

### 5.1 Hive tools (task tracking)

- `hive_create` / `hive_create_epic`
- `hive_query`
- `hive_update`
- `hive_close`
- `hive_cells`
- `hive_sync`

These operate against the Hive adapter (not a CLI). The hive adapter should use the global DB and JSONL export.

### 5.2 Swarm tools (coordination)

- `swarm_init` (check tool availability, skill discovery)
- `swarm_decompose`
- `swarm_validate_decomposition`
- `swarm_delegate_planning` (planner subagent)
- `swarm_spawn_subtask`
- `swarm_spawn_researcher`
- `swarm_status`
- `swarm_progress`
- `swarm_checkpoint`
- `swarm_complete`
- `swarm_broadcast`

### 5.3 Swarm Mail tools (event-sourced coordination)

- `swarmmail_init`
- `swarmmail_send`
- `swarmmail_inbox`, `swarmmail_read_message`, `swarmmail_ack`
- `swarmmail_reserve` / `swarmmail_release`
- `swarmmail_release_all` (coordinator override only)

### 5.4 Hivemind tools (memory)

- `hivemind_store`
- `hivemind_find`
- `hivemind_get`
- `hivemind_remove`
- `hivemind_validate`
- `hivemind_stats`
- `hivemind_index`
- `hivemind_sync`

### 5.5 Skills tools

- `skills_list`
- `skills_use`
- `skills_create`
- `skills_remove`

Skills are markdown documents with YAML frontmatter and are discovered at:
- `.opencode/skills/`
- `.claude/skills/`
- `skills/`

Always-on guidance:
- The system injects an always-on guidance skill for coordinator and worker roles.
- This guidance enforces tool priority order, role constraints, and model-specific behavior.

### 5.6 Review tools

- `swarm_review`
- `swarm_review_feedback`

Review is a gate. Workers cannot finalize completion until review is approved.

### 5.7 Observability and analytics

- `swarm_export_*`
- `swarm_query_*`
- analytics queries (duration, lock contention, strategy success)

---

## 6. Swarm Lifecycle (End-to-End)

### Phase 0: Initialization

- Coordinator verifies tool availability (`swarm_init`)
- Sets working directory for Hive/Swarm Mail
- Prepares to load skills

### Phase 1: Optional Research

If technology is unfamiliar:
- Coordinator spawns a researcher (`swarm_spawn_researcher`)
- Researcher gathers data and returns a summary
- Coordinator stores learnings in Hivemind if valuable

### Phase 2: Decomposition

Coordinator uses one of:
- `swarm_decompose` (direct decomposition)
- `swarm_delegate_planning` (delegate to a planner agent)

The decomposition must:
- Produce independent subtasks
- Assign files with no overlap
- Specify dependencies
- Estimate complexity

Output schema (CellTree):

```json
{
  "epic": { "title": "...", "description": "..." },
  "subtasks": [
    {
      "title": "...",
      "description": "...",
      "files": ["..."],
      "dependencies": [0, 2],
      "estimated_complexity": 1
    }
  ]
}
```

The response is validated by `swarm_validate_decomposition`:
- File conflicts (same file in two subtasks) are rejected
- Dependency indices must be valid
- Instruction conflicts are detected (positive/negative directive heuristics)

### Phase 3: Hive Creation

Coordinator creates an epic cell and child cells:
- `hive_create_epic`
- `hive_create` for each subtask

Each subtask cell is marked `in_progress` only when the worker starts.

### Phase 4: Spawn Workers

For each subtask, coordinator calls `swarm_spawn_subtask` which returns:
- The generated prompt
- Recommended model
- Post-completion instructions for the coordinator

Coordinator then calls Task with that prompt to launch the worker.

### Phase 5: Worker Execution (Strict Workflow)

Workers follow a strict checklist (abbreviated):

1. `swarmmail_init` to register with Swarm Mail
2. `hivemind_find` to query past learnings
3. `skills_list` and `skills_use` to load relevant skills
4. `swarmmail_reserve` to lock files
5. Implement with TDD (red -> green -> refactor)
6. Report progress via `swarm_progress` at 25%, 50%, 75%
7. `swarm_checkpoint` before risky operations
8. `hivemind_store` for notable learnings
9. `swarm_complete` for finalization

### Phase 6: Review Gate

Coordinator must review each completed subtask:

1. `swarm_review` generates a review prompt with:
   - Epic goal
   - Task requirements
   - Dependency context
   - Downstream dependencies
   - Diff of changed files
2. Coordinator submits feedback using `swarm_review_feedback`:
   - approved
   - needs_changes (with issues list)

The system enforces a maximum of 3 review attempts. After 3 failures, the task is blocked.

### Phase 7: Completion and Learning

`swarm_complete` performs:
- Review gate check
- Verification gate (typecheck + tests) unless skipped
- Contract validation: files_touched must be subset of assigned files
- Hive cell closure
- Reservation release
- Outcome event emission
- Learning signal capture

### Phase 8: Swarm Finalization

When all subtasks are complete:
- Epic is closed
- Swarm outcome is recorded
- Hivemind is updated with any new learnings

---

## 7. Prompt Templates (Key Structures)

A Ruby implementation should replicate the semantics and placeholders, even if phrasing changes.

### 7.1 Decomposition Prompt (Core Requirements)

Key elements:
- Explicit instructions to create a cell per subtask
- JSON output schema
- File assignment with no overlap
- Dependency ordering
- Aggressive decomposition

Template skeleton:

```
You are decomposing a task into parallelizable subtasks.

Task: {task}
Context: {context}

Requirements:
- Parallelizable subtasks
- Explicit file lists
- No overlap
- Dependencies in order
- Complexity 1-5

Respond with JSON:
{ epic: {...}, subtasks: [...] }
```

### 7.2 Subtask Prompt (Worker V2)

Key structure (abridged):

```
[IDENTITY]
Agent: (assigned)
Cell: {cell_id}
Epic: {epic_id}

[TASK]
{subtask_description}

[FILES]
Reserved: {file_list}

[CONTEXT]
{shared_context}
{compressed_context}
{error_context}

[MANDATORY SURVIVAL CHECKLIST]
1. swarmmail_init
2. hivemind_find
3. skills_list + skills_use
4. swarmmail_reserve
5. TDD red->green->refactor
6. swarm_progress at milestones
7. swarm_checkpoint before risky changes
8. hivemind_store (if learned)
9. swarm_complete
```

Workers also receive a machine-readable contract:

```json
{
  "contract": {
    "task_id": "...",
    "files_owned": ["..."],
    "files_readonly": [],
    "dependencies_completed": [],
    "success_criteria": ["...", "..."]
  },
  "context": {
    "epic_summary": "...",
    "your_role": "..."
  },
  "escalation": {
    "blocked_contact": "coordinator",
    "scope_change_protocol": "..."
  }
}
```

### 7.3 Review Prompt

Review prompt includes:
- Epic goal
- Task requirements
- Completed dependencies
- Downstream dependencies
- File diff
- Review checklist

The review output is structured JSON:

```json
{
  "status": "approved" | "needs_changes",
  "summary": "...",
  "issues": [{"file": "...", "line": 12, "issue": "..."}]
}
```

### 7.4 Compaction Context Injection

On compaction, the coordinator receives a strict resume guide:
- Reasserts coordinator role
- Lists forbidden tools
- Provides resume checklist
- Provides a canonical summary format for swarm state

This ensures continuity even after severe context loss.

---

## 8. Model Selection for Workers

The coordinator selects a model per subtask when calling `swarm_spawn_subtask`.

Current heuristics:
- If a subtask explicitly specifies a model, use it.
- If all files are docs (`.md`, `.mdx`) or tests (`.test.`, `.spec.`), use a lite model.
- Otherwise, use the primary model.

You can preserve the same heuristic in Ruby or replace it with a cost/latency-aware selector.

## 9. Conflict Prevention and Scope Control

### 9.1 File Reservations

Workers acquire exclusive reservations for their file list via Swarm Mail:
- Reservations emit `file_reserved` events
- TTL defaults to 1 hour
- Conflicts emit `file_conflict` events
- Reservations are released on completion

### 9.2 Worktree Isolation (Optional)

An alternative to reservations is git worktree isolation:
- Each worker uses a separate worktree at the same base commit
- Changes are cherry-picked back into main

This avoids direct file conflicts at the cost of additional merge work.

### 9.3 Contract Validation

At completion time, the system validates that:
- `files_touched` is a subset of `files_owned`
- Violations are recorded as negative learning signals

---

## 10. Learning and Feedback System

Swarm learns from outcomes using implicit signals:
- Duration
- Error count
- Retry count
- Scope violations

Key concepts:
- Feedback events (helpful, harmful, neutral)
- Confidence decay over time (default half-life: 90 days)
- Anti-pattern detection (if a pattern fails too often)
- Three-strike escalation for repeated task failure (mark blocked and surface to a human)

Signals are stored as events (e.g., `subtask_outcome`) and can be used to adjust decomposition strategy over time.

---

## 11. Compaction and Recovery

Compaction is inevitable in long sessions. Swarm preserves state by:

1. Scanning session tool calls for swarm signatures
2. Folding tool events into a deterministic swarm projection
3. Injecting a specialized compaction context that:
   - Reasserts coordinator role
   - Lists active epic and subtasks
   - Provides next actions

The guiding philosophy is "err on the side of continuation": false positives are cheaper than losing swarm state.

---

## 12. Event Types (Core List)

Your Ruby implementation should model these event categories. Not all fields are shown, but the types matter.

Agent events:
- agent_registered
- agent_active

Messaging:
- message_sent
- message_read
- message_acked
- thread_created
- thread_activity

Reservations:
- file_reserved
- file_released
- file_conflict

Tasks:
- task_started
- task_progress
- task_completed
- task_blocked

Decomposition and outcomes:
- decomposition_generated
- subtask_outcome
- human_feedback

Swarm lifecycle:
- swarm_started
- worker_spawned
- worker_completed
- review_started
- review_completed
- swarm_completed

Checkpoints and compaction:
- swarm_checkpointed
- swarm_recovered
- checkpoint_created
- context_compacted

Hive:
- cell_created
- cell_updated
- cell_status_changed
- cell_closed
- epic_created
- hive_synced

Memory:
- memory_stored
- memory_found
- memory_updated
- memory_validated
- memory_deleted

CASS (session search):
- cass_searched
- cass_viewed
- cass_indexed

Skills:
- skill_loaded
- skill_created

---

## 13. Data Models (Suggested Schemas)

### 12.1 Cell

Fields used by Hive:
- id, project_key, type, status
- title, description, priority
- parent_id (for epic relationships)
- assignee, created_by
- created_at, updated_at, closed_at
- closed_reason

### 12.2 Reservation

Fields used by Swarm Mail:
- reservation_id
- agent_name
- paths (array)
- exclusive (boolean)
- ttl_seconds
- expires_at
- epic_id, cell_id

### 12.3 Message

Fields:
- message_id
- from_agent, to_agents
- subject, body
- thread_id
- importance
- ack_required

---

## 14. Implementation Blueprint for Ruby

A Ruby implementation should provide the following modules:

1. Event Store
   - Append-only events table
   - Ordered by sequence and timestamp
   - ReadEvents filters by project + type

2. Swarm Mail
   - Messaging (inbox, read, ack)
   - Reservations (lock + release)
   - Checkpoints
   - Durable deferred signaling for task completion

3. Hive
   - Cell CRUD
   - Epic creation
   - JSONL export/import for git sync

4. Hivemind
   - Semantic memory store
   - Embedding support or FTS fallback
   - Session indexing (optional but recommended)

5. Coordinator Logic
   - Decomposition prompt
   - Spawn flow
   - Review gating
   - Compaction handling

6. Worker Runtime
   - Standard prompt + checklist
   - Progress reporting
   - Completion with verification

7. Observability
   - Logs for compaction, reservations, completion
   - Analytics queries (latency, lock contention, failures)

8. Safety Guardrails
   - Coordinator guard (disallow edits, tests, reservations)
   - Contract validation for file scope

---

## 15. Non-Obvious Constraints and Gotchas

- Global DB only: do not use local per-project DBs.
- Tests must use in-memory DBs (no file-based test DBs).
- COUNT(*) on vector tables may return 0 due to libSQL vector extension; use COUNT(id).
- Workers must call swarmmail_init before any other tool.
- Coordinator must never edit or reserve files; enforce at runtime.
- Review is a hard gate (up to 3 attempts).
- If compaction occurs mid-swarm, rebuild state from events rather than hive projection.

---

## 16. Minimal End-to-End Example (Pseudo Flow)

```
Coordinator:
  swarm_init()
  hivemind_find("task keywords")
  swarm_decompose(task)
  swarm_validate_decomposition(response)
  hive_create_epic(...)
  swarm_spawn_subtask(...)
  Task(subagent_type="swarm-worker", prompt=...)
  ... repeat for each subtask ...
  swarm_status()
  swarm_review(...)
  swarm_review_feedback(...)
  hive_close(epic)

Worker:
  swarmmail_init(project_path, task_description)
  hivemind_find("task keywords")
  skills_list(); skills_use(...)
  swarmmail_reserve(paths)
  (TDD work)
  swarm_progress(25/50/75)
  swarm_complete(...)
```

---

## 17. What to Preserve When Re-Implementing in Ruby

If you only port a subset, preserve these invariants:

1. Event sourcing is authoritative; projections are derived.
2. Cells are the unit of work; every subtask maps to a cell.
3. Coordinators orchestrate only; workers implement only.
4. File ownership is enforced by reservations or worktrees.
5. Swarm must survive compaction through event-based recovery.
6. Learning signals are recorded even if you do not use them yet.

These invariants are the backbone of Swarm, independent of language.

---

## 18. Suggested File/Module Structure for a Ruby Port

```
lib/
  swarm/
    coordinator.rb
    worker.rb
    prompts.rb
    review.rb
    compaction.rb
  hive/
    adapter.rb
    jsonl.rb
  swarm_mail/
    events.rb
    store.rb
    messaging.rb
    reservations.rb
    checkpoints.rb
  hivemind/
    memory.rb
    search.rb
  skills/
    loader.rb
    skill.rb
  observability/
    analytics.rb
    logs.rb
```

---

If you want, I can also draft a Ruby-specific interface skeleton and SQL schema based on this guide.
