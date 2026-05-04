---
stepsCompleted:
  - wf-plugin-scan
  - technical-reframe
inputDocuments:
  - src/App.tsx
  - src/lib/schema.ts
  - src/lib/store.ts
  - src/server/routes/files.ts
  - src/server/routes/export.ts
  - /Users/mini/wf-plugin/src/skills/wf/SKILL.md
  - /Users/mini/wf-plugin/src/skills/wf/INTERNALS.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/10-state-machine.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/20-hooks.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/30-scripts.md
  - /Users/mini/wf-plugin/src/skills/wf/internal/50-steps.md
  - /Users/mini/wf-plugin/src/skills/wf/lib/init-workflow.sh
  - /Users/mini/wf-plugin/src/skills/wf/lib/complete-step.sh
  - /Users/mini/wf-plugin/src/skills/wf/lib/resume-workflow.sh
  - /Users/mini/wf-plugin/src/skills/wf/lib/render-step.py
  - /Users/mini/wf-plugin/src/skills/wf/stop-guard.sh
  - /Users/mini/wf-plugin/src/skills/wf/user-interrupt.sh
workflowType: trd
projectName: skill-builder-cc
date: 2026-05-02
---

# Technical Requirements & Design - Skill Builder CC

## 1. 기술 방향

Skill Builder CC는 두 겹으로 구성된다.

1. **Builder application**: 사용자가 skill workflow를 시각적으로 만들고, agent와 대화하며 수정하는 로컬 UI/API.
2. **Stateful skill runtime**: 생성된 skill package가 agent harness에서 실행될 때 state transition, step delivery, interrupt, resume을 담당하는 platform layer.

현재 구현은 첫 번째 겹의 MVP다. 앞으로는 두 번째 겹을 first-class model로 올려야 한다.

## 2. Reference Architecture: wf-plugin

`~/wf-plugin/src/skills/wf`는 현재 참고해야 할 reference 구조다.

```text
Agent session
  |
  | reads
  v
SKILL.md
  |
  | calls
  v
run.sh
  |
  | dispatches
  v
lib/init-workflow.sh
lib/complete-step.sh
lib/resume-workflow.sh
lib/rewind-step.sh
  |
  | mutate/read
  v
<worktree>/.workflow/state.json
  |
  | render
  v
current step markdown + helpers
```

Key properties:

- Agent is the runtime. There is no long-running orchestrator process.
- Shell/Python runtime scripts mutate state and render the next instruction.
- Agent makes decisions inside the current step, then calls explicit transition commands.
- Step files are not all loaded at once. They are rendered one at a time.
- Track order, not filename number, determines execution order.

## 3. Target Runtime Asset Taxonomy

Folder path alone is not enough. Skill Builder must classify assets by role.

### Platform Runtime Assets

Generated or managed by the platform.

Examples:

- `run.sh`
- `lib/init-workflow.sh`
- `lib/complete-step.sh`
- `lib/resume-workflow.sh`
- `lib/rewind-step.sh`
- `lib/render-step.py`
- `lib/find-hook-state.py`
- `stop-guard.sh`
- `user-interrupt.sh`

Rules:

- Default UI should present these as runtime infrastructure.
- User edits should be advanced-mode only.
- Runtime upgrades may replace these files.
- Validation failure if missing or incompatible.

### Workflow Utility Scripts

Deterministic scripts attached to a workflow template or step behavior.

Examples from `wf-plugin`:

- `scripts/observe-ci.sh`
- `scripts/observe-reviews.sh`
- `scripts/check-merge-status.sh`
- `scripts/agent-interrupt.sh` if kept under `scripts/`, though conceptually this is runtime interrupt control.

Rules:

- Visible to the user as reusable automation blocks.
- May be template-owned or user-customized.
- Step markdown can reference them.
- Must be preserved unless explicitly regenerated.

### User-authored Scripts

Scripts a user creates for their own workflow domain.

Examples:

- release note generator
- deployment checklist collector
- local project setup command wrapper
- custom report generator

Rules:

- User owns content.
- Platform must never overwrite without explicit confirmation.
- Builder should support creating, editing, testing, and binding these scripts to steps.

## 4. Canonical Skill Project Model

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
}
```

### SkillEntrypoint

```ts
interface SkillEntrypoint {
  path: 'SKILL.md';
  name: string;
  description: string;
  triggers: string[];
  role: 'checklist_executor' | 'facilitator' | 'custom';
  startCommand: string;
  haltRules: string[];
}
```

`SKILL.md` should be generated from this model and remain thin.

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
  filename: string;
  number: number;
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

Important:

- `number` groups steps visually.
- `track.steps[]` orders execution.
- `key` is the stable identity used in state.

### TrackDefinition

```ts
interface TrackDefinition {
  name: string;
  trigger: string;
  useCase: string;
  steps: string[];
  defaultAutonomy: 'autonomous' | 'interactive';
}
```

### RuntimeProfile

```ts
interface RuntimeProfile {
  id: 'basic_stateful' | 'wf_like' | 'custom';
  version: string;
  assets: RuntimeAsset[];
  commands: {
    init: string;
    resume: string;
    complete: string;
    interrupt: string;
    rewind?: string;
  };
  hookPolicy: HookPolicy;
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
}
```

## 5. State Machine Design

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
    },
    "created_at": "...",
    "updated_at": "...",
    "error": null
  },
  "data": {
    "task_description": "...",
    "ticket_id": "",
    "pr_number": null
  }
}
```

Rules:

- `control.*` is reserved for platform runtime scripts.
- Agent never edits `control.*` directly.
- Agent writes `data.*` only through runtime data commands.
- Step transition is explicit: pending -> running -> completed.
- Rewind is an explicit runtime action.

