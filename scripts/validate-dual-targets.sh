#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

require_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "Missing required file: $path" >&2
    exit 1
  fi
}

require_file .claude-plugin/marketplace.json
require_file claude-plugin/.claude-plugin/plugin.json
require_file claude-plugin/skills/skill-builder/SKILL.md
require_file claude-plugin/skills/skill-builder/app/package.json
require_file .agents/plugins/marketplace.json
require_file plugins/skill-builder/.codex-plugin/plugin.json
require_file plugins/skill-builder/skills/skill-builder/SKILL.md
require_file plugins/skill-builder/skills/skill-builder/app/package.json

ROOT_VERSION="$(jq -r '.version' package.json)"
APP_VERSION="$(jq -r '.version' plugin-src/skills/skill-builder/app/package.json)"
CLAUDE_VERSION="$(jq -r '.version' claude-plugin/.claude-plugin/plugin.json)"
CLAUDE_MARKET_VERSION="$(jq -r '.metadata.version' .claude-plugin/marketplace.json)"
CODEX_VERSION="$(jq -r '.version' plugins/skill-builder/.codex-plugin/plugin.json)"

if [ "$ROOT_VERSION" != "$APP_VERSION" ] || [ "$APP_VERSION" != "$CLAUDE_VERSION" ] || [ "$APP_VERSION" != "$CLAUDE_MARKET_VERSION" ] || [ "$APP_VERSION" != "$CODEX_VERSION" ]; then
  echo "Version mismatch: root=$ROOT_VERSION app=$APP_VERSION claude=$CLAUDE_VERSION marketplace=$CLAUDE_MARKET_VERSION codex=$CODEX_VERSION" >&2
  exit 1
fi

jq empty .claude-plugin/marketplace.json
jq empty claude-plugin/.claude-plugin/plugin.json
jq empty .agents/plugins/marketplace.json
jq empty plugins/skill-builder/.codex-plugin/plugin.json
jq -e '.plugins[] | select(.name == "skill-builder" and .source == "./claude-plugin")' .claude-plugin/marketplace.json >/dev/null
jq -e '.plugins[] | select(.name == "skill-builder" and .source.path == "./plugins/skill-builder")' .agents/plugins/marketplace.json >/dev/null

diff -qr -x .DS_Store -x node_modules -x dist -x .skill-builder-server.log plugin-src/skills claude-plugin/skills >/dev/null
diff -qr -x .DS_Store -x node_modules -x dist -x .skill-builder-server.log plugin-src/skills plugins/skill-builder/skills >/dev/null

if command -v claude >/dev/null 2>&1; then
  claude plugin validate claude-plugin
else
  echo "Skipping Claude plugin validate because claude CLI is not installed"
fi

if [ "${SKILL_BUILDER_VALIDATE_CODEX_MARKETPLACE:-0}" = "1" ]; then
  if ! command -v codex >/dev/null 2>&1; then
    echo "Codex marketplace validation requested but codex CLI is not installed" >&2
    exit 1
  fi
  TMP_HOME="$(mktemp -d)"
  trap 'rm -rf "$TMP_HOME"' EXIT
  HOME="$TMP_HOME" codex plugin marketplace add "$ROOT" >/dev/null
fi

echo "Dual-target validation passed"
