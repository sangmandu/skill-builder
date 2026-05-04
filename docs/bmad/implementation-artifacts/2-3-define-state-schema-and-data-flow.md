# Story 2.3: Define State Schema and Data Flow

## Status

review

## Story

As a Workflow Reviewer,
I want to see and edit workflow state fields,
So that I know what each step produces and consumes.

## Acceptance Criteria

- Given a runtime profile is selected, when the state schema panel opens, then `control.*` fields appear as locked platform fields, and `data.*` fields appear as editable workflow metadata fields.
- Given the user adds `data.ticket_id`, when they set type, default, producing step, and consuming steps, then the model records that schema metadata, and downstream step details show the consumed field.
- Given the user attempts to edit `control.current_step`, when they save, then validation blocks the edit as a reserved runtime field.

## Tasks / Subtasks

- [x] Add state schema to `WorkflowConfig`.
- [x] Merge explicit schema fields with step produces/consumes references.
- [x] Add State sidebar panel.
- [x] Lock `control.*` fields.
- [x] Add editable `data.*` fields with type/default/producer/consumer metadata.
- [x] Surface produced and consumed fields in step details.

## Dev Agent Record

### Completion Notes

- State fields are managed as model metadata and synchronized into step `produces` and `consumes`.
- `control.*` fields are generated from runtime defaults and cannot be edited through the UI.
- Export writes `state-schema.json` for the generated skill package.

### File List

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/routes/files.ts`
- `src/server/routes/export.ts`
- `src/components/panels/StatePanel.tsx`
- `src/components/panels/StepDetailPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`

### Change Log

- 2026-05-03: Implemented state schema editor and data-flow display.