## 6. Hook Design

The runtime uses hooks to solve the LLM stop problem structurally.

### Stop Guard

When the agent tries to end a turn:

1. Find active `.workflow/state.json`.
2. If no running workflow, allow stop.
3. If current step execution mode is `User involved` or `Background wait`, allow stop without changing interrupt state.
4. If workflow is running at a `Solo run` step, block with instructions.

### User Interrupt

When user sends a message during a running workflow:

1. Inject context telling the agent the workflow is still running.
2. Do not change interrupt state.
3. If the response requires a true workflow pause, the agent runs `run.sh interrupt "<reason>"`.

### Builder Implication

The builder must let users decide:

- Which steps are `Solo run`.
- Which steps are `User involved`.
- Which steps are `Background wait`.
- Which messages are user-facing and which are internal progress.

## 7. Live Filesystem Sync

Target behavior:

```text
UI edit
  -> in-memory project model
  -> validation
  -> file patch/write
  -> file watcher event
  -> reconcile model

Agent edit
  -> file patch/write
  -> watcher event
  -> UI updates
  -> validation
```

### Write Strategy

- Workflow content files can be written directly from the model.
- Runtime files are generated from runtime profile and version.
- User scripts are preserved and edited only by direct user action or explicit agent request.
- External file edits must not be overwritten silently.

### Conflict Strategy

Each asset tracks:

- last known hash
- dirty source: UI, agent, external editor
- owner and overwrite policy

If both UI and FS changed since last sync, builder shows conflict and asks for resolution.

## 8. Builder-as-a-Skill Runtime

The builder itself should be runnable as a skill.

Expected flow:

1. User invokes Skill Builder skill.
2. Skill starts local UI server or opens existing UI.
3. Skill passes current project/root dir to the builder.
4. UI loads the SkillProject model from FS.
5. Agent can mutate the same files through normal tool calls.
6. UI updates from watcher.

This means Skill Builder must expose both:

- browser UI for visual editing
- agent-readable project model and validation reports

## 9. Current App Mapping

Current code already has useful pieces.

| Current component | Keep | Reframe |
|---|---|---|
| `Step` model | yes | add produces/consumes/scriptRefs/autonomy |
| `Track` model | yes | track order is execution source, not just filter |
| `Helper` model | yes | keep lazy helper rendering semantics |
| `HookConfig` | partial | expand into InterruptPolicy and HookPolicy |
| Import/export API | partial | evolve into live sync |
| Presets | yes | become runtime/workflow templates |
| Canvas edges | partial | distinguish visual grouping, execution order, dependency |

## 10. Graph Semantics

Canvas must not imply false execution semantics.

There are at least three edge types:

| Edge type | Meaning | Source of truth |
|---|---|---|
| visual_group_flow | diagram aid between numbered groups | generated |
| track_order | actual execution order in a track | `track-steps.json` |
| dependency_or_branch | user-authored semantic relation | future graph file |

When user says "A group을 C group으로 연결", builder must know whether this means:

- draw a visual note
- reorder track execution
- create dependency/skip/branch relation
- add a validation constraint

Default should be explicit: ask or present semantic choices during design mode. In autonomous agent-edit mode, infer from context and record the chosen semantic.

## 11. Validation Engine

Validation should run after every model change.

### Structural Validation

- Every track step key exists in registry.
- Every registry file exists.
- Every helper reference exists.
- Every script reference exists.
- Step keys are unique.
- Track names are unique.
- Runtime required files exist.

### Runtime Validation

- `complete` command exists.
- `resume` command exists.
- interrupt command exists if any step can interrupt.
- stop guard allowlist matches interrupt policy.
- no-question steps do not contain approval/confirmation language.

### Asset Ownership Validation

- platform_runtime files are generated from current runtime profile.
- user_script files are not overwritten by platform generation.
- workflow_utility files have clear owner.

## 12. API Direction

Current endpoints:

- `POST /api/files/load`
- `POST /api/export`
- `GET /api/presets`

Target endpoints:

```text
GET    /api/project?rootDir=...
POST   /api/project
PATCH  /api/project/model
POST   /api/project/validate
POST   /api/project/sync
GET    /api/project/events
POST   /api/assets/:path/test
POST   /api/runtime/upgrade-preview
```

`/api/export` remains useful for packaged output, but normal operation should be live sync.

## 13. Template System

Templates should include:

- thin `SKILL.md`
- default runtime profile
- starter tracks
- starter steps
- helper library
- state schema defaults
- script role metadata
- validation rules

`wf-plugin` can be represented as an advanced template:

- feature track
- fix track with reproduction gate
- light track
- brainstorm track
- stop guard
- user interrupt
- state transition helpers
- CI/review observer workflow utilities

## 14. Testing Strategy

The system must test both builder behavior and generated skill behavior.

### Builder Tests

- Model editing
- Canvas editing
- live FS sync
- conflict handling
- validation reports

### Generated Skill Tests

- init creates state
- complete advances state
- resume renders current step
- interrupt sets state
- stop guard blocks `Solo run` steps
- stop guard allows `User involved` and `Background wait` steps without changing interrupt state
- helper rendering includes always and referenced on-demand helpers

### Fixture Strategy

Use `wf-plugin`-like fixtures:

```text
tests/fixtures/stateful-skill-basic/
tests/fixtures/stateful-skill-with-user-scripts/
tests/fixtures/stateful-skill-wf-like/
```

## 15. Migration from Current MVP

Recommended sequence:

1. Add asset role metadata to current import model.
2. Add state schema and interrupt policy models.
3. Add validation engine.
4. Convert export into project sync with explicit overwrite policies.
5. Add builder-as-skill launch path.
6. Add live watcher.
7. Add conversational edit protocol.
