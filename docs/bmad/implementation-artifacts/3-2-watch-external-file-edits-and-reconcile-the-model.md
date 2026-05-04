# Story 3.2: Watch External File Edits and Reconcile the Model

## Status

review

## Story

As a Skill Author,
I want edits from Zed or an agent to appear in the UI,
So that visual editing and text editing stay aligned.

## Acceptance Criteria

- Given a watched skill file changes outside the UI, when the watcher receives the event, then the changed file is parsed and the project model updates.
- Given an external edit changes a step file, when the UI updates, then the step detail panel and canvas show the new title, body, helper refs, and warnings.
- Given an external edit changes an unsupported or unknown file, when the watcher processes it, then the asset browser still updates hash and role state without crashing.

## Tasks / Subtasks

- [x] Add server-side project event stream.
- [x] Watch bound root directories with filesystem events.
- [x] Reconcile clean UI state by reloading the project model.
- [x] Preserve UI dirty state by entering conflict instead of overwriting.
- [x] Recompute asset hashes on import so unsupported file edits still appear in the asset browser.

## Dev Agent Record

### Completion Notes

- Added `GET /api/project/events?rootDir=...` as an SSE stream backed by `chokidar`.
- The client opens an `EventSource` for the bound project root.
- Clean UI state reloads from disk after debounced file events.
- Dirty UI state turns external changes into sync conflicts.
- Imported assets now include current file hashes.

### File List

- `src/server/routes/project.ts`
- `src/server/routes/files.ts`
- `src/lib/store.ts`

### Verification

- `npm run lint`
- `npm run build`
- SSE smoke test emitted `ready` and `changed` events for an external edit to `001-setup.md`.

### Change Log

- 2026-05-03: Implemented filesystem watcher event stream and UI reconcile flow.

