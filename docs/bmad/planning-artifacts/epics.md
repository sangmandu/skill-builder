---
stepsCompleted:
  - prerequisites-extracted
  - epics-designed
  - stories-created
  - final-validation
inputDocuments:
  - docs/bmad/planning-artifacts/prd.md
  - docs/bmad/planning-artifacts/architecture.md
  - docs/bmad/planning-artifacts/trd.md
  - docs/bmad/planning-artifacts/ux-design.md
  - docs/bmad/planning-artifacts/user-scenarios-test-cases.md
  - src/lib/schema.ts
  - src/lib/store.ts
  - src/server/routes/files.ts
  - src/server/routes/export.ts
  - src/components/FlowCanvas.tsx
workflowType: epics-and-stories
projectName: skill-builder-cc
date: 2026-05-03
---

# skill-builder-cc - Epic Breakdown

## Overview

This document decomposes Skill Builder CC into user-value-focused epics and implementable stories. The product direction is a stateful skill platform builder: users create automation workflows as executable skill packages with state, tracks, runtime assets, policy validation, live filesystem sync, and conversational editing.

## Requirements Inventory

### Functional Requirements

FR1: Users can create a new stateful skill package from an empty project by entering skill name, trigger, description, and runtime profile.

FR2: Users can select a runtime profile that provides `init`, `resume`, `complete`, and `interrupt` commands and classifies runtime assets separately from user scripts.

FR3: Users can design workflow steps with stable step keys, separate filenames, markdown instructions, common instruction references, execution mode, produced fields, and consumed fields.

FR4: Users can design multiple tracks where each track has an independent execution order over the same step pool.

FR5: Users can define and inspect state schema fields, with `control.*` reserved for platform runtime and `data.*` available for workflow metadata.

FR6: Users can configure execution mode so `Solo run` steps continue without normal approval prompts and validation warns when step text conflicts with that policy.

FR7: Users can use explicit interrupt flow so agent-initiated `run.sh interrupt "<reason>"` records state before pausing, while execution mode controls stop-guard blocking.

FR8: UI edits and external filesystem edits are synchronized through live filesystem sync with role-aware overwrite and conflict handling.

FR9: Users can change workflow structure through agent conversation, and the UI updates from the same filesystem state.

FR10: Skill Builder itself can run as a skill that opens the builder UI and passes the active skill root to the app.

FR11: Users can create scripts while distinguishing platform runtime assets, workflow utility scripts, user-authored scripts, workflow content, docs, and config templates.

FR12: Users can validate whether a skill package is structurally valid, runtime-compatible, policy-safe, and ownership-safe.

FR13: Users can start from a `wf-plugin`-like reference template containing feature, fix, light, and brainstorm tracks with stateful runtime behavior.

### NonFunctional Requirements

NFR1: User-authored scripts must never be overwritten silently by export, sync, or runtime upgrade flows.

NFR2: Generated runtime behavior must be deterministic enough to test with local command execution.

NFR3: The source of truth for asset category must be explicit role metadata, not folder path alone.

NFR4: The UI must remain usable for repeated workflow editing: dense, scannable, and not marketing-oriented.

NFR5: Validation should run after model changes and before unsafe writes when possible.

NFR6: Generated skill packages must preserve lazy-loading semantics so agent context is limited to the current step and relevant helpers.

NFR7: The builder must make execution semantics explicit: track order, visual grouping, dependency edges, and branch semantics cannot be conflated.

NFR8: The app must continue passing lint and build checks after each implementation story.

NFR9: UI controls must remain keyboard-accessible and readable across desktop and constrained layouts.

### Additional Requirements

- The existing MVP should be evolved rather than replaced: keep the current React Flow canvas, panels, store, import/export API, presets, and schema as migration points.
- `architecture.md` and `trd.md` define a two-layer system: builder application and generated stateful skill runtime.
- Generated runtime assets are platform-managed and versioned.
- Workflow utility scripts are deterministic reusable automation blocks that may be template-owned or user-customized.
- User scripts are user-owned domain automation and must be preserved.
- `.workflow/state.json` is the generated skill execution state file.
- `control.*` state belongs to runtime scripts.
- `data.*` state belongs to workflow metadata.
- Stop hook behavior and user-prompt hook behavior must be modeled in the builder.
- `~/wf-plugin` should be represented as both an import fixture and an advanced reference template.
- Normal operation should move from one-shot import/export toward live filesystem sync.
- Canvas manual edges need explicit semantic meaning.

