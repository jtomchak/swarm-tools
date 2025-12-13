# Verification & Quality Assurance Patterns

**Extracted from:** obra/superpowers repo skills
**Analysis for:** opencode-swarm-plugin quality philosophy integration

---

## I. Core Principles (The Philosophy)

1. **Evidence Before Claims, Always**
   - Claiming work is complete without verification is dishonesty, not efficiency
   - Confidence ≠ evidence
   - No shortcuts for verification
   - Partial verification proves nothing

2. **Root Cause Over Symptoms**
   - ALWAYS find root cause before attempting fixes
   - Symptom fixes are failure
   - Trace backward through call chain until you find original trigger
   - 95% of "no root cause" cases are incomplete investigation

3. **Systematic Over Random**
   - Random fixes waste time and create new bugs
   - Quick patches mask underlying issues
   - Systematic debugging is FASTER than guess-and-check thrashing
   - Process is fast for simple bugs too

4. **Defense In Depth**
   - Single validation: "We fixed the bug"
   - Multiple layers: "We made the bug structurally impossible"
   - Validate at EVERY layer data passes through
   - Different layers catch different cases

5. **Question Architecture After 3 Failures**
   - If 3+ fixes failed, you have an architectural problem, not a bug
   - Pattern indicates fundamental unsoundness, not failed hypothesis
   - STOP and discuss with human before attempting more fixes
   - "Sticking with it through sheer inertia" is not engineering

---

## II. The Iron Laws (Non-Negotiable)

### Law 1: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

```
If you haven't run the verification command in THIS message,
you cannot claim it passes.
```

**Violating the letter of this rule is violating the spirit of this rule.**

### Law 2: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

```
If you haven't completed Phase 1 (Root Cause Investigation),
you cannot propose fixes.
```

**Violating the letter of this process is violating the spirit of debugging.**

### Law 3: NEVER FIX JUST WHERE ERROR APPEARS

```
Trace backward through the call chain until you find the original trigger.
Then fix at the source.
```

**Symptom fixes mask underlying issues.**

---

## III. Decision Frameworks

### A. The Gate Function (Verification)

**BEFORE claiming ANY status or expressing satisfaction:**

```
1. IDENTIFY: What command proves this claim?
2. RUN: Execute the FULL command (fresh, complete)
3. READ: Full output, check exit code, count failures
4. VERIFY: Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

### B. The Four-Phase Debugging Framework

**Complete each phase before proceeding to the next:**

| Phase                   | Key Activities                                                                                                                 | Success Criteria                                     | Skip = Failure                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------ |
| **1. Root Cause**       | Read errors completely, reproduce consistently, check recent changes, gather evidence at component boundaries, trace data flow | Understand WHAT and WHY                              | Proposing fixes without investigation      |
| **2. Pattern Analysis** | Find working examples, compare against references, identify differences, understand dependencies                               | Identify what's different between working and broken | Skimming references, assuming similarities |
| **3. Hypothesis**       | Form single specific hypothesis, test minimally (one variable), verify before continuing                                       | Confirmed hypothesis or new hypothesis formed        | Multiple changes at once, vague theories   |
| **4. Implementation**   | Create failing test, implement single fix, verify, count attempts                                                              | Bug resolved with tests passing                      | Fixing without test, bundled refactoring   |

**Special Rule - Phase 4.5:**

```
IF 3+ fixes have failed:
  STOP → Question the architecture
  DON'T attempt Fix #4
  Discuss with human partner

This is NOT a failed hypothesis.
This is a WRONG ARCHITECTURE.
```

### C. Defense-in-Depth Layers

**When fixing any bug caused by invalid data:**

```
1. Map the data flow - Where does value originate? Where is it used?
2. Identify all checkpoints - List every point data passes through
3. Add validation at each layer:
   - Layer 1: Entry Point Validation (API boundary)
   - Layer 2: Business Logic Validation (operation-specific)
   - Layer 3: Environment Guards (context-specific safety)
   - Layer 4: Debug Instrumentation (forensic evidence)
