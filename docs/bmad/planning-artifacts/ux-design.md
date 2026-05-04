---
stepsCompleted:
  - ux-design-created
inputDocuments:
  - docs/bmad/planning-artifacts/prd.md
  - docs/bmad/planning-artifacts/trd.md
  - docs/bmad/planning-artifacts/user-scenarios-test-cases.md
  - src/App.tsx
  - src/components/FlowCanvas.tsx
  - src/components/panels/Toolbar.tsx
  - src/components/panels/StepDetailPanel.tsx
workflowType: ux-design
projectName: skill-builder-cc
date: 2026-05-03
---

# UX Design Specification - Skill Builder CC

## 1. UX Goal

Skill Builder CC must help users design executable stateful skills without forcing them to understand every runtime file by hand. The UI should make skill structure visible, but the product is not a passive visualizer. The primary experience is building, validating, and running a state-managed automation workflow.

## 2. Primary Workspaces

### Project Header

Shows the active skill project, sync state, validation state, and primary actions.

Required controls:

- New Stateful Skill
- Import Skill
- Validate
- Sync Status
- Export Package
- Open in Agent Harness

### Canvas

Shows groups, steps, track order, and semantic edges.

Required behavior:

- Group nodes show visual ranges such as Setup, Investigate, Plan, Test, Implement, Review.
- Step nodes show title, step key, execution mode, common instruction references, and validation warnings.
- Track filter changes the execution path displayed.
- Manual connections must resolve to a semantic edge type instead of only drawing a temporary edge.

### Left Sidebar

Navigation and project structure.

Required sections:

- Tracks
- Steps
- State fields
- Assets
- Validation issues

### Right Detail Panel

Context-specific editing.

Required editors:

- Step details
- Track details
- State field details
- Asset details
- Runtime profile details
- Validation issue details

## 3. Core User Flows

### New Stateful Skill

1. User selects New Stateful Skill.
2. User enters skill name, trigger, description, and runtime profile.
3. Builder creates a thin `SKILL.md`, default track, starter step registry, state schema, and runtime asset inventory.
4. Canvas shows the new workflow.
5. Validation runs immediately.

### Workflow Editing

1. User adds a step.
2. Builder assigns a stable key and filename.
3. User edits step markdown in the detail panel.
4. User adds the step to one or more tracks.
5. Builder updates registry, track order, and canvas.
6. Validation flags missing helpers, scripts, or policy conflicts.

### State and Execution Mode Editing

1. User opens state schema.
2. `control.*` fields appear locked and platform-owned.
3. User adds or edits `data.*` fields.
4. User marks producing and consuming steps.
5. User sets step execution mode.
6. Validation checks that `Solo run` steps do not ask for normal approval.

### Script Role Editing

1. User adds or imports a script.
2. Builder asks for or infers role: platform runtime, workflow utility, user script.
3. Asset list shows owner and overwrite policy.
4. Advanced metadata can bind workflow utility scripts to a step when needed.
5. Validation reports missing script files or unsafe overwrite policies.

### Live Sync and Conversational Editing

1. User edits UI.
2. Files change on disk.
3. Agent sees the updated filesystem state.
4. Agent edits files from conversation.
5. Watcher updates the UI.
6. Conflict UI appears if UI and external edit collide.

## 4. Required UX Components

### Validation Panel

Shows grouped issues:

- Structural errors
- Runtime errors
- Ownership warnings
- Autonomy warnings
- Sync conflicts

Each issue must include affected file, affected model entity, severity, and recommended fix.

### Asset Role Browser

Shows all project files with role badges:

- Platform Runtime
- Workflow Utility
- User Script
- Workflow Content
- Docs
- Config Template

Role badges must be visible anywhere script or runtime files appear.

### State Schema Panel

Shows `control.*` and `data.*` separately.

Requirements:

- Locked styling for `control.*`.
- Editable schema controls for `data.*`.
- Produces/consumes relation list.
- Validation warning if a step writes reserved control state.

### Edge Meaning Dialog

When the user connects nodes manually, the UI must capture the intended meaning.

Options:

- Visual note
- Track reorder
- Dependency
- Branch
- Validation constraint

In autonomous conversational editing, the agent may infer the meaning from context but must record it in the project model.

### Sync Conflict View

Shows:

- asset path;
- role;
- owner;
- UI version summary;
- filesystem version summary;
- recommended resolution.

## 5. Interaction Rules

- Default mode is `Solo run` workflow design.
- Asking the user for approval is not normal behavior inside generated `Solo run` steps.
- UI must distinguish "needs user input by design" from "agent asked because it was unsure."
- Runtime-owned files are editable only through advanced mode or runtime upgrade flows.
- User scripts are never silently overwritten.
- Track order is execution order.
- Visual group order is not execution order unless explicitly saved as track order.

## 6. Accessibility and Responsiveness

- Keyboard users must be able to navigate tracks, steps, validation issues, and detail panels.
- Validation severity must not rely on color alone.
- Compact layouts must keep step key, title, and issue count readable.
- Buttons should use recognizable icons with tooltips where an icon is not self-explanatory.
- Long filenames and step keys must truncate or wrap without breaking layout.

## 7. UX Design Requirements

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
