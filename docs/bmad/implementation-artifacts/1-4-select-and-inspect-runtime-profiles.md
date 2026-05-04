# Story 1.4: Select and Inspect Runtime Profiles

Status: review

## Story

As a Skill Author,
I want to select and inspect a runtime profile,
so that I know which generated files and commands my skill package will use.

## Acceptance Criteria

1. Given a new or imported project is open, when the user opens runtime profile details, then the UI lists required commands: `init`, `resume`, `complete`, and `interrupt`.

2. Given optional commands are supported, when the runtime profile details render, then optional commands such as `rewind` are shown when present.

3. Given a runtime profile is selected, when runtime assets render, then platform runtime files show owner `platform` and overwrite policy `replace_on_upgrade`.

4. Given a runtime profile is selected, when the user changes profile id, then the runtime profile changes without breaking existing steps, tracks, helpers, assets, or `SKILL.md`.

5. Given a required runtime file is missing from the asset inventory, when runtime details render, then the UI marks that runtime asset as missing.

6. Given lint and build are run after implementation, when both complete, then the story is not considered done unless both pass.

## Tasks / Subtasks

- [x] Add runtime profile UI (AC: 1, 2, 3, 5)
  - [x] Add a Runtime tab to the left sidebar.
  - [x] Render selected runtime profile id and version.
  - [x] Render command list.
  - [x] Render required runtime assets and whether each exists in project assets.

- [x] Add runtime profile mutation support (AC: 4)
  - [x] Allow runtime profile id changes.
  - [x] Preserve existing workflow structure.
  - [x] Keep runtime hook policy aligned with current hooks.

- [x] Run verification (AC: 6)
  - [x] Run runtime profile smoke checks.
  - [x] Run `npm run lint`.
  - [x] Run `npm run build`.

## Dev Notes

This story should not generate or upgrade runtime files yet. Runtime generation belongs to Epic 4. This story exposes runtime profile metadata so users can inspect what the package expects.

### Likely Files

- `src/components/panels/RuntimePanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/lib/store.ts`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npx tsx -e "...createDefaultRuntimeProfile..."`: confirmed command list, required assets, platform owner, and overwrite policy.
- `npm run lint`: passed.
- `npm run build`: passed.

### Completion Notes List

- Added `RuntimePanel` with profile selector, version/hook summary, command list, and runtime asset presence status.
- Added Runtime tab to the left sidebar.
- Added `updateRuntimeProfileId` store action.
- Runtime profile changes preserve existing steps, tracks, helpers, assets, and `SKILL.md`.

### File List

- `src/components/panels/RuntimePanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/lib/store.ts`
- `docs/bmad/implementation-artifacts/sprint-status.yaml`
- `docs/bmad/implementation-artifacts/1-4-select-and-inspect-runtime-profiles.md`
- `docs/bmad/implementation-artifacts/implementation-state.md`

## Change Log

| Date | Change |
|---|---|
| 2026-05-03 | Implemented runtime profile inspection and selection UI with command and required asset visibility. |
