#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/plugin-src/skills/skill-builder/app"
COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
  echo "Usage: scripts/run-app.sh <npm-script> [args...]" >&2
  exit 1
fi

if [ ! -d "$APP_DIR/node_modules" ]; then
  npm install --prefix "$APP_DIR"
fi

shift
npm --prefix "$APP_DIR" run "$COMMAND" -- "$@"
