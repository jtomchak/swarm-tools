---
"swarm-mail": minor
"opencode-swarm-plugin": minor
---

> "In addition, there is a huge variation in quality and productivity among programmers, but we have made little attempt to understand what makes the best programmers so much better or to teach those skills in our classes." — John Ousterhout, *A Philosophy of Software Design*

            .-.
           (o o)   "Release the hive."
           | O |
            '-'

## 🐝 Coordinator Reservation Overrides
- Add `releaseAllSwarmFiles` + `releaseSwarmFilesForAgent` admin paths for coordinator recovery.
- Extend `file_released` events with `release_all` and `target_agent` for precise cleanup.
- Expose `swarmmail_release_all` and `swarmmail_release_agent` in plugin + wrapper template.

## 🧹 UBS Reference Cleanup
- Remove UBS references from prompts, doctor guidance, and docs.
- Drop UBS availability checks from swarm init/tool availability.

**Backward compatible:** existing `swarmmail_release` behavior is unchanged for workers.
