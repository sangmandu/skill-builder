<h1 align="center">Skill Builder</h1>

<p align="center">
  A skill-hosted visual builder for turning repeatable agent work into documented, stateful automation workflows.
</p>

<p align="center">
  <a href="https://github.com/sangmandu/skill-builder/actions/workflows/plugin-ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/sangmandu/skill-builder/plugin-ci.yml?branch=main&label=ci"></a>
  <a href="./LICENSE"><img alt="License" src="https://img.shields.io/github/license/sangmandu/skill-builder"></a>
  <img alt="Claude Code" src="https://img.shields.io/badge/Claude%20Code-plugin-6D5BD0">
  <img alt="Codex" src="https://img.shields.io/badge/Codex-plugin-0F766E">
</p>

<p align="center">
  <img alt="Skill Builder canvas" src="./.github/assets/skill-builder-canvas.png">
</p>

## Why

Most useful agent workflows start as loose chat habits: clarify the task, write a plan, run a review, test, summarize, commit. Skill Builder turns those repeated habits into a real skill package with step files, helpers, tracks, runtime state, scripts, and export metadata for Claude Code or Codex.

The user does not host the builder manually. After plugin installation, the agent harness reads the `skill-builder` skill, runs its bundled launcher, and hosts the local UI from inside the skill package.

## Install

### Claude Code

Claude Code uses a two-step marketplace flow: add the marketplace, then install the plugin from it.

From your terminal:

```bash
claude plugin marketplace add sangmandu/skill-builder
claude plugin install skill-builder@sangmandu
```

Inside Claude Code, the equivalent slash commands are:

```text
/plugin marketplace add sangmandu/skill-builder
/plugin install skill-builder@sangmandu
```

If Claude Code is already running, reload plugins before invoking the skill:

```text
/reload-plugins
/skill-builder:skill-builder
```

### Codex

```bash
codex plugin marketplace add https://github.com/sangmandu/skill-builder
```

Then ask Codex to open Skill Builder for the current project or skill package.

## First Run

When there is no existing skill package, Skill Builder starts by helping the agent discover the workflow before editing files.

Checklist:

- What kind of work do you repeat most often?
- What user request usually starts it?
- Which steps happen almost every time?
- Where should the agent involve the user?
- What waits on CI, reviews, long jobs, external systems, or sub-agents?
- What documents should be produced every run?
- What state needs to carry between steps?
- Which repeated commands should become scripts?
- Do you need multiple tracks like `feature`, `fix`, `light`, or `research`?
- What proves the workflow is done?

The first draft can be created visually from a preset or conversationally by asking the agent to add, remove, reorder, or rewrite steps.

<p align="center">
  <img alt="Skill Builder welcome screen" src="./.github/assets/skill-builder-welcome.png">
</p>

## What It Builds

- Thin `SKILL.md` entrypoints for lazy loading
- Step files such as `010-specify.md`, `020-plan.md`, and `040-implement.md`
- `helpers.yaml` for reusable common skill instructions
- `track-steps.json` for feature/light/custom workflow paths
- `state-schema.json` and `.workflow/state.json` runtime state
- `run.sh` plus generated runtime scripts for init, complete, resume, rewind, and interrupt
- Target-specific metadata for Claude Code or Codex

## How It Works

Skill Builder is itself a skill. The app lives inside the skill folder:

```text
plugin-src/skills/skill-builder/
  SKILL.md
  scripts/open-builder.sh
  app/
```

The committed plugin bundles keep installation direct:

```text
claude-plugin/                         # Claude Code plugin bundle
plugins/skill-builder/                 # Codex plugin bundle
.claude-plugin/                        # Claude marketplace metadata
.agents/plugins/                       # Codex marketplace metadata
```

`plugin-src/skills/skill-builder/` is the source of truth. `npm run sync:plugins` copies that skill, including its bundled `app/`, into both runtime-specific plugin bundles.

<details>
<summary>Maintainer Notes</summary>

### Validation

```bash
npm run lint
npm run build
npm run test:scenarios
npm run sync:plugins
npm run validate:plugins
```

Optional Codex marketplace validation:

```bash
SKILL_BUILDER_VALIDATE_CODEX_MARKETPLACE=1 npm run validate:plugins
```

### Design

See [DESIGN.md](./plugin-src/skills/skill-builder/app/DESIGN.md) for visual design tokens and UI rules.

</details>

## References

- Claude Code plugin docs: https://code.claude.com/docs/en/plugins
- Claude Code marketplace docs: https://code.claude.com/docs/en/discover-plugins
- Claude Code plugin CLI reference: https://code.claude.com/docs/en/plugins-reference
- Claude HUD README pattern: https://github.com/jarrodwatts/claude-hud
- Awesome README examples: https://github.com/matiassingers/awesome-readme
- OpenAI plugin examples: https://github.com/openai/plugins
