# Story 3.1: Add Live Project API and Debounced File Writes

## Status

review

## Story

As an Automation Builder,
I want UI edits to update the skill folder directly,
So that the filesystem becomes the shared truth instead of a one-shot export target.

## Acceptance Criteria

- Given a project is bound to a root directory, when the user changes a step title, body, track order, helper, or asset role, then the app patches the project model and writes affected files after debounce.
- Given validation finds a blocking issue before write, when the user tries to sync, then unsafe writes are blocked and the validation issue explains why.
- Given a write succeeds, when the project header renders, then sync state shows clean and the asset hash baseline updates.

## Tasks / Subtasks

- [x] Add a live project sync API separate from one-shot export.
- [x] Reuse package writing logic for export and live sync.
- [x] Persist asset role metadata and hash baselines.
- [x] Add debounced autosync for bound root directories.
- [x] Block sync when validation has error-level issues.
- [x] Show sync state in the project header.

## Dev Agent Record

### Completion Notes

- Added `POST /api/project/sync`.
- Export and live sync now share the same server-side package writer.
- Bound projects autosync after debounce when UI state becomes dirty.
- Sync is blocked before write when validation returns a blocking error.
- Successful writes return hashed asset baselines and update the store.
- Asset role metadata is persisted under `.skill-builder/assets.json` and reapplied on import.

### File List

- `src/server/lib/skillPackageWriter.ts`
- `src/server/routes/project.ts`
- `src/server/routes/export.ts`
- `src/server/routes/files.ts`
- `src/server/index.ts`
- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/components/panels/Toolbar.tsx`

### Verification

- `npm run lint`
- `npm run build`
- `POST /api/project/sync` smoke test returned `200`, wrote workflow files, and returned hashed assets.
- `POST /api/project/sync` validation-block smoke test returned `409`.

### Change Log

- 2026-05-03: Implemented live sync API, debounced autosync, sync state UI, validation blocking, and asset hash baseline updates.

