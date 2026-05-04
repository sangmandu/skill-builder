---
stepsCompleted:
  - current-implementation-documented
  - future-plan-documented
inputDocuments:
  - docs/bmad/planning-artifacts/prd.md
  - docs/bmad/planning-artifacts/architecture.md
  - docs/bmad/planning-artifacts/epics.md
  - docs/bmad/implementation-artifacts/sprint-plan.md
  - docs/bmad/implementation-artifacts/sprint-status.yaml
  - docs/bmad/implementation-artifacts/1-1-create-the-canonical-stateful-skill-project-model.md
workflowType: implementation-state
projectName: skill-builder-cc
date: 2026-05-03
---

# Implementation State - Skill Builder CC

## Current Product Understanding

Skill Builder CC is now documented and planned as a stateful skill platform builder. The product is not mainly a viewer for existing skills. Its purpose is to help users turn their own work into executable, documented, state-managed, pipeline-like skills that can run inside an agent harness.

The reference implementation is `/Users/mini/wf-plugin/src/skills/wf`. That reference established the important distinction between platform runtime assets and user workflow assets.

## What Was Implemented Before BMad Planning

The existing app already had these MVP capabilities:

- React/Vite UI with React Flow canvas.
- Skill-like folder import.
- Step, group, track, helper, hook, and script visualization.
- Preset workflow loading.
- Step add/edit/delete.
- Track membership editing.
- Execution mode editing.
- Helper add/edit/delete.
- One-shot skill folder export.
- Basic stop guard and user interrupt file generation during export.

This existing implementation was closer to a skill workflow visualizer/editor than a full stateful skill platform builder.

## Planning Artifacts Now Available

The planning set now documents both current implementation and future direction:

- `docs/bmad/planning-artifacts/prd.md`: product intent and requirements.
- `docs/bmad/planning-artifacts/architecture.md`: BMad-compatible architecture entrypoint.
- `docs/bmad/planning-artifacts/trd.md`: detailed technical design.
- `docs/bmad/planning-artifacts/ux-design.md`: UX requirements.
- `docs/bmad/planning-artifacts/user-scenarios-test-cases.md`: action-level scenario matrix.
- `docs/bmad/planning-artifacts/epics.md`: 5 epics and 23 stories.
- `docs/bmad/planning-artifacts/implementation-readiness-report-2026-05-03.md`: readiness assessment.
- `docs/bmad/implementation-artifacts/sprint-plan.md`: sprint sequencing.
- `docs/bmad/implementation-artifacts/sprint-status.yaml`: BMad implementation status.

## Implemented: Story 1.1

Story 1.1 is implemented and ready for review.

### Code Changes

`src/lib/schema.ts`

- Added canonical `SkillProject` model.
- Added `SkillEntrypoint`, `WorkflowDefinition`, `StepDefinition`, `TrackDefinition`, `RuntimeProfile`, `RuntimeCommandSet`, `StateSchema`, `StateField`, `InterruptPolicy`, `WorkflowGraph`, `SkillAsset`, `ValidationResult`, and `SyncState`.
- Extended `Step` with `scriptRefs`, `executionMode`, legacy compatibility policy fields, `produces`, and `consumes`.
- Extended `ShellScript` with `role`, `owner`, `generated`, `overwritePolicy`, and `roleSource`.
- Added compatibility helpers:
  - `normalizeStepDefinition`
  - `createDefaultRuntimeProfile`
  - `createDefaultStateSchema`
  - `createSkillProjectFromWorkflowConfig`
  - `workflowConfigFromSkillProject`
  - `inferSkillAsset`
  - `assetToShellScript`

`src/lib/store.ts`

- Added project-level state surfaces: `assets`, `rootDir`, `runtimeProfile`, and derived `project`.
- Preserved existing UI-facing store fields and actions.
- Updated import/preset loading to populate asset inventory and runtime profile.
- Export now sends asset inventory while preserving existing export behavior.

`src/server/routes/files.ts`

- Exported `loadSkillDir` for direct verification.
- Added recursive asset inventory generation.
- Added canonical project creation to import response.
- Added script reference extraction from step markdown.
- Added state data reference extraction from step markdown.
- Added role-aware script objects for existing UI compatibility.
- Added conservative asset role inference:
  - platform runtime for `run.sh`, stop/user interrupt files, known `lib/*` runtime files, and `scripts/agent-interrupt.sh`;
  - workflow utility for CI/review/merge observer scripts;
  - user script for unknown `scripts/*.sh`;
  - workflow content for `SKILL.md`, registry, tracks, helpers, and numbered step files;
  - docs for markdown documentation.

### Verification

Manual verification was used because the project currently has no dedicated unit test runner in `package.json`.

Passed:

- Canonical model smoke test with `createSkillProjectFromWorkflowConfig`.
- `wf-plugin` import smoke test with `loadSkillDir('/Users/mini/wf-plugin/src/skills/wf')`.
- `wf-plugin` import result:
  - 40 steps
  - 4 tracks
  - 11 helpers
  - 18 visible scripts
  - 82 total assets
  - 20 platform runtime assets
  - 4 workflow utility assets
  - 44 workflow content assets
  - 14 docs assets
