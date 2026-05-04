# Story 2.5: Configure Execution Mode Stop Policy

## Status

review

## Story

As an Agent Operator,
I want execution mode to decide stop-guard behavior,
So that generated workflows stay automated unless the agent explicitly pauses through the runtime interrupt command.

## Acceptance Criteria

- Given a step is `User involved` or `Background wait`, when runtime files are generated, then stop guard treats that step as non-blocking.
- Given a step is `Solo run`, when stop guard is configured, then the generated guard blocks agent termination while the workflow is running on that step.
- Given an agent needs real user input during any step, when it invokes the runtime interrupt command, then state records interrupted status and reason, and resume instructions are available to continue the workflow after the user response.

## Tasks / Subtasks

- [x] Keep execution mode and hook policy synchronized.
- [x] Support `Solo run`, `User involved`, and `Background wait`.
- [x] Export stop guard non-blocking policy from execution mode.
- [x] Generate `scripts/agent-interrupt.sh` for runtime interruption.
- [x] Move guard/discussion indicators from canvas overlay into the left sidebar footer.

## Dev Agent Record

### Completion Notes

- Execution mode changes now update legacy compatibility fields and derived `hooks.interruptSteps`.
- Exported stop guard receives the current non-blocking step set.
- Runtime interrupt command records interrupted state, reason, and resume instruction output.
- Canvas minimap was moved to the bottom right as a post-story QA adjustment.

### File List

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/routes/export.ts`
- `src/components/panels/StepDetailPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/components/FlowCanvas.tsx`

### Change Log

- 2026-05-03: Implemented interrupt policy controls, stop guard allowlist export, and agent interrupt script generation.
