---
stepsCompleted:
  - architecture-normalized-from-trd
inputDocuments:
  - docs/bmad/planning-artifacts/trd.md
  - docs/bmad/planning-artifacts/prd.md
  - docs/bmad/planning-artifacts/user-scenarios-test-cases.md
  - /Users/mini/wf-plugin/src/skills/wf/SKILL.md
  - /Users/mini/wf-plugin/src/skills/wf/run.sh
  - /Users/mini/wf-plugin/src/skills/wf/lib/init-workflow.sh
  - /Users/mini/wf-plugin/src/skills/wf/lib/complete-step.sh
  - /Users/mini/wf-plugin/src/skills/wf/lib/resume-workflow.sh
  - /Users/mini/wf-plugin/src/skills/wf/internal/10-state-machine.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/20-hooks.md
workflowType: architecture
projectName: skill-builder-cc
date: 2026-05-03
---

# Architecture - Skill Builder CC

## 1. Purpose

This architecture document is the BMad-compatible architecture entrypoint for Skill Builder CC. The detailed technical design lives in `trd.md`; this document normalizes the same direction into implementation constraints that stories and developer agents can consume directly.

Skill Builder CC is a local visual and conversational builder for stateful skill packages. It must help users create, edit, validate, and run automation workflows that behave like structured agent skills, not just static diagrams.

## 2. System Layers

### Builder Application

The builder application is the user-facing editor.

- React UI for canvas, side panels, forms, and validation views.
- Express API for loading, creating, exporting, syncing, validating, and testing skill projects.
- File-system watcher layer for live project sync.
- Project model layer that normalizes skill package files into a canonical `SkillProject`.

### Generated Stateful Skill Runtime

The generated runtime is copied or rendered into the target skill package.

- `SKILL.md` remains a thin entrypoint.
- `run.sh` dispatches runtime commands.
- `lib/*` scripts own state transitions and step rendering.
- `.workflow/state.json` stores execution state in the target worktree.
- Stop and user-prompt hooks enforce autonomous execution and explicit interruption.

## 3. Current Codebase Baseline

Current app paths to preserve and evolve:

- `src/lib/schema.ts`: current `Step`, `Track`, `Helper`, `ShellScript`, `HookConfig`, `WorkflowConfig`.
- `src/lib/store.ts`: current in-memory workflow store and import/export operations.
- `src/server/routes/files.ts`: current skill folder import.
- `src/server/routes/export.ts`: current one-shot package export.
- `src/server/routes/presets.ts`: current starter workflow presets.
- `src/components/FlowCanvas.tsx`: current React Flow visualization and manual edge creation.
- `src/components/panels/*`: current editing panels.

The current implementation already supports importing a skill-like folder, editing steps/tracks/helpers, toggling interrupt steps, and exporting files. The architecture must evolve this into a stateful platform builder with live filesystem truth and explicit runtime semantics.

## 4. Canonical Domain Model

### SkillProject

```ts
interface SkillProject {
  id: string;
  name: string;
  rootDir: string;
  entrypoint: SkillEntrypoint;
  workflow: WorkflowDefinition;
  runtime: RuntimeProfile;
  assets: SkillAsset[];
  validation: ValidationResult;
  sync: SyncState;
}
```

### WorkflowDefinition

```ts
interface WorkflowDefinition {
  steps: StepDefinition[];
  tracks: TrackDefinition[];
  helpers: HelperDefinition[];
  stateSchema: StateSchema;
  interruptPolicy: InterruptPolicy;
  graph: WorkflowGraph;
}
```

### StepDefinition

```ts
interface StepDefinition {
  key: string;
  number: number;
  filename: string;
  title: string;
  body: string;
  helperRefs: string[];
  scriptRefs: string[];
  interruptMode: 'never' | 'allowed' | 'required';
  autonomy: 'autonomous' | 'needs_user' | 'background_wait';
  produces: string[];
  consumes: string[];
}
```

### SkillAsset

```ts
interface SkillAsset {
  path: string;
  role: 'platform_runtime' | 'workflow_utility' | 'user_script' | 'workflow_content' | 'docs' | 'config_template';
  owner: 'platform' | 'template' | 'user';
  generated: boolean;
  overwritePolicy: 'replace_on_upgrade' | 'preserve' | 'merge' | 'ask';
  hash?: string;
}
```

## 5. Asset Role Taxonomy

Folder path is not the source of truth. Asset role metadata is the source of truth.

| Role | Examples | Owner | Overwrite policy |
|---|---|---|---|
| `platform_runtime` | `run.sh`, `lib/init-workflow.sh`, `lib/complete-step.sh`, `lib/resume-workflow.sh`, `lib/render-step.py`, `stop-guard.sh`, `user-interrupt.sh` | platform | replace on runtime upgrade |
| `workflow_utility` | `scripts/observe-ci.sh`, `scripts/check-merge-status.sh`, template-specific deterministic scripts | template or user | preserve or merge |
| `user_script` | user-created release, reporting, deployment, or project-specific scripts | user | preserve |
| `workflow_content` | `SKILL.md`, step markdown, `step-registry.json`, `track-steps.json`, `helpers.yaml` | user | merge or ask |
| `docs` | internal documentation and generated reports | user | preserve |
| `config_template` | generated default config files | platform or template | ask or merge |

