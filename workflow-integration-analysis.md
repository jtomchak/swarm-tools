# Workflow Integration & Branch Management Analysis

**From: obra/superpowers**  
**Analyzed: using-git-worktrees, finishing-a-development-branch, executing-plans**  
**Date: 2025-12-13**

---

## Core Principles

1. **Systematic directory selection = reliable isolation**
   - Priority: existing > CLAUDE.md > ask user
   - Never assume, never hardcode

2. **Safety verification prevents repository pollution**
   - .gitignore check is NON-NEGOTIABLE for project-local worktrees
   - "Fix broken things immediately" - add to .gitignore + commit before proceeding

3. **Clean baseline establishes known-good state**
   - Run tests after worktree creation, before any implementation
   - "Can't distinguish new bugs from pre-existing issues" without this

4. **Batch execution with checkpoints enables human oversight**
   - Default: first 3 tasks, then report
   - Architect reviews between batches, not micromanaging individual tasks

5. **Structured options eliminate ambiguity**
   - Present exactly 4 options (merge/PR/keep/discard)
   - No open-ended "what should I do?" questions

6. **Typed confirmation for destructive actions**
   - Require exact string "discard" to delete work
   - Show what will be permanently lost

7. **Stop and ask beats guessing**
   - Blockers, unclear instructions, repeated failures = STOP
   - Clarification > forcing through

8. **Worktree lifecycle matches branch lifecycle**
   - Create worktree → work → cleanup worktree
   - Exception: keep worktree for PR option (may need it)

---

## Full Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FULL DEVELOPMENT CYCLE                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  BRAINSTORMING  │  Socratic refinement → design document
└────────┬────────┘
         │ Design approved? ──[NO]──> iterate
         │ [YES]
         ▼
┌─────────────────────────────────────┐
│      USING-GIT-WORKTREES            │
├─────────────────────────────────────┤
│ 1. Directory Selection:             │
│    ├─ .worktrees/ exists? ──[YES]─> use it
│    ├─ worktrees/ exists? ──[YES]──> use it
│    ├─ CLAUDE.md preference? ──[YES]─> use it
│    └─ [NO to all] ──> ask user      │
│                                     │
│ 2. Safety Verification:             │
│    └─ If project-local:             │
│       └─ grep .gitignore ──[NOT FOUND]──> add + commit
│                                     │
│ 3. Create Worktree:                 │
│    └─ git worktree add <path> -b <branch>
│                                     │
│ 4. Project Setup:                   │
│    └─ Auto-detect (npm/cargo/pip/go)│
│    └─ Run install/build             │
│                                     │
│ 5. Verify Clean Baseline:           │
│    └─ Run tests ──[FAIL]──> report + ask
│                   [PASS]──> proceed │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────────┐
│ WRITING-PLANS   │ ───> │ Plan Document:       │
└────────┬────────┘      │ - Bite-sized tasks   │
         │               │ - Exact file paths   │
         │               │ - Complete code      │
         │               │ - Verification steps │
         │               └──────────────────────┘
         ▼
    ┌─────────────────────┐
    │  EXECUTION CHOICE   │
    └─────────┬───────────┘
         ┌────┴────┐
         │         │
    [BATCH]   [CONTINUOUS]
         │         │
         ▼         ▼
┌─────────────────┐  ┌────────────────────────┐
│ EXECUTING-PLANS │  │ SUBAGENT-DRIVEN-DEV   │
├─────────────────┤  ├────────────────────────┤
│ Loop:           │  │ Loop:                  │
│ 1. Execute 3    │  │ 1. Dispatch subagent   │
│ 2. Report       │  │ 2. Review code         │
│ 3. Wait feedback│  │ 3. Fix if needed       │
│ 4. Next batch   │  │ 4. Next task           │
│                 │  │                        │
│ Stop when:      │  │ Same session, faster   │
│ - Blocker       │  │ iteration              │
│ - Tests fail    │  │                        │
│ - Unclear       │  └────────┬───────────────┘
└────────┬────────┘           │
         │                    │
         └──────────┬─────────┘
                    │ All tasks complete
                    ▼
