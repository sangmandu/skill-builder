# Story 2.2: Edit Track Execution Order Independently from Visual Groups

## Status

review

## Story

As an Automation Builder,
I want track order to be explicit and editable,
So that feature, fix, light, and brainstorm workflows can reuse steps in different sequences.

## Acceptance Criteria

- Given a project has multiple tracks, when the user adds the same step to feature and fix tracks, then both tracks reference the same stable step key, and each track can order that step independently.
- Given the user reorders steps within a track, when the model is saved, then `track-steps.json` changes to match the new execution order.
- Given a workflow is already running, when the user edits template track order, then the UI warns that existing `.workflow/state.json` execution state does not automatically change.

## Tasks / Subtasks

- [x] Add track execution-order controls.
- [x] Keep step membership by stable step key.
- [x] Add per-track move up/down behavior.
- [x] Keep `track-steps.json` export ordered by the track array.
- [x] Show running-state warning near execution-order edits.

## Dev Agent Record

### Completion Notes

- TrackPanel now shows explicit execution order for the selected track.
- The same step key can be toggled into multiple tracks and ordered per track.
- Track order edits are reflected by the exported `track-steps.json` arrays.

### File List

- `src/components/panels/TrackPanel.tsx`
- `src/lib/store.ts`
- `src/server/routes/export.ts`

### Change Log

- 2026-05-03: Implemented track-order editing separate from visual grouping.