- `npm run lint`
- `npm run build`

## Implemented: Story 1.2

Story 1.2 is implemented and ready for review.

### Code Changes

`src/components/panels/AssetPanel.tsx`

- Added an Assets tab panel.
- Shows asset counts by role.
- Filters assets by role.
- Shows path, role, owner, overwrite policy, and role source.
- Allows users to change asset role from the UI.

`src/components/panels/LeftSidebar.tsx`

- Added the Assets tab beside Steps, Tracks, and Helpers.

`src/lib/store.ts`

- Added `updateAsset`.
- Role changes are marked as explicit.
- Matching shell script metadata is kept aligned when a shell asset role changes.

### Verification

Passed:

- `wf-plugin` import role smoke test:
  - `run.sh` -> `platform_runtime`
  - `scripts/agent-interrupt.sh` -> `platform_runtime`
  - `scripts/observe-ci.sh` -> `workflow_utility`
  - `step-registry.json` -> `workflow_content`
  - `030-specify.md` -> `workflow_content`
  - unknown `scripts/custom-release.sh` -> `user_script`
- `npm run lint`
- `npm run build`

## Implemented: Story 1.3

Story 1.3 is implemented and ready for review.

### Code Changes

`src/components/panels/NewSkillDialog.tsx`

- Added New Stateful Skill creation dialog.
- Captures skill name, trigger, description, and runtime profile.

`src/App.tsx`

- Added New Stateful Skill dialog state.
- Added empty-state New Stateful Skill entry point.

`src/components/panels/Toolbar.tsx`

- Added toolbar New entry point.

`src/lib/schema.ts`

- Added `NewStatefulSkillInput`.
- Added `createStarterWorkflowConfig`.
- Starter config creates:
  - thin `SKILL.md`;
  - `SETUP`, `PLAN`, `IMPLEMENT`, `REPORT` steps;
  - default track;
  - `state_transition` helper;
  - default execution mode policy with `REPORT` as `User involved`.

`src/lib/store.ts`

- Added `description` state.
- Added `createNewSkill`.
- New projects are unsynced, dirty, and unbound from `rootDir`.
- New projects receive runtime and workflow content asset inventory through the canonical project model.

### Verification

Passed:

- Starter creation smoke test:
  - 4 starter steps
  - default track
  - `state_transition` helper
  - 15 assets
  - 7 runtime assets
  - 8 workflow content assets
  - sync state `unbound`
- `npm run lint`
- `npm run build`

## Implemented: Story 1.4

Story 1.4 is implemented and ready for review.

### Code Changes

`src/components/panels/RuntimePanel.tsx`

- Added Runtime tab panel.
- Shows selected runtime profile and version.
- Shows hook summary.
- Shows `init`, `resume`, `complete`, `interrupt`, and optional `rewind` commands.
- Shows runtime profile assets with required/optional status and present/missing state against project assets.

`src/components/panels/LeftSidebar.tsx`

- Added Runtime tab.

`src/lib/store.ts`

- Added `updateRuntimeProfileId`.
- Runtime profile id changes preserve existing workflow structure and rebuild runtime metadata from current hooks.

### Verification

Passed:

- Runtime profile smoke test:
  - command list includes `init`, `resume`, `complete`, `interrupt`, `rewind`;
  - 7 runtime assets;
  - 6 required assets;
  - owner `platform`;
  - overwrite policy `replace_on_upgrade`.
- `npm run lint`
- `npm run build`

## UX Correction: Skill Package vs Workflow Seed

The empty-state and toolbar hierarchy was corrected after review.

Problem:

- `New Stateful Skill`, `Preset`, and `Scratch` were presented as peer actions.
- That mixed two levels:
  - skill package creation;
  - workflow seed creation inside a skill.

Implemented correction:

- Removed the visible `New Skill` action from the empty-state and toolbar because it mixed package creation with workflow seed selection.
- Removed the preset selection modal.
- `Preset` now loads the single default preset directly.
- `Scratch` remains a workflow-level blank seed action.
- Deleted the old `PresetDialog` component.
- Deleted the temporary `NewSkillDialog` component from the UI layer.

Code changes:

- `src/App.tsx`: removed preset dialog state and New Skill dialog state; loads `full-pipeline` from `Preset`.
- `src/components/panels/Toolbar.tsx`: toolbar action now says `Preset`, not `Default Workflow`.
- `src/components/panels/PresetDialog.tsx`: removed.
- `src/components/panels/NewSkillDialog.tsx`: removed.

Current empty-state choice:

- `Preset`
- `Scratch`

Verification:

- `npm run lint`
- `npm run build`

## QA Fix: Canvas Group Movement and Preset Layout

The canvas behavior was corrected before starting Story 2.

Problems:

