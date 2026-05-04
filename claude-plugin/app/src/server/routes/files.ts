import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  assetToShellScript,
  createSkillProjectFromWorkflowConfig,
  getStepExecutionMode,
  inferSkillAsset,
  interruptModeFromExecutionMode,
  autonomyFromExecutionMode,
  type Helper,
  type SkillAsset,
  type SkillExportTarget,
  type Step,
  type Track,
  type WorkflowConfig,
} from '../../lib/schema.js';

export const fileRouter = Router();

fileRouter.post('/load', (req, res) => {
  const { dirPath } = req.body as { dirPath: string };
  if (!dirPath) {
    res.status(400).json({ error: 'dirPath required' });
    return;
  }

  const resolved = path.resolve(dirPath.replace(/^~/, process.env.HOME || ''));
  if (!fs.existsSync(resolved)) {
    res.status(404).json({ error: `Directory not found: ${resolved}` });
    return;
  }

  try {
    const result = loadSkillDir(resolved);
    res.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

export function loadSkillDir(dir: string) {
  const stepRegistry = readJsonSafe(path.join(dir, 'step-registry.json'), {});
  const trackSteps = readJsonSafe(path.join(dir, 'track-steps.json'), {});
  const helpersRaw = readYamlSafe(path.join(dir, 'helpers.yaml'), {});
  const stateSchema = readJsonSafe(path.join(dir, 'state-schema.json'), undefined);
  const modelMetadata = readJsonSafe(path.join(dir, '.skill-builder/model.json'), {}) as PersistedModelMetadata;
  const skillMd = readFileSafe(path.join(dir, 'SKILL.md'), '');
  const stopGuard = readFileSafe(path.join(dir, 'stop-guard.sh'), '');
  const assets = findAssets(dir);

  const interruptSteps = extractInterruptSteps(stopGuard);

  const steps: Step[] = Object.entries(stepRegistry as Record<string, string>).map(([key, filename]) => {
    const filePath = path.join(dir, filename);
    const content = readFileSafe(filePath, '');
    const match = filename.match(/^(\d{3})-/);
    const number = match ? parseInt(match[1], 10) : 0;
    const title = extractTitle(content) || key;
    const helperRefs = extractHelperRefs(content);
    const meta = modelMetadata.steps?.[key] ?? {};
    let executionMode = getStepExecutionMode({
      executionMode: meta.executionMode,
      autonomy: meta.autonomy,
      interruptMode: meta.interruptMode,
      isInterrupt: interruptSteps.includes(key) || meta.isInterrupt === true,
    });
    if (!meta.executionMode && executionMode === 'solo') {
      executionMode = inferLegacyExecutionMode(content);
    }
    const interruptMode = interruptModeFromExecutionMode(executionMode);
    const isInterrupt = executionMode === 'user_involved';

    return {
      key,
      number,
      filename,
      title,
      content,
      isInterrupt,
      helperRefs: meta.helperRefs ?? helperRefs,
      scriptRefs: meta.scriptRefs ?? extractScriptRefs(content),
      executionMode,
      interruptMode,
      autonomy: autonomyFromExecutionMode(executionMode),
      produces: meta.produces ?? extractStateRefs(content, 'produces'),
      consumes: meta.consumes ?? extractStateRefs(content, 'consumes'),
    };
  });

  const helpers = parseHelpers(helpersRaw as Record<string, unknown>);

  const tracks: Track[] = Object.entries(trackSteps as Record<string, string[]>).map(([name, stepKeys]) => ({
    name,
    description: modelMetadata.tracks?.[name]?.description ?? '',
    steps: stepKeys,
    defaultAutonomy: modelMetadata.tracks?.[name]?.defaultAutonomy,
  }));

  const scripts = assets.filter(isScriptVisibleInCurrentUi).map(asset => {
    const withDescription = {
      ...asset,
      description: extractScriptDescription(path.join(dir, asset.path)),
    };
    return assetToShellScript(withDescription);
  });

  const hooks = {
    interruptSteps,
    stopGuardEnabled: stopGuard.length > 0,
    userInterruptEnabled: fs.existsSync(path.join(dir, 'user-interrupt.sh')),
  };

  const workflowConfig: WorkflowConfig = {
    name: path.basename(dir),
    description: '',
    steps,
    groups: [],
    tracks,
    helpers,
    scripts,
    hooks,
    skillMd,
    assets,
    stateSchema: stateSchema as WorkflowConfig['stateSchema'],
    graph: modelMetadata.graph ?? { edges: [] },
  };

  const project = createSkillProjectFromWorkflowConfig(workflowConfig, {
    name: path.basename(dir),
    rootDir: dir,
    assets,
  });

  return {
    rootDir: dir,
    steps,
    tracks,
    helpers,
    scripts,
    hooks,
    skillMd,
    assets,
    targetRuntime: modelMetadata.targetRuntime,
    project,
  };
}

interface PersistedModelMetadata {
  targetRuntime?: SkillExportTarget;
  steps?: Record<string, {
    isInterrupt?: boolean;
    executionMode?: Step['executionMode'];
    autonomy?: Step['autonomy'];
    interruptMode?: Step['interruptMode'];
    helperRefs?: string[];
    scriptRefs?: string[];
    produces?: string[];
    consumes?: string[];
  }>;
  tracks?: Record<string, {
    description?: string;
    defaultAutonomy?: Track['defaultAutonomy'];
  }>;
  graph?: WorkflowConfig['graph'];
}

function extractInterruptSteps(stopGuardContent: string): string[] {
  const jsonMatch = stopGuardContent.match(/python3 - "\$STATE" "\$WF_ROOT" '([^']*)'/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]) as string[] | Record<string, string>;
      if (Array.isArray(parsed)) return parsed;
      return Object.keys(parsed);
    } catch {
      return [];
    }
  }
  const match = stopGuardContent.match(/INTERRUPT_STEPS=\(\s*([\s\S]*?)\)/);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(?:Step\s+\d+:\s*)?(.+)/m);
  return match ? match[1].trim() : '';
}

