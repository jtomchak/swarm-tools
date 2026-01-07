---
"opencode-swarm-plugin": minor
---

## 🔬 The Hive Learns to See Itself

```
        🐝 → 📊 → 🧠
       /         \
    Events     Insights
      |           |
   [Log DB] → [Analytics]
      |           |
   Capture    Understand
```

> "Observability is about instrumenting your system in a way that ensures that sufficient information about a system's runtime is collected and analyzed so that when something goes wrong, it can help you understand why."
> 
> — *AI Engineering: Building Applications with Foundation Models*

The swarm is getting smarter about watching itself work. This release adds deep analytics, proper logging, and visibility into what actually happens when agents coordinate. No more flying blind.

---

### 🐛 CRITICAL FIX: Plugin Wrapper Module Resolution

**The Bug:** Plugin wrapper imported `captureCompactionEvent` from swarm-mail → transitive deps (`evalite`) not available in OpenCode context → trace trap → crash.

**The Fix:** Inlined the capture logic directly into the plugin wrapper template. No imports, no deps, no crash.

**Why it matters:** The plugin wrapper must be **DUMB**. All smarts live in the CLI (where deps are safe). This was the last violation of that rule. Plugin now survives context compaction without exploding.

---

### 📝 Date-Stamped Logging with Rotation

**What changed:**
- Logs now live in `~/.config/swarm-tools/logs/YYYY-MM-DD.log`
- Daily rotation (one file per day, keeps last 7 days)
- `swarm log` CLI command to view/filter logs

**Why it matters:** 
Before this, debug output vanished into the void. Now coordinators and workers leave a trail. When a swarm fails at 2am, you can replay the sequence. Logs are indexed by day, so you can diff "what happened yesterday vs today."

**Example:**
```bash
# View today's logs
swarm log

# Filter by level
swarm log --level error

# Watch mode
swarm log --watch
```

---

### 🎯 Strategy Diversification

**What changed:**
- Added keywords for **file-based** strategy: "CRUD", "schema", "API route", "component", "utility"
- Added keywords for **risk-based** strategy: "refactor", "breaking", "migration", "auth", "payment"

**Why it matters:**
The swarm was over-indexing on feature-based decomposition. Now it recognizes when work is naturally file-scoped (CRUD endpoints) or risk-scoped (auth changes that need isolation). Better strategy selection = less conflict, faster completion.

---

### ⚡ Compaction Tuning

**What changed:**
- Narrowed activity detection window: 10 messages → 5 messages
- Added tool call boosting: messages with tool calls get 2x weight
- Made compaction prompt dumps opt-in: `swarm stats --compaction-prompts`

**Why it matters:**
Context compaction was too conservative - waiting until 10 messages of silence before triggering. Now it fires faster (5 messages) but weighs tool activity higher (an agent editing files is more "active" than chatting). The prompt dumps were noisy, so they're now hidden unless you ask.

**Compaction is the difference between a swarm that finishes and one that exhausts context mid-flight.**

---

### 📊 Rejection Analytics

**What changed:**
- Added `swarm stats --rejections` flag to surface coordinator review rejections

**Why it matters:**
The 3-strike rule exists to catch architectural problems early. Now you can see which tasks are burning review attempts and why. If a subtask gets rejected 3 times, it's not "worker skill issue" - it's a signal that the decomposition was wrong or the epic's requirements are unclear.

---

### 📚 Research Reports

This release includes deep analysis:
- **Database audit** - Found and documented 7 stray database paths, all migrated to global DB
- **Eval analysis** - Coordinator evals now test REAL sessions, not synthetic prompts
- **Rejection patterns** - Analyzed what causes review failures (incomplete work, scope creep, missing tests)

**Why it matters:**
The swarm plugin learns from outcomes. These reports capture what we learned so the NEXT swarm is smarter.

---

### Migration Notes

**No breaking changes.** All new features are opt-in or backwards-compatible.

If you see `captureCompactionEvent` import errors in the plugin wrapper, update to this version - the inline fix is mandatory for stability.

---

### What's Next?

- **Semantic search over logs** - query "show me all file conflicts in the last week"
- **Real-time dashboard** - `swarm dashboard --live` with worker status, progress bars
- **Outcome prediction** - "this decomposition has 80% failure rate based on history"

The hive is learning to see. Next, it learns to predict.
