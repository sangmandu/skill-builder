# Story 3.3: Detect and Resolve Sync Conflicts by Asset Role

## Status

review

## Story

As a Workflow Reviewer,
I want conflicts to show what changed and who owns the file,
So that user scripts are protected while generated files can be regenerated safely.

## Acceptance Criteria

- Given UI and filesystem both change an asset since the last baseline, when sync runs, then the asset enters conflict state instead of being overwritten.
- Given the conflicted asset is `user_script`, when conflict resolution opens, then the recommended default is preserve user version.
- Given the conflicted asset is `platform_runtime`, when conflict resolution opens, then the UI explains whether the platform version can be regenerated from the runtime profile.

## Tasks / Subtasks

- [x] Track asset hash baselines.
- [x] Detect disk drift before live sync writes.
- [x] Return conflict details from the sync API.
- [x] Surface conflict status in the toolbar.
- [x] Provide preserve-filesystem and use-UI resolution actions.
- [x] Show role-aware recommendations.

## Dev Agent Record

### Completion Notes

- Live sync compares current disk hash against the last known asset hash before writing model-owned files.
- Conflicts return HTTP `409` with path, role, owner, overwrite policy, hashes, and recommendation.
- Toolbar conflict resolver lists affected assets and allows preserving the filesystem or overwriting with the UI model.
- User-owned scripts recommend preserving external filesystem changes.
- Platform runtime files recommend regenerating from the selected runtime profile when the UI version should win.

### File List

- `src/server/lib/skillPackageWriter.ts`
- `src/server/routes/project.ts`
- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/components/panels/Toolbar.tsx`

### Verification

- `npm run lint`
- `npm run build`
- Conflict smoke test returned `409` for a changed `001-setup.md` with recommendation `review_manually`.

### Change Log

- 2026-05-03: Implemented role-aware conflict detection and toolbar resolution UI.

