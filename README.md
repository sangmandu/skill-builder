<h1 align="center">Skill Builder</h1>

<p align="center">
  A Claude Code/Codex skill that opens a local visual editor for turning repeatable agent work into documented, stateful automation workflows.
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

Skill Builder is not a standalone platform, SaaS product, or separately hosted app. The user installs a plugin and runs a skill. That skill contains the launcher and UI files, so the agent harness reads the `skill-builder` skill, runs its bundled launcher, and opens the local editor from inside the skill package.

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

Then ask Codex to run Skill Builder for the current project or skill package.

## First Run

When there is no existing skill package, Skill Builder does not open the UI immediately. The skill first asks how the user wants to author the workflow:

1. Let the agent analyze the repo and draft a workflow quickly, with lower accuracy.
2. Ping-pong with the agent to co-author the draft more slowly, with higher accuracy.
3. Open the visual builder directly and build manually.

For the first two paths, the agent creates the draft first and opens the visual builder afterward. For the direct path, the visual builder opens immediately.

The first-run authoring session does not start a generated workflow runtime:

- No generated `run.sh init`
- No `.workflow/state.json`
- No generated hook invocation
- No stop guard or user prompt hook for Skill Builder itself

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

Skill Builder is itself a skill. The editor files live inside the skill folder:

```text
plugin-src/skills/skill-builder/
  SKILL.md
  scripts/open-builder.sh
  scripts/discover-workflow.sh
  app/
```

The committed plugin bundles keep installation direct:

```text
claude-plugin/                         # Claude Code plugin bundle
plugins/skill-builder/                 # Codex plugin bundle
.claude-plugin/                        # Claude marketplace metadata
.agents/plugins/                       # Codex marketplace metadata
```

`plugin-src/skills/skill-builder/` is the source of truth. `npm run sync:plugins` copies that skill, including its bundled editor files, into both runtime-specific plugin bundles.

<details>
<summary>Maintainer Notes</summary>

### Validation

```bash
npm run lint
npm run build
npm run test:scenarios
npm run test:e2e:clean-cli
npm run test:e2e:authoring-modes
npm run sync:plugins
npm run validate:plugins
```

`test:e2e:clean-cli` runs in Docker with a clean HOME, installs Claude Code and Codex CLIs, adds this repo as a local marketplace, installs the Skill Builder plugin, verifies the authoring gate, launches the bundled editor after discovery, imports a sample project, exports a generated skill, starts that generated skill runtime, and verifies hook ownership isolation.

`test:e2e:authoring-modes` runs in Docker with a clean HOME and validates the three first-run authoring paths: repo-analysis draft, ping-pong draft, and direct visual builder. It asserts that Mode 1 and Mode 2 do not open the UI until a draft exists, Mode 3 opens directly, and Skill Builder onboarding never creates generated workflow state or hooks.

Optional model-backed CLI smoke tests:

```bash
SKILL_BUILDER_E2E_LIVE=1 npm run test:e2e:live-agent
```

The live smoke uses subscription-backed CLIs, not direct API keys. For Codex, it runs `codex exec` with a clean HOME seeded only with Codex auth. For Claude Code, it first uses `CLAUDE_CODE_OAUTH_TOKEN` when available for a clean HOME subscription run; otherwise it uses the locally logged-in Claude Code subscription with user settings disabled via `--setting-sources project`. It checks that the installed skill contract still routes first-run users through the three authoring modes without opening the UI or creating `.workflow/state.json`.

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
- Claude Code authentication docs: https://code.claude.com/docs/en/authentication
- Claude HUD README pattern: https://github.com/jarrodwatts/claude-hud
- Awesome README examples: https://github.com/matiassingers/awesome-readme
- OpenAI plugin examples: https://github.com/openai/plugins
