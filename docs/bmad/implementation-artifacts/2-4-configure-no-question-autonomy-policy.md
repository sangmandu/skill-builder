# Story 2.4: Configure Execution Mode Policy

## Status

review

## Story

As an Automation Builder,
I want each step to have one clear execution mode,
So that the generated skill continues work instead of stopping unnecessarily.

## Acceptance Criteria

- Given a step has execution mode `Solo run`, when its markdown includes phrases like `ask the user`, `confirm`, or `wait for approval`, then validation shows an execution warning.
- Given a new step is added, when no behavior is configured, then the step defaults to `Solo run`.
- Given a validation warning exists, when the user changes the step to `User involved`, then the no-question warning is resolved and stop guard allows normal stop at that step.

## Tasks / Subtasks

- [x] Add execution mode control to step details.
- [x] Validate approval language inside solo steps.
- [x] Default new steps to solo mode.
- [x] Derive stop guard behavior from execution mode.
- [x] Display step-level validation warnings while editing.

## Dev Agent Record

### Completion Notes

- StepDetailPanel exposes one `Execution Mode` selector.
- Store defaults new steps to `Solo run`.
- Validation catches approval language in solo steps.
- Stop guard non-blocking behavior is derived from `User involved` and `Background wait`.

### File List

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/components/panels/StepDetailPanel.tsx`

### Change Log

- 2026-05-03: Implemented no-question autonomy policy controls and warnings.
