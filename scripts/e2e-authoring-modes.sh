#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${SKILL_BUILDER_E2E_IMAGE:-skill-builder-authoring-modes-e2e}"

if [ "${SKILL_BUILDER_E2E_IN_DOCKER:-}" != "1" ]; then
  docker build -f "$ROOT/tests/e2e/Dockerfile" -t "$IMAGE" "$ROOT"
  docker run --rm \
    -e SKILL_BUILDER_E2E_IN_DOCKER=1 \
    -v "$ROOT:/repo:ro" \
    "$IMAGE" \
    bash /repo/scripts/e2e-authoring-modes.sh
  exit 0
fi

export HOME=/home/skill-builder-authoring-e2e
export XDG_CONFIG_HOME=/home/skill-builder-authoring-e2e/.config
export SKILL_BUILDER_CLIENT_PORT=49347
export SKILL_BUILDER_SERVER_PORT=49348

WORK_ROOT=/tmp/skill-builder-authoring
SAMPLE_PROJECT="$WORK_ROOT/sample-code-project"
MODE_1_DRAFT="$WORK_ROOT/mode-1-repo-analysis-skill"
MODE_2_DRAFT="$WORK_ROOT/mode-2-ping-pong-skill"

rm -rf "$HOME" "$WORK_ROOT"
mkdir -p "$HOME" "$XDG_CONFIG_HOME" "$SAMPLE_PROJECT/src" "$SAMPLE_PROJECT/tests" "$SAMPLE_PROJECT/docs" "$SAMPLE_PROJECT/.github/workflows"

cat > "$SAMPLE_PROJECT/package.json" <<'JSON'
{
  "name": "sample-authoring-project",
  "private": true,
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint src",
    "test": "node --test tests/*.test.js"
  }
}
JSON

cat > "$SAMPLE_PROJECT/README.md" <<'MD'
# Sample Authoring Project

This project repeats feature delivery work with planning, implementation, review, tests, and commits.
MD

cat > "$SAMPLE_PROJECT/docs/release.md" <<'MD'
# Release Notes

Every feature needs a short release note and verification summary.
MD

