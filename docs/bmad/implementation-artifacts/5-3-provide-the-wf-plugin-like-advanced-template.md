# Story 5.3: Provide the `wf-plugin`-Like Advanced Template

## Status

review

## Story

As an Automation Builder,
I want to start from a full automation template,
So that I can build feature, fix, light, and brainstorm tracks without recreating the whole structure.

## Acceptance Criteria

- Given the user opens templates, when they choose the `wf_like` template, then the project includes feature, fix, light, and brainstorm tracks.
- Given the fix track is generated, when validation runs, then reproduction and verification steps appear before implementation steps.
- Given the template includes CI or review observer scripts, when assets are listed, then they are classified as workflow utilities, not platform runtime.

## Tasks / Subtasks

- [x] Add `wf-like-advanced` preset.
- [x] Include feature, fix, light, and brainstorm tracks.
- [x] Include fix-track reproduction and verification gates before implementation.
- [x] Include CI, review, and merge observer utility scripts.
- [x] Classify observer scripts as `workflow_utility`.
- [x] Generate placeholder workflow utility scripts during package writes.

## Dev Agent Record

### Completion Notes

- Added a WF-like advanced template to the preset API while leaving the main empty-state `Preset` action on the existing default preset.
- The template includes multi-track workflow structure inspired by `/Users/mini/wf-plugin`.
- Workflow utility assets are template-owned and preserved, separate from platform runtime assets.
- Package writer now writes deterministic placeholder scripts for template workflow utilities when exporting/syncing.

### File List

- `src/server/routes/presets.ts`
- `src/server/lib/skillPackageWriter.ts`

### Verification

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

### Change Log

- 2026-05-03: Added WF-like advanced template and workflow utility asset handling.
