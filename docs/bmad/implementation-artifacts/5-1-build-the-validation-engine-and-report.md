# Story 5.1: Build the Validation Engine and Report

## Status

review

## Story

As a Workflow Reviewer,
I want validation to explain structural, runtime, policy, and ownership issues,
So that I know whether a skill package can safely run.

## Acceptance Criteria

- Given a track references a missing step key, when validation runs, then the report shows a structural error with the track name and missing key.
- Given a step references an unknown helper or script, when validation runs, then the report identifies the missing reference and affected step.
- Given a `Solo run` step contains approval language, when validation runs, then the report shows an execution warning.
- Given a platform runtime file is missing, when validation runs, then the report shows a runtime error.

## Tasks / Subtasks

- [x] Add duplicate key checks for steps, tracks, and helpers.
- [x] Validate missing track step references.
- [x] Validate unknown common instruction and utility script references.
- [x] Validate execution mode policy conflicts.
- [x] Validate missing required runtime assets.
- [x] Validate asset ownership and overwrite policy risks.
- [x] Add validation summary fields for errors, warnings, and runnable state.

## Dev Agent Record

### Completion Notes

- `validateWorkflowConfig` now covers structure, references, runtime assets, ownership policy, execution mode, and semantic edge references.
- Validation returns a summary with error count, warning count, highest severity, and runnable state.
- Fix tracks receive an order check that requires reproduction and verification before implementation.

### File List

- `src/lib/schema.ts`
- `src/components/panels/ValidationPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/components/panels/Toolbar.tsx`

### Verification

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

### Change Log

- 2026-05-03: Implemented validation engine and visible validation report.