- Groups were visually presented as movable, but drag stop reset them back to generated layout positions.
- Step reorder inside a group was too brittle because reorder used stale node positions in some drag-stop cases.
- Preset workflows were laid out as one long horizontal chain, making the full pipeline hard to scan.

Implemented correction:

- Group nodes can now be freely dragged and their canvas positions are preserved in the current session.
- Group movement no longer rewrites track order.
- Step reorder still applies only inside the group and active track.
- Step reorder now substitutes the dragged node's final position before sorting, making drag/drop order changes more reliable.
- Preset/generated layouts now wrap groups into rows instead of placing every group on one horizontal line.

Code changes:

- `src/components/FlowCanvas.tsx`: preserves group node positions and improves step reorder calculation.
- `src/lib/layout.ts`: adds row wrapping for generated group layout.

Verification:

- `npm run lint`
- `npm run build`

## QA Fix: Duplicate Group Edges

The canvas edge replacement behavior was corrected before starting Story 2.

Problem:

- Moving a group-to-group edge added a new manual edge while the generated group-flow edge stayed visible.
- This made the canvas show duplicate connections into the same group.

Implemented correction:

- Group-to-group manual connections now replace existing group-flow edges that share the same source or target.
- Manual group edge overrides are reapplied when the generated layout refreshes.
- Step-level/manual non-group connections still use normal add behavior.

Code changes:

- `src/components/FlowCanvas.tsx`: added session-level group edge overrides and duplicate generated edge filtering.

Verification:

- `npm run lint`
- `npm run build`

## Implemented: Epic 2 Stories 2.1-2.5

Epic 2 is implemented and all five stories are ready for review.

### Story 2.1: Thin SKILL.md and Step Files

Problem:

- The app had step markdown and `SKILL.md` state, but entrypoint metadata was not a first-class editable model surface.
- Export could skip `SKILL.md` if the imported/preset state did not provide one.

Implemented correction:

- Added skill entrypoint state for name, trigger, description, and start command.
- Added a Skill sidebar panel that previews generated thin `SKILL.md`.
- Export always writes generated thin `SKILL.md`.
- Step content continues to export as separate numbered markdown files through `step-registry.json`.

Code changes:

- `src/lib/schema.ts`: added entrypoint config fields and exported `createThinSkillMd`.
- `src/lib/store.ts`: derives thin `SKILL.md` from entrypoint state.
- `src/server/routes/export.ts`: always writes `SKILL.md`.
- `src/components/panels/SkillPanel.tsx`: added entrypoint editor.
- `src/components/panels/LeftSidebar.tsx`: added Skill tab.

### Story 2.2: Track Execution Order

Problem:

- Track membership existed, but the selected track's execution order was not explicit enough for workflows that reuse the same step pool differently.

Implemented correction:

- Added selected-track execution order controls.
- Added move up/down actions that mutate only the selected track array.
- Added step-pool membership toggles under the selected track.
- Added UI copy that clarifies track arrays control execution and file numbers are not the runtime order.
- Added a running-state warning that template order edits do not move an existing `.workflow/state.json` cursor.

Code changes:

- `src/components/panels/TrackPanel.tsx`
- `src/lib/store.ts`

### Story 2.3: State Schema and Data Flow

Problem:

- Step `produces` and `consumes` fields existed in the model, but there was no state schema editor and no UI for `control.*` vs `data.*`.

Implemented correction:

- Added state schema to `WorkflowConfig`.
- Added `control.*` runtime fields as locked platform fields.
- Added editable `data.*` workflow metadata fields.
- Added producer and consumer assignment that syncs back to step `produces` and `consumes`.
- Step detail now shows produced and consumed fields.
- Export writes `state-schema.json`.
- Import reads `state-schema.json` when present.

