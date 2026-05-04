# Story 1.3: Create a New Stateful Skill from Scratch

Status: review

## Story

As an Automation Builder,
I want to create a new stateful skill from an empty app state,
so that I can build my own automation workflow without first importing an existing skill.

## Acceptance Criteria

1. Given the app is empty, when the user selects New Stateful Skill, then the UI asks for skill name, trigger, description, and runtime profile.

2. Given the user completes creation, when the project is initialized, then a thin `SKILL.md`, starter `step-registry.json`, starter `track-steps.json`, starter `helpers.yaml`, default state schema, and runtime asset inventory are created in memory.

3. Given the starter project is created, when the canvas renders, then it shows a starter workflow with a default track and starter steps.

4. Given the project has not been synced to disk yet, when the user views project status, then the UI clearly shows unsynced project state and export remains available.

5. Given current import, preset, step, track, helper, and export behavior exists, when New Stateful Skill is added, then those existing flows still work.

6. Given lint and build are run after implementation, when both complete, then the story is not considered done unless both pass.

## Tasks / Subtasks

- [x] Add New Stateful Skill creation flow (AC: 1)
  - [x] Add a toolbar entry point.
  - [x] Add an empty-state entry point.
  - [x] Add dialog fields for skill name, trigger, description, and runtime profile.

- [x] Add starter project creation in store (AC: 2, 3, 4, 5)
  - [x] Generate starter steps and default track.
  - [x] Generate thin `SKILL.md`.
  - [x] Generate starter helpers.
  - [x] Populate runtime and workflow content asset inventory.
  - [x] Mark the project as unsynced/dirty without binding `rootDir`.

- [x] Preserve existing flows (AC: 5)
  - [x] Import still works.
  - [x] Presets still work.
  - [x] Add step still works.
  - [x] Export still works.

- [x] Run verification (AC: 6)
  - [x] Run starter creation smoke checks.
  - [x] Run `npm run lint`.
  - [x] Run `npm run build`.

## Dev Notes

This story should not implement live filesystem sync. Export can remain the packaging path for unsynced projects.

Use the existing store and UI patterns. Do not replace the app shell.

### Likely Files

- `src/App.tsx`
- `src/components/panels/Toolbar.tsx`
- `src/components/panels/NewSkillDialog.tsx`
- `src/lib/store.ts`
- `src/lib/schema.ts`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npx tsx -e "...createStarterWorkflowConfig..."`: created starter config with 4 steps, default track, helper, 15 assets, 7 runtime assets, 8 workflow content assets.
- `npm run lint`: passed.
- `npm run build`: passed.

### Completion Notes List

- Added `NewSkillDialog` with skill name, trigger, description, and runtime profile fields.
- Added toolbar and empty-state New Stateful Skill entry points.
- Added starter workflow generation helper with thin `SKILL.md`, starter steps, default track, helper, state fields, runtime profile, and asset inventory.
- Added `createNewSkill` store action and project description state.
- Preserved existing import, preset, add step, and export flows.
- Follow-up correction: removed visible `New Skill` from empty-state and toolbar because the current screen is workflow seed selection, not package-level creation.
- Follow-up correction: restored user-facing workflow seed terms to `Preset` and `Scratch`.
- Follow-up correction: removed the three-choice preset modal and made `Preset` load the default preset directly.

### File List

- `src/App.tsx`
- `src/components/panels/NewSkillDialog.tsx`
- `src/components/panels/Toolbar.tsx`
- `src/components/panels/PresetDialog.tsx`
- `src/lib/schema.ts`
- `src/lib/store.ts`
- `docs/bmad/implementation-artifacts/sprint-status.yaml`
- `docs/bmad/implementation-artifacts/1-3-create-a-new-stateful-skill-from-scratch.md`
- `docs/bmad/implementation-artifacts/implementation-state.md`

## Change Log

| Date | Change |
|---|---|
| 2026-05-03 | Implemented New Stateful Skill creation, starter workflow model generation, thin `SKILL.md`, starter assets, and unsynced project state. |
| 2026-05-03 | Corrected UI hierarchy: empty-state now exposes only `Preset` and `Scratch`; removed visible `New Skill`; removed preset selection modal. |
