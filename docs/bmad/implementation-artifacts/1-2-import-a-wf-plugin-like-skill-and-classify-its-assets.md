# Story 1.2: Import a `wf-plugin`-Like Skill and Classify Its Assets

Status: review

## Story

As a Skill Author,
I want to import a `wf-plugin`-like skill folder and see asset roles correctly,
so that I can understand which files are platform runtime, workflow utilities, user scripts, and workflow content.

## Acceptance Criteria

1. Given the user imports `/Users/mini/wf-plugin/src/skills/wf`, when import completes, then `run.sh`, known `lib/*` runtime scripts, `stop-guard.sh`, `user-interrupt.sh`, and `scripts/agent-interrupt.sh` are classified as `platform_runtime`.

2. Given the user imports `/Users/mini/wf-plugin/src/skills/wf`, when import completes, then `step-registry.json`, `track-steps.json`, `helpers.yaml`, `SKILL.md`, and numbered step markdown files are classified as `workflow_content`.

3. Given imported scripts include deterministic helpers such as `observe-ci.sh`, `observe-reviews.sh`, `check-merge-status.sh`, and `wait-for-ci.sh`, when the asset browser renders, then they are classified as `workflow_utility`.

4. Given unknown `scripts/*.sh` files are imported, when role inference runs, then they default to `user_script` with owner `user` and overwrite policy `preserve`.

5. Given a project is loaded in the UI, when the user opens the Assets tab, then assets are grouped or filterable by role and show role, owner, overwrite policy, and path.

6. Given an asset role was inferred, when the user changes it in the Assets tab, then the asset role changes to explicit without breaking existing steps, tracks, helpers, scripts, or `SKILL.md` rendering.

7. Given lint and build are run after implementation, when both complete, then the story is not considered done unless both pass.

## Tasks / Subtasks

- [x] Create asset browser UI (AC: 5, 6)
  - [x] Add an Assets tab to the left sidebar.
  - [x] Render asset counts by role.
  - [x] Render path, role, owner, overwrite policy, and inference source.
  - [x] Allow role changes from the UI and mark changed roles as explicit.

- [x] Extend store asset mutation support (AC: 6)
  - [x] Add an asset update action.
  - [x] Keep shell script metadata aligned when a shell asset role changes.
  - [x] Preserve existing UI-facing store fields.

- [x] Verify `wf-plugin` import classification (AC: 1-4)
  - [x] Confirm `platform_runtime` classification for runtime files.
  - [x] Confirm `workflow_utility` classification for observer scripts.
  - [x] Confirm `workflow_content` classification for step/config files.
  - [x] Confirm unknown script default remains `user_script`.

- [x] Run verification (AC: 7)
  - [x] Run import smoke checks.
  - [x] Run `npm run lint`.
  - [x] Run `npm run build`.

## Dev Notes

Story 1.1 already added the canonical model and role inference. This story should expose that information in the current UI without redesigning the whole app.

Do not implement the full validation engine here. Validation is Epic 5. This story is about import classification visibility and role editability.

### Likely Files

- `src/components/panels/LeftSidebar.tsx`
- `src/components/panels/AssetPanel.tsx`
- `src/lib/store.ts`
- `src/lib/schema.ts` if role helper utilities are needed

### References

- [Implementation State](implementation-state.md)
- [Story 1.1](1-1-create-the-canonical-stateful-skill-project-model.md)
- [Epics](../planning-artifacts/epics.md)
- Reference implementation: `/Users/mini/wf-plugin/src/skills/wf`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npx tsx -e "...loadSkillDir('/Users/mini/wf-plugin/src/skills/wf')..."`: confirmed runtime, utility, content, and unknown script role inference.
- `npm run lint`: passed.
- `npm run build`: passed.

### Completion Notes List

- Added `AssetPanel` with role counts, role filter, metadata display, and editable role select.
- Added Assets tab to the left sidebar.
- Added `updateAsset` store action that marks role edits explicit and keeps shell script metadata aligned.
- Verified `run.sh`, `scripts/agent-interrupt.sh`, `scripts/observe-ci.sh`, `step-registry.json`, numbered step markdown, and unknown `scripts/custom-release.sh` classification.

### File List

- `src/components/panels/AssetPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/lib/store.ts`
- `docs/bmad/implementation-artifacts/sprint-status.yaml`
- `docs/bmad/implementation-artifacts/1-2-import-a-wf-plugin-like-skill-and-classify-its-assets.md`
- `docs/bmad/implementation-artifacts/implementation-state.md`

## Change Log

| Date | Change |
|---|---|
| 2026-05-03 | Implemented asset role browser, role filter/counts, explicit role edits, and `wf-plugin` import classification verification. |
