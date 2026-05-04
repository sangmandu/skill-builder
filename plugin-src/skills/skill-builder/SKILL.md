---
name: skill-builder
description: Run the Skill Builder skill to open its bundled local editor for a stateful skill package and keep visual edits aligned with filesystem state. Use when the user wants to create, inspect, edit, import, export, or package automation skills visually.
trigger: skill builder
---

# Skill Builder

Skill Builder is a skill that opens a visual and conversational editor for stateful automation skills.

Use this skill when the user wants to create, inspect, modify, import, export, or package a skill workflow. This is not a standalone platform or separately hosted app. The user runs the skill; the agent harness reads this skill, runs the bundled launcher, and the launcher opens the local builder UI from this skill's own `app/` directory.

The builder edits skill packages that contain thin `SKILL.md` entrypoints, step instruction files, helpers, tracks, runtime state schema, generated shell utilities, and target runtime metadata for Claude Code or Codex.

## What The User Can Change

The user can change the skill visually in the builder or by giving natural-language instructions to the agent. Support both paths.

- Skill identity: name, description, target runtime, and start command.
- Workflow steps: titles, numbers, filenames, instructions, execution mode, helper refs, and ordering.
- Tracks: feature/light/custom paths that reuse or reorder steps.
- Helpers: common instructions shared across steps.
- Runtime assets: generated skill-runtime utilities, user-owned scripts, and supporting files.
- State behavior: state schema, current workflow data, interrupt behavior, and background wait behavior.
- Canvas layout: groups, positions, edges, validation state, and visible organization.

## Agent Responsibilities

When the user asks to open the builder, launch the bundled app. When the user describes a change in chat, edit the skill package files directly and keep the visual model consistent.

## Runtime Boundary

Skill Builder is an authoring skill. It must not start, install, or trigger workflow runtime hooks for itself.

- Do not run generated `run.sh` commands while opening or onboarding Skill Builder.
- Do not create `.workflow/state.json` for the Skill Builder authoring session.
- Do not run generated `stop-guard.sh`, `user-interrupt.sh`, or `scripts/agent-interrupt.sh` during Skill Builder onboarding.
- Runtime hook scripts belong to exported skills. They become meaningful only after the exported skill starts its own workflow with `run.sh init`.
- If hook output appears while using Skill Builder itself, treat it as coming from another installed workflow and do not follow it unless it matches the current exported skill workflow state.

## First Run Discovery Guide

When the user runs Skill Builder without an existing skill package or asks what to build, inspect first and ask later. Keep the conversation concrete and short. The goal is to identify one repeatable automation workflow that can become a stateful skill.

Run the bundled discovery helper from the user's current project root before asking broad questions:

```bash
SKILL_DIR="<directory containing this SKILL.md>"; bash "$SKILL_DIR/scripts/discover-workflow.sh" "$PWD"
```

Use the discovered project signals to propose a starter workflow. Include the evidence you used, such as package scripts, source folders, tests, docs, CI files, or repeated project conventions. Ask a question only when the missing answer materially changes the generated workflow.

If the project looks like ordinary feature work, propose this shape:

```text
Specify -> Plan -> Explain Plan -> Implement -> Self Review -> Test -> Commit
```

For heavier engineering work, suggest:

```text
Specify -> Plan -> Debate Plan -> Explain Plan -> Setup Test -> Explain Test -> Implement -> Self Review -> Test -> Commit
```

If the repository does not contain enough evidence, ask one focused question about the repeated work the user wants to automate. Do not ask a long checklist before offering a proposal.

When creating the first draft, keep it as an authoring action in Skill Builder. Do not start the exported skill runtime, do not initialize `.workflow/state.json`, and do not activate generated hooks.

For conversational edits:

- Resolve the active skill package root from the user's path, the current working directory, or the builder URL `rootDir`.
- Prefer existing generated files and schema over inventing new formats.
- Edit `SKILL.md`, step markdown files, `helpers.yaml`, `track-steps.json`, `state-schema.json`, `.skill-builder/model.json`, scripts, or assets as appropriate.
- Preserve Skill Builder runtime utilities unless the user explicitly asks to regenerate them.
- Keep user-owned scripts separate from Skill Builder workflow utilities.
- If the builder is open, rely on the file watcher to reconcile filesystem edits back into the canvas.
- If a requested edit is ambiguous but can be safely interpreted from context, make the conservative edit and explain the assumption after the change.

## Path Resolution

This file lives at `<SKILL_DIR>/SKILL.md`. When this skill is activated, note the directory that contains this file and use it as `SKILL_DIR`.

Run the launcher from the user's current working directory. Do not `cd` into the skill directory before choosing the active project root.

```bash
SKILL_DIR="<directory containing this SKILL.md>"; bash "$SKILL_DIR/scripts/open-builder.sh" "$PWD"
```

If the current directory is a generated skill package, pass that directory as the active project root. If the editor is already running, the script reuses it. If not, it prepares the bundled editor when needed, starts the local Skill Builder server, and opens the browser with `rootDir` set.

After opening the UI, continue editing the skill package through normal filesystem operations when requested. The builder watcher reconciles filesystem changes into the visual model.
