# Story 4.3: Integrate Stop Guard and User Prompt Hooks

## Status

review

## Story

As an Agent Operator,
I want hooks to enforce the workflow state machine,
So that the agent continues autonomous work and pauses only through explicit interruption.

## Acceptance Criteria

- Given workflow status is running and current step is `Solo run`, when the stop guard receives a stop event, then it returns a block decision with instructions to continue, complete, or explicitly interrupt.
- Given current step is `User involved` or `Background wait`, when the stop guard receives a stop event, then it allows the stop without changing interrupt state.
- Given the user sends a message during a running workflow, when the user-prompt hook runs, then it injects context without changing interrupt state.
- Given the agent truly needs user input, when it runs `run.sh interrupt "<reason>"`, then runtime state records interruption and resume instructions are available.

## Tasks / Subtasks

- [x] Generate stop guard from execution mode.
- [x] Generate user prompt hook for user-message context.
- [x] Generate agent interrupt script for explicit user-input needs.
- [x] Remove runtime dependency on `jq` from generated hooks.
- [x] Verify guard block, guard allow, prompt hook, explicit interrupt, and resume behavior.

## Dev Agent Record

### Completion Notes

- `stop-guard.sh` finds `.workflow/state.json`, blocks stops on `Solo run` steps, and prints command choices for continue, complete, or explicit interrupt.
- `User involved` and `Background wait` steps are allowed to stop without recording `control.interrupted`.
- `user-interrupt.sh` injects hook context without changing workflow state.
- Explicit `run.sh interrupt "<reason>"` records `control.interrupted` plus `control.interrupt_reason`.
- Generated hook scripts now use Python for JSON updates so packages do not depend on `jq`.

### File List

- `src/server/lib/skillPackageWriter.ts`

### Verification

- `npm run lint`
- Runtime smoke test:
  - stop guard returned `{"decision":"block"}` on solo `SETUP`.
  - stop guard allowed user-involved `REPORT` without changing interrupt state.
  - user-prompt hook emitted `UserPromptSubmit` context without changing interrupt state.
  - explicit `run.sh interrupt "need approval"` recorded interrupted status and reason.
  - `run.sh resume` cleared interruption and rendered the current step.

### Change Log

- 2026-05-03: Implemented generated stop guard and user prompt hook integration.