### UX Design Requirements

UX-DR1: New Stateful Skill creation must be a first-class entry point, not hidden behind import/export.

UX-DR2: The UI must show asset roles and ownership wherever files or scripts are displayed.

UX-DR3: The step editor must expose step key, filename, step instruction, common instruction refs, execution mode, saved workflow data, and used workflow data.

UX-DR4: Track editing must make execution order explicit and independent from visual group numbers.

UX-DR5: The state schema view must lock `control.*` and make `data.*` editable with type/default/producer/consumer metadata.

UX-DR6: Validation must be visible during editing, not only at export time.

UX-DR7: Live sync state must be visible in the project header and asset browser.

UX-DR8: Manual canvas connections must resolve to explicit edge semantics.

UX-DR9: Generated skill runtime status must be visible enough for users to understand what the agent will do next.

UX-DR10: Builder-as-a-skill mode must make the currently edited skill root visible so users trust that UI and agent are editing the same package.

### FR Coverage Map

FR1: Epic 1 - new stateful skill creation and project model.

FR2: Epic 1, Epic 4 - runtime profile selection and generated runtime execution.

FR3: Epic 2 - step design and thin `SKILL.md`/lazy-loading semantics.

FR4: Epic 2 - track designer and execution order controls.

FR5: Epic 2 - state schema editor and reserved state enforcement.

FR6: Epic 2, Epic 5 - autonomy policy and validator warnings.

FR7: Epic 2, Epic 4 - interrupt policy model, runtime commands, and hooks.

FR8: Epic 3 - live filesystem sync and conflict handling.

FR9: Epic 3 - conversational editing over the same filesystem truth.

FR10: Epic 4 - builder-as-a-skill launcher and project handoff.

FR11: Epic 1, Epic 5 - asset role taxonomy, ownership, overwrite policies, and validation.

FR12: Epic 5 - validation engine and scenario coverage.

FR13: Epic 5 - `wf-plugin`-like advanced template and fixture coverage.

## Epic List

### Epic 1: Start and Understand a Stateful Skill Project

Users can open or create a skill project and immediately understand its executable structure, including asset roles, runtime ownership, and the difference between platform scripts and user workflow scripts.

**FRs covered:** FR1, FR2, FR11

### Epic 2: Design Autonomous Workflow Behavior

Users can model the behavior of an automation skill: steps, tracks, state fields, common instruction references, execution mode, and explicit interrupt flow.

**FRs covered:** FR3, FR4, FR5, FR6, FR7

### Epic 3: Edit Through Filesystem and Conversation

Users can edit the same skill project from the UI, external editor, or agent conversation without losing the filesystem as the shared source of truth.

**FRs covered:** FR8, FR9

### Epic 4: Run the Builder and Generated Skills as Real Automation

Users can launch Skill Builder as a skill and run generated stateful skill packages with runtime commands, hooks, and resume behavior.

**FRs covered:** FR2, FR7, FR10

### Epic 5: Trust, Validate, and Reuse Skill Workflows

Users can validate packages, understand scenario coverage, preserve user-owned assets, and start from a `wf-plugin`-like template.

**FRs covered:** FR6, FR11, FR12, FR13

## Epic 1: Start and Understand a Stateful Skill Project

Users can open or create a skill project and immediately understand its executable structure, including asset roles, runtime ownership, and the difference between platform scripts and user workflow scripts.

### Story 1.1: Create the Canonical Stateful Skill Project Model

As an Automation Builder,
I want the app to represent a skill package as a canonical project model,
So that every UI, API, validation, and filesystem operation shares the same meaning.

**Acceptance Criteria:**

**Given** the existing `WorkflowConfig` model in `src/lib/schema.ts`
**When** the project model is extended
**Then** it includes `SkillProject`, `SkillEntrypoint`, `WorkflowDefinition`, `RuntimeProfile`, `SkillAsset`, `StateSchema`, `InterruptPolicy`, and `ValidationResult`
**And** existing step, track, helper, hook, and script data are migrated into the new model without removing current import/export behavior.

