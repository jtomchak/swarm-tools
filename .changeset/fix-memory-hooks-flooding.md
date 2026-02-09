---
"swarm-tools": minor
---

Overhaul hivemind memory hooks to stop flooding sessions with garbage context

**Auto-recall fixes:**
- Add 30s cooldown between recall queries (was firing ~608x per 8hr session)
- Raise minScore from 0.3 to 0.55 (filter weak matches)
- Skip system messages (watchdog, heartbeat, exec logs, telegrams, etc.)
- Truncate query to first 200 chars instead of sending full prompt
- Move console.log spam behind debug flag
- Reduce maxRecallResults from 5 to 3

**Auto-capture fixes:**
- Only capture assistant responses (was also capturing user messages and system prompts)
- Replace loose CAPTURE_PATTERNS with STRONG_CAPTURE_PATTERNS requiring actual knowledge signals
- Add 19-pattern system message blocklist (heartbeat, watchdog, OUTCOME/DECISION blocks, etc.)
- Raise min capture length from 50 to 80 chars
- Long messages (300+) only captured if also entity-rich
- Reduce captures per turn from 2 to 1
- Increase truncation from 500 to 1000 chars (capture complete thoughts)

**Format improvements:**
- Increase recalled content from 300 to 600 chars
- Drop emoji decay badges (waste tokens)
- Drop "Relevant memories:" header and "Use naturally" instruction
- Cleaner format: `- (85%) [tags] content`

**Tag detection:**
- Remove "task" tag (matched every system log)
- Add "gotcha", "architecture", "config" tags

**Session handler:**
- Don't store "Session ended without summary" garbage (require 50+ char summary)
- Better session start query, limit results from 5 to 3

**New config options:** recallCooldownMs, maxCapturePerTurn, captureContentLimit, recallContentLimit
