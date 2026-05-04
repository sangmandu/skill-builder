#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

copy_dir() {
  local src="$1"
  local dst="$2"
  mkdir -p "$dst"
  rsync -a --delete --delete-excluded \
    --exclude .DS_Store \
    --exclude node_modules \
    --exclude dist \
    --exclude .skill-builder-server.log \
    "$src"/ "$dst"/
}

copy_dir plugin-src/skills claude-plugin/skills
copy_dir plugin-src/skills plugins/skill-builder/skills
chmod +x claude-plugin/skills/skill-builder/scripts/open-builder.sh
chmod +x claude-plugin/skills/skill-builder/scripts/discover-workflow.sh
chmod +x plugins/skill-builder/skills/skill-builder/scripts/open-builder.sh
chmod +x plugins/skill-builder/skills/skill-builder/scripts/discover-workflow.sh

echo "Synced Skill Builder plugin targets"
