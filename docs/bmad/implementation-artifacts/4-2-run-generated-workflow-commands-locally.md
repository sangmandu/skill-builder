# Story 4.2: Run Generated Workflow Commands Locally

## Status

review

## Story

As an Agent Operator,
I want generated skills to run through local commands,
So that automation behavior can be tested before relying on it.

## Acceptance Criteria

- Given a generated skill package exists, when `run.sh init feature "task"` is executed in a target worktree, then `.workflow/state.json` is created with current step running and remaining steps pending.
- Given a workflow is running, when `run.sh complete <STEP_KEY>` is executed, then the completed step status changes to completed and the next step becomes running.
- Given a workflow is interrupted, when `run.sh resume` is executed, then the current step markdown is rendered again with relevant helpers.

## Tasks / Subtasks

- [x] Generate `run.sh` as the command router for runtime actions.
- [x] Generate `init`, `complete`, `resume`, and `rewind` runtime scripts.
- [x] Generate a markdown renderer that prints the current step plus relevant helpers.
- [x] Support non-git target directories by falling back to `pwd`.
- [x] Verify local command execution against a generated package and isolated worktree.

## Dev Agent Record

### Completion Notes

- `run.sh` now routes `init`, `complete`, `resume`, `interrupt`, and `rewind`.
- `init` writes `.workflow/state.json` with track, task description, current step, step statuses, and initial `data.task_description`.
- `complete` marks the named step completed, advances the next pending step, and renders the next instruction.
- `resume` clears interruption flags and renders the active step again.
- `render-step.py` loads the current step from `step-registry.json` and includes always helpers plus referenced on-demand helpers.

### File List

- `src/server/lib/skillPackageWriter.ts`

### Verification

- `npm run lint`
- Runtime smoke test:
  - `bash run.sh init default "runtime task"` created `.workflow/state.json`.
  - `SETUP` started as running and `REPORT` started as pending.
  - `bash run.sh complete SETUP` advanced the current step to `REPORT`.
  - `bash run.sh interrupt "need approval"` set interrupted status and reason.
  - `bash run.sh resume` rendered the `REPORT` step and helper context.
  - completing the final step set workflow status to `completed`.

### Change Log

- 2026-05-03: Implemented generated local runtime command execution.
