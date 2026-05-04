# Story 2.1: Generate and Edit Thin `SKILL.md` and Step Files

## Status

review

## Story

As a Skill Author,
I want `SKILL.md` to stay thin while step instructions live in separate files,
So that generated skills preserve lazy-loading behavior.

## Acceptance Criteria

- Given a user edits skill description, trigger, or start command, when the project model is saved, then `SKILL.md` updates only entrypoint metadata and startup instructions, and step body content is not embedded into `SKILL.md`.
- Given a user adds a step, when the project is synced, then the step key is added to `step-registry.json`, and the step markdown file is created separately using the configured filename.
- Given step number and track order differ, when validation runs, then no error is raised solely because the file number differs from execution order, and the UI explains that track array order controls execution.

## Tasks / Subtasks

- [x] Add skill entrypoint fields to the project model.
- [x] Generate thin `SKILL.md` from name, trigger, description, and start command.
- [x] Add a Skill sidebar panel for entrypoint editing and preview.
- [x] Keep step body export in numbered markdown files and registry references.
- [x] Preserve track-order semantics independently from file numbering.

## Dev Agent Record

### Completion Notes

- Added editable skill entrypoint state in the store.
- Export now always writes generated thin `SKILL.md`.
- Step files remain separate files in export and are referenced from `step-registry.json`.

### File List

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/routes/export.ts`
- `src/components/panels/SkillPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`

### Change Log

- 2026-05-03: Implemented thin entrypoint generation and UI editing.

