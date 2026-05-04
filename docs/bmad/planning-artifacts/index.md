---
workflowType: planning-index
projectName: skill-builder-cc
date: 2026-05-02
---

# Planning Artifacts Index - skill-builder-cc

## Documents

| Document | Purpose |
|---|---|
| `prd.md` | Product intent for a stateful skill automation platform and visual/conversational builder |
| `architecture.md` | BMad-compatible architecture entrypoint derived from the TRD |
| `trd.md` | Target architecture, runtime asset taxonomy, state machine, hooks, live FS sync |
| `ux-design.md` | UX design requirements for the visual builder, asset roles, state schema, validation, sync, and builder-as-skill mode |
| `epics.md` | Full epic and story breakdown for implementation planning |
| `implementation-readiness-report-2026-05-03.md` | Readiness assessment validating PRD, architecture, UX, epics, and story quality |
| `user-scenarios-test-cases.md` | Action-level scenarios for skill creation, stateful runtime, no-question policy, interrupt flow |

## Implementation Artifacts

| Document | Purpose |
|---|---|
| `../implementation-artifacts/sprint-status.yaml` | BMad sprint tracking status for all epics and stories |
| `../implementation-artifacts/sprint-plan.md` | Human-readable sprint sequencing and exit criteria |
| `../implementation-artifacts/implementation-state.md` | Current implementation state, completed code work, verification, and future plan |
| `../implementation-artifacts/1-1-create-the-canonical-stateful-skill-project-model.md` | First detailed story ready for development |

## Current Focus

The product is a builder for stateful automation skills. It should help users turn their own work process into a runnable skill package with steps, tracks, helpers, runtime state, interrupt policy, and user-owned scripts. Existing skill visualization remains useful, but it is not the core product purpose.
