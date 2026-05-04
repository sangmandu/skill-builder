---
name: skill-builder
description: Open the local Skill Builder UI for a stateful skill package and keep visual edits aligned with filesystem state. Use when the user wants to create, inspect, edit, import, export, or package automation skills visually.
trigger: skill builder
---

# Skill Builder

Skill Builder is a visual and conversational editor for stateful automation skills.

Use this skill when the user wants to create, inspect, modify, import, export, or package a skill workflow. The user does not host the app manually. The agent harness reads this skill, runs the bundled launcher, and the launcher hosts the local builder UI from this skill's own `app/` directory.

The builder edits skill packages that contain thin `SKILL.md` entrypoints, step instruction files, helpers, tracks, runtime state schema, generated shell utilities, and target runtime metadata for Claude Code or Codex.

## What The User Can Change

The user can change the skill visually in the builder or by giving natural-language instructions to the agent. Support both paths.

- Skill identity: name, description, target runtime, and start command.
- Workflow steps: titles, numbers, filenames, instructions, execution mode, helper refs, and ordering.
- Tracks: feature/light/custom paths that reuse or reorder steps.
- Helpers: common instructions shared across steps.
- Runtime assets: generated platform utilities, user-owned scripts, and supporting files.
- State behavior: state schema, current workflow data, interrupt behavior, and background wait behavior.
- Canvas layout: groups, positions, edges, validation state, and visible organization.

## Agent Responsibilities

When the user asks to open the builder, launch the bundled app. When the user describes a change in chat, edit the skill package files directly and keep the visual model consistent.

For conversational edits:

- Resolve the active skill package root from the user's path, the current working directory, or the builder URL `rootDir`.
- Prefer existing generated files and schema over inventing new formats.
- Edit `SKILL.md`, step markdown files, `helpers.yaml`, `track-steps.json`, `state-schema.json`, `.skill-builder/model.json`, scripts, or assets as appropriate.
- Preserve platform-owned runtime utilities unless the user explicitly asks to regenerate them.
- Keep user-owned scripts separate from platform workflow utilities.
- If the builder is open, rely on the file watcher to reconcile filesystem edits back into the canvas.
- If a requested edit is ambiguous but can be safely interpreted from context, make the conservative edit and explain the assumption after the change.

## Path Resolution

This file lives at `<SKILL_DIR>/SKILL.md`. When this skill is activated, note the directory that contains this file and use it as `SKILL_DIR`.

Run the launcher from the user's current working directory. Do not `cd` into the skill directory before choosing the active project root.

```bash
SKILL_DIR="<directory containing this SKILL.md>"; bash "$SKILL_DIR/scripts/open-builder.sh" "$PWD"
```

If the current directory is a generated skill package, pass that directory as the active project root. If the app is already running, the script reuses it. If not, it installs app dependencies when needed, starts the local Skill Builder dev server, and opens the browser with `rootDir` set.

After opening the UI, continue editing the skill package through normal filesystem operations when requested. The builder watcher reconciles filesystem changes into the visual model.