cat > "$SAMPLE_PROJECT/src/app.ts" <<'TS'
export function titleCase(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
TS

cat > "$SAMPLE_PROJECT/tests/app.test.js" <<'JS'
import assert from 'node:assert/strict';

assert.equal('Skill Builder'.trim(), 'Skill Builder');
JS

cat > "$SAMPLE_PROJECT/.github/workflows/ci.yml" <<'YAML'
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
YAML

port_listening() {
  lsof -iTCP:"$1" -sTCP:LISTEN -Pn >/dev/null 2>&1
}

assert_builder_closed() {
  if port_listening "$SKILL_BUILDER_CLIENT_PORT" || port_listening "$SKILL_BUILDER_SERVER_PORT"; then
    echo "Skill Builder opened before the authoring path allowed visual editing" >&2
    exit 1
  fi
}

stop_builder() {
  local pids
  pids="$(lsof -tiTCP:"$SKILL_BUILDER_CLIENT_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
  fi
  pids="$(lsof -tiTCP:"$SKILL_BUILDER_SERVER_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
  fi
  sleep 1
}

assert_no_authoring_runtime_state() {
  if find "$WORK_ROOT" -path '*/.workflow/state.json' -print -quit | grep -q .; then
    echo "Skill Builder authoring created generated workflow state before exported skill runtime start" >&2
    exit 1
  fi
}

json_string() {
  python3 - "$1" <<'PY'
import json
import sys
print(json.dumps(sys.argv[1]))
PY
}

write_draft_skill() {
  local draft_dir="$1"
  local title="$2"
  local summary="$3"
  mkdir -p "$draft_dir/steps" "$draft_dir/.skill-builder"
  cat > "$draft_dir/SKILL.md" <<MD
---
name: $(basename "$draft_dir")
description: Draft workflow created by Skill Builder authoring E2E.
---

# $title

$summary
MD
  cat > "$draft_dir/step-registry.json" <<'JSON'
{
  "SPECIFY": "steps/010-specify.md",
  "PLAN": "steps/020-plan.md",
  "EXPLAIN_PLAN": "steps/030-explain-plan.md",
  "IMPLEMENT": "steps/040-implement.md",
  "SELF_REVIEW": "steps/050-self-review.md",
  "TEST": "steps/060-test.md",
  "COMMIT": "steps/070-commit.md"
}
JSON
  cat > "$draft_dir/track-steps.json" <<'JSON'
{
  "feature": ["SPECIFY", "PLAN", "EXPLAIN_PLAN", "IMPLEMENT", "SELF_REVIEW", "TEST", "COMMIT"],
  "light": ["SPECIFY", "PLAN", "EXPLAIN_PLAN", "IMPLEMENT", "SELF_REVIEW", "COMMIT"]
}
JSON
  cat > "$draft_dir/helpers.yaml" <<'YAML'
state_transition:
  type: always
  body: |
    ## State Transition

    Keep workflow progress explicit and continue without user questions unless blocked.
git_rules:
  type: on_demand
  body: |
    ## Git Rules

    Stage only relevant files and commit after verification.
YAML
  cat > "$draft_dir/.skill-builder/model.json" <<'JSON'
{
  "targetRuntime": "codex",
  "steps": {
    "SPECIFY": { "executionMode": "solo", "helperRefs": ["state_transition"], "produces": ["data.task_scope"] },
    "PLAN": { "executionMode": "solo", "helperRefs": ["state_transition"], "consumes": ["data.task_scope"], "produces": ["data.plan_summary"] },
    "EXPLAIN_PLAN": { "executionMode": "user_involved", "helperRefs": ["state_transition"], "consumes": ["data.plan_summary"] },
    "IMPLEMENT": { "executionMode": "solo", "helperRefs": ["state_transition", "git_rules"], "consumes": ["data.plan_summary"], "produces": ["data.implementation_summary"] },
    "SELF_REVIEW": { "executionMode": "background_wait", "helperRefs": ["state_transition"], "consumes": ["data.implementation_summary"], "produces": ["data.review_notes"] },
    "TEST": { "executionMode": "solo", "helperRefs": ["state_transition"], "consumes": ["data.review_notes"], "produces": ["data.verification_summary"] },
    "COMMIT": { "executionMode": "solo", "helperRefs": ["state_transition", "git_rules"], "consumes": ["data.verification_summary"], "produces": ["data.commit_sha"] }
  },
  "tracks": {
    "feature": { "description": "Feature delivery draft" },
    "light": { "description": "Small change draft" }
  },
  "graph": { "edges": [] }
}
JSON
  cat > "$draft_dir/steps/010-specify.md" <<'MD'
# Step 010: SPECIFY

Clarify the concrete task and repository constraints.
MD
  cat > "$draft_dir/steps/020-plan.md" <<'MD'
# Step 020: PLAN

Create a focused implementation plan from the task scope.
MD
  cat > "$draft_dir/steps/030-explain-plan.md" <<'MD'
# Step 030: EXPLAIN_PLAN

Explain the plan to the user when visibility or confirmation is required.
MD
  cat > "$draft_dir/steps/040-implement.md" <<'MD'
# Step 040: IMPLEMENT

Apply the planned change.
MD
  cat > "$draft_dir/steps/050-self-review.md" <<'MD'
# Step 050: SELF_REVIEW

Ask a sub-agent to review the implementation and wait for the result.
MD
  cat > "$draft_dir/steps/060-test.md" <<'MD'
# Step 060: TEST

Run the verification commands and record results.
MD
  cat > "$draft_dir/steps/070-commit.md" <<'MD'
# Step 070: COMMIT

Commit the completed change when appropriate.
MD
}

load_skill_dir() {
  local dir="$1"
  local body
  body="{\"dirPath\":$(json_string "$dir")}"
  curl -fsS \
    -H 'Content-Type: application/json' \
    -d "$body" \
    "http://127.0.0.1:${SKILL_BUILDER_SERVER_PORT}/api/files/load"
}

claude plugin validate /repo
claude plugin marketplace add /repo
claude plugin install skill-builder@sangmandu
codex plugin marketplace add /repo

CLAUDE_SKILL="$HOME/.claude/plugins/cache/sangmandu/skill-builder/0.1.0/skills/skill-builder"
test -f "$CLAUDE_SKILL/SKILL.md"
test -x "$CLAUDE_SKILL/scripts/open-builder.sh"
test -x "$CLAUDE_SKILL/scripts/discover-workflow.sh"
test ! -e "$CLAUDE_SKILL/stop-guard.sh"
test ! -e "$CLAUDE_SKILL/user-interrupt.sh"
grep -q "Do not launch the builder UI immediately on skill activation" "$CLAUDE_SKILL/SKILL.md"
grep -q "어떤 방식으로 시작할까요" "$CLAUDE_SKILL/SKILL.md"
grep -q "레포를 분석해서" "$CLAUDE_SKILL/SKILL.md"
grep -q "핑퐁해서" "$CLAUDE_SKILL/SKILL.md"
grep -q "직접 만들어보실래요" "$CLAUDE_SKILL/SKILL.md"
grep -q "one to three focused questions" "$CLAUDE_SKILL/SKILL.md"
grep -q "Do not start the exported skill runtime, do not initialize" "$CLAUDE_SKILL/SKILL.md"

if jq -e 'has("hooks")' "$HOME/.claude/settings.json" >/dev/null; then
  echo "Skill Builder install registered Claude hooks before an exported skill runtime exists" >&2
  exit 1
fi
test ! -f "$HOME/.codex/hooks.json"
assert_builder_closed
assert_no_authoring_runtime_state

bash "$CLAUDE_SKILL/scripts/discover-workflow.sh" "$SAMPLE_PROJECT" > "$WORK_ROOT/mode-1-discovery.md"
grep -q "Source directories: src" "$WORK_ROOT/mode-1-discovery.md"
grep -q "Test directories: tests" "$WORK_ROOT/mode-1-discovery.md"
grep -Fq "Package scripts: build: tsc -p tsconfig.json, lint: eslint src, test: node --test tests/*.test.js" "$WORK_ROOT/mode-1-discovery.md"
grep -q "Specify -> Plan -> Explain Plan -> Implement -> Self Review -> Test -> Commit" "$WORK_ROOT/mode-1-discovery.md"
assert_builder_closed
write_draft_skill "$MODE_1_DRAFT" "Repository Analysis Draft" "Drafted from package scripts, source folders, tests, docs, and CI evidence."
test -f "$MODE_1_DRAFT/SKILL.md"
test -f "$MODE_1_DRAFT/step-registry.json"
assert_no_authoring_runtime_state
timeout 120 bash "$CLAUDE_SKILL/scripts/open-builder.sh" "$MODE_1_DRAFT" > "$WORK_ROOT/mode-1-open.out"
grep -q "Skill Builder: http://localhost:${SKILL_BUILDER_CLIENT_PORT}/?rootDir=" "$WORK_ROOT/mode-1-open.out"
load_skill_dir "$MODE_1_DRAFT" > "$WORK_ROOT/mode-1-load.json"
jq -e '.steps | length == 7' "$WORK_ROOT/mode-1-load.json" >/dev/null
jq -e '.tracks | map(.name) | index("feature") and index("light")' "$WORK_ROOT/mode-1-load.json" >/dev/null
jq -e '.targetRuntime == "codex"' "$WORK_ROOT/mode-1-load.json" >/dev/null
assert_no_authoring_runtime_state
stop_builder
assert_builder_closed

cat > "$WORK_ROOT/mode-2-interview.md" <<'MD'
# Mode 2 Ping-Pong Transcript

Q1. What repeated trigger starts the workflow?
A1. Feature request or small product change.

Q2. Where should the user be involved?
A2. Explain the plan before implementation, then continue autonomously unless blocked.

Q3. What proves completion?
A3. Review notes, test output, and a commit summary.
MD
grep -q "Q1" "$WORK_ROOT/mode-2-interview.md"
grep -q "A3" "$WORK_ROOT/mode-2-interview.md"
assert_builder_closed
write_draft_skill "$MODE_2_DRAFT" "Ping-Pong Co-Author Draft" "Drafted from focused user answers about trigger, user involvement, and completion evidence."
test -f "$MODE_2_DRAFT/SKILL.md"
assert_no_authoring_runtime_state
timeout 120 bash "$CLAUDE_SKILL/scripts/open-builder.sh" "$MODE_2_DRAFT" > "$WORK_ROOT/mode-2-open.out"
load_skill_dir "$MODE_2_DRAFT" > "$WORK_ROOT/mode-2-load.json"
jq -e '.steps | map(.key) == ["SPECIFY","PLAN","EXPLAIN_PLAN","IMPLEMENT","SELF_REVIEW","TEST","COMMIT"]' "$WORK_ROOT/mode-2-load.json" >/dev/null
jq -e '.steps[] | select(.key == "EXPLAIN_PLAN") | .executionMode == "user_involved"' "$WORK_ROOT/mode-2-load.json" >/dev/null
jq -e '.steps[] | select(.key == "SELF_REVIEW") | .executionMode == "background_wait"' "$WORK_ROOT/mode-2-load.json" >/dev/null
assert_no_authoring_runtime_state
stop_builder
assert_builder_closed

timeout 120 bash "$CLAUDE_SKILL/scripts/open-builder.sh" "$SAMPLE_PROJECT" > "$WORK_ROOT/mode-3-open.out"
load_skill_dir "$SAMPLE_PROJECT" > "$WORK_ROOT/mode-3-load.json"
jq -e '.steps | length == 0' "$WORK_ROOT/mode-3-load.json" >/dev/null
jq -e '.project.config.steps | length == 0' "$WORK_ROOT/mode-3-load.json" >/dev/null
assert_no_authoring_runtime_state
stop_builder

echo "Authoring modes E2E passed."