Code changes:

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/routes/files.ts`
- `src/server/routes/export.ts`
- `src/components/panels/StatePanel.tsx`
- `src/components/panels/StepDetailPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`

### Story 2.4: Execution Mode Policy

Problem:

- The UI had a simple guarded/discussion toggle, but it did not expose whether a step should run solo, involve the user, or wait on background work. It also needed to detect markdown that would cause solo steps to stop and ask for approval.

Implemented correction:

- Added one user-facing `Execution Mode` control: `Solo run`, `User involved`, and `Background wait`.
- New steps default to `Solo run`.
- Validation warns when a solo step contains approval language such as ask/confirm/wait for approval.
- Stop-guard non-blocking behavior is derived from execution mode instead of a separate interrupt selector.
- Step detail shows validation issues for the selected step.

Code changes:

- `src/lib/schema.ts`: added `validateWorkflowConfig`.
- `src/lib/store.ts`: exposes derived validation and policy update actions.
- `src/components/panels/StepDetailPanel.tsx`: added execution mode control and warnings.

### Story 2.5: Execution Mode Stop Policy

Problem:

- Stop-guard behavior and generated runtime interruption behavior were split across multiple old fields, which made it look like interrupt availability was a per-step option.

Implemented correction:

- `executionMode` now drives the legacy compatibility fields `isInterrupt`, `interruptMode`, `autonomy`, and `hooks.interruptSteps`.
- Stop guard generation derives its non-blocking set from `Solo run`, `User involved`, and `Background wait`.
- Export now generates `scripts/agent-interrupt.sh`.
- Explicit `run.sh interrupt "<reason>"` records `control.interrupted`, `control.interrupt_reason`, and interrupted status in `.workflow/state.json`, then prints resume instructions.

Code changes:

- `src/lib/store.ts`
- `src/server/routes/export.ts`
- `src/components/panels/StepDetailPanel.tsx`

### Post-Story QA Adjustment

Implemented after completing Epic 2 because it was requested as a follow-up:

- Moved React Flow minimap to bottom right.
- Moved canvas controls to bottom left.
- Removed the Guard/Discussion floating overlay from the canvas.
- Added Guard/Discussion indicators to the left sidebar footer below the list area.

Code changes:

- `src/components/FlowCanvas.tsx`
- `src/components/panels/LeftSidebar.tsx`

### Verification

Passed:

- `npm run lint`
- `npm run build`

## Implemented: Story 3.1

Story 3.1 is implemented and ready for review.

### Problem

The app could import a skill folder and export a package, but UI edits did not write back to the bound folder automatically. That meant the filesystem was not yet the shared truth for the UI, external editors, and future agent conversation.

### Implemented Correction

- Added `POST /api/project/sync` for live project sync.
- Refactored package writing into a shared server writer used by both export and live sync.
- Bound projects now autosync after debounce when the UI model becomes dirty.
- Validation errors block sync before files are written.
- Successful sync returns updated asset hashes.
- Asset role metadata and hash baselines are persisted in `.skill-builder/assets.json`.
- Import reapplies persisted asset metadata when available.
- Export now binds the app to the exported folder and marks sync clean.
- Toolbar now shows sync state: unbound, sync pending, syncing, synced, blocked, or conflict.

### Code Changes

`src/server/lib/skillPackageWriter.ts`

- Added shared package writer for workflow content, runtime hooks, runtime command files, state schema, asset metadata, and hash baselines.

`src/server/routes/project.ts`

- Added live sync endpoint.
- Blocks writes with HTTP `409` when validation contains error-level issues.

`src/server/routes/export.ts`

- Replaced duplicated writer logic with shared package writer.

`src/server/routes/files.ts`

- Reads `.skill-builder/assets.json` and overlays explicit asset role metadata onto inferred assets.

`src/lib/store.ts`

- Added sync state.
- Added debounced autosync for bound root directories.
- Added manual `syncNow`.
- Updates asset hash baseline on successful sync.

`src/components/panels/Toolbar.tsx`

- Added sync status badge and manual Sync button.

### Verification

Passed:

- `npm run lint`
- `npm run build`
- `POST /api/project/sync` smoke test:
  - returned `200`;
  - wrote `SKILL.md`, step markdown, registry, tracks, helpers, state schema, runtime command files, and hooks;
  - returned 10 assets with hashes.
- Validation-block smoke test:
  - returned `409`;
  - returned the blocking validation issue message.

## Implemented: Epic 3 Stories 3.2-3.4

Epic 3 is implemented and all four stories are ready for review.

### Story 3.2: Watch External File Edits

Problem:

- After Story 3.1, UI edits could write to disk, but external edits from Zed or agent file operations still required manual reimport.

Implemented correction:

- Added `GET /api/project/events?rootDir=...` as an SSE stream backed by `chokidar`.
- The client opens an `EventSource` for the bound project root.
- Clean UI state reloads from disk after debounced file events.
- Dirty UI state turns external changes into conflict instead of overwriting unsynced UI edits.
- Imported assets now include current file hashes, so unknown file edits update the asset browser safely.

Code changes:

- `src/server/routes/project.ts`: project watcher event stream.
- `src/server/routes/files.ts`: hash assets on import.
- `src/lib/store.ts`: watcher connection and reconcile behavior.

### Story 3.3: Sync Conflicts by Asset Role

Problem:

- Live sync could overwrite files that changed externally after the last hash baseline.

Implemented correction:

- Live sync compares disk hash against the last known asset hash before writing model-owned files.
- Conflicts return HTTP `409` with path, role, owner, overwrite policy, hashes, and recommendation.
- Toolbar shows conflict status and opens a conflict resolver.
- Resolver supports preserving the filesystem version or overwriting with the UI model.
- Recommendations are role-aware:
  - `user_script`: preserve filesystem version.
  - `platform_runtime`: regenerate from runtime profile when UI should win.
  - other workflow content: review manually.

Code changes:

- `src/server/lib/skillPackageWriter.ts`: conflict detection and `SkillPackageConflictError`.
- `src/server/routes/project.ts`: conflict response.
- `src/lib/schema.ts`: `SyncConflict`.
- `src/lib/store.ts`: conflict state and resolution actions.
- `src/components/panels/Toolbar.tsx`: conflict resolver UI.

### Story 3.4: Conversational Workflow Edits

Problem:

- Agent edits can change files, but UI-only model fields such as execution mode and workflow data metadata did not have a disk representation that an agent could edit.

Implemented correction:

- Added `.skill-builder/model.json` for step and track metadata.
- Export/live sync writes step execution mode, common instruction refs, script refs, produced fields, consumed fields, and track defaults.
- Import reads `.skill-builder/model.json` and applies metadata back into the UI model.
- `.skill-builder/assets.json` preserves explicit asset role metadata, so agent edits to user scripts remain user-owned.
- Watcher reload makes agent changes visible in canvas, step detail, validation, and asset browser when the UI is clean.

Code changes:

- `src/server/lib/skillPackageWriter.ts`: writes `.skill-builder/model.json`.
- `src/server/routes/files.ts`: reads `.skill-builder/model.json`.
- `src/server/routes/project.ts`: watcher catches hidden metadata file changes.
- `src/lib/store.ts`: watcher-driven reconcile and conflict handling.

### Verification

Passed:

- `npm run lint`
- `npm run build`
- SSE watcher smoke test:
  - emitted `ready`;
  - emitted `changed` with `paths: ["001-setup.md"]` after external file edit.
- Conflict smoke test:
  - returned `409`;
  - reported `001-setup.md` as `workflow_content`;
  - recommendation was `review_manually`.
- Agent metadata smoke test:
  - changed `.skill-builder/model.json`;
  - `/api/files/load` returned updated execution mode and produced data field.

## Implemented: Epic 4 Stories 4.1-4.5

Epic 4 is implemented and all five stories are ready for review.

### Story 4.1: Runtime Asset Generation

Problem:

- Runtime profile selection existed as metadata, but generated packages still needed a complete, consistent runtime asset set for command execution, rendering, hooks, and state utilities.

Implemented correction:

- Expanded the default runtime profile to include `run.sh`, command scripts, renderer, hook state finder, data helpers, stop guard, user interrupt hook, and agent interrupt script.
- The shared package writer now generates the full runtime asset set during sync/export.
- Runtime panel now includes `Generate Runtime`.
- Runtime panel shows replaceable platform runtime count and preserved user asset count.

Code changes:

- `src/lib/schema.ts`
- `src/server/lib/skillPackageWriter.ts`
- `src/components/panels/RuntimePanel.tsx`

### Story 4.2: Local Runtime Commands

Problem:

- A generated package could describe a workflow, but it did not yet behave like a runnable state-managed skill from a target worktree.

Implemented correction:

- Generated `run.sh` routes `init`, `complete`, `resume`, `interrupt`, and `rewind`.
- `init` creates `.workflow/state.json` with track, task description, current step, and per-step statuses.
- `complete` marks the current step done and advances the next pending step.
- `resume` clears interruption state and re-renders the current step.
- `render-step.py` prints the current step markdown plus always helpers and referenced on-demand helpers.
- Runtime scripts fall back to `pwd` when the target worktree is not a git repo.

Code changes:

- `src/server/lib/skillPackageWriter.ts`

### Story 4.3: Stop Guard and User Prompt Hooks

Problem:

- The product goal is no-question automation by default, but generated packages needed hook behavior that structurally prevents an agent from stopping at `Solo run` steps.

Implemented correction:

- `stop-guard.sh` blocks stop events when the workflow is running on a `Solo run` step.
- The block response tells the agent to continue, complete the step, or explicitly run `run.sh interrupt "<reason>"`.
- `User involved` and `Background wait` steps are allowed to stop without mutating interrupt state.
- `user-interrupt.sh` injects prompt-event context without marking the workflow interrupted.
- Explicit `run.sh interrupt "<reason>"` remains the only runtime path that records `control.interrupted` plus `control.interrupt_reason`.
- Generated hook scripts no longer require `jq`; JSON state updates use Python.

Code changes:

- `src/server/lib/skillPackageWriter.ts`

### Story 4.4: Builder-as-a-Skill

Problem:

- The builder itself needed to behave like a skill so the same agent harness can open the UI and edit the active skill package on disk.

Implemented correction:

- Added `.agents/skills/skill-builder/SKILL.md`.
- Added `.agents/skills/skill-builder/scripts/open-builder.sh`.
- The launcher starts or reuses the local dev server and opens `http://localhost:3847/?rootDir=...`.
- The React app reads `rootDir` from the URL once and loads the bound project folder.
- Existing watcher behavior then keeps UI and filesystem edits aligned.