`~/wf-plugin` is the reference fixture for this classification.

## 6. Runtime State Machine

Generated skills use `.workflow/state.json` in the target worktree.

```json
{
  "control": {
    "workflow_id": "uuid",
    "track": "feature",
    "status": "running",
    "current_step": "PLAN",
    "interrupted": false,
    "interrupt_reason": "",
    "steps": {
      "SETUP": { "status": "completed" },
      "PLAN": { "status": "running" },
      "IMPLEMENT": { "status": "pending" }
    }
  },
  "data": {
    "task_description": "",
    "ticket_id": "",
    "pr_number": null
  }
}
```

Rules:

- `control.*` is reserved for runtime scripts.
- Agents never edit `control.*` directly.
- Agent-visible writes to `data.*` must go through dedicated runtime commands or validated project APIs.
- Step transition is explicit: pending to running to completed.
- Interrupt and resume are explicit runtime transitions.

## 7. Hook Policy

### Stop Guard

The stop guard checks the active workflow state before allowing the agent to end a turn.

- If no running workflow exists, allow stop.
- If workflow status is not `running`, allow stop.
- If current step is `User involved` or `Background wait`, allow stop without recording interruption.
- If workflow is running at a `Solo run` step, block and instruct the agent to continue, complete, or explicitly interrupt.

### User Prompt Submit

When the user sends a message during a running workflow:

- inject context that the workflow is still running;
- do not mutate interrupt state;
- require explicit `run.sh interrupt "<reason>"` if the agent must pause for real user input.

## 8. Live Filesystem Sync

Normal operation should not be import/export only. The target state is:

```text
UI edit -> in-memory model -> validation -> file patch/write -> watcher event -> reconciled model
Agent edit -> file patch/write -> watcher event -> UI update -> validation
```

Each asset tracks:

- last known hash;
- owner;
- role;
- overwrite policy;
- dirty source: UI, agent, or external editor.

If UI and filesystem both changed since the last known hash, the builder shows a conflict instead of overwriting.

## 9. API Direction

Current endpoints remain useful but should evolve.

```text
GET    /api/project?rootDir=...
POST   /api/project
PATCH  /api/project/model
POST   /api/project/validate
POST   /api/project/sync
GET    /api/project/events
POST   /api/assets/:path/test
POST   /api/runtime/upgrade-preview
POST   /api/export
```

`POST /api/export` remains the packaging path. Live editing uses project, sync, events, and validation endpoints.

## 10. Validation Architecture

Validation runs after model changes and before file writes when possible.

### Structural Rules

- Every track step key exists in the step registry.
- Every registry file exists.
- Every helper reference exists.
- Every script reference exists.
- Step keys, track names, and helper keys are unique.

### Runtime Rules

- Runtime required files exist.
- `init`, `resume`, `complete`, and `interrupt` commands are available when the profile requires them.
- Stop guard non-blocking set matches execution mode.
- `Solo run` steps do not contain approval or confirmation language.

### Ownership Rules

- Platform runtime assets match the selected runtime profile version.
- User scripts are not overwritten by runtime generation or upgrade.
- Workflow utility scripts have clear ownership.

## 11. Graph Semantics

React Flow edges must not silently change execution semantics.

| Edge type | Meaning | Source of truth |
|---|---|---|
| `visual_group_flow` | diagram aid between numbered groups | generated |
| `track_order` | execution order in a track | `track-steps.json` |
| `dependency_or_branch` | user-authored semantic relation | future graph model |

When a user connects A group to C group, the builder must record whether the action means visual note, track reorder, dependency, branch, or validation constraint.

## 12. Builder-as-a-Skill

The builder itself must be runnable as a skill.

Expected flow:

1. User invokes the Skill Builder skill.
2. The skill starts or opens the local UI.
3. The skill passes the active project root to the builder.
4. UI loads the same skill project from the filesystem.
5. Agent edits and UI edits converge through watcher and validation.

## 13. Testing Strategy

### Builder Tests

- Project creation and import.
- Asset role classification.
- Step, track, helper, state schema, and interrupt policy editing.
- Live filesystem writes and watcher reconciliation.
- Conflict handling.
- Validation report rendering.
- Canvas edge semantics.

### Generated Skill Runtime Tests

- `run.sh init` creates `.workflow/state.json`.
- `run.sh complete` advances current step.
- `run.sh resume` renders the current step.
- `run.sh interrupt` records interruption.
- Stop guard blocks `Solo run` step termination.
- Stop guard allows `User involved` and `Background wait` steps without changing interrupt state.
- Helper rendering includes always helpers and referenced on-demand helpers.

### Fixture Strategy

Use fixtures based on `~/wf-plugin`:

```text
tests/fixtures/stateful-skill-basic/
tests/fixtures/stateful-skill-with-user-scripts/
tests/fixtures/stateful-skill-wf-like/
```

## 14. Implementation Sequence

1. Add canonical model and asset role taxonomy.
2. Add wf-plugin-like fixture import and classification.
3. Add new stateful skill project creation.
4. Add state schema, autonomy, and interrupt policy models.
5. Add validation engine.
6. Add live filesystem sync and conflict handling.
7. Add generated runtime execution tests.
8. Add builder-as-skill launcher.
