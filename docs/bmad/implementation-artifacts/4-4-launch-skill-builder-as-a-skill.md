# Story 4.4: Launch Skill Builder as a Skill

## Status

review

## Story

As an Automation Builder,
I want Skill Builder itself to open from a skill invocation,
So that I can use the builder inside the same agent harness that will edit the skill files.

## Acceptance Criteria

- Given the Skill Builder skill is installed, when the user invokes it, then it starts or opens the local builder UI.
- Given the user is already working in a skill project, when the builder skill starts, then it passes the active project root to the UI.
- Given the UI opens from the skill, when the agent edits files, then the UI watcher reflects the changes.

## Tasks / Subtasks

- [x] Add a local Skill Builder skill entrypoint.
- [x] Add a launcher script that starts or reuses the local dev server.
- [x] Pass the active project root through the builder URL.
- [x] Make the app load `rootDir` from the URL once on startup.
- [x] Verify launcher script syntax.

## Dev Agent Record

### Completion Notes

- `.agents/skills/skill-builder/SKILL.md` now defines the builder invocation.
- `scripts/open-builder.sh` starts or reuses the Vite/API dev server and opens `http://localhost:3847/?rootDir=...`.
- The React app reads the `rootDir` query parameter and calls `loadFromDir` once so the same folder is visible to UI and agent edits.
- Watcher behavior comes from Epic 3, so files edited after launch are reconciled into the UI.

### File List

- `.agents/skills/skill-builder/SKILL.md`
- `.agents/skills/skill-builder/scripts/open-builder.sh`
- `src/App.tsx`

### Verification

- `npm run lint`
- `bash -n .agents/skills/skill-builder/scripts/open-builder.sh`

### Change Log

- 2026-05-03: Implemented builder-as-a-skill launcher and URL project handoff.
