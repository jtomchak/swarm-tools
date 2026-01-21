---
"opencode-swarm-plugin": minor
"swarm-mail": patch
---

feat(observability): wire linkOutcomeToTrace for quality_score population

When workers complete via swarm_complete, the outcome event is now linked
back to its decision trace, enabling quality_score calculation. This fixes
the 0% success rate previously shown in `swarm stats` and `swarm o11y`.

New functions:
- `findDecisionTraceByBead()` - look up decision traces by bead ID
- `linkOutcomeToDecisionTrace()` - helper to link outcomes to traces
