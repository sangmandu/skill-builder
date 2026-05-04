# Story 1.1: Create the Canonical Stateful Skill Project Model

Status: review

## Story

As an Automation Builder,
I want the app to represent a skill package as a canonical project model,
so that every UI, API, validation, and filesystem operation shares the same meaning.

## Acceptance Criteria

1. Given the existing `WorkflowConfig` model in `src/lib/schema.ts`, when the project model is extended, then it includes `SkillProject`, `SkillEntrypoint`, `WorkflowDefinition`, `RuntimeProfile`, `SkillAsset`, `StateSchema`, `InterruptPolicy`, and `ValidationResult`.

2. Given current import/export behavior exists, when the new model is introduced, then existing step, track, helper, hook, script, and `SKILL.md` data still load into the UI.

3. Given a script exists in `lib/` or `scripts/`, when it is loaded into the model, then the model stores explicit role, owner, generated flag, and overwrite policy.

4. Given an asset path suggests a default category, when role inference runs, then path is used only as an inference signal and not as the final source of truth.

5. Given the UI consumes the current store, when the new model is introduced, then existing panels continue to render steps, tracks, helpers, scripts, and hooks.

6. Given lint and build are run after implementation, when both complete, then the story is not considered done unless both pass.

## Tasks / Subtasks

- [x] Extend the domain schema in `src/lib/schema.ts` (AC: 1, 3, 4)
  - [x] Add `SkillProject`, `SkillEntrypoint`, `WorkflowDefinition`, `RuntimeProfile`, `RuntimeCommandSet`, `SkillAsset`, `StateSchema`, `StateField`, `InterruptPolicy`, `ValidationResult`, and validation issue types.
  - [x] Extend `Step` or add `StepDefinition` fields for `scriptRefs`, `autonomy`, `interruptMode`, `produces`, and `consumes`.
  - [x] Extend script modeling so role, owner, generated, and overwrite policy can be stored.

- [x] Add compatibility mapping between current `WorkflowConfig` and the new `SkillProject` model (AC: 2, 5)
  - [x] Provide a function that wraps existing imported data into a `SkillProject`.
  - [x] Provide a function that exposes existing `WorkflowConfig` shape for current panels while migration is incomplete.
  - [x] Keep current step grouping and filename parsing behavior working.

- [x] Update store state without breaking current UI consumers (AC: 2, 5)
  - [x] Add project-level state to `src/lib/store.ts`.
  - [x] Keep existing return values used by `App.tsx`, `FlowCanvas`, and panel components.
  - [x] Mark dirty state when project-level fields change.

- [x] Update server import result shape safely (AC: 2, 3, 4)
  - [x] Add asset inventory to `src/server/routes/files.ts`.
  - [x] Infer platform runtime candidates from known runtime filenames.
  - [x] Infer workflow content from `SKILL.md`, step files, registry file, track file, and helpers file.
  - [x] Infer scripts from `lib/` and `scripts/` but keep role editable.

- [x] Add focused tests or verification coverage (AC: 1-6)
  - [x] Confirm no dedicated unit test runner exists in package scripts.
  - [x] If no test runner exists yet, add pure helper functions that can be exercised later and document manual verification.
  - [x] Run `npm run lint`.
  - [x] Run `npm run build`.

## Dev Notes

### Current Implementation Context

The app currently models an imported workflow with:

- `Step`, `StepGroup`, `Track`, `Helper`, `ShellScript`, `HookConfig`, and `WorkflowConfig` in `src/lib/schema.ts`.
- React state and mutation functions in `src/lib/store.ts`.
- File import in `src/server/routes/files.ts`.
- Package export in `src/server/routes/export.ts`.
- UI consumers in `src/App.tsx`, `src/components/FlowCanvas.tsx`, and `src/components/panels/*`.

Do not replace the whole store or UI in this story. The safe implementation path is additive:

1. Add canonical types.
2. Add conversion helpers.
3. Add project-level state.
4. Keep existing UI selectors and props working.
5. Add asset inventory from import.

### Required Model Semantics

`SkillAsset.role` must support:

