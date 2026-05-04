import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { getStepExecutionMode, inferSkillAsset, isStopAllowedExecutionMode, type Helper, type HookConfig, type SkillAsset, type SkillExportTarget, type StateSchema, type Step, type SyncConflict, type Track, type WorkflowGraph } from '../../lib/schema.js';

export interface SkillPackageWriteBody {
  targetDir: string;
  workflowName?: string;
  steps: Array<Pick<Step, 'key' | 'number' | 'filename' | 'content' | 'isInterrupt'> & Partial<Pick<Step, 'executionMode' | 'autonomy' | 'interruptMode' | 'helperRefs' | 'scriptRefs' | 'produces' | 'consumes'>>>;
  tracks: Array<Pick<Track, 'name' | 'description' | 'steps'> & Partial<Pick<Track, 'defaultAutonomy'>>>;
  helpers: Array<Pick<Helper, 'key' | 'type' | 'body'>>;
  hooks: HookConfig;
  skillMd: string;
  assets?: SkillAsset[];
  stateSchema?: StateSchema;
  graph?: WorkflowGraph;
  targetRuntime?: SkillExportTarget;
  detectConflicts?: boolean;
}

export interface SkillPackageWriteResult {
  path: string;
  assets: SkillAsset[];
  written: string[];
  preserved: string[];
  lastSyncedAt: string;
}

export class SkillPackageConflictError extends Error {
  conflicts: SyncConflict[];

  constructor(conflicts: SyncConflict[]) {
    super('Sync conflict');
    this.name = 'SkillPackageConflictError';
    this.conflicts = conflicts;
  }
}

