# Eval/Observability Ecosystem Rundown SOP

**Standard Operating Procedure for assessing the health of the swarm-tools eval and observability systems.**

```
    🐝   EVAL/O11Y HEALTH CHECK   🐝
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Systematic ecosystem analysis
```

## Purpose

This SOP provides a repeatable process for analyzing the eval and observability ecosystem in swarm-tools. It answers:

- **Are our evals catching regressions?** (eval suite health)
- **Are evals improving over time?** (historical trends)
- **Are coordinators following protocol?** (session quality)
- **Are we capturing the right events?** (coverage gaps)
- **What changed since last check?** (delta analysis)

## When to Run This Analysis

| Trigger | Frequency | Priority |
|---------|-----------|----------|
| **Weekly health check** | Every Monday | Medium |
| **Pre-release verification** | Before each npm publish | High |
| **Regression alert** | Ad-hoc when eval scores drop | Urgent |
| **New eval added** | After adding new eval file | Medium |
| **Event schema changes** | After modifying schemas/ | High |
| **Post-incident** | After coordination failures | Medium |

## Required Context

- **Working directory**: `/Users/joel/Code/joelhooks/opencode-swarm-plugin`
- **Packages**: `swarm-evals`, `opencode-swarm-plugin`, `swarm-mail`
- **Data sources**:
  - Eval suite: `packages/swarm-evals/src/*.eval.ts`
  - Eval history: `packages/opencode-swarm-plugin/.opencode/eval-history.jsonl`
  - Sessions: `~/.config/swarm-tools/sessions/*.jsonl`
  - Event schemas: `packages/opencode-swarm-plugin/src/schemas/`
  - Baseline: `packages/opencode-swarm-plugin/.hive/eval-results.json`

---

## Checklist (Run in Order)

### 1. Run Eval Suite

**Command:**
```bash
cd packages/swarm-evals
bun run test
```

**Expected output:**
- All evals complete without crashes
- Score summary printed to console
- Results written to `eval-results.json`

**Capture:**
```bash
# Save raw output for later analysis
bun run test 2>&1 | tee /tmp/eval-run-$(date +%Y%m%d-%H%M%S).log
```

**Metrics to extract:**
- Total eval suites (should be 7+)
- Overall pass rate (target: >85%)
- Individual suite scores:
  - `coordinator-behavior` (target: >0.80)
  - `coordinator-session` (target: >0.75)
  - `swarm-decomposition` (target: >0.85)
  - `compaction-prompt` (target: >0.85)
  - `compaction-resumption` (target: >0.90)
  - `decision-quality` (target: >0.80)

**Red flags:**
- ❌ Any eval suite score drops >10% from baseline
- ❌ New eval suite consistently scores <0.60
- ❌ Test crashes or timeouts

---

### 2. Parse Eval History for Trends

**Command:**
```bash
cd packages/opencode-swarm-plugin
cat .opencode/eval-history.jsonl | jq -s '
  group_by(.eval_name) | 
  map({
    eval: .[0].eval_name,
    runs: length,
    latest_score: .[-1].score,
    avg_score: (map(.score) | add / length),
    min_score: (map(.score) | min),
    max_score: (map(.score) | max),
    variance: (map(.score) | add / length) as $avg | 
              (map(pow(. - $avg; 2)) | add / length | sqrt)
  })
'
```

**Expected output (JSON array):**
```json
[
  {
    "eval": "coordinator-behavior",
    "runs": 42,
    "latest_score": 0.85,
    "avg_score": 0.82,
    "min_score": 0.70,
    "max_score": 0.90,
    "variance": 0.05
  },
  ...
]
```

**Metrics to extract:**
- **Unique eval count** (should match eval suite count)
- **Run count per eval** (minimum 5 runs for statistical relevance)
- **Trend classification**:
  - **Improving**: `latest_score > avg_score + variance`
  - **Stable**: `latest_score within avg_score ± variance`
  - **Regressing**: `latest_score < avg_score - variance`
- **High variance** (>0.10): unstable eval, needs investigation

**Analysis template:**
```bash
# Detect regressions
jq -s '
  group_by(.eval_name) | 
  map(select(.[0].eval_name != null)) |
  map({
    eval: .[0].eval_name,
    latest: .[-1].score,
    avg: (map(.score) | add / length),
    status: if (.[-1].score < (map(.score) | add / length) - 0.05) 
            then "REGRESSING" 
            else "OK" 
            end
  }) |
  map(select(.status == "REGRESSING"))
' .opencode/eval-history.jsonl
```

**Red flags:**
- ❌ Eval regressing for 3+ consecutive runs
- ❌ Variance >0.15 (flaky eval)
- ❌ Run count <3 (not enough data)

---

### 3. Audit Coordinator Sessions

**Command:**
```bash
# Count sessions by type
ls ~/.config/swarm-tools/sessions/*.jsonl | wc -l

# Check recent session quality
for file in $(ls -t ~/.config/swarm-tools/sessions/*.jsonl | head -10); do
  echo "=== $(basename $file) ==="
  jq -s '
    {
      session_id: .[0].session_id,
      event_count: length,
      violations: map(select(.type == "VIOLATION")) | length,
      decisions: map(select(.type == "DECISION")) | length,
      outcomes: map(select(.type == "OUTCOME")) | length,
      quality: if (map(select(.type == "VIOLATION")) | length) == 0 
               then "PASS" 
               else "FAIL" 
               end
    }
  ' "$file"
done
```

