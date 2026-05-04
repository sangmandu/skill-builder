# Story 5.2: Persist Canvas Edge Semantics

## Status

review

## Story

As an Automation Builder,
I want manual canvas connections to have explicit meaning,
So that visual editing does not silently create false execution behavior.

## Acceptance Criteria

- Given the user connects A group to C group, when the edge meaning dialog opens, then the user can choose visual note, track reorder, dependency, branch, or validation constraint.
- Given the user chooses track reorder, when the edge is saved, then `track-steps.json` is updated to reflect the execution order change.
- Given the user chooses visual note, when the edge is saved, then execution order does not change.

## Tasks / Subtasks

- [x] Add persistent workflow graph edges to the canonical model.
- [x] Persist semantic graph edges into `.skill-builder/model.json`.
- [x] Rehydrate semantic graph edges on import.
- [x] Add edge meaning dialog for manual group-to-group connections.
- [x] Implement visual note, track reorder, dependency, branch, and validation constraint edge meanings.
- [x] Render persisted semantic edges on the canvas.

## Dev Agent Record

### Completion Notes

- `WorkflowConfig` now carries `graph.edges`.
- Manual group connections open an edge meaning dialog instead of silently becoming transient visual edges.
- `track_order` edges reorder the selected track by moving the source group before the target group.
- Other semantic edge types persist as graph metadata without changing execution order.
- Validation checks that persisted semantic edge endpoints still exist.

### File List

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/lib/skillPackageWriter.ts`
- `src/server/routes/files.ts`
- `src/components/FlowCanvas.tsx`

### Verification

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

### Change Log

- 2026-05-03: Implemented semantic edge persistence and canvas edge meaning selection.
