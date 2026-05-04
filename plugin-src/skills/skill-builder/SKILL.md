---
name: skill-builder
description: Open the local Skill Builder UI for a stateful skill package and keep visual edits aligned with filesystem state. Use when the user wants to create, inspect, edit, import, export, or package automation skills visually.
trigger: skill builder
---

# Skill Builder

Open the visual builder for the current skill project root.

## Path Resolution

This file lives at `<SKILL_DIR>/SKILL.md`. When this skill is activated, note the directory that contains this file and use it as `SKILL_DIR`.

Run the launcher from the user's current working directory. Do not `cd` into the skill directory before choosing the active project root.

```bash
SKILL_DIR="<directory containing this SKILL.md>"; bash "$SKILL_DIR/scripts/open-builder.sh" "$PWD"
```

If the current directory is a generated skill package, pass that directory as the active project root. If the app is already running, the script reuses it. If not, it installs app dependencies when needed, starts the local Skill Builder dev server, and opens the browser with `rootDir` set.

After opening the UI, continue editing the skill package through normal filesystem operations when requested. The builder watcher reconciles filesystem changes into the visual model.