┌──────────────────────────────────────────┐
│    FINISHING-A-DEVELOPMENT-BRANCH        │
├──────────────────────────────────────────┤
│ 1. Verify Tests:                         │
│    └─ Run test suite ──[FAIL]──> STOP    │
│                        [PASS]──> continue│
│                                          │
│ 2. Determine Base Branch:                │
│    └─ git merge-base HEAD main           │
│                                          │
│ 3. Present Options:                      │
│    ┌─ 1. Merge back to main locally     │
│    ├─ 2. Push and create Pull Request   │
│    ├─ 3. Keep the branch as-is          │
│    └─ 4. Discard this work              │
│                                          │
│ 4. Execute Choice:                       │
│    ┌─────┬──────┬────────┬──────────┐   │
│    │     │      │        │          │   │
│   [1]   [2]    [3]      [4]         │   │
│    │     │      │        │          │   │
│    ▼     ▼      ▼        ▼          │   │
│  Merge  Push   Keep   Confirm      │   │
│   +     +      worktree  ↓         │   │
│  Delete Push     │    "discard"    │   │
│  branch  +       │       ↓         │   │
│   +    Keep      │    Delete       │   │
│ Remove worktree  │    branch       │   │
│ worktree  │      │       +         │   │
│    │      │      │    Remove       │   │
│    │      │      │    worktree     │   │
│    └──────┴──────┴───────┘         │   │
│                                    │   │
│ 5. Report Status                   │   │
└────────────────────────────────────┘   │
         │                                │
         ▼                                │
    ┌─────────┐                          │
    │  DONE   │                          │
    └─────────┘                          │
```

---

## Git Worktree Best Practices

### Directory Selection Priority

**1. Check existing directories first:**

```bash
ls -d .worktrees 2>/dev/null     # Preferred (hidden, project-local)
ls -d worktrees 2>/dev/null      # Alternative
```

**If both exist:** `.worktrees` wins (hidden preference)

**2. Check CLAUDE.md for preferences:**

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference found:** Use it without asking

**3. Ask user if neither:**

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

### Safety Verification (MANDATORY for project-local)

**The .gitignore check is NON-NEGOTIABLE:**

```bash
# Check if directory pattern in .gitignore
grep -q "^\.worktrees/$" .gitignore || grep -q "^worktrees/$" .gitignore
```

**If NOT in .gitignore:**

Per Jesse's rule "Fix broken things immediately":

1. Add appropriate line to .gitignore
2. Commit the change
3. Then proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

**For global directory (~/.config/superpowers/worktrees):**

- No .gitignore verification needed
- Outside project entirely, can't pollute repo

### Project Setup Auto-Detection

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

**Don't hardcode** - auto-detect from project files

### Clean Baseline Verification

**Run tests after setup, before any implementation:**

```bash
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**

- Report failures
- Ask whether to proceed or investigate
- Don't assume broken tests are acceptable

**If tests pass:**

- Report ready with count (e.g., "47 tests, 0 failures")
- Proceed with confidence

**Why:** Can't distinguish new bugs from pre-existing issues without clean baseline

---

## Branch Completion Options

### The 4 Options (Present Exactly)

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep concise, let user choose

### Option 1: Merge Locally

**Workflow:**

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# VERIFY TESTS ON MERGED RESULT
<test command>

# If tests pass
git branch -d <feature-branch>
```

**Cleanup:** Remove worktree (Step 5)

**When to use:**

- Small changes
- Working alone
- Want immediate integration

### Option 2: Push and Create PR

**Workflow:**

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

**Cleanup:** Remove worktree (Step 5)

**Keep worktree?** Actually YES for this option - might need it for PR feedback

**When to use:**

- Team collaboration
- Want code review
- Significant changes

### Option 3: Keep As-Is

**Action:** Report only

```
Keeping branch <name>. Worktree preserved at <path>.
```

**Don't cleanup worktree** - user will handle later

**When to use:**

- Work in progress
- Need to switch contexts
- Experimental branch

### Option 4: Discard

**REQUIRES TYPED CONFIRMATION:**

```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