**Expected output:**
```json
{
  "session_id": "ses_xyz",
  "event_count": 42,
  "violations": 0,
  "decisions": 8,
  "outcomes": 5,
  "quality": "PASS"
}
```

**Metrics to extract:**
- **Total session count** (healthy: 50+)
- **Sessions by type**:
  - Coordinator sessions (`grep -l "DECISION" *.jsonl | wc -l`)
  - Worker sessions (all others)
- **Quality pass rate**: `(sessions with 0 violations / total) * 100`
- **Event distribution**:
  - DECISION events (coordinator choices)
  - VIOLATION events (protocol breaches)
  - OUTCOME events (results of actions)
  - COMPACTION events (context compression)

**Red flags:**
- ❌ Quality pass rate <70%
- ❌ Sessions with >5 violations
- ❌ No sessions in last 7 days (capture broken?)

---

### 4. Map Event Coverage

**Command:**
```bash
# List all event types defined in schemas
cd packages/opencode-swarm-plugin
grep -h "type: z.literal" src/schemas/cell-events.ts | \
  sed -E 's/.*z\.literal\("([^"]+)"\).*/\1/' | \
  sort -u > /tmp/schema-events.txt

# List event types seen in actual sessions
jq -r '.type' ~/.config/swarm-tools/sessions/*.jsonl 2>/dev/null | \
  sort -u > /tmp/observed-events.txt

# Compare
echo "=== Events defined but never observed ==="
comm -23 /tmp/schema-events.txt /tmp/observed-events.txt

echo "=== Events observed but not in schema ==="
comm -13 /tmp/schema-events.txt /tmp/observed-events.txt

echo "=== Coverage ==="
total_defined=$(wc -l < /tmp/schema-events.txt)
total_observed=$(wc -l < /tmp/observed-events.txt)
coverage=$(echo "scale=2; ($total_observed / $total_defined) * 100" | bc)
echo "Observed: $total_observed / $total_defined ($coverage%)"
```

**Expected output:**
```
=== Events defined but never observed ===
cell_comment_deleted
cell_epic_child_removed
cell_label_removed

=== Events observed but not in schema ===
(none)

=== Coverage ===
Observed: 17 / 20 (85%)
```

**Metrics to extract:**
- **Coverage %**: `(observed event types / defined event types) * 100`
- **Unused events**: events in schema but never captured (expected for rare operations)
- **Unknown events**: events in sessions but not in schema (schema drift!)

**Red flags:**
- ❌ Unknown events detected (schema out of sync)
- ❌ Coverage <50% (capture too narrow or schema bloated)
- ❌ Core events missing (e.g., `cell_created`, `cell_closed`)

---

### 5. Compare to Baseline

**Command:**
```bash
cd packages/opencode-swarm-plugin

# Load baseline (last known-good state)
baseline=$(jq '.suite_scores' .hive/eval-results.json 2>/dev/null)

# Load current run
current=$(jq '.suite_scores' packages/swarm-evals/eval-results.json 2>/dev/null)

# Delta report
echo "=== Eval Score Deltas ==="
jq -n --argjson baseline "$baseline" --argjson current "$current" '
  ($baseline | keys) as $evals |
  $evals | map({
    eval: .,
    baseline: $baseline[.],
    current: $current[.] // 0,
    delta: (($current[.] // 0) - $baseline[.]),
    status: if (($current[.] // 0) - $baseline[.]) < -0.05 
            then "⚠️ REGRESSION" 
            elif (($current[.] // 0) - $baseline[.]) > 0.05 
            then "✅ IMPROVED" 
            else "➡️ STABLE" 
            end
  })
'
```

**Expected output:**
```json
[
  {
    "eval": "coordinator-behavior",
    "baseline": 0.80,
    "current": 0.85,
    "delta": 0.05,
    "status": "✅ IMPROVED"
  },
  {
    "eval": "coordinator-session",
    "baseline": 0.75,
    "current": 0.72,
    "delta": -0.03,
    "status": "➡️ STABLE"
  },
  ...
]
```

**Metrics to extract:**
- **Regressions**: evals with delta < -0.05
- **Improvements**: evals with delta > 0.05
- **Stable**: evals with |delta| <= 0.05

**Red flags:**
- ❌ Any regression >0.10
- ❌ Multiple regressions in same run
- ❌ Baseline file missing or stale (>30 days old)

---

### 6. Update Baseline (if healthy)

**Criteria for updating baseline:**
- ✅ All evals pass (score >0.60)
- ✅ No regressions >0.10
- ✅ Session quality pass rate >70%
- ✅ Event coverage >50%

**Command:**
```bash
# Backup old baseline
cp .hive/eval-results.json .hive/eval-results.json.bak

# Update baseline
cp packages/swarm-evals/eval-results.json .hive/eval-results.json

# Commit
git add .hive/eval-results.json
git commit -m "chore: update eval baseline ($(date +%Y-%m-%d))"
```