function inferLegacyExecutionMode(content: string): NonNullable<Step['executionMode']> {
  if (!/\bsub-?agents?\b/i.test(content)) return 'solo';
  return [
    /dispatch a sub-agent and wait/i,
    /wait for completion/i,
    /main agent receives sub-agent output/i,
    /delegate to .*sub-agents/i,
    /sub-agents must run in parallel/i,
    /all .* sub-agents must run in parallel/i,
  ].some(pattern => pattern.test(content)) ? 'background_wait' : 'solo';
}

function extractHelperRefs(content: string): string[] {
  const refs: string[] = [];
  const re = /helpers#([a-z][a-z0-9_]*)/g;
  let m;
  while ((m = re.exec(content))) {
    if (!refs.includes(m[1])) refs.push(m[1]);
  }
  return refs;
}

function extractScriptRefs(content: string): string[] {
  const refs = new Set<string>();
  const re = /\b((?:scripts|lib)\/[a-zA-Z0-9._/-]+\.(?:sh|py|js|ts))\b/g;
  let m;
  while ((m = re.exec(content))) {
    refs.add(m[1]);
  }
  return [...refs];
}

function extractStateRefs(content: string, label: 'produces' | 'consumes'): string[] {
  const refs = new Set<string>();
  const re = new RegExp(`${label}:\\s*([^\\n]+)`, 'gi');
  let m;
  while ((m = re.exec(content))) {
    for (const ref of m[1].split(',')) {
      const trimmed = ref.trim().replace(/`/g, '');
      if (trimmed.startsWith('data.')) refs.add(trimmed);
    }
  }
  return [...refs];
}

function parseHelpers(raw: Record<string, unknown>): Helper[] {
  const helpers: Helper[] = [];
  const always = (raw.always || {}) as Record<string, { body: string }>;
  const onDemand = (raw.on_demand || {}) as Record<string, { body: string }>;
  for (const [key, val] of Object.entries(always)) {
    helpers.push({ key, type: 'always', body: val.body || '' });
  }
  for (const [key, val] of Object.entries(onDemand)) {
    helpers.push({ key, type: 'on_demand', body: val.body || '' });
  }
  return helpers;
}

function findAssets(dir: string): SkillAsset[] {
  const metadata = readAssetMetadata(dir);
  return walkFiles(dir)
    .map(filePath => {
      const rel = path.relative(dir, filePath).split(path.sep).join('/');
      const description = rel.endsWith('.sh') ? extractScriptDescription(filePath) : '';
      const inferred = inferSkillAsset(rel, description);
      const override = metadata.get(rel);
      return {
        ...inferred,
        ...override,
        path: rel,
        description: override?.description ?? description,
        hash: hashFile(filePath),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function hashFile(filePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readAssetMetadata(dir: string): Map<string, SkillAsset> {
  const raw = readJsonSafe(path.join(dir, '.skill-builder/assets.json'), null) as { assets?: SkillAsset[] } | null;
  return new Map((raw?.assets ?? []).map(asset => [asset.path, asset]));
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

function isScriptVisibleInCurrentUi(asset: SkillAsset): boolean {
  return asset.path.endsWith('.sh') && (asset.path.startsWith('scripts/') || asset.path.startsWith('lib/'));
}

function extractScriptDescription(filePath: string): string {
  const content = readFileSafe(filePath, '');
  const line = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('#') && !line.startsWith('#!'))
    .map(line => line.replace(/^#\s*/, '').trim())
    .find(line => /[A-Za-z0-9]/.test(line));
  return line ?? '';
}

function readJsonSafe(p: string, fallback: unknown) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return fallback;
  }
}

function readYamlSafe(p: string, fallback: unknown) {
  try {
    return yaml.load(fs.readFileSync(p, 'utf-8'));
  } catch {
    return fallback;
  }
}

function readFileSafe(p: string, fallback: string) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return fallback;
  }
}