**Wait for exact confirmation** - don't accept "yes", "ok", etc.

**If confirmed:**

```bash
git checkout <base-branch>
git branch -D <feature-branch>  # Force delete
```

**Cleanup:** Remove worktree (Step 5)

**When to use:**

- Failed experiment
- Superseded approach
- Accidental branch

### Worktree Cleanup (Step 5)

**For Options 1, 2, 4:**

```bash
# Check if in worktree
git worktree list | grep $(git branch --show-current)

# If yes, remove it
git worktree remove <worktree-path>
```

**For Option 3:** Keep worktree intact

### Quick Reference Table

| Option           | Merge | Push | Keep Worktree | Cleanup Branch |
| ---------------- | ----- | ---- | ------------- | -------------- |
| 1. Merge locally | ✓     | -    | -             | ✓              |
| 2. Create PR     | -     | ✓    | ✓             | -              |
| 3. Keep as-is    | -     | -    | ✓             | -              |
| 4. Discard       | -     | -    | -             | ✓ (force)      |

---

## Batch Execution Patterns

### executing-plans Workflow

**Core principle:** Batch execution with checkpoints for architect review

**Step 1: Load and Review Plan**

1. Read plan file
2. Review critically - identify questions/concerns
3. If concerns: raise with human before starting
4. If no concerns: create TodoWrite and proceed

**Step 2: Execute Batch**

**Default: First 3 tasks**

For each task:

1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

**Step 3: Report**

When batch complete:

- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

**Step 4: Continue**

Based on feedback:

- Apply changes if needed
- Execute next batch
- Repeat until complete

**Step 5: Complete Development**

After all tasks complete and verified:

- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- Use finishing-a-development-branch skill
- Follow that skill to verify tests, present options, execute choice

### When to Stop and Ask for Help

**STOP executing immediately when:**

- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing**

### When to Revisit Earlier Steps

**Return to Review (Step 1) when:**

- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask

### Batch Size Considerations

**Default 3 tasks chosen because:**

- Small enough for focused review
- Large enough for meaningful progress
- Matches typical 15-20 minute review cycle

**Can adjust based on:**

- Task complexity (1-2 for complex, 5+ for trivial)
- Human availability (larger batches if async)
- Risk level (smaller batches for critical code)

---

## Anti-Patterns and Red Flags

### Git Worktree Anti-Patterns

**Skipping .gitignore verification**

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always grep .gitignore before creating project-local worktree
- **Quote:** "Why critical: Prevents accidentally committing worktree contents to repository"

**Assuming directory location**

- **Problem:** Creates inconsistency, violates project conventions
- **Fix:** Follow priority: existing > CLAUDE.md > ask
- **Never:** Create without checking existing first

**Proceeding with failing tests**

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed
- **Quote:** "If tests fail: Report failures, ask whether to proceed or investigate"

**Hardcoding setup commands**

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, Cargo.toml, etc.)

### Branch Completion Anti-Patterns

**Skipping test verification**

- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options
- **Quote:** "Before presenting options, verify tests pass"

**Open-ended questions**

- **Problem:** "What should I do next?" → ambiguous, decision paralysis
- **Fix:** Present exactly 4 structured options
- **Quote:** "Don't add explanation - keep options concise"

**Automatic worktree cleanup**

- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4
- **Note:** Option 2 (PR) might need worktree for feedback iterations

**No confirmation for discard**

- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation
- **Quote:** "Wait for exact confirmation - don't accept 'yes', 'ok', etc."

**Merging without verifying tests on result**

- **Problem:** Merge conflicts can break tests
- **Fix:** Run tests after merge, before deleting branch

### Batch Execution Anti-Patterns

**Forcing through blockers**