**Given** a script exists in `lib/` or `scripts/`
**When** it is loaded into the model
**Then** the model stores explicit role, owner, generated flag, and overwrite policy
**And** path alone is not used as the final category decision.

**Given** the UI consumes the current store
**When** the new model is introduced
**Then** existing panels continue to render steps, tracks, helpers, scripts, and hooks.

### Story 1.2: Import a `wf-plugin`-Like Skill and Classify Its Assets

As a Skill Author,
I want to import a `wf-plugin`-like skill folder and see asset roles correctly,
So that I can understand which files are platform runtime, workflow utilities, user scripts, and workflow content.

**Acceptance Criteria:**

**Given** the user imports `/Users/mini/wf-plugin/src/skills/wf`
**When** import completes
**Then** `run.sh`, `lib/init-workflow.sh`, `lib/complete-step.sh`, `lib/resume-workflow.sh`, `lib/render-step.py`, `stop-guard.sh`, and `user-interrupt.sh` are classified as `platform_runtime`
**And** `step-registry.json`, `track-steps.json`, `helpers.yaml`, `SKILL.md`, and step markdown are classified as `workflow_content`.

**Given** imported scripts include workflow-specific deterministic helpers
**When** the asset browser renders them
**Then** scripts such as CI or review observers are classified as `workflow_utility`
**And** user-created scripts can be classified as `user_script`.

**Given** an asset classification is ambiguous
**When** validation runs
**Then** the asset receives a warning requiring explicit role selection before export or runtime upgrade.

### Story 1.3: Create a New Stateful Skill from Scratch

As an Automation Builder,
I want to create a new stateful skill from an empty app state,
So that I can build my own automation workflow without first importing an existing skill.

**Acceptance Criteria:**

**Given** the app is empty
**When** the user selects New Stateful Skill
**Then** the UI asks for skill name, trigger, description, and runtime profile
**And** the default runtime profile is preselected.

**Given** the user completes creation
**When** the project is initialized
**Then** a thin `SKILL.md`, starter `step-registry.json`, starter `track-steps.json`, starter `helpers.yaml`, default state schema, and runtime asset inventory are created in memory
**And** the canvas shows the starter workflow.

**Given** the project has not been synced to disk yet
**When** the user views project status
**Then** the UI clearly shows unsynced project state and offers a target folder selection.

### Story 1.4: Select and Inspect Runtime Profiles

As a Skill Author,
I want to select and inspect a runtime profile,
So that I know which generated files and commands my skill package will use.

**Acceptance Criteria:**

**Given** a new or imported project is open
**When** the user opens runtime profile details
**Then** the UI lists required commands: `init`, `resume`, `complete`, and `interrupt`
**And** optional commands such as `rewind` are shown when supported.

**Given** a runtime profile is selected
**When** asset inventory renders
**Then** platform runtime files show owner `platform` and overwrite policy `replace_on_upgrade`
**And** user scripts show owner `user` and overwrite policy `preserve`.

**Given** a platform runtime file is missing
**When** validation runs
**Then** the issue appears as a runtime error with the missing path and profile requirement.

## Epic 2: Design Autonomous Workflow Behavior

Users can model the behavior of an automation skill: steps, tracks, state fields, common instruction references, execution mode, and explicit interrupt flow.

### Story 2.1: Generate and Edit Thin `SKILL.md` and Step Files

As a Skill Author,
I want `SKILL.md` to stay thin while step instructions live in separate files,
So that generated skills preserve lazy-loading behavior.

**Acceptance Criteria:**

**Given** a user edits skill description, trigger, or start command
**When** the project model is saved
**Then** `SKILL.md` updates only entrypoint metadata and startup instructions
**And** step body content is not embedded into `SKILL.md`.

**Given** a user adds a step
**When** the project is synced
**Then** the step key is added to `step-registry.json`
**And** the step markdown file is created separately using the configured filename.

**Given** step number and track order differ
**When** validation runs
**Then** no error is raised solely because the file number differs from execution order
**And** the UI explains that track array order controls execution.

