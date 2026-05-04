# Story 4.5: Package and Export Generated Skills Safely

## Status

review

## Story

As a Skill Author,
I want to package a generated skill without damaging user-owned files,
So that I can install or share the skill confidently.

## Acceptance Criteria

- Given a project contains platform runtime, workflow content, workflow utilities, and user scripts, when export runs, then all required files are written to the target package and overwrite behavior follows asset role policy.
- Given export would overwrite a user script, when the user has not explicitly allowed overwrite, then export blocks or preserves the existing user script.
- Given export completes, when validation runs on the target folder, then no required runtime or registry files are missing.

## Tasks / Subtasks

- [x] Preserve user-owned assets when package generation writes planned platform paths.
- [x] Preserve user-owned hook files when hook generation is disabled.
- [x] Return preserved path information from live sync/export writer.
- [x] Skip user-owned preserve assets during conflict detection because the writer will not overwrite them.
- [x] Verify planned-path user script preservation.

## Dev Agent Record

### Completion Notes

- `writeSkillPackage` now builds a preserve map from incoming asset metadata and existing `.skill-builder/assets.json`.
- Planned writes skip files marked `user_script` or `owner: user` with `overwritePolicy: preserve`.
- Generated file removal also respects preserve policy, so disabling a hook cannot delete a user-owned file at that path.
- Conflict detection ignores preserved user assets because no overwrite is attempted.
- Sync responses include a `preserved` list so the UI or later validation can explain what was intentionally left untouched.

### File List

- `src/server/lib/skillPackageWriter.ts`

### Verification

- `npm run lint`
- Runtime sync smoke test confirmed required files were generated and final workflow status reached `completed`.
- Planned-path preservation smoke test:
  - pre-created `scripts/agent-interrupt.sh` and `user-interrupt.sh` as user-owned preserve assets;
  - sync returned preserved paths for both files;
  - file contents remained user-owned content after generation.

### Change Log

- 2026-05-03: Implemented role-safe runtime package generation and export preservation.