Code changes:

- `.agents/skills/skill-builder/SKILL.md`
- `.agents/skills/skill-builder/scripts/open-builder.sh`
- `src/App.tsx`

### Story 4.5: Safe Package and Export

Problem:

- Runtime generation writes platform paths, but user-owned files can exist in the same package. Generation must not overwrite or delete those files just because they are on a planned write path.

Implemented correction:

- `writeSkillPackage` builds a preserve map from incoming assets and existing `.skill-builder/assets.json`.
- Files marked `user_script` or `owner: user` with `overwritePolicy: preserve` are skipped during planned writes.
- Generated-file removal also respects preserve policy, so disabling a hook cannot delete a user-owned file at that path.
- Conflict detection skips preserved user assets because the writer will not overwrite them.
- Sync/export responses include `preserved` paths.

Code changes:

- `src/server/lib/skillPackageWriter.ts`

### Verification

Passed:

- `npm run lint`
- `bash -n .agents/skills/skill-builder/scripts/open-builder.sh`
- Runtime sync and command smoke test:
  - generated all required runtime files;
  - `run.sh init` created `.workflow/state.json`;
  - first step started running and remaining steps were pending;
  - stop guard blocked solo `SETUP`;
  - `run.sh complete SETUP` advanced to `REPORT`;
  - stop guard allowed user-involved `REPORT` without changing interrupt state;
  - user-prompt hook emitted `UserPromptSubmit` context without changing interrupt state;
  - explicit `run.sh interrupt "need approval"` set interrupted status and reason;
  - `run.sh resume` rendered current markdown and helpers;
  - completing the final step set status to `completed`.