### Story 2.2: Edit Track Execution Order Independently from Visual Groups

As an Automation Builder,
I want track order to be explicit and editable,
So that feature, fix, light, and brainstorm workflows can reuse steps in different sequences.

**Acceptance Criteria:**

**Given** a project has multiple tracks
**When** the user adds the same step to feature and fix tracks
**Then** both tracks reference the same stable step key
**And** each track can order that step independently.

**Given** the user reorders steps within a track
**When** the model is saved
**Then** `track-steps.json` changes to match the new execution order.

**Given** a workflow is already running
**When** the user edits template track order
**Then** the UI warns that existing `.workflow/state.json` execution state does not automatically change.

### Story 2.3: Define State Schema and Data Flow

As a Workflow Reviewer,
I want to see and edit workflow state fields,
So that I know what each step produces and consumes.

**Acceptance Criteria:**

**Given** a runtime profile is selected
**When** the state schema panel opens
**Then** `control.*` fields appear as locked platform fields
**And** `data.*` fields appear as editable workflow metadata fields.

**Given** the user adds `data.ticket_id`
**When** they set type, default, producing step, and consuming steps
**Then** the model records that schema metadata
**And** downstream step details show the consumed field.

**Given** the user attempts to edit `control.current_step`
**When** they save
**Then** validation blocks the edit as a reserved runtime field.

### Story 2.4: Configure Execution Mode Policy

As an Automation Builder,
I want each step to have one clear execution mode,
So that the generated skill continues work instead of stopping unnecessarily.

**Acceptance Criteria:**

**Given** a step has execution mode `Solo run`
**When** its markdown includes phrases like `ask the user`, `confirm`, or `wait for approval`
**Then** validation shows an execution warning.

**Given** a new step is added
**When** no behavior is configured
**Then** the step defaults to `Solo run`.

**Given** a validation warning exists
**When** the user changes the step to `User involved`
**Then** the warning is resolved and stop guard allows normal stop at that step.

### Story 2.5: Configure Execution Mode Stop Policy

As an Agent Operator,
I want execution mode to decide stop guard behavior,
So that generated workflows stay automated unless real intervention is needed.

**Acceptance Criteria:**

**Given** a step is `User involved` or `Background wait`
**When** runtime files are generated
**Then** stop guard treats that step as non-blocking.

**Given** a step is `Solo run`
**When** stop guard is configured
**Then** the generated guard blocks agent termination while the workflow is running on that step.

**Given** an agent needs real user input during any step
**When** it invokes the runtime interrupt command
**Then** state records interrupted status and reason
**And** resume instructions are available to continue the workflow after the user response.

## Epic 3: Edit Through Filesystem and Conversation

Users can edit the same skill project from the UI, external editor, or agent conversation without losing the filesystem as the shared source of truth.

### Story 3.1: Add Live Project API and Debounced File Writes

As an Automation Builder,
I want UI edits to update the skill folder directly,
So that the filesystem becomes the shared truth instead of a one-shot export target.

**Acceptance Criteria:**

**Given** a project is bound to a root directory
**When** the user changes a step title, body, track order, helper, or asset role
**Then** the app patches the project model and writes affected files after debounce.

**Given** validation finds a blocking issue before write
**When** the user tries to sync
**Then** unsafe writes are blocked and the validation issue explains why.

**Given** a write succeeds
**When** the project header renders
**Then** sync state shows clean and the asset hash baseline updates.

### Story 3.2: Watch External File Edits and Reconcile the Model

As a Skill Author,
I want edits from Zed or an agent to appear in the UI,
So that visual editing and text editing stay aligned.

**Acceptance Criteria:**

**Given** a watched skill file changes outside the UI
**When** the watcher receives the event
**Then** the changed file is parsed and the project model updates.

**Given** an external edit changes a step file
**When** the UI updates
**Then** the step detail panel and canvas show the new title, body, helper refs, and warnings.

**Given** an external edit changes an unsupported or unknown file
**When** the watcher processes it
**Then** the asset browser still updates hash and role state without crashing.

### Story 3.3: Detect and Resolve Sync Conflicts by Asset Role

