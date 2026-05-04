---
stepsCompleted:
  - sprint-plan-created
inputDocuments:
  - docs/bmad/planning-artifacts/epics.md
  - docs/bmad/planning-artifacts/implementation-readiness-report-2026-05-03.md
workflowType: sprint-plan
projectName: skill-builder-cc
date: 2026-05-03
---

# Sprint Plan - Skill Builder CC

## Current Implementation Goal

Sprint 1 through Sprint 5 are implemented and ready for review. The next implementation goal is review hardening: run UX QA against real generated packages, decide which review findings should become follow-up stories, and promote reviewed stories from `review` to `done`.

## Sprint 1: Stateful Project Foundation

### Objective

Make the app understand a stateful skill project as a first-class model instead of treating imported folders as a loose set of steps, tracks, helpers, and scripts.

### Stories

1. Story 1.1: Create the Canonical Stateful Skill Project Model
2. Story 1.2: Import a `wf-plugin`-Like Skill and Classify Its Assets
3. Story 1.3: Create a New Stateful Skill from Scratch
4. Story 1.4: Select and Inspect Runtime Profiles

### Exit Criteria

- Existing import/export behavior still works.
- `SkillProject`, `RuntimeProfile`, `SkillAsset`, state schema, and validation result types exist.
- Imported `wf-plugin` reference assets are classified by role.
- Runtime assets and user scripts are visibly different in the model.
- Lint and build pass.

## Sprint 2: Workflow Behavior Design

### Objective

Expose the execution model users actually need to design: step files, track order, state fields, and execution mode.

### Stories

1. Story 2.1: Generate and Edit Thin `SKILL.md` and Step Files
2. Story 2.2: Edit Track Execution Order Independently from Visual Groups
3. Story 2.3: Define State Schema and Data Flow
4. Story 2.4: Configure Execution Mode Policy
5. Story 2.5: Configure Execution Mode Stop Policy

### Exit Criteria

- Track order is treated as execution order.
- State schema UI distinguishes `control.*` and `data.*`.
- `Solo run` steps can be validated against approval language.
- Execution mode can generate or preview stop guard non-blocking behavior.

## Sprint 3: Filesystem and Conversational Editing

### Objective

Move from one-shot import/export to a shared filesystem truth that both UI and agent conversation can edit.

### Stories

1. Story 3.1: Add Live Project API and Debounced File Writes
2. Story 3.2: Watch External File Edits and Reconcile the Model
3. Story 3.3: Detect and Resolve Sync Conflicts by Asset Role
4. Story 3.4: Support Conversational Workflow Edits

### Exit Criteria

- UI edits write to the bound skill folder.
- External edits update the UI.
- Conflicts are role-aware.
- Agent-edited files appear in the UI without reimport.

## Sprint 4: Runtime Execution and Builder-as-a-Skill

### Objective

Generate skill packages that can actually run as stateful agent workflows, and launch the builder itself from a skill.

### Stories

1. Story 4.1: Generate Runtime Assets from the Selected Profile
2. Story 4.2: Run Generated Workflow Commands Locally
3. Story 4.3: Integrate Stop Guard and User Prompt Hooks
4. Story 4.4: Launch Skill Builder as a Skill
5. Story 4.5: Package and Export Generated Skills Safely

### Exit Criteria

- Generated skills support `init`, `resume`, `complete`, and `interrupt`.
- Stop guard blocks `Solo run` stops and allows `User involved` / `Background wait` stops without changing interrupt state.
- Builder skill opens the local UI with the active project root.
- Export respects role-based overwrite policy.

## Sprint 5: Validation, Templates, and Scenario Coverage

### Objective

Make users trust generated workflows by validating structure, runtime, ownership, policy, edge semantics, and scenario coverage.

### Stories

1. Story 5.1: Build the Validation Engine and Report
2. Story 5.2: Persist Canvas Edge Semantics
3. Story 5.3: Provide the `wf-plugin`-Like Advanced Template
4. Story 5.4: Add Scenario-Based Test Coverage
5. Story 5.5: Make Validation and Runtime Status Visible in the UI

### Exit Criteria

- Validation catches missing step keys, helper refs, script refs, runtime files, and autonomy conflicts.
- Canvas manual edges have explicit semantics.
- `wf-plugin`-like template is available.
- User scenario matrix maps to automated or manual test coverage.

## Immediate Next Story

No backlog story remains in the current BMad sprint plan.

Recommended next activity:

`Review Epic 1-5 implementation and create hardening follow-up stories only for confirmed gaps.`