- Planned-path preservation smoke test:
  - pre-created `scripts/agent-interrupt.sh` and `user-interrupt.sh` as user-owned preserve assets;
  - sync returned both paths in `preserved`;
  - file contents remained user-owned content after generation.

## Implemented: Epic 5 Stories 5.1-5.5

Epic 5 is implemented and all five stories are ready for review.

### Story 5.1: Validation Engine and Report

Problem:

- Earlier validation mostly covered execution warnings and sync blocking. It did not yet explain missing references, missing runtime files, ownership drift, semantic edge problems, or fix-track order problems in a single report.

Implemented correction:

- `validateWorkflowConfig` now checks duplicate steps/tracks/helpers, missing track step keys, missing helper refs, missing script refs, required runtime files, asset ownership and overwrite policy, autonomy approval language, fix-track order, and semantic edge endpoints.
- Validation now returns summary data: errors, warnings, info count, highest severity, and runnable status.
- Added a Validation sidebar panel that groups issues by category and shows scenario coverage rules.
- Toolbar now shows the highest validation severity.

Code changes:

- `src/lib/schema.ts`
- `src/components/panels/ValidationPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/components/panels/Toolbar.tsx`

### Story 5.2: Canvas Edge Semantics

Problem:

- Manual canvas edges were visual-only and could imply execution changes without any persisted meaning.

Implemented correction:

- Added persistent `workflow.graph.edges`.
- Group-to-group connections now open an edge meaning dialog.
- Supported meanings are visual note, track reorder, dependency, branch, and validation constraint.
- `track_order` edges update the selected track order.
- Semantic edges are written to and read from `.skill-builder/model.json`.
- Canvas renders persisted semantic edges and validation catches dangling edge endpoints.

