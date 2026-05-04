# Story 5.5: Make Validation and Runtime Status Visible in the UI

## Status

review

## Story

As an Agent Operator,
I want to see validation and runtime status while editing,
So that I can understand what will happen when the skill runs.

## Acceptance Criteria

- Given validation issues exist, when the project header renders, then the highest severity state is visible.
- Given a step has runtime or policy warnings, when the canvas renders, then the step node shows a warning indicator.
- Given a generated workflow has known current state, when runtime status is loaded, then the UI shows current track, current step, interrupted status, and next action.

## Tasks / Subtasks

- [x] Add validation status badge to the header.
- [x] Add Validation sidebar panel.
- [x] Add step-node issue indicator.
- [x] Add runtime status API endpoint.
- [x] Add runtime status display and load action in Runtime panel.

## Dev Agent Record

### Completion Notes

- Toolbar now shows validation state as `valid`, `warnings`, or `invalid`.
- Step nodes show a warning/error icon when validation issues target that step.
- Runtime panel can load `.workflow/state.json` from the bound project root and shows status, track, current step, interrupted state, and next action.

### File List

- `src/components/panels/Toolbar.tsx`
- `src/components/panels/ValidationPanel.tsx`
- `src/components/panels/RuntimePanel.tsx`
- `src/components/nodes/StepNode.tsx`
- `src/lib/layout.ts`
- `src/server/routes/project.ts`

### Verification

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

### Change Log

- 2026-05-03: Added validation and runtime status visibility in the UI.
