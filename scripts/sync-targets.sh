#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

copy_dir() {
  local src="$1"
  local dst="$2"
  mkdir -p "$dst"
  rsync -a --delete --delete-excluded --exclude .DS_Store "$src"/ "$dst"/
}

copy_file() {
  local src="$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
}

sync_app() {
  local dst="$1"
  rm -rf "$dst"
  mkdir -p "$dst"

  copy_file package.json "$dst/package.json"
  copy_file package-lock.json "$dst/package-lock.json"
  copy_file tsconfig.json "$dst/tsconfig.json"
  copy_file tsconfig.app.json "$dst/tsconfig.app.json"
  copy_file tsconfig.node.json "$dst/tsconfig.node.json"
  copy_file vite.config.ts "$dst/vite.config.ts"
  copy_file eslint.config.js "$dst/eslint.config.js"
  copy_file index.html "$dst/index.html"
  copy_file DESIGN.md "$dst/DESIGN.md"
  copy_dir public "$dst/public"
  copy_dir src "$dst/src"
}

copy_dir plugin-src/skills claude-plugin/skills
copy_dir plugin-src/skills plugins/skill-builder/skills
sync_app claude-plugin/app
sync_app plugins/skill-builder/app
chmod +x claude-plugin/skills/skill-builder/scripts/open-builder.sh
chmod +x plugins/skill-builder/skills/skill-builder/scripts/open-builder.sh

echo "Synced Skill Builder plugin targets"