Code changes:

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/lib/skillPackageWriter.ts`
- `src/server/routes/files.ts`
- `src/components/FlowCanvas.tsx`

### Story 5.3: WF-like Advanced Template

Problem:

- The default preset was useful, but there was no reusable advanced template that reflected the multi-track automation style of `/Users/mini/wf-plugin`.

Implemented correction:

- Added `wf-like-advanced` preset.
- The template includes `feature`, `fix`, `light`, and `brainstorm` tracks.
- The fix track places reproduction and verification gates before implementation.
- CI, review, and merge observer scripts are classified as `workflow_utility`, not platform runtime.
- Package writer generates deterministic placeholder scripts for template-owned workflow utilities.

Code changes:

- `src/server/routes/presets.ts`
- `src/server/lib/skillPackageWriter.ts`

### Story 5.4: Scenario-Based Test Coverage

Problem:

- The scenario matrix documented product behavior, but it was not connected to executable coverage.

Implemented correction:

- Added `src/lib/scenarioCoverage.ts` with scenario ID prefix coverage rules.
- Added `tests/scenarioCoverage.test.ts`.
- Added `npm run test:scenarios`.
- The test parses `user-scenarios-test-cases.md` and verifies every documented scenario ID has coverage mapping.
- The same test exercises validation rules, WF-like template structure, workflow utility classification, and generated runtime command behavior.

Code changes:

- `src/lib/scenarioCoverage.ts`
- `tests/scenarioCoverage.test.ts`
- `package.json`

### Story 5.5: Validation and Runtime Status UI

Problem:

- Users could edit a workflow, but they could not see enough about validation severity or current runtime state while editing.

Implemented correction:

- Toolbar shows validation status as `valid`, `warnings`, or `invalid`.
- Step nodes show warning/error indicators when validation issues target that step.
- Runtime panel can load `.workflow/state.json` and show runtime status, current track, current step, interrupted state, and next action.
- Added `GET /api/project/runtime-status`.

Code changes:

- `src/components/panels/Toolbar.tsx`
- `src/components/panels/ValidationPanel.tsx`
- `src/components/panels/RuntimePanel.tsx`
- `src/components/nodes/StepNode.tsx`
- `src/lib/layout.ts`
- `src/server/routes/project.ts`

### Verification

Passed:

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

## Implemented: Execution Mode Consolidation QA

This follow-up was implemented after Epic 5 because manual QA showed the old language still exposed too many internal concepts.

Problem:

- The UI exposed `autonomy`, interrupt policy, helper references, script references, and state data flow as separate concepts. That matched internal implementation history, but not the builder mental model.
- Interrupt also looked like something that could be enabled or disabled per step, even though the runtime rule is simpler: an agent can always explicitly run `run.sh interrupt "<reason>"` when it truly needs user input.

Implemented correction:

- Collapsed user-facing step behavior into one `Execution Mode` selector.
- `Solo run` means the stop guard blocks normal stopping while the step is running.
- `User involved` means the stop guard allows stopping for user-facing discussion, but does not automatically change interrupt state.
- `Background wait` means the stop guard allows stopping for CI/review/background waiting, but does not automatically change interrupt state.
- Explicit `run.sh interrupt "<reason>"` is the only path that marks `.workflow/state.json` as interrupted.
- Preset loading normalizes legacy `isInterrupt`, `autonomy`, and `interruptMode` fields into `executionMode`.
- Step detail now says `Common Instructions`, lets users add existing helpers through a select box, and removes the old script references section from the main step panel.
- Step markdown is labeled `Step Instruction`.
- `State Data Flow` was renamed to `Workflow Data` with `Saves` and `Uses`.

Code changes:

- `src/lib/schema.ts`
- `src/lib/store.ts`
- `src/server/lib/skillPackageWriter.ts`
- `src/server/routes/files.ts`
- `src/components/panels/StepDetailPanel.tsx`
- `src/components/nodes/StepNode.tsx`
- `src/components/panels/StepListPanel.tsx`
- `src/components/panels/LeftSidebar.tsx`
- `src/components/panels/ValidationPanel.tsx`
- `src/lib/scenarioCoverage.ts`
- `tests/scenarioCoverage.test.ts`

Verification:

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`
- Runtime smoke confirmed `Solo run` blocks stop, `User involved` and `Background wait` allow stop without changing interrupt state, and explicit `run.sh interrupt` records the interrupted state.

## Implemented: Focused Default Preset

Problem:

- The default preset still represented a heavier end-to-end pipeline with ticket, PR, CI, review, and merge steps. That made the first workflow seed feel larger than the builder's current authoring goal.

Implemented correction:

- Default `Preset` now uses a focused `feature` track: `SPECIFY`, `PLAN`, `DEBATE_PLAN`, `EXPLAIN_PLAN`, `SETUP_TEST`, `EXPLAIN_TEST`, `IMPLEMENT`, `SELF_REVIEW`, `TEST`, `COMMIT`.
- Preset step numbering now preserves visual grouping without reserving removed workflow slots: `010 SPECIFY`, `020/021/022 PLAN group`, `030/031 TEST setup group`, `040 IMPLEMENT`, `050 SELF_REVIEW`, `060 TEST`, `070 COMMIT`.
- Default `light` track now uses: `SPECIFY`, `PLAN`, `EXPLAIN_PLAN`, `IMPLEMENT`, `SELF_REVIEW`, `COMMIT`.
- Only `EXPLAIN_PLAN` and `EXPLAIN_TEST` are `User involved`.
- `SELF_REVIEW` is `Background wait` and instructs the agent to request a sub-agent review, wait for the result, apply clear fixes, and record notes.
- The `Plan` visual group contains `PLAN`, `DEBATE_PLAN`, and `EXPLAIN_PLAN`; the `Test` visual group contains `SETUP_TEST` and `EXPLAIN_TEST`.
- The final `TEST` step stays later in the workflow because it runs after implementation and self-review.
- Step detail no longer shows `Workflow Data` because `Saves` / `Uses` state metadata is internal pipeline metadata, not a primary authoring control.
- Track selector now lists only actual tracks such as `feature` and `light`; there is no `All steps` mode.
- Top toolbar exposes direct skill name editing.
- Export now defaults to `~/.claude/skills/{skill-name}`.
- Canvas lock disables group and step dragging, and the align button resets group positions back to the generated grid layout.

Verification:

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

## Implemented: Scratch Canvas and Runtime-Targeted Export

Problem:

- `Scratch` still opened the add-step dialog, which made it behave like "add first step" instead of "start from a blank workflow canvas."
- Export always emitted one generic `SKILL.md`, even though Claude Code and Codex expect different skill discovery metadata.

Implemented correction:

- `Scratch` now switches the app into an initialized blank workspace with zero steps, so the user sees an empty canvas and can add workflow structure from there.
- Export now has a `Target Runtime` selector with `Claude Code` and `Codex`.
- `Claude Code` export defaults to `~/.claude/skills/{skill-name}` and writes a Claude-oriented thin `SKILL.md`.
- `Codex` export defaults to `~/.codex/skills/{skill-name}` and writes Codex frontmatter with `scope`, `trigger`, and `description`.
- `.skill-builder/model.json` records `targetRuntime` so imported packages can preserve the selected runtime target on later sync/export.

