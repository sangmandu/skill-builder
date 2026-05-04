# Skill Builder

Skill Builder is a visual editor for stateful automation skills. It lets you model a skill as steps, helpers, tracks, state, and runtime assets, then export the generated package for Claude Code or Codex.

The product goal is to make automation workflows easier to create than hand-writing a growing set of `SKILL.md`, step files, helper files, shell scripts, and state transition utilities.

The user does not host the builder manually. After plugin installation, the agent harness reads the `skill-builder` skill, runs its bundled launcher, and hosts the local UI from inside the skill package.

## What It Builds

- Thin `SKILL.md` entrypoints for lazy loading
- Step files such as `010-specify.md`, `020-plan.md`, and `040-implement.md`
- `helpers.yaml` for reusable common skill instructions
- `track-steps.json` for feature/light/etc workflow paths
- `state-schema.json` and `.workflow/state.json` runtime state
- `run.sh` plus generated runtime scripts for init, complete, resume, rewind, and interrupt
- Target-specific metadata for Claude Code or Codex

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3847
```

To import an existing generated skill, use the UI import field or open:

```text
http://localhost:3847/?rootDir=/path/to/skill
```

## Plugin Layout

This repository ships dual plugin targets because Claude Code and Codex use different manifest conventions.

```text
plugin-src/skills/skill-builder/        # source skill, launcher, and bundled app
claude-plugin/                          # Claude Code plugin bundle
plugins/skill-builder/                  # Codex plugin bundle
.claude-plugin/                         # Claude marketplace metadata
.agents/plugins/                        # Codex marketplace metadata
scripts/sync-targets.sh                 # regenerate plugin bundles from source
scripts/validate-dual-targets.sh
```

The duplicated target bundles are intentional and committed so `plugin marketplace add` can install directly from the repository. `plugin-src/skills/skill-builder/` is the source of truth; `npm run sync:plugins` copies that skill, including its `app/` directory, into each runtime-specific bundle.

## Claude Code Plugin

During local development:

```bash
claude --plugin-dir ./claude-plugin
```

Then invoke:

```text
/skill-builder:skill-builder
```

The plugin starts the local app from `claude-plugin/skills/skill-builder/app/` and opens the builder for the current working directory.

## Codex Plugin

For a local marketplace install:

```bash
codex plugin marketplace add .
```

The Codex plugin bundle lives at:

```text
plugins/skill-builder
```

The bundled skill is:

```text
plugins/skill-builder/skills/skill-builder/SKILL.md
```

The Codex plugin starts the same bundled skill app from `plugins/skill-builder/skills/skill-builder/app/`.

## Validation

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

## Design

See [DESIGN.md](./plugin-src/skills/skill-builder/app/DESIGN.md) for the visual design tokens and UI rules.

## References

- Claude Code plugin docs: https://code.claude.com/docs/en/plugins
- Claude Code plugin reference: https://code.claude.com/docs/en/plugins-reference
- OpenAI Codex plugins and skills overview: https://openai.com/academy/codex-plugins-and-skills/
- OpenAI plugin examples: https://github.com/openai/plugins