**Skip update if:**
- ❌ Any regression detected
- ❌ Eval suite crashes or incomplete
- ❌ Session capture broken (0 sessions in last 7 days)

---

## Delta Analysis Template

Use this template for reporting findings:

```markdown
# Eval/O11y Health Check - [DATE]

## Summary
- **Status**: [HEALTHY | DEGRADED | CRITICAL]
- **Total eval suites**: X
- **Overall pass rate**: Y%
- **Session quality**: Z%

## Key Findings

### Regressions
- [eval-name]: baseline X.XX → current Y.YY (ΔZ.ZZ)
  - Root cause: [brief]
  - Action: [cell ID or "investigating"]

### Improvements
- [eval-name]: baseline X.XX → current Y.YY (+Z.ZZ)
  - Attribution: [change that caused improvement]

### Coverage Gaps
- Events defined but never seen: [list]
- Events seen but not in schema: [list] ❌
- Action: [sync schema or add capture]

## Trends (Last 7 Days)
- coordinator-behavior: [IMPROVING | STABLE | REGRESSING]
- coordinator-session: [IMPROVING | STABLE | REGRESSING]
- swarm-decomposition: [IMPROVING | STABLE | REGRESSING]

## Session Quality
- Total sessions: X
- Coordinator sessions: Y
- Quality pass rate: Z%
- Violation patterns: [most common violation type]

## Action Items
- [ ] [cell ID] Fix regression in [eval-name]
- [ ] [cell ID] Sync event schema (unknown events detected)
- [ ] Update baseline (if healthy)
```

---

## Output Artifacts

After completing this rundown, you should have:

1. **Eval run log**: `/tmp/eval-run-YYYYMMDD-HHMMSS.log`
2. **Trend analysis JSON**: saved or copied from step 2
3. **Session quality report**: from step 3
4. **Coverage gap list**: from step 4
5. **Delta report**: from step 5
6. **Health check markdown**: written to `.hive/analysis/eval-o11y-health-YYYYMMDD.md`

---

## Advanced Queries

### Find flaky evals (high variance)
```bash
jq -s '
  group_by(.eval_name) | 
  map({
    eval: .[0].eval_name,
    variance: (map(.score) | add / length) as $avg | 
              (map(pow(. - $avg; 2)) | add / length | sqrt)
  }) |
  map(select(.variance > 0.10))
' .opencode/eval-history.jsonl
```

### Session event timeline (last 24h)
```bash
find ~/.config/swarm-tools/sessions/ -name "*.jsonl" -mtime -1 | xargs jq -s '
  sort_by(.timestamp) | 
  map({
    time: (.timestamp | todate),
    type: .type,
    message: .message // .decision // .violation
  })
'
```

### Coordinator violation breakdown
```bash
jq -s '
  map(select(.type == "VIOLATION")) | 
  group_by(.violation) | 
  map({
    violation: .[0].violation,
    count: length,
    sessions: map(.session_id) | unique | length
  }) |
  sort_by(-.count)
' ~/.config/swarm-tools/sessions/*.jsonl
```

### Event type frequency distribution
```bash
jq -r '.type' ~/.config/swarm-tools/sessions/*.jsonl | \
  sort | uniq -c | sort -rn
```

---

## Troubleshooting

### No sessions in ~/.config/swarm-tools/sessions/

**Cause**: Session capture not enabled or daemon not running.

**Fix**:
```bash
# Check daemon status
curl http://127.0.0.1:8765/health/liveness

# Restart daemon if needed
launchctl stop com.swarm-tools.daemon
launchctl start com.swarm-tools.daemon
```

### Eval suite crashes with "Cannot find module"

**Cause**: Missing dependencies or workspace link broken.

**Fix**:
```bash
cd packages/swarm-evals
bun install
cd ../..
bun install
```

### eval-history.jsonl missing or empty

**Cause**: First run or eval suite never completed successfully.

**Fix**: Run eval suite at least once:
```bash
cd packages/swarm-evals
bun run test
```

### Baseline file (.hive/eval-results.json) missing

**Cause**: Fresh checkout or baseline never set.

**Fix**: Establish baseline after first successful run:
```bash
cp packages/swarm-evals/eval-results.json .hive/eval-results.json
git add .hive/eval-results.json
git commit -m "chore: establish eval baseline"
```

---

## Maintenance

### Weekly
- Run steps 1-5
- Generate delta report
- File cells for regressions

### Monthly
- Review trend data (step 2)
- Identify chronically flaky evals (variance >0.15)
- Prune stale sessions (>90 days old)

### Quarterly
- Audit event schema vs observed events
- Archive old baseline snapshots
- Review and update this SOP

---

## References

- **Eval suite README**: `packages/swarm-evals/README.md`
- **Event schemas**: `packages/opencode-swarm-plugin/src/schemas/cell-events.ts`
- **Session capture docs**: (TODO: document session capture mechanism)
- **Evalite docs**: https://evalite.dev

---

*Last updated: 2025-12-28*
*SOP version: 1.0*