As a Workflow Reviewer,
I want conflicts to show what changed and who owns the file,
So that user scripts are protected while generated files can be regenerated safely.

**Acceptance Criteria:**

**Given** UI and filesystem both change an asset since the last baseline
**When** sync runs
**Then** the asset enters conflict state instead of being overwritten.

**Given** the conflicted asset is `user_script`
**When** conflict resolution opens
**Then** the recommended default is preserve user version.

**Given** the conflicted asset is `platform_runtime`
**When** conflict resolution opens
**Then** the UI explains whether the platform version can be regenerated from the runtime profile.

### Story 3.4: Support Conversational Workflow Edits

As an Automation Builder,
I want agent conversation to change the same project structure visible in the UI,
So that I can say what I want and watch the skill structure update.

**Acceptance Criteria:**

**Given** the user asks the agent to add a fix track reproduction gate
**When** the agent edits files in the skill project
**Then** registry, track order, step files, and validation state update in the UI.

**Given** the user asks the agent to make a step no-question
**When** the agent updates policy metadata
**Then** the step detail panel shows autonomy `autonomous`
**And** validation applies no-question checks.

**Given** the agent changes a user script
**When** the watcher processes it
**Then** the asset remains user-owned and no platform overwrite policy is applied.

## Epic 4: Run the Builder and Generated Skills as Real Automation

Users can launch Skill Builder as a skill and run generated stateful skill packages with runtime commands, hooks, and resume behavior.

### Story 4.1: Generate Runtime Assets from the Selected Profile

As a Skill Author,
I want the builder to generate runtime files from a profile,
So that every stateful skill has consistent command and hook behavior.

**Acceptance Criteria:**

**Given** a project selects `basic_stateful` or `wf_like`
**When** runtime generation runs
**Then** `run.sh`, required `lib/*` files, stop guard, user interrupt hook, and renderer files are created or updated as platform runtime assets.

**Given** a runtime profile version changes
**When** upgrade preview runs
**Then** platform runtime files are listed as replaceable
**And** user scripts are listed as preserved.

**Given** a required runtime file is missing after generation
**When** validation runs
**Then** the package is not considered runnable.

### Story 4.2: Run Generated Workflow Commands Locally

As an Agent Operator,
I want generated skills to run through local commands,
So that automation behavior can be tested before relying on it.

**Acceptance Criteria:**

**Given** a generated skill package exists
**When** `run.sh init feature "task"` is executed in a target worktree
**Then** `.workflow/state.json` is created with current step running and remaining steps pending.

**Given** a workflow is running
**When** `run.sh complete <STEP_KEY>` is executed
**Then** the completed step status changes to completed and the next step becomes running.

**Given** a workflow is interrupted
**When** `run.sh resume` is executed
**Then** the current step markdown is rendered again with relevant helpers.

### Story 4.3: Integrate Stop Guard and User Prompt Hooks

As an Agent Operator,
I want hooks to enforce the workflow state machine,
So that the agent continues autonomous work and pauses only through explicit interruption.

**Acceptance Criteria:**

**Given** workflow status is running and current step is `Solo run`
**When** the stop guard receives a stop event
**Then** it returns a block decision with instructions to continue, complete, or interrupt.

**Given** current step is `User involved` or `Background wait`
**When** the stop guard receives a stop event
**Then** it allows the stop without changing interrupt state.

**Given** the user sends a message during a running workflow
**When** the user-prompt hook runs
**Then** it injects context without changing interrupt state.

### Story 4.4: Launch Skill Builder as a Skill

As an Automation Builder,
I want Skill Builder itself to open from a skill invocation,
So that I can use the builder inside the same agent harness that will edit the skill files.

**Acceptance Criteria:**

**Given** the Skill Builder skill is installed
**When** the user invokes it
**Then** it starts or opens the local builder UI.

**Given** the user is already working in a skill project
**When** the builder skill starts
**Then** it passes the active project root to the UI.

**Given** the UI opens from the skill
**When** the agent edits files
**Then** the UI watcher reflects the changes.

### Story 4.5: Package and Export Generated Skills Safely

As a Skill Author,
I want to package a generated skill without damaging user-owned files,
So that I can install or share the skill confidently.

**Acceptance Criteria:**