- **Problem:** Waste time on wrong approach, build on broken foundation
- **Fix:** Stop and ask when hit blocker
- **Quote:** "Ask for clarification rather than guessing"

**Skipping verifications**

- **Problem:** Don't know if implementation works
- **Fix:** Run every verification step in plan
- **Quote:** "Don't skip verifications"

**Not reporting between batches**

- **Problem:** Human can't course-correct, issues compound
- **Fix:** Always report + wait after batch
- **Quote:** "Between batches: just report and wait"

**Ignoring plan steps**

- **Problem:** Miss critical setup, tests, edge cases
- **Fix:** Follow plan exactly
- **Quote:** "Follow each step exactly (plan has bite-sized steps)"

**Guessing when unclear**

- **Problem:** Implement wrong thing, waste time
- **Fix:** Stop and ask for clarification
- **Quote:** "Stop when blocked, don't guess"

### General Red Flags

**From using-git-worktrees:**

- Create worktree without .gitignore verification (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous
- Skip CLAUDE.md check

**From finishing-a-development-branch:**

- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**From executing-plans:**

- Ignore questions/concerns during review
- Force through blockers
- Skip verifications
- Deviate from plan without discussing
- Continue when fundamentally unclear

---

## Key Quotes Worth Preserving

### On Directory Selection

> "Follow this priority order: existing > CLAUDE.md > ask"

> "If both exist, `.worktrees` wins."

### On Safety

> "MUST verify .gitignore before creating worktree"

> "Why critical: Prevents accidentally committing worktree contents to repository."

> "Per Jesse's rule 'Fix broken things immediately': 1. Add appropriate line to .gitignore 2. Commit the change 3. Proceed with worktree creation"

### On Clean Baseline

> "Verify clean baseline: Run tests to ensure worktree starts clean"

> "If tests fail: Report failures, ask whether to proceed or investigate."

> "Can't distinguish new bugs from pre-existing issues"

### On Batch Execution

> "Batch execution with checkpoints for architect review"

> "Default: first 3 tasks, then report"

> "Between batches: just report and wait"

> "Ask for clarification rather than guessing"

> "Don't force through blockers - stop and ask"

### On Completion Options

> "Present exactly these 4 options"

> "Don't add explanation - keep options concise"

> "Type 'discard' to confirm."

> "Wait for exact confirmation - don't accept 'yes', 'ok', etc."

### On Discipline

> "Follow plan steps exactly"

> "Don't skip verifications"

> "Stop executing immediately when: Hit a blocker mid-batch"

> "Reference skills when plan says to"

### On Integration

> "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch"

> "Announces at start: 'I'm using the [skill-name] skill to [action]'"

---

## Workflow Integration Summary

### The Full Loop

1. **brainstorming** → design document
2. **using-git-worktrees** → isolated workspace + clean baseline
3. **writing-plans** → bite-sized implementation tasks
4. **executing-plans** OR **subagent-driven-development** → implementation with checkpoints
5. **finishing-a-development-branch** → structured completion

### Key Integration Points

**brainstorming → using-git-worktrees:**

- After design approved
- Before implementation starts
- Sets up isolation

**using-git-worktrees → writing-plans:**

- Work happens in worktree
- Plan saved to `docs/plans/YYYY-MM-DD-<topic>.md`

**writing-plans → executing-plans:**

- Plan header includes: "REQUIRED SUB-SKILL: Use superpowers:executing-plans"
- Executor loads plan, follows tasks

**executing-plans → finishing-a-development-branch:**

- After all batches complete
- Step 5 explicitly requires this skill
- Verifies tests, presents options, cleans up

**finishing-a-development-branch → using-git-worktrees:**

- Cleanup completes the cycle
- Worktree removed (except Option 3)

### Execution Choice: Batch vs Continuous

**executing-plans (batch, parallel session):**

- Human reviews between batches
- Default 3 tasks per batch
- Slower but more oversight
- Better when plan needs validation

**subagent-driven-development (continuous, same session):**

- Fresh subagent per task
- Code review after each task
- Faster iteration
- Better when tasks independent

Both end with **finishing-a-development-branch**

### Skill Announcement Pattern

Every skill starts with announcement:

```
"I'm using the [skill-name] skill to [action]."
```

Examples:

- "I'm using the using-git-worktrees skill to set up an isolated workspace."
- "I'm using the executing-plans skill to implement this plan."
- "I'm using the finishing-a-development-branch skill to complete this work."

**Why:** Transparency + confirms skill was read

### Mandatory Workflows

From using-superpowers skill:

> "If a skill exists for your task, you must use it or you will fail at your task."

These workflows are MANDATORY, not suggestions:

- Brainstorming before coding
- Git worktrees for implementation
- Test-driven development during implementation
- Finishing-a-development-branch at completion

---

## Implementation Notes for opencode-swarm-plugin

### Patterns to Adopt

1. **Directory selection priority** - systematic approach to finding/creating directories
2. **Safety verification before mutation** - always check .gitignore before creating project-local directories
3. **Clean baseline verification** - run tests after setup, before work starts
4. **Structured option presentation** - 4 exact choices, no open-ended questions
5. **Typed confirmation for destructive actions** - require exact string match
6. **Batch execution with reporting** - default 3 tasks, report for review
7. **Stop-and-ask over guessing** - clarity > forcing through

### Skill Integration Pattern

**Header structure for skills:**

```yaml
---
name: skill-name
description: Use when [trigger] - [one-line summary of workflow]
---
```

**Announcement pattern:**

```
"I'm using the [skill-name] skill to [action]."
```

**Cross-skill integration:**

```markdown
**REQUIRED SUB-SKILL:** Use superpowers:other-skill-name
```

**Quick Reference tables** for decision points

**Red Flags section** with "Never" and "Always" lists

### Testing Patterns

**Clean baseline:**

- Auto-detect test command from project
- Run before starting work
- Report count + failures
- Ask permission if failures exist

**Verification steps:**

- Every task has explicit verification
- Run actual command, show output
- Don't proceed if verification fails

**Test on merge:**

- Even after successful feature tests
- Merge conflicts can break things
- Verify before deleting branch

### Error Handling

**Stop conditions:**

- Blocker mid-batch
- Critical gaps in plan
- Unclear instructions
- Repeated verification failures

**Recovery paths:**

- Report issue + wait for guidance
- Don't guess or force through
- Return to earlier step if fundamental rethink needed

### Documentation Patterns

**Plan documents:**

- Save to `docs/plans/YYYY-MM-DD-<topic>.md`
- Include header with REQUIRED SUB-SKILL directive
- Bite-sized tasks (2-5 minutes each)
- Exact file paths, complete code, verification steps

**Design documents:**

- Save to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Present in sections (200-300 words)
- Validate each section before continuing

---

## Conclusion

The Superpowers workflow integration demonstrates:

1. **Systematic over ad-hoc** - directory selection, option presentation, batch sizes all follow clear rules
2. **Safety first** - .gitignore verification, clean baselines, typed confirmations
3. **Structured checkpoints** - report between batches, present exact options, stop when blocked
4. **Lifecycle management** - worktree creation tied to branch lifecycle, cleanup when done
5. **Skill composition** - skills call other skills explicitly, workflows chain cleanly

The patterns are production-tested (Jesse's "Superpowers" system powers real development) and focused on preventing common failure modes:

- Repository pollution (worktree .gitignore)
- Broken baselines (test verification)
- Ambiguous decisions (4 exact options)
- Accidental deletion (typed confirmation)
- Context drift (batch execution)
- Forcing through blockers (stop and ask)

These patterns map directly to opencode-swarm-plugin needs:

- Swarm decomposition = brainstorming + writing-plans
- Parallel agents = subagent-driven-development
- Cleanup = finishing-a-development-branch
- Safety = .gitignore verification, clean baselines
- Learning = recording outcomes from batch execution
