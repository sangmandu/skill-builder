#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${SKILL_BUILDER_E2E_IMAGE:-skill-builder-clean-cli-e2e}"

if [ "${SKILL_BUILDER_E2E_IN_DOCKER:-}" != "1" ]; then
  docker build -f "$ROOT/tests/e2e/Dockerfile" -t "$IMAGE" "$ROOT"
  docker run --rm \
    -e SKILL_BUILDER_E2E_IN_DOCKER=1 \
    -v "$ROOT:/repo:ro" \
    "$IMAGE" \
    bash /repo/scripts/e2e-clean-cli.sh
  exit 0
fi

export HOME=/home/skill-builder-e2e
export XDG_CONFIG_HOME=/home/skill-builder-e2e/.config
export SKILL_BUILDER_CLIENT_PORT=48347
export SKILL_BUILDER_SERVER_PORT=48348

rm -rf "$HOME" /tmp/sample-code-project /tmp/generated-skill /tmp/other-code-project
mkdir -p "$HOME" "$XDG_CONFIG_HOME" /tmp/sample-code-project/src /tmp/sample-code-project/tests /tmp/sample-code-project/.github/workflows /tmp/other-code-project

cat > /tmp/sample-code-project/package.json <<'JSON'
{
  "name": "sample-code-project",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint src",
    "test": "node --test tests/*.test.js"
  }
}
JSON

cat > /tmp/sample-code-project/README.md <<'MD'
# Sample Code Project

This sample represents a small product codebase with feature delivery, tests, and CI.
MD

cat > /tmp/sample-code-project/src/app.ts <<'TS'
export function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
TS

cat > /tmp/sample-code-project/tests/app.test.js <<'JS'
import assert from 'node:assert/strict';

assert.equal('Skill Builder'.trim(), 'Skill Builder');
JS

cat > /tmp/sample-code-project/.github/workflows/ci.yml <<'YAML'
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
YAML

claude plugin validate /repo
claude plugin marketplace add /repo
claude plugin install skill-builder@sangmandu

if jq -e 'has("hooks")' "$HOME/.claude/settings.json" >/dev/null; then
  echo "Claude clean install unexpectedly registered hooks" >&2
  exit 1
fi

CLAUDE_SKILL="$HOME/.claude/plugins/cache/sangmandu/skill-builder/0.1.0/skills/skill-builder"
test -f "$CLAUDE_SKILL/SKILL.md"
test -x "$CLAUDE_SKILL/scripts/open-builder.sh"
test -x "$CLAUDE_SKILL/scripts/discover-workflow.sh"
test ! -e "$CLAUDE_SKILL/stop-guard.sh"
test ! -e "$CLAUDE_SKILL/user-interrupt.sh"

bash "$CLAUDE_SKILL/scripts/discover-workflow.sh" /tmp/sample-code-project > /tmp/discovery.md
grep -q "code project with repeatable implementation and verification work" /tmp/discovery.md
grep -q "Specify -> Plan -> Explain Plan -> Implement -> Self Review -> Test -> Commit" /tmp/discovery.md

timeout 120 bash "$CLAUDE_SKILL/scripts/open-builder.sh" /tmp/sample-code-project > /tmp/open-builder.out
grep -q "Skill Builder: http://localhost:${SKILL_BUILDER_CLIENT_PORT}/?rootDir=" /tmp/open-builder.out
curl -fsS "http://127.0.0.1:${SKILL_BUILDER_SERVER_PORT}/api/presets/full-pipeline" -o /tmp/preset.json

jq '.config + {targetDir: "/tmp/generated-skill"}' /tmp/preset.json > /tmp/export-body.json
curl -fsS \
  -H 'Content-Type: application/json' \
  -d @/tmp/export-body.json \
  "http://127.0.0.1:${SKILL_BUILDER_SERVER_PORT}/api/export" \
  -o /tmp/export-result.json

jq -e '.success == true' /tmp/export-result.json >/dev/null
test -x /tmp/generated-skill/run.sh
test -x /tmp/generated-skill/stop-guard.sh
test -x /tmp/generated-skill/user-interrupt.sh
test ! -e /tmp/sample-code-project/.workflow/state.json

cd /tmp/sample-code-project
bash /tmp/generated-skill/run.sh init feature "add typed title normalization"
test -f /tmp/sample-code-project/.workflow/state.json

printf '{"session_id":"session-a","transcript_path":"/tmp/session-a.jsonl","cwd":"/tmp/sample-code-project"}' \
  | bash /tmp/generated-skill/stop-guard.sh > /tmp/guard-a.json
grep -q '"decision": "block"' /tmp/guard-a.json
jq -e '.control.owner_session_id == "session-a"' /tmp/sample-code-project/.workflow/state.json >/dev/null

printf '{"session_id":"session-b","transcript_path":"/tmp/session-b.jsonl","cwd":"/tmp/sample-code-project"}' \
  | bash /tmp/generated-skill/stop-guard.sh > /tmp/guard-b.json
test ! -s /tmp/guard-b.json

cd /tmp/other-code-project
printf '{"session_id":"session-a","transcript_path":"/tmp/session-a.jsonl","cwd":"/tmp/other-code-project"}' \
  | bash /tmp/generated-skill/stop-guard.sh > /tmp/guard-other.json
test ! -s /tmp/guard-other.json

codex plugin marketplace add /repo
test -f "$HOME/.codex/config.toml"
grep -q "sangmandu" "$HOME/.codex/config.toml"
test ! -f "$HOME/.codex/hooks.json"

echo "Clean CLI E2E passed."