- `platform_runtime`
- `workflow_utility`
- `user_script`
- `workflow_content`
- `docs`
- `config_template`

`SkillAsset.owner` must support:

- `platform`
- `template`
- `user`

`SkillAsset.overwritePolicy` must support:

- `replace_on_upgrade`
- `preserve`
- `merge`
- `ask`

Path inference should seed a role, not make it immutable. The product requirement is explicit because `scripts/` can contain workflow utilities, user scripts, or even misplaced runtime control scripts.

### Suggested Asset Inference Rules for This Story

Use conservative defaults:

- `run.sh`, `stop-guard.sh`, `user-interrupt.sh`, and known runtime files under `lib/` -> `platform_runtime`, owner `platform`, overwrite `replace_on_upgrade`.
- `SKILL.md`, `step-registry.json`, `track-steps.json`, `helpers.yaml`, and `*.md` step files -> `workflow_content`, owner `user`, overwrite `merge`.
- Unknown `scripts/*.sh` -> `user_script`, owner `user`, overwrite `preserve`.
- Known deterministic template helpers such as `observe-ci.sh`, `observe-reviews.sh`, or `check-merge-status.sh` -> `workflow_utility`, owner `template`, overwrite `preserve`.
- Unknown docs -> `docs`, owner `user`, overwrite `preserve`.

### Files Likely to Change

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/routes/files.ts`
- Possibly `src/server/routes/export.ts` if export needs to accept or preserve asset inventory.
- Possibly panel components only if TypeScript consumers require new props or null handling.

### Files to Avoid in This Story

Avoid large UI redesign work. Do not implement full live sync, state schema editor, validation panel, or runtime execution in Story 1.1. Those are later stories.

### Testing Requirements

Minimum verification:

- Import an existing skill-like folder still populates steps, tracks, helpers, hooks, scripts, and `SKILL.md`.
- Imported assets include role metadata.
- Existing preset flow still works.
- Existing export path still works at least as before.
- `npm run lint` passes.
- `npm run build` passes.

### References

- [PRD](../planning-artifacts/prd.md)
- [Architecture](../planning-artifacts/architecture.md)
- [TRD](../planning-artifacts/trd.md)
- [Epics](../planning-artifacts/epics.md)
- [Test Matrix](../planning-artifacts/user-scenarios-test-cases.md)
- Reference implementation: `/Users/mini/wf-plugin/src/skills/wf`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npx tsx -e "...createSkillProjectFromWorkflowConfig..."`: canonical model helper smoke test passed.
- `npx tsx -e "...loadSkillDir('/Users/mini/wf-plugin/src/skills/wf')..."`: imported 40 steps, 4 tracks, 11 helpers, 18 visible scripts, 82 assets.
- `npm run lint`: passed.
- `npm run build`: passed.

### Completion Notes List

- Added canonical skill project, runtime, asset, state schema, interrupt policy, graph, validation, and sync types.
- Added compatibility helpers to convert current `WorkflowConfig` into `SkillProject` and back.
- Extended step and script models with script refs, execution mode, legacy compatibility policy fields, produced/consumed fields, role, owner, generated flag, overwrite policy, and role source.
- Added role inference that distinguishes platform runtime, workflow utility, user script, workflow content, docs, and config template assets.
- Updated the workflow store to expose derived `project`, `assets`, `rootDir`, and `runtimeProfile` while preserving existing UI return values.
- Updated skill directory import to return asset inventory and canonical project data.
- Verified `wf-plugin` import classification, including `scripts/agent-interrupt.sh` as platform runtime and observer scripts as workflow utilities.

### File List
- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/routes/files.ts`
- `docs/bmad/implementation-artifacts/sprint-status.yaml`
- `docs/bmad/implementation-artifacts/1-1-create-the-canonical-stateful-skill-project-model.md`
- `docs/bmad/implementation-artifacts/implementation-state.md`

## Change Log

| Date | Change |
|---|---|
| 2026-05-03 | Implemented Story 1.1 canonical stateful skill project model, asset role taxonomy, import asset inventory, store project view, and verification documentation. |
TBD.
