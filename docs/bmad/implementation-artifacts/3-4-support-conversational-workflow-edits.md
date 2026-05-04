# Story 3.4: Support Conversational Workflow Edits

## Status

review

## Story

As an Automation Builder,
I want agent conversation to change the same project structure visible in the UI,
So that I can say what I want and watch the skill structure update.

## Acceptance Criteria

- Given the user asks the agent to add a fix track reproduction gate, when the agent edits files in the skill project, then registry, track order, step files, and validation state update in the UI.
- Given the user asks the agent to make a step no-question, when the agent updates policy metadata, then the step detail panel shows execution mode `Solo run`, and validation applies no-question checks.
- Given the agent changes a user script, when the watcher processes it, then the asset remains user-owned and no platform overwrite policy is applied.

## Tasks / Subtasks

- [x] Persist UI-only workflow metadata to disk.
- [x] Rehydrate step execution mode, references, and workflow data metadata from disk.
- [x] Let watcher reload registry, tracks, step files, helper files, schema, and metadata into the UI model.
- [x] Preserve explicit asset role metadata across agent file edits.
- [x] Verify agent-style metadata edits round-trip through import.

## Dev Agent Record

### Completion Notes

- Added `.skill-builder/model.json` for step and track metadata that does not naturally live in markdown, registry, or track files.
- Import reads `.skill-builder/model.json` and applies execution mode, common instruction refs, script refs, produces, consumes, and track defaults.
- `.skill-builder/assets.json` keeps explicit role metadata so agent edits to user scripts remain user-owned after watcher reload.
- Watcher-driven reloads now make agent file changes visible without manual reimport when the UI is clean.

### File List

- `src/server/lib/skillPackageWriter.ts`
- `src/server/routes/files.ts`
- `src/server/routes/project.ts`
- `src/lib/store.ts`

### Verification

- `npm run lint`
- `npm run build`
- Agent metadata smoke test changed `.skill-builder/model.json`; `/api/files/load` returned updated execution mode and produced data fields.

### Change Log

- 2026-05-03: Implemented disk-persisted workflow metadata and watcher-based agent edit reconciliation.
