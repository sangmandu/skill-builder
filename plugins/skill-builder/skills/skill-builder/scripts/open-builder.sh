#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
APP_ROOT="$PLUGIN_ROOT/app"
ACTIVE_ROOT="${1:-${SKILL_BUILDER_PROJECT_ROOT:-$PWD}}"
CLIENT_PORT="${SKILL_BUILDER_CLIENT_PORT:-3847}"
SERVER_PORT="${SKILL_BUILDER_SERVER_PORT:-3848}"
LOG_FILE="$APP_ROOT/.skill-builder-server.log"

if [ ! -d "$APP_ROOT" ]; then
  echo "Skill Builder app bundle not found: $APP_ROOT" >&2
  exit 1
fi

cd "$APP_ROOT"

if [ ! -d node_modules ]; then
  npm install
fi

port_listening() {
  lsof -iTCP:"$1" -sTCP:LISTEN -Pn >/dev/null 2>&1
}

wait_for_port() {
  local port="$1"
  local label="$2"
  local attempts=0
  until port_listening "$port"; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
      echo "Timed out waiting for $label on port $port. See $LOG_FILE" >&2
      exit 1
    fi
    sleep 0.5
  done
}

if ! port_listening "$SERVER_PORT"; then
  SKILL_BUILDER_SERVER_PORT="$SERVER_PORT" nohup npm run dev:server >> "$LOG_FILE" 2>&1 < /dev/null &
fi

if ! port_listening "$CLIENT_PORT"; then
  SKILL_BUILDER_CLIENT_PORT="$CLIENT_PORT" SKILL_BUILDER_SERVER_PORT="$SERVER_PORT" nohup npm run dev:client >> "$LOG_FILE" 2>&1 < /dev/null &
fi

wait_for_port "$SERVER_PORT" "Skill Builder API"
wait_for_port "$CLIENT_PORT" "Skill Builder UI"

ENCODED_ROOT="$(python3 - "$ACTIVE_ROOT" <<'PY'
import sys
import urllib.parse
print(urllib.parse.quote(sys.argv[1]))
PY
)"
URL="http://localhost:${CLIENT_PORT}/?rootDir=$ENCODED_ROOT"

if command -v open >/dev/null 2>&1; then
  open "$URL"
else
  printf '%s\n' "$URL"
fi

printf 'Skill Builder: %s\n' "$URL"