**Given** a project contains platform runtime, workflow content, workflow utilities, and user scripts
**When** export runs
**Then** all required files are written to the target package
**And** overwrite behavior follows asset role policy.

**Given** export would overwrite a user script
**When** the user has not explicitly allowed overwrite
**Then** export blocks or preserves the existing user script.

**Given** export completes
**When** validation runs on the target folder
**Then** no required runtime or registry files are missing.

## Epic 5: Trust, Validate, and Reuse Skill Workflows

Users can validate packages, understand scenario coverage, preserve user-owned assets, and start from a `wf-plugin`-like template.

### Story 5.1: Build the Validation Engine and Report

As a Workflow Reviewer,
I want validation to explain structural, runtime, policy, and ownership issues,
So that I know whether a skill package can safely run.

**Acceptance Criteria:**

**Given** a track references a missing step key
**When** validation runs
**Then** the report shows a structural error with the track name and missing key.

**Given** a step references an unknown helper or script
**When** validation runs
**Then** the report identifies the missing reference and affected step.

**Given** a `Solo run` step contains approval language
**When** validation runs
**Then** the report shows an execution warning.

**Given** a platform runtime file is missing
**When** validation runs
**Then** the report shows a runtime error.

### Story 5.2: Persist Canvas Edge Semantics

As an Automation Builder,
I want manual canvas connections to have explicit meaning,
So that visual editing does not silently create false execution behavior.

**Acceptance Criteria:**

**Given** the user connects A group to C group
**When** the edge meaning dialog opens
**Then** the user can choose visual note, track reorder, dependency, branch, or validation constraint.

**Given** the user chooses track reorder
**When** the edge is saved
**Then** `track-steps.json` is updated to reflect the execution order change.

**Given** the user chooses visual note
**When** the edge is saved
**Then** execution order does not change.

### Story 5.3: Provide the `wf-plugin`-Like Advanced Template

As an Automation Builder,
I want to start from a full automation template,
So that I can build feature, fix, light, and brainstorm tracks without recreating the whole structure.

**Acceptance Criteria:**

**Given** the user opens templates
**When** they choose the `wf_like` template
**Then** the project includes feature, fix, light, and brainstorm tracks.

**Given** the fix track is generated
**When** validation runs
**Then** reproduction and verification steps appear before implementation steps.

**Given** the template includes CI or review observer scripts
**When** assets are listed
**Then** they are classified as workflow utilities, not platform runtime.

### Story 5.4: Add Scenario-Based Test Coverage

As a Workflow Reviewer,
I want the documented user scenarios to map to automated or manual tests,
So that every important action is covered before implementation is trusted.

**Acceptance Criteria:**

**Given** `user-scenarios-test-cases.md` contains scenario IDs
**When** the test coverage view loads
**Then** each scenario maps to a planned unit, integration, E2E, or manual test.

**Given** a generated runtime fixture exists
**When** runtime tests run
**Then** init, complete, resume, interrupt, stop guard, and helper rendering are covered.

**Given** asset role fixtures exist
**When** validation tests run
**Then** platform runtime, workflow utility, and user script overwrite rules are covered.

### Story 5.5: Make Validation and Runtime Status Visible in the UI

As an Agent Operator,
I want to see validation and runtime status while editing,
So that I can understand what will happen when the skill runs.

**Acceptance Criteria:**

**Given** validation issues exist
**When** the project header renders
**Then** the highest severity state is visible.

**Given** a step has runtime or policy warnings
**When** the canvas renders
**Then** the step node shows a warning indicator.

**Given** a generated workflow has known current state
**When** runtime status is loaded
**Then** the UI shows current track, current step, interrupted status, and next action.

## Final Validation

- All FRs from the PRD are covered by at least one epic.
- Every epic delivers a user-visible outcome, even when the first story includes foundational model work.
- Stories do not depend on future stories inside the same epic.
- `wf-plugin` reference requirements are covered by import classification, template generation, runtime behavior, and fixtures.
- Platform runtime scripts and user scripts are treated as separate asset categories.
- No-question policy and interrupt policy are both covered by model, runtime, and validation stories.
- Live filesystem sync and conversational editing are covered as first-class user flows.