Local CLI verification:

- Exported both stacks under repo-local `.tmp/skill-builder-cli-stack-check.*` paths, not global skill folders.
- Claude Code package path: `.tmp/.../claude-workspace/.claude/skills/full-pipeline`.
- Codex package path: `.tmp/.../codex-home/skills/full-pipeline` and `.tmp/.../codex-workspace/.agents/skills/full-pipeline`.
- `bash run.sh init feature ...`, `bash run.sh complete SPECIFY`, and `bash run.sh resume` worked for both exported packages.
- `claude --setting-sources project --add-dir ... -p "/full-pipeline ..."` loaded the repo-local Claude skill and returned `full-pipeline-loaded`.
- `codex debug prompt-input` showed the repo-local Codex skill in the available skill list.
- `codex exec --cd ... "full-pipeline: ..."` loaded the repo-local Codex skill, read its `SKILL.md`, and returned `full-pipeline-loaded`.

## Implemented: New Workflow Guard and Import Path Clarification

Problem:

- The toolbar still exposed `Preset` as a direct action, but the desired model is `New` first, then choose `Preset` or `Scratch`.
- Starting a new workflow could replace the current editing state without first asking whether to save/sync current changes.
- The path `~/.claude/skills/wf` does not exist on this machine; the installed `wf` package currently lives under the Codex plugin cache.

Implemented correction:

- Toolbar `Preset` is now `New`.
- `New` opens a `Preset` / `Scratch` chooser.
- If current work exists, `New` asks before closing it.
- If current work has unsynced changes and is bound to a folder, `New` asks whether to save through `syncNow()` first.
- If current work is unbound, `New` warns that the current workflow has not been exported yet before discarding it.

Verification:

- `loadSkillDir('/Users/mini/.codex/plugins/cache/sangmandu/wf/1.3.3/skills/wf')` loads `40` steps, `4` tracks, and `11` helpers.

## Implemented: Legacy wf-plugin Import Compatibility

Problem:

- Legacy `wf` packages predate Skill Builder's `state-schema.json` and `.skill-builder/model.json` metadata.
- Builder validation treated the missing state schema as a blocking error even though the app can synthesize the runtime control schema.
- The fix-track validator only recognized `REPRODUCE`-style step names, while `wf` uses `INVESTIGATE` → `VERIFY` → `REPORT` as the reproduction gate.
- Background sub-agent steps were not explicitly represented when importing old packages.

Implemented correction:

- Imported legacy packages can synthesize state schema without becoming `invalid`.
- Fix-track validation now accepts `INVESTIGATE` / `VERIFY` / `REPORT` gate naming before `IMPLEMENT`.
- Import now infers `Background wait` from legacy step text that dispatches sub-agents and waits for completion.
- Added a regression scenario for legacy `wf` import compatibility.
- Added builder metadata and state schema files to `/Users/mini/wf-plugin` source and packaged targets.
- Bumped `wf-plugin` target package metadata from `1.3.3` to `1.3.4`.

Verification:

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`
- `/Users/mini/wf-plugin/plugins/wf/skills/wf` now validates as `warning` with `0` errors in Skill Builder import validation.

## Current Sprint Status

Story 1.1 is in `review`.
Story 1.2 is in `review`.
Story 1.3 is in `review`.
Story 1.4 is in `review`.
Story 2.1 is in `review`.
Story 2.2 is in `review`.
Story 2.3 is in `review`.
Story 2.4 is in `review`.
Story 2.5 is in `review`.
Story 3.1 is in `review`.
Story 3.2 is in `review`.
Story 3.3 is in `review`.
Story 3.4 is in `review`.
Story 4.1 is in `review`.
Story 4.2 is in `review`.
Story 4.3 is in `review`.
Story 4.4 is in `review`.
Story 4.5 is in `review`.
Story 5.1 is in `review`.
Story 5.2 is in `review`.
Story 5.3 is in `review`.
Story 5.4 is in `review`.
Story 5.5 is in `review`.

No backlog story remains in the current sprint plan.

Recommended next activity:

`Review Epic 1-5 implementation and create hardening follow-up stories only for confirmed gaps.`

## Future Implementation Plan

### Next Activity: Review Hardening

Purpose:

- Run manual UX QA against generated packages.
- Confirm which review findings should become follow-up stories.
- Move reviewed stories from `review` to `done` when accepted.

### Potential Follow-Up Areas

- installable packaged Skill Builder release flow;
- persisted canvas group positions;
- richer test runner integration beyond the scenario smoke suite;
- real utility script bodies for external CI/review providers;
- UX polish after hands-on workflow authoring.

## Working Rule Going Forward

Every implementation story should update:

1. its story file;
2. `sprint-status.yaml`;
3. this implementation state document;
4. lint/build verification notes.

This keeps the user-facing state aligned with the actual code state.
