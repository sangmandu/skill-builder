# Story 4.1: Generate Runtime Assets from the Selected Profile

## Status

review

## Story

As a Skill Author,
I want the builder to generate runtime files from a profile,
So that every stateful skill has consistent command and hook behavior.

## Acceptance Criteria

- Given a project selects `basic_stateful` or `wf_like`, when runtime generation runs, then `run.sh`, required `lib/*` files, stop guard, user interrupt hook, and renderer files are created or updated as platform runtime assets.
- Given a runtime profile version changes, when upgrade preview runs, then platform runtime files are listed as replaceable and user scripts are listed as preserved.
- Given a required runtime file is missing after generation, when validation runs, then the package is not considered runnable.

## Tasks / Subtasks

- [x] Expand runtime profile inventory to include command scripts, renderer, hook state finder, and optional data helpers.
- [x] Generate required runtime files through the shared package writer.
- [x] Add a Runtime panel action that triggers live generation for bound project folders.
- [x] Show runtime upgrade preview counts for replaceable platform assets and preserved user assets.
- [x] Verify generated package contains required runtime files.

## Dev Agent Record

### Completion Notes

- `createDefaultRuntimeProfile` now models the runtime as a full platform asset set instead of only top-level hooks.
- Live sync and export both generate the same runtime files through `writeSkillPackage`.
- The Runtime panel exposes `Generate Runtime`, command previews, required asset status, and upgrade preview counts.
- Runtime validation is still a broader Epic 5 validation-engine concern, but required runtime generation is now present and smoke-tested.

### File List

- `src/lib/schema.ts`
- `src/server/lib/skillPackageWriter.ts`
- `src/components/panels/RuntimePanel.tsx`

### Verification

- `npm run lint`
- Runtime sync smoke test wrote `run.sh`, `lib/init-workflow.sh`, `lib/complete-step.sh`, `lib/resume-workflow.sh`, `lib/render-step.py`, `lib/find-hook-state.py`, `stop-guard.sh`, `user-interrupt.sh`, and `scripts/agent-interrupt.sh`.

### Change Log

- 2026-05-03: Implemented runtime profile generation and Runtime panel generation preview.