4. Test each layer independently
```

**Key Insight:** All four layers are necessary. Different code paths bypass different checks.

### D. Root Cause Tracing Process

**When error appears deep in call stack:**

```
1. Observe the symptom (what failed, where)
2. Find immediate cause (what code directly triggered it)
3. Ask: What called this? (trace one level up)
4. Keep tracing up (find what value was passed)
5. Find original trigger (where did bad value originate)
6. Fix at source (NOT at symptom point)
7. Add defense-in-depth (validate at every layer)
```

**When manual tracing fails:**

- Add stack trace instrumentation before problematic operation
- Use `console.error()` in tests (not logger - may be suppressed)
- Include context: directory, cwd, environment, timestamps
- Capture: `new Error().stack` shows complete call chain

---

## IV. Anti-Patterns and Red Flags

### A. Verification Red Flags (STOP IMMEDIATELY)

**Language that indicates violation:**

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit/push/PR without verification
- Trusting agent success reports
- Relying on partial verification
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

**The rule applies to:**

- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness

### B. Debugging Red Flags (RETURN TO PHASE 1)

**If you catch yourself thinking:**

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**

### C. Human Partner Signals You're Doing It Wrong

**Watch for these redirections:**

- "Is that not happening?" → You assumed without verifying
- "Will it show us...?" → You should have added evidence gathering
- "Stop guessing" → You're proposing fixes without understanding
- "Ultrathink this" → Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) → Your approach isn't working

**When you see these:** STOP. Return to Phase 1.

---

## V. Common Failures Table

### A. What Requires What (Verification)

| Claim                 | Requires                        | Not Sufficient                 |
| --------------------- | ------------------------------- | ------------------------------ |
| Tests pass            | Test command output: 0 failures | Previous run, "should pass"    |
| Linter clean          | Linter output: 0 errors         | Partial check, extrapolation   |
| Build succeeds        | Build command: exit 0           | Linter passing, logs look good |
| Bug fixed             | Test original symptom: passes   | Code changed, assumed fixed    |
| Regression test works | Red-green cycle verified        | Test passes once               |
| Agent completed       | VCS diff shows changes          | Agent reports "success"        |
| Requirements met      | Line-by-line checklist          | Tests passing                  |

### B. Common Rationalizations (Debugging)

| Excuse                                       | Reality                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| "Issue is simple, don't need process"        | Simple issues have root causes too. Process is fast for simple bugs.    |
| "Emergency, no time for process"             | Systematic debugging is FASTER than guess-and-check thrashing.          |
| "Just try this first, then investigate"      | First fix sets the pattern. Do it right from the start.                 |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it.                       |
| "Multiple fixes at once saves time"          | Can't isolate what worked. Causes new bugs.                             |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely.              |
| "I see the problem, let me fix it"           | Seeing symptoms ≠ understanding root cause.                             |
| "One more fix attempt" (after 2+ failures)   | 3+ failures = architectural problem. Question pattern, don't fix again. |

### C. Common Rationalizations (Verification)

| Excuse                                  | Reality                |
| --------------------------------------- | ---------------------- |
| "Should work now"                       | RUN the verification   |
| "I'm confident"                         | Confidence ≠ evidence  |
| "Just this once"                        | No exceptions          |
| "Linter passed"                         | Linter ≠ compiler      |
| "Agent said success"                    | Verify independently   |
| "I'm tired"                             | Exhaustion ≠ excuse    |
| "Partial check is enough"               | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter     |

---

## VI. Key Patterns and Templates

### A. Verification Patterns

**Tests:**

```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**

```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**

```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Requirements:**

```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**

```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

### B. Multi-Component Evidence Gathering

**WHEN system has multiple components (CI → build → signing, API → service → database):**

**BEFORE proposing fixes, add diagnostic instrumentation:**

```
For EACH component boundary:
  - Log what data enters component
  - Log what data exits component
  - Verify environment/config propagation
  - Check state at each layer

Run once to gather evidence showing WHERE it breaks
THEN analyze evidence to identify failing component
THEN investigate that specific component
```

**Example (multi-layer system):**

```bash
# Layer 1: Workflow
echo "=== Secrets available in workflow: ==="
echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

# Layer 2: Build script
echo "=== Env vars in build script: ==="
env | grep IDENTITY || echo "IDENTITY not in environment"

# Layer 3: Signing script
echo "=== Keychain state: ==="
security list-keychains
security find-identity -v

# Layer 4: Actual signing
codesign --sign "$IDENTITY" --verbose=4 "$APP"
```

**This reveals:** Which layer fails (secrets → workflow ✓, workflow → build ✗)

### C. Defense-in-Depth Template

**Example: Empty projectDir bug prevention**