export function writeSkillPackage(body: SkillPackageWriteBody): SkillPackageWriteResult {
  const resolved = path.resolve(body.targetDir.replace(/^~/, process.env.HOME || ''));
  const written = new Set<string>();
  const preserved = new Set<string>();
  const preserveMap = createPreserveMap(body.assets ?? [], resolved);

  fs.mkdirSync(resolved, { recursive: true });
  fs.mkdirSync(path.join(resolved, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(resolved, 'lib'), { recursive: true });
  const plannedPaths = collectPlannedWritePaths(body);

  if (body.detectConflicts) {
    const conflicts = detectWriteConflicts(resolved, body.assets ?? [], plannedPaths);
    if (conflicts.length > 0) {
      throw new SkillPackageConflictError(conflicts);
    }
  }

  const stepRegistry: Record<string, string> = {};
  for (const step of body.steps) {
    stepRegistry[step.key] = step.filename;
    writeFile(resolved, step.filename, step.content, written, preserved, preserveMap);
  }

  writeJson(resolved, 'step-registry.json', stepRegistry, written, preserved, preserveMap);

  const trackSteps: Record<string, string[]> = {};
  for (const track of body.tracks) {
    trackSteps[track.name] = track.steps;
  }
  writeJson(resolved, 'track-steps.json', trackSteps, written, preserved, preserveMap);

  const helpersObj: Record<string, Record<string, { body: string }>> = {
    always: {},
    on_demand: {},
  };
  for (const helper of body.helpers) {
    helpersObj[helper.type][helper.key] = { body: helper.body };
  }
  writeFile(resolved, 'helpers.yaml', yaml.dump(helpersObj, { lineWidth: -1 }), written, preserved, preserveMap);
  writeFile(resolved, 'SKILL.md', body.skillMd, written, preserved, preserveMap);

  if (body.stateSchema) {
    writeJson(resolved, 'state-schema.json', body.stateSchema, written, preserved, preserveMap);
  }
  writeJson(resolved, '.skill-builder/model.json', createModelMetadata(body), written, preserved, preserveMap);

  writeExecutable(resolved, 'lib/init-workflow.sh', generateInitWorkflow(), written, preserved, preserveMap);
  writeExecutable(resolved, 'lib/complete-step.sh', generateCompleteStep(), written, preserved, preserveMap);
  writeExecutable(resolved, 'lib/resume-workflow.sh', generateResumeWorkflow(), written, preserved, preserveMap);
  writeExecutable(resolved, 'lib/rewind-step.sh', generateRewindStep(), written, preserved, preserveMap);
  writeFile(resolved, 'lib/render-step.py', generateRenderStepPy(), written, preserved, preserveMap);
  fs.chmodSync(path.join(resolved, 'lib/render-step.py'), 0o755);
  writeFile(resolved, 'lib/find-hook-state.py', generateFindHookStatePy(), written, preserved, preserveMap);
  fs.chmodSync(path.join(resolved, 'lib/find-hook-state.py'), 0o755);
  writeExecutable(resolved, 'lib/get-data.sh', generateGetData(), written, preserved, preserveMap);
  writeExecutable(resolved, 'lib/set-data.sh', generateSetData(), written, preserved, preserveMap);

  if (body.hooks.stopGuardEnabled) {
    writeExecutable(resolved, 'stop-guard.sh', generateStopGuard(body.steps), written, preserved, preserveMap);
  } else {
    removeGeneratedFile(resolved, 'stop-guard.sh', written, preserved, preserveMap);
  }

  if (body.hooks.userInterruptEnabled) {
    writeExecutable(resolved, 'user-interrupt.sh', generateUserInterrupt(), written, preserved, preserveMap);
  } else {
    removeGeneratedFile(resolved, 'user-interrupt.sh', written, preserved, preserveMap);
  }

  writeExecutable(resolved, 'scripts/agent-interrupt.sh', generateAgentInterrupt(), written, preserved, preserveMap);
  writeExecutable(resolved, 'run.sh', generateRunSh(), written, preserved, preserveMap);
  for (const asset of body.assets ?? []) {
    if (asset.role === 'workflow_utility' && asset.path.startsWith('scripts/') && asset.path.endsWith('.sh')) {
      writeExecutable(resolved, asset.path, generateWorkflowUtility(asset), written, preserved, preserveMap);
    }
  }

  const assets = collectAssetBaseline(resolved, body.assets ?? [], [...written]);
  writeAssetMetadata(resolved, assets);

  return {
    path: resolved,
    assets,
    written: [...written].sort(),
    preserved: [...preserved].sort(),
    lastSyncedAt: new Date().toISOString(),
  };
}

function writeFile(
  root: string,
  relPath: string,
  content: string,
  written: Set<string>,
  preserved: Set<string>,
  preserveMap: Map<string, SkillAsset>,
): void {
  const normalized = normalizeAssetPath(relPath);
  const filePath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (preserveMap.has(normalized) && fs.existsSync(filePath)) {
    preserved.add(normalized);
    return;
  }
  fs.writeFileSync(filePath, content, 'utf-8');
  written.add(normalized);
}

function writeJson(
  root: string,
  relPath: string,
  value: unknown,
  written: Set<string>,
  preserved: Set<string>,
  preserveMap: Map<string, SkillAsset>,
): void {
  writeFile(root, relPath, JSON.stringify(value, null, 2) + '\n', written, preserved, preserveMap);
}

function writeExecutable(
  root: string,
  relPath: string,
  content: string,
  written: Set<string>,
  preserved: Set<string>,
  preserveMap: Map<string, SkillAsset>,
): void {
  writeFile(root, relPath, content, written, preserved, preserveMap);
  if (!preserved.has(normalizeAssetPath(relPath))) {
    fs.chmodSync(path.join(root, relPath), 0o755);
  }
}

function removeGeneratedFile(
  root: string,
  relPath: string,
  written: Set<string>,
  preserved: Set<string>,
  preserveMap: Map<string, SkillAsset>,
): void {
  const filePath = path.join(root, relPath);
  if (fs.existsSync(filePath)) {
    const normalized = normalizeAssetPath(relPath);
    if (preserveMap.has(normalized)) {
      preserved.add(normalized);
      return;
    }
    fs.rmSync(filePath);
    written.add(normalized);
  }
}

function collectPlannedWritePaths(body: SkillPackageWriteBody): string[] {
  const paths = new Set<string>([
    'step-registry.json',
    'track-steps.json',
    'helpers.yaml',
    'SKILL.md',
    'lib/init-workflow.sh',
    'lib/complete-step.sh',
    'lib/resume-workflow.sh',
    'lib/rewind-step.sh',
    'lib/render-step.py',
    'lib/find-hook-state.py',
    'lib/get-data.sh',
    'lib/set-data.sh',
    'scripts/agent-interrupt.sh',
    'run.sh',
    '.skill-builder/model.json',
  ]);

  for (const step of body.steps) {
    paths.add(normalizeAssetPath(step.filename));
  }

  if (body.stateSchema) {
    paths.add('state-schema.json');
  }

  paths.add('stop-guard.sh');
  paths.add('user-interrupt.sh');
  for (const asset of body.assets ?? []) {
    if (asset.role === 'workflow_utility' && asset.path.startsWith('scripts/') && asset.path.endsWith('.sh')) {
      paths.add(normalizeAssetPath(asset.path));
    }
  }

  return [...paths];
}

function detectWriteConflicts(root: string, assets: SkillAsset[], plannedPaths: string[]): SyncConflict[] {
  const byPath = new Map(assets.map(asset => [normalizeAssetPath(asset.path), asset]));
  const conflicts: SyncConflict[] = [];

  for (const relPath of plannedPaths.map(normalizeAssetPath)) {
    const filePath = path.join(root, relPath);
    if (!fs.existsSync(filePath)) continue;

    const asset = byPath.get(relPath);
    if (!asset?.hash) continue;

    const currentHash = hashFile(filePath);
    if (currentHash === asset.hash) continue;

    const inferred = inferSkillAsset(relPath);
    const role = asset.role ?? inferred.role;
    const owner = asset.owner ?? inferred.owner;
    const overwritePolicy = asset.overwritePolicy ?? inferred.overwritePolicy;
    if (role === 'user_script' || (owner === 'user' && overwritePolicy === 'preserve')) continue;

    conflicts.push({
      path: relPath,
      role,
      owner,
      overwritePolicy,
      baselineHash: asset.hash,
      currentHash,
      recommendation: conflictRecommendation(role),
    });
  }

  return conflicts;
}

function conflictRecommendation(role: SkillAsset['role']): SyncConflict['recommendation'] {
  if (role === 'user_script') return 'preserve_external';
  if (role === 'platform_runtime') return 'regenerate_platform';
  return 'review_manually';
}

function createPreserveMap(assets: SkillAsset[], root: string): Map<string, SkillAsset> {
  const existing = readExistingAssetMetadata(root);
  const merged = new Map(existing);
  for (const asset of assets) {
    merged.set(normalizeAssetPath(asset.path), asset);
  }

  return new Map([...merged.entries()].filter(([, asset]) =>
    asset.role === 'user_script' ||
    (asset.owner === 'user' && asset.overwritePolicy === 'preserve'),
  ));
}

function readExistingAssetMetadata(root: string): Map<string, SkillAsset> {
  const metadataPath = path.join(root, '.skill-builder/assets.json');
  if (!fs.existsSync(metadataPath)) return new Map();
  try {
    const parsed = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as { assets?: SkillAsset[] };
    return new Map((parsed.assets ?? []).map(asset => [normalizeAssetPath(asset.path), asset]));
  } catch {
    return new Map();
  }
}

function collectAssetBaseline(root: string, providedAssets: SkillAsset[], writtenPaths: string[]): SkillAsset[] {
  const provided = new Map(providedAssets.map(asset => [normalizeAssetPath(asset.path), asset]));
  const paths = new Set([
    ...walkFiles(root).map(filePath => normalizeAssetPath(path.relative(root, filePath))),
    ...writtenPaths.map(normalizeAssetPath),
  ]);

  return [...paths]
    .filter(relPath => fs.existsSync(path.join(root, relPath)))
    .map(relPath => {
      const inferred = inferSkillAsset(relPath);
      const override = provided.get(relPath);
      return {
        ...inferred,
        ...override,
        path: relPath,
        hash: hashFile(path.join(root, relPath)),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function writeAssetMetadata(root: string, assets: SkillAsset[]): void {
  const metadataDir = path.join(root, '.skill-builder');
  fs.mkdirSync(metadataDir, { recursive: true });
  const metadata = {
    version: 1,
    updatedAt: new Date().toISOString(),
    assets: assets.map(asset => ({
      path: asset.path,
      role: asset.role,
      owner: asset.owner,
      generated: asset.generated,
      overwritePolicy: asset.overwritePolicy,
      roleSource: asset.roleSource,
      hash: asset.hash,
      description: asset.description,
    })),
  };
  fs.writeFileSync(path.join(metadataDir, 'assets.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf-8');
}

function createModelMetadata(body: SkillPackageWriteBody): unknown {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    workflowName: body.workflowName,
    targetRuntime: body.targetRuntime ?? 'claude-code',
    steps: Object.fromEntries(body.steps.map(step => [
      step.key,
      {
        isInterrupt: step.isInterrupt,
        executionMode: 'executionMode' in step ? step.executionMode : getStepExecutionMode(step),
        autonomy: 'autonomy' in step ? step.autonomy : undefined,
        interruptMode: 'interruptMode' in step ? step.interruptMode : undefined,
        helperRefs: 'helperRefs' in step ? step.helperRefs : undefined,
        scriptRefs: 'scriptRefs' in step ? step.scriptRefs : undefined,
        produces: 'produces' in step ? step.produces : undefined,
        consumes: 'consumes' in step ? step.consumes : undefined,
      },
    ])),
    tracks: Object.fromEntries(body.tracks.map(track => [
      track.name,
      {
        description: track.description,
        defaultAutonomy: 'defaultAutonomy' in track ? track.defaultAutonomy : undefined,
      },
    ])),
    graph: body.graph ?? { edges: [] },
  };
}

function hashFile(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function normalizeAssetPath(assetPath: string): string {
  return assetPath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function generateInitWorkflow(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$WORKTREE"

TRACK="\${1:-default}"
TASK="\${2:-}"
STATE_DIR=".workflow"
STATE_FILE="$STATE_DIR/state.json"
OWNER_SESSION_ID="\${SKILL_WORKFLOW_SESSION_ID:-\${CLAUDE_SESSION_ID:-\${CODEX_SESSION_ID:-}}}"
OWNER_TRANSCRIPT_PATH="\${SKILL_WORKFLOW_TRANSCRIPT_PATH:-\${CLAUDE_TRANSCRIPT_PATH:-\${CODEX_TRANSCRIPT_PATH:-}}}"
mkdir -p "$STATE_DIR"

python3 - "$SKILL_DIR" "$TRACK" "$TASK" "$STATE_FILE" "$OWNER_SESSION_ID" "$OWNER_TRANSCRIPT_PATH" "$WORKTREE" <<'PY'
import json
import pathlib
import sys
import time
import uuid

skill_dir = pathlib.Path(sys.argv[1])
track = sys.argv[2]
task = sys.argv[3]
state_file = pathlib.Path(sys.argv[4])
owner_session_id = sys.argv[5]
owner_transcript_path = sys.argv[6]
owner_cwd = sys.argv[7]

track_steps = json.loads((skill_dir / "track-steps.json").read_text())
steps = track_steps.get(track)
if not steps:
    available = ", ".join(sorted(track_steps.keys()))
    raise SystemExit(f"Unknown or empty track: {track}. Available: {available}")

now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
state = {
    "control": {
        "workflow_id": str(uuid.uuid4()),
        "track": track,
        "status": "running",
        "current_step": steps[0],
        "interrupted": False,
        "interrupt_reason": "",
        "task_description": task,
        "owner_session_id": owner_session_id,
        "owner_transcript_path": owner_transcript_path,
        "owner_cwd": owner_cwd,
        "hook_claim_policy": "claim_on_first_hook",
        "created_at": now,
        "updated_at": now,
        "steps": [
            {"key": key, "status": "running" if index == 0 else "pending", "completed_at": None}
            for index, key in enumerate(steps)
        ],
    },
    "data": {
        "task_description": task,
    },
}
state_file.write_text(json.dumps(state, indent=2) + "\\n")
PY

python3 "$SKILL_DIR/lib/render-step.py" "$STATE_FILE" "$SKILL_DIR"
`;
}

function generateCompleteStep(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$WORKTREE"

STEP="\${1:-}"
STATE_FILE=".workflow/state.json"

if [ -z "$STEP" ]; then
  echo "Usage: complete-step.sh <STEP_KEY>" >&2
  exit 2
fi

if [ ! -f "$STATE_FILE" ]; then
  echo "No workflow state found at $STATE_FILE" >&2
  exit 1
fi

python3 - "$STATE_FILE" "$STEP" <<'PY'
import json
import pathlib
import sys
import time

state_file = pathlib.Path(sys.argv[1])
step_key = sys.argv[2]
state = json.loads(state_file.read_text())
control = state.setdefault("control", {})
steps = control.get("steps", [])
now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

found = False
for step in steps:
    if step.get("key") == step_key:
        step["status"] = "completed"
        step["completed_at"] = now
        found = True
        break

if not found:
    raise SystemExit(f"Step not found in workflow state: {step_key}")

next_step = None
for step in steps:
    if step.get("status") == "pending":
        step["status"] = "running"
        next_step = step.get("key")
        break

control["interrupted"] = False
control["interrupt_reason"] = ""
control["updated_at"] = now

if next_step:
    control["status"] = "running"
    control["current_step"] = next_step
else:
    control["status"] = "completed"
    control["current_step"] = ""

state_file.write_text(json.dumps(state, indent=2) + "\\n")
PY

python3 "$SKILL_DIR/lib/render-step.py" "$STATE_FILE" "$SKILL_DIR"
`;
}

function generateResumeWorkflow(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$WORKTREE"

STATE_FILE=".workflow/state.json"

if [ ! -f "$STATE_FILE" ]; then
  echo "No workflow state found at $STATE_FILE" >&2
  exit 1
fi

python3 - "$STATE_FILE" <<'PY'
import json
import pathlib
import sys
import time

state_file = pathlib.Path(sys.argv[1])
state = json.loads(state_file.read_text())
control = state.setdefault("control", {})
if control.get("status") == "interrupted":
    control["status"] = "running"
control["interrupted"] = False
control["interrupt_reason"] = ""
control["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
state_file.write_text(json.dumps(state, indent=2) + "\\n")
PY

python3 "$SKILL_DIR/lib/render-step.py" "$STATE_FILE" "$SKILL_DIR"
`;
}

function generateRewindStep(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$WORKTREE"

STATE_FILE=".workflow/state.json"

if [ ! -f "$STATE_FILE" ]; then
  echo "No workflow state found at $STATE_FILE" >&2
  exit 1
fi

python3 - "$STATE_FILE" <<'PY'
import json
import pathlib
import sys
import time

state_file = pathlib.Path(sys.argv[1])
state = json.loads(state_file.read_text())
control = state.setdefault("control", {})
steps = control.get("steps", [])
current = control.get("current_step")
index = next((i for i, step in enumerate(steps) if step.get("key") == current), len(steps))
target = max(0, index - 1)
for i, step in enumerate(steps):
    if i < target:
        step["status"] = "completed"
    elif i == target:
        step["status"] = "running"
        step["completed_at"] = None
        control["current_step"] = step.get("key")
    else:
        step["status"] = "pending"
        step["completed_at"] = None
control["status"] = "running"
control["interrupted"] = False
control["interrupt_reason"] = ""
control["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
state_file.write_text(json.dumps(state, indent=2) + "\\n")
PY

python3 "$SKILL_DIR/lib/render-step.py" "$STATE_FILE" "$SKILL_DIR"
`;
}

function generateGetData(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

PATH_EXPR="\${1:-}"
STATE_FILE=".workflow/state.json"

if [ -z "$PATH_EXPR" ]; then
  echo "Usage: get-data.sh <data.path>" >&2
  exit 2
fi

python3 - "$STATE_FILE" "$PATH_EXPR" <<'PY'
import json
import pathlib
import sys

state = json.loads(pathlib.Path(sys.argv[1]).read_text())
value = state
for part in sys.argv[2].split("."):
    value = value.get(part) if isinstance(value, dict) else None
    if value is None:
        break
print(json.dumps(value))
PY
`;
}

function generateSetData(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

PATH_EXPR="\${1:-}"
VALUE="\${2:-}"
STATE_FILE=".workflow/state.json"

if [ -z "$PATH_EXPR" ]; then
  echo "Usage: set-data.sh <data.path> <json-value>" >&2
  exit 2
fi

python3 - "$STATE_FILE" "$PATH_EXPR" "$VALUE" <<'PY'
import json
import pathlib
import sys
import time

state_file = pathlib.Path(sys.argv[1])
path_expr = sys.argv[2]
raw_value = sys.argv[3]
state = json.loads(state_file.read_text())
try:
    value = json.loads(raw_value)
except json.JSONDecodeError:
    value = raw_value

target = state
parts = path_expr.split(".")
for part in parts[:-1]:
    target = target.setdefault(part, {})
target[parts[-1]] = value
state.setdefault("control", {})["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
state_file.write_text(json.dumps(state, indent=2) + "\\n")
PY
`;
}

function generateFindHookStatePy(): string {
  return `#!/usr/bin/env python3
import json
import pathlib
import sys

raw = sys.stdin.read()
try:
    payload = json.loads(raw or "{}")
except Exception:
    payload = {}

session_id = str(payload.get("session_id") or "")
transcript_path = str(payload.get("transcript_path") or "")
hook_cwd = pathlib.Path(str(payload.get("cwd") or pathlib.Path.cwd())).expanduser().resolve()

def candidate_roots():
    yielded = set()
    for start in [hook_cwd, pathlib.Path.cwd().resolve()]:
        for directory in [start, *start.parents]:
            if directory in yielded:
                continue
            yielded.add(directory)
            yield directory

for directory in candidate_roots():
    candidate = directory / ".workflow" / "state.json"
    if not candidate.exists():
        continue
    try:
        state = json.loads(candidate.read_text())
    except Exception:
        continue
    control = state.get("control") if isinstance(state, dict) else None
    if not isinstance(control, dict):
        continue
    if control.get("status") not in {"running", "interrupted", "completed"}:
        continue
    owner_session_id = str(control.get("owner_session_id") or "")
    if owner_session_id and session_id and owner_session_id != session_id:
        continue
    if owner_session_id and not session_id:
        continue
    if not owner_session_id and session_id and control.get("hook_claim_policy") == "claim_on_first_hook":
        control["owner_session_id"] = session_id
        control["owner_transcript_path"] = transcript_path
        control["owner_cwd"] = str(hook_cwd)
        candidate.write_text(json.dumps(state, indent=2) + "\\n")
    print(candidate)
    raise SystemExit(0)
`;
}

function generateRenderStepPy(): string {
  return `#!/usr/bin/env python3
import json
import pathlib
import re
import sys

def load_yaml(path):
    if not path.exists():
        return {}
    try:
        import yaml
        return yaml.safe_load(path.read_text()) or {}
    except Exception:
        return parse_helpers_fallback(path.read_text())

def parse_helpers_fallback(text):
    result = {"always": {}, "on_demand": {}}
    current_section = None
    current_key = None
    collecting = False
    body_lines = []
    for line in text.splitlines():
        if re.match(r"^(always|on_demand):\\s*$", line):
            if current_section and current_key:
                result[current_section][current_key] = {"body": "\\n".join(body_lines).rstrip()}
            current_section = line.split(":")[0]
            current_key = None
            collecting = False
            body_lines = []
            continue
        key_match = re.match(r"^  ([A-Za-z0-9_\\-]+):\\s*$", line)
        if key_match and current_section:
            if current_key:
                result[current_section][current_key] = {"body": "\\n".join(body_lines).rstrip()}
            current_key = key_match.group(1)
            collecting = False
            body_lines = []
            continue
        if re.match(r"^    body:\\s*", line):
            collecting = True
            body_lines = []
            continue
        if collecting:
            body_lines.append(re.sub(r"^      ?", "", line))
    if current_section and current_key:
        result[current_section][current_key] = {"body": "\\n".join(body_lines).rstrip()}
    return result

state_file = pathlib.Path(sys.argv[1])
skill_dir = pathlib.Path(sys.argv[2])
state = json.loads(state_file.read_text())
control = state.get("control", {})
current_step = control.get("current_step")

if control.get("status") == "completed" or not current_step:
    print("Workflow completed.")
    raise SystemExit(0)

registry = json.loads((skill_dir / "step-registry.json").read_text())
filename = registry.get(current_step)
if not filename:
    raise SystemExit(f"Current step is missing from registry: {current_step}")

step_path = skill_dir / filename
content = step_path.read_text() if step_path.exists() else f"# {current_step}\\n\\nMissing step file: {filename}\\n"
helpers = load_yaml(skill_dir / "helpers.yaml")
model_path = skill_dir / ".skill-builder" / "model.json"
model = json.loads(model_path.read_text()) if model_path.exists() else {}
step_meta = (model.get("steps") or {}).get(current_step, {})
helper_refs = set(step_meta.get("helperRefs") or [])
helper_refs.update(re.findall(r"helpers#([A-Za-z0-9_\\-]+)", content))

print(f"Workflow: {control.get('workflow_id', '')}")
print(f"Track: {control.get('track', '')}")
print(f"Status: {control.get('status', '')}")
print(f"Current step: {current_step}")
if control.get("task_description"):
    print(f"Task: {control.get('task_description')}")
print("")
print(content.rstrip())

always = helpers.get("always") or {}
on_demand = helpers.get("on_demand") or {}
selected = []
for key, value in always.items():
    selected.append((key, value.get("body", "")))
for key in sorted(helper_refs):
    if key in on_demand:
        selected.append((key, on_demand[key].get("body", "")))

if selected:
    print("\\n---\\n")
    print("# Relevant Helpers")
    for key, body in selected:
        print(f"\\n## {key}\\n")
        print(str(body).rstrip())
`;
}

function generateStopGuard(steps: SkillPackageWriteBody['steps']): string {
  const modeByStep = Object.fromEntries(steps.map(step => [step.key, getStepExecutionMode(step)]));
  const allowedModes = Object.fromEntries(Object.entries(modeByStep).filter(([, mode]) => isStopAllowedExecutionMode(mode)));
  const modesJson = JSON.stringify(allowedModes);
  return `#!/usr/bin/env bash
set -euo pipefail

WF_ROOT="$(cd "$(dirname "$0")" && pwd)"
INPUT="$(cat)"
STATE="$(printf '%s' "$INPUT" | python3 "$WF_ROOT/lib/find-hook-state.py" 2>/dev/null || true)"
[ -n "$STATE" ] || exit 0

python3 - "$STATE" "$WF_ROOT" '${modesJson}' <<'PY'
import json
import pathlib
import sys

state_file = pathlib.Path(sys.argv[1])
wf_root = sys.argv[2]
non_blocking_modes = json.loads(sys.argv[3])
try:
    state = json.loads(state_file.read_text())
except Exception:
    raise SystemExit(0)

control = state.setdefault("control", {})
if control.get("status") != "running":
    raise SystemExit(0)

current = control.get("current_step") or ""
if not current or control.get("interrupted") is True:
    raise SystemExit(0)

if current in non_blocking_modes:
    raise SystemExit(0)

steps = control.get("steps") or []
total = len(steps)
completed = sum(1 for step in steps if step.get("status") == "completed")
position = completed + 1 if total else "?"
message = (
    f"[wf guard] Workflow is still running - step [{position}/{total or '?'}] {current}.\\n"
    "Choose one of the following:\\n"
    f"  1. Step is complete -> bash {wf_root}/run.sh complete {current}\\n"
    "  2. Continue working -> proceed with the workflow instructions\\n"
    f"  3. Need user input -> bash {wf_root}/run.sh interrupt \\"<reason>\\""
)
print(json.dumps({"decision": "block", "reason": message}))
PY
`;
}

function generateAgentInterrupt(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

REASON="\${1:-Agent requested user input}"
STATE=".workflow/state.json"

if [ ! -f "$STATE" ]; then
  echo "No workflow state found at $STATE" >&2
  exit 1
fi

python3 - "$STATE" "$REASON" <<'PY'
import json
import pathlib
import sys
import time

state_file = pathlib.Path(sys.argv[1])
reason = sys.argv[2]
state = json.loads(state_file.read_text())
control = state.setdefault("control", {})
control["interrupted"] = True
control["interrupt_reason"] = reason
control["status"] = "interrupted"
control["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
state_file.write_text(json.dumps(state, indent=2) + "\\n")
current = control.get("current_step", "")
print(f"Workflow interrupted at step: {current}")
print(f"Reason: {reason}")
print("")
print("After the user response is resolved, run:")
print("  bash run.sh resume")
PY
`;
}

function generateUserInterrupt(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

WF_ROOT="$(cd "$(dirname "$0")" && pwd)"
INPUT="$(cat)"
STATE="$(printf '%s' "$INPUT" | python3 "$WF_ROOT/lib/find-hook-state.py" 2>/dev/null || true)"
[ -n "$STATE" ] || exit 0

python3 - "$STATE" "$WF_ROOT" <<'PY'
import json
import pathlib
import sys

state_file = pathlib.Path(sys.argv[1])
wf_root = sys.argv[2]
try:
    state = json.loads(state_file.read_text())
except Exception:
    raise SystemExit(0)

control = state.setdefault("control", {})
if control.get("status") != "running":
    raise SystemExit(0)

current = control.get("current_step") or ""
if not current:
    raise SystemExit(0)

additional_context = (
    f"[wf] Workflow is running at step {current}. "
    "This prompt hook does not mark the workflow interrupted. "
    f"If the user response requires a real workflow pause, run bash {wf_root}/run.sh interrupt \\"<reason>\\". "
    "Otherwise continue the current step and complete it when done."
)
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": additional_context,
    }
}))
PY
`;
}

function generateRunSh(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKTREE="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$WORKTREE"
CMD="\${1:-}"
shift || true

case "$CMD" in
  init)
    exec bash "$SKILL_DIR/lib/init-workflow.sh" "$@"
    ;;
  resume)
    exec bash "$SKILL_DIR/lib/resume-workflow.sh" "$@"
    ;;
  complete)
    exec bash "$SKILL_DIR/lib/complete-step.sh" "$@"
    ;;
  interrupt)
    exec bash "$SKILL_DIR/scripts/agent-interrupt.sh" "$@"
    ;;
  rewind)
    exec bash "$SKILL_DIR/lib/rewind-step.sh" "$@"
    ;;
  *)
    cat >&2 <<EOF
Usage: run.sh <command> [args]

Commands:
  init <track> "<description>"   Start a new workflow
  resume                         Resume the current workflow
  complete <STEP_KEY>            Mark step done and get the next one
  interrupt "<reason>"           Signal that the agent needs user input
  rewind                         Move the workflow back one step
EOF
    exit 2
    ;;
esac
`;
}

function generateWorkflowUtility(asset: SkillAsset): string {
  return `#!/usr/bin/env bash
set -euo pipefail

echo "Workflow utility placeholder: ${asset.path}"
`;
}
