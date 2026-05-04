#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${SKILL_BUILDER_E2E_LIVE:-}" != "1" ]; then
  echo "Live agent E2E skipped. Set SKILL_BUILDER_E2E_LIVE=1 to run Claude/Codex model-backed smoke tests."
  exit 0
fi

TMP_ROOT="$(mktemp -d /tmp/skill-builder-live-agent.XXXXXX)"
SCHEMA="$TMP_ROOT/authoring-schema.json"

cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT

cat > "$SCHEMA" <<'JSON'
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "mode_count": { "type": "integer" },
    "opens_ui_immediately": { "type": "boolean" },
    "mode_1": { "type": "string" },
    "mode_2": { "type": "string" },
    "mode_3": { "type": "string" },
    "runtime_state_created": { "type": "boolean" }
  },
  "required": [
    "mode_count",
    "opens_ui_immediately",
    "mode_1",
    "mode_2",
    "mode_3",
    "runtime_state_created"
  ]
}
JSON

create_sample_project() {
  local project="$1"
  mkdir -p "$project/src" "$project/tests"
  cat > "$project/package.json" <<'JSON'
{
  "name": "skill-builder-live-sample",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --test tests/*.test.js"
  }
}
JSON
  cat > "$project/src/app.ts" <<'TS'
export function compact(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
TS
  cat > "$project/tests/app.test.js" <<'JS'
import assert from 'node:assert/strict';

assert.equal('x'.trim(), 'x');
JS
}

assert_authoring_json() {
  local file="$1"
  jq -e '.mode_count == 3' "$file" >/dev/null
  jq -e '.opens_ui_immediately == false' "$file" >/dev/null
  jq -e '.runtime_state_created == false' "$file" >/dev/null
  jq -e '(.mode_1 | test("repo|analy|레포|분석"; "i"))' "$file" >/dev/null
  jq -e '(.mode_2 | test("ping|pong|co-author|guided|interview|핑퐁|같이"; "i"))' "$file" >/dev/null
  jq -e '(.mode_3 | test("direct|visual|builder|직접|빌더"; "i"))' "$file" >/dev/null
}

extract_json_object() {
  local raw="$1"
  local normalized="$2"
  python3 - "$raw" "$normalized" <<'PY'
import json
import pathlib
import sys

raw = pathlib.Path(sys.argv[1]).read_text()
start = raw.find("{")
end = raw.rfind("}")
if start == -1 or end == -1 or end < start:
    raise SystemExit("No JSON object found in live agent output")
data = json.loads(raw[start:end + 1])
pathlib.Path(sys.argv[2]).write_text(json.dumps(data))
PY
}

run_codex_live() {
  local auth_source="${SKILL_BUILDER_CODEX_AUTH_JSON:-$HOME/.codex/auth.json}"
  if [ ! -f "$auth_source" ]; then
    echo "Codex live E2E skipped. Provide SKILL_BUILDER_CODEX_AUTH_JSON or login with codex first."
    return 0
  fi

  local live_home="$TMP_ROOT/codex-home"
  local project="$TMP_ROOT/codex-project"
  local output="$TMP_ROOT/codex-output.json"
  mkdir -p "$live_home/.codex"
  cp "$auth_source" "$live_home/.codex/auth.json"
  create_sample_project "$project"

  HOME="$live_home" CODEX_HOME="$live_home/.codex" codex plugin marketplace add "$ROOT" >/dev/null
  HOME="$live_home" CODEX_HOME="$live_home/.codex" codex exec \
    --ignore-rules \
    --skip-git-repo-check \
    --sandbox read-only \
    --cd "$project" \
    --add-dir "$ROOT" \
    --output-schema "$SCHEMA" \
    --output-last-message "$output" \
    "/skill-builder:skill-builder
First run in this repository. Do not modify files, do not start hooks, and do not open the builder. Read the installed Skill Builder authoring contract before answering. If the skill is not automatically loaded, inspect $ROOT/plugins/skill-builder/skills/skill-builder/SKILL.md from the local marketplace source. Return JSON only:
- mode_count: number of first-run authoring choices.
- opens_ui_immediately: whether Skill Builder should open the UI before a mode is selected.
- mode_1, mode_2, mode_3: short labels for each first-run authoring mode.
- runtime_state_created: whether Skill Builder onboarding should create .workflow/state.json." >/dev/null

  assert_authoring_json "$output"
  test ! -e "$project/.workflow/state.json"
  test ! -f "$live_home/.codex/hooks.json"
  echo "Codex live authoring smoke passed."
}

run_claude_live() {
  local claude_bin="${SKILL_BUILDER_CLAUDE_BIN:-$(command -v claude || true)}"
  if [ -x "/Users/mini/.local/bin/claude" ]; then
    claude_bin="/Users/mini/.local/bin/claude"
  fi
  if [ -z "$claude_bin" ]; then
    echo "Claude live E2E skipped. Install Claude Code CLI first."
    return 0
  fi

  local live_home="$TMP_ROOT/claude-home"
  local project="$TMP_ROOT/claude-project"
  local raw_output="$TMP_ROOT/claude-output.raw"
  local output="$TMP_ROOT/claude-output.json"
  local claude_env=(env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN CMUX_CLAUDE_HOOKS_DISABLED=1)
  mkdir -p "$live_home"
  create_sample_project "$project"

  if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
    claude_env+=(HOME="$live_home")
  elif ! "${claude_env[@]}" "$claude_bin" auth status --json >/dev/null 2>&1; then
    echo "Claude live E2E skipped. Log in with Claude Code subscription or set CLAUDE_CODE_OAUTH_TOKEN from 'claude setup-token'."
    return 0
  fi

  (
    cd "$project"
    printf '%s' \
      "/skill-builder:skill-builder
First run in this repository. Do not modify files, do not start hooks, and do not open the builder. According to the Skill Builder skill contract, return JSON only:
- mode_count: number of first-run authoring choices.
- opens_ui_immediately: whether Skill Builder should open the UI before a mode is selected.
- mode_1, mode_2, mode_3: short labels for each first-run authoring mode.
- runtime_state_created: whether Skill Builder onboarding should create .workflow/state.json." \
      | timeout 120 "${claude_env[@]}" "$claude_bin" -p \
        --no-session-persistence \
        --setting-sources project \
        --plugin-dir "$ROOT/claude-plugin" \
        --output-format text \
        > "$raw_output"
  )

  extract_json_object "$raw_output" "$output"
  assert_authoring_json "$output"
  test ! -e "$project/.workflow/state.json"
  if [ -n "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
    if find "$live_home/.claude" -name 'settings*.json' -print -quit 2>/dev/null | grep -q .; then
      echo "Claude clean token live E2E unexpectedly created user settings" >&2
      return 1
    fi
    echo "Claude live authoring smoke passed with clean HOME and CLAUDE_CODE_OAUTH_TOKEN."
  else
    echo "Claude live authoring smoke passed with local Claude subscription login and user settings disabled."
  fi
}

run_codex_live
run_claude_live