```typescript
// Layer 1: Entry Point Validation
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === "") {
    throw new Error("workingDirectory cannot be empty");
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }
  // ... proceed
}

// Layer 2: Business Logic Validation
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error("projectDir required for workspace initialization");
  }
  // ... proceed
}

// Layer 3: Environment Guards
async function gitInit(directory: string) {
  if (process.env.NODE_ENV === "test") {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));
    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `Refusing git init outside temp dir during tests: ${directory}`,
      );
    }
  }
  // ... proceed
}

// Layer 4: Debug Instrumentation
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug("About to git init", {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... proceed
}
```

**Result:** Bug impossible to reproduce. All 1847 tests passed.

---

## VII. When To Apply (Triggers)

### Verification-Before-Completion Triggers

**ALWAYS before:**

- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

### Systematic-Debugging Triggers

**Use for ANY technical issue:**

- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use ESPECIALLY when:**

- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**

- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

### Defense-in-Depth Triggers

**When to apply:**

- Any bug caused by invalid data
- After finding root cause (complement to systematic debugging)
- Before claiming bug is "impossible" to reproduce

### Root-Cause-Tracing Triggers

**Use when:**

- Error happens deep in execution (not at entry point)
- Stack trace shows long call chain
- Unclear where invalid data originated
- Need to find which test/code triggers the problem

---

## VIII. Key Quotes Worth Preserving

### On Verification

> "Claiming work is complete without verification is dishonesty, not efficiency."

> "Skip any step = lying, not verifying."

> "No shortcuts for verification. Run the command. Read the output. THEN claim the result. This is non-negotiable."

> "Violating the letter of this rule is violating the spirit of this rule."

### On Debugging

> "Random fixes waste time and create new bugs. Quick patches mask underlying issues."

> "Systematic debugging is FASTER than guess-and-check thrashing."

> "Seeing symptoms ≠ understanding root cause."

> "3+ failures = architectural problem. Question pattern, don't fix again."

> "This is NOT a failed hypothesis. This is a WRONG ARCHITECTURE."

### On Defense-in-Depth

> "Single validation: 'We fixed the bug'. Multiple layers: 'We made the bug structurally impossible.'"

> "All four layers were necessary. During testing, each layer caught bugs the others missed."

> "Don't stop at one validation point. Add checks at every layer."

### On Root Cause Tracing

> "Trace backward through the call chain until you find the original trigger, then fix at the source."

> "NEVER fix just where the error appears."

> "95% of 'no root cause' cases are incomplete investigation."

---

## IX. Real-World Impact (Evidence)

### From Verification Skills:

- "I don't believe you" - trust broken
- Undefined functions shipped - would crash
- Missing requirements shipped - incomplete features
- Time wasted on false completion → redirect → rework
- Violates: "Honesty is a core value. If you lie, you'll be replaced."

### From Systematic Debugging:

- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common

### From Root Cause Tracing:

- Found root cause through 5-level trace
- Fixed at source (getter validation)
- Added 4 layers of defense
- 1847 tests passed, zero pollution

---

## X. Integration with Other Skills

### Required Sub-Skills

**Systematic Debugging requires:**

- `root-cause-tracing` - REQUIRED when error is deep in call stack (Phase 1, Step 5)
- `test-driven-development` - REQUIRED for creating failing test case (Phase 4, Step 1)

**Root Cause Tracing complements:**

- `defense-in-depth` - Add validation at multiple layers after finding root cause

### Complementary Skills

**After applying these patterns:**

- `defense-in-depth` - Add validation at multiple layers after finding root cause
- `condition-based-waiting` - Replace arbitrary timeouts identified in Phase 2
- `verification-before-completion` - Verify fix worked before claiming success

---

## XI. Architecture Question Criteria

**Pattern indicating architectural problem (not bug):**

- Each fix reveals new shared state/coupling/problem in different place
- Fixes require "massive refactoring" to implement
- Each fix creates new symptoms elsewhere
- 3+ fixes have failed

**When this happens:**

1. STOP attempting more fixes
2. Question fundamentals:
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor architecture vs. continue fixing symptoms?
3. Discuss with human partner before proceeding
4. This is NOT a failed hypothesis - this is a wrong architecture

---

## XII. The Bottom Line

**No shortcuts for verification.**
Run the command. Read the output. THEN claim the result.
This is non-negotiable.

**No fixes without understanding.**
Find the root cause. Test your hypothesis. Fix at the source.
Add defense at every layer.

**Question architecture early.**
If 3+ fixes failed, it's not the fix - it's the foundation.
Stop digging. Start designing.
