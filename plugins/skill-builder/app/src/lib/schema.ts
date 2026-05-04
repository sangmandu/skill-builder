export interface Step {
  key: string;
  number: number;
  filename: string;
  title: string;
  content: string;
  isInterrupt: boolean;
  helperRefs: string[];
  scriptRefs?: string[];
  executionMode?: ExecutionMode;
  interruptMode?: InterruptMode;
  autonomy?: AutonomyMode;
  produces?: string[];
  consumes?: string[];
}

export interface StepGroup {
  id: string;
  label: string;
  range: [number, number];
  steps: Step[];
}

export interface Track {
  name: string;
  description: string;
  steps: string[];
  defaultAutonomy?: 'autonomous' | 'interactive';
}

export interface Helper {
  key: string;
  type: 'always' | 'on_demand';
  body: string;
}

export interface ShellScript {
  name: string;
  path: string;
  description: string;
  role: AssetRole;
  owner: AssetOwner;
  generated: boolean;
  overwritePolicy: OverwritePolicy;
  roleSource: AssetRoleSource;
}

export interface HookConfig {
  interruptSteps: string[];
  stopGuardEnabled: boolean;
  userInterruptEnabled: boolean;
}

export interface WorkflowConfig {
  name: string;
  description: string;
  trigger?: string;
  startCommand?: string;
  steps: Step[];
  groups: StepGroup[];
  tracks: Track[];
  helpers: Helper[];
  scripts: ShellScript[];
  hooks: HookConfig;
  skillMd: string;
  assets?: SkillAsset[];
  stateSchema?: StateSchema;
  graph?: WorkflowGraph;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  config: WorkflowConfig;
}

export type RuntimeProfileId = 'basic_stateful' | 'wf_like' | 'custom';
export type SkillExportTarget = 'claude-code' | 'codex';
export type ExecutionMode = 'solo' | 'user_involved' | 'background_wait';
export type AutonomyMode = 'autonomous' | 'needs_user' | 'background_wait';
export type InterruptMode = 'never' | 'allowed' | 'required';
export type AssetRole = 'platform_runtime' | 'workflow_utility' | 'user_script' | 'workflow_content' | 'docs' | 'config_template';
export type AssetOwner = 'platform' | 'template' | 'user';
export type OverwritePolicy = 'replace_on_upgrade' | 'preserve' | 'merge' | 'ask';
export type AssetRoleSource = 'explicit' | 'inferred';
export type StateFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'json' | 'null';
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationStatus = 'valid' | 'warning' | 'invalid';

export interface SkillProject {
  id: string;
  name: string;
  rootDir: string;
  entrypoint: SkillEntrypoint;
  workflow: WorkflowDefinition;
  runtime: RuntimeProfile;
  assets: SkillAsset[];
  validation: ValidationResult;
  sync: SyncState;
}

export interface SkillEntrypoint {
  path: 'SKILL.md';
  name: string;
  description: string;
  triggers: string[];
  role: 'checklist_executor' | 'facilitator' | 'custom';
  startCommand: string;
  haltRules: string[];
}

export interface WorkflowDefinition {
  steps: StepDefinition[];
  tracks: TrackDefinition[];
  helpers: HelperDefinition[];
  stateSchema: StateSchema;
  interruptPolicy: InterruptPolicy;
  graph: WorkflowGraph;
}

export interface StepDefinition extends Step {
  body: string;
  scriptRefs: string[];
  executionMode: ExecutionMode;
  interruptMode: InterruptMode;
  autonomy: AutonomyMode;
  produces: string[];
  consumes: string[];
}

export interface TrackDefinition extends Track {
  trigger?: string;
  useCase?: string;
  defaultAutonomy?: 'autonomous' | 'interactive';
}

export interface HelperDefinition extends Helper {
  refs?: string[];
}

export interface StateSchema {
  fields: StateField[];
}

export interface StateField {
  path: string;
  type: StateFieldType;
  defaultValue?: unknown;
  reserved: boolean;
  producingSteps: string[];
  consumingSteps: string[];
}

export interface InterruptPolicy {
  defaultMode: InterruptMode;
  interruptSteps: string[];
  stopGuardEnabled: boolean;
  userInterruptEnabled: boolean;
  allowAgentInterruptCommand: boolean;
}

export interface WorkflowGraph {
  edges: WorkflowEdge[];
}

export type WorkflowEdgeType = 'visual_group_flow' | 'visual_note' | 'track_order' | 'dependency' | 'branch' | 'dependency_or_branch' | 'validation_constraint';

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: WorkflowEdgeType;
  label?: string;
}

export interface RuntimeProfile {
  id: RuntimeProfileId;
  version: string;
  assets: RuntimeAsset[];
  commands: RuntimeCommandSet;
  hookPolicy: HookPolicy;
}

export interface RuntimeCommandSet {
  init: string;
  resume: string;
  complete: string;
  interrupt: string;
  rewind?: string;
}

export interface HookPolicy {
  stopGuardEnabled: boolean;
  userInterruptEnabled: boolean;
  interruptSteps: string[];
}

export interface RuntimeAsset extends SkillAsset {
  required: boolean;
}

export interface SkillAsset {
  path: string;
  role: AssetRole;
  owner: AssetOwner;
  generated: boolean;
  overwritePolicy: OverwritePolicy;
  roleSource: AssetRoleSource;
  hash?: string;
  description?: string;
}

export interface ValidationResult {
  status: ValidationStatus;
  issues: ValidationIssue[];
  updatedAt?: string;
  summary?: ValidationSummary;
}

export interface ValidationSummary {
  errors: number;
  warnings: number;
  info: number;
  highestSeverity: ValidationSeverity | 'none';
  runnable: boolean;
}

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: 'structure' | 'runtime' | 'ownership' | 'execution' | 'sync' | 'reference' | 'edge' | 'coverage';
  message: string;
  path?: string;
  entityKey?: string;
}

export interface RuntimeStateSnapshot {
  status: 'missing' | 'running' | 'interrupted' | 'completed' | 'unknown';
  track?: string;
  currentStep?: string;
  interrupted?: boolean;
  interruptReason?: string;
  nextAction?: string;
  updatedAt?: string;
  statePath?: string;
}

export interface SyncState {
  status: 'unbound' | 'clean' | 'dirty' | 'syncing' | 'blocked' | 'conflict';
  lastSyncedAt?: string;
  dirtySource?: 'ui' | 'agent' | 'external';
  message?: string;
  conflicts?: SyncConflict[];
}

export interface SyncConflict {
  path: string;
  role: AssetRole;
  owner: AssetOwner;
  overwritePolicy: OverwritePolicy;
  baselineHash?: string;
  currentHash?: string;
  recommendation: 'preserve_external' | 'regenerate_platform' | 'review_manually';
}

export interface CreateSkillProjectOptions {
  id?: string;
  name?: string;
  rootDir?: string;
  assets?: SkillAsset[];
  runtime?: RuntimeProfile;
  validation?: ValidationResult;
  sync?: SyncState;
}

export interface SkillEntrypointUpdate {
  name?: string;
  description?: string;
  trigger?: string;
  startCommand?: string;
}

export interface NewStatefulSkillInput {
  name: string;
  trigger: string;
  description: string;
  runtimeProfileId: RuntimeProfileId;
}

export function groupSteps(steps: Step[]): StepGroup[] {
  const groupMap = new Map<number, Step[]>();
  for (const step of steps) {
    const decade = Math.floor(step.number / 10) * 10;
    if (!groupMap.has(decade)) groupMap.set(decade, []);
    groupMap.get(decade)!.push(step);
  }

  const groups: StepGroup[] = [];
  for (const [decade, groupSteps] of [...groupMap.entries()].sort(([a], [b]) => a - b)) {
    const sorted = groupSteps.sort((a, b) => a.number - b.number);
    groups.push({
      id: `group-${decade}`,
      label: inferGroupLabel(decade, sorted),
      range: [decade, decade + 9],
      steps: sorted,
    });
  }
  return groups;
}

function inferGroupLabel(decade: number, steps: Step[]): string {
  const firstStep = steps[0];
  if (steps.some(step => ['SETUP_TEST', 'EXPLAIN_TEST'].includes(step.key))) {
    return 'Test';
  }
  const stepLabeledGroups = new Set([
    'SPECIFY',
    'PLAN',
    'DEBATE_PLAN',
    'EXPLAIN_PLAN',
    'SETUP_TEST',
    'EXPLAIN_TEST',
    'IMPLEMENT',
    'SELF_REVIEW',
    'TEST',
    'COMMIT',
  ]);
  if (firstStep && stepLabeledGroups.has(firstStep.key)) {
    return steps[0]?.title ?? 'Specify';
  }
  const labels: Record<number, string> = {
    0: 'Setup',
    10: 'Investigate',
    20: 'Ticket & Branch',
    30: 'Plan',
    40: 'Test',
    50: 'Implement',
    60: 'Commit & PR',
    70: 'CI',
    80: 'Review',
    90: 'Complete',
    100: 'Brainstorm',
  };
  return labels[decade] ?? steps[0]?.title ?? `Group ${decade}`;
}

export function parseStepFilename(filename: string): { number: number; key: string } | null {
  const match = filename.match(/^(\d{3})-(.+)\.md$/);
  if (!match) return null;
  return {
    number: parseInt(match[1], 10),
    key: match[2].replace(/-/g, '_').toUpperCase(),
  };
}

export function stepKeyToFilename(key: string, number: number): string {
  const pad = String(number).padStart(3, '0');
  const slug = key.toLowerCase().replace(/_/g, '-');
  return `${pad}-${slug}.md`;
}

export function normalizeStepDefinition(step: Step): StepDefinition {
  const executionMode = getStepExecutionMode(step);
  const interruptMode = interruptModeFromExecutionMode(executionMode);
  return {
    ...step,
    body: step.content,
    executionMode,
    scriptRefs: step.scriptRefs ?? [],
    interruptMode,
    autonomy: autonomyFromExecutionMode(executionMode),
    isInterrupt: executionMode === 'user_involved',
    produces: step.produces ?? [],
    consumes: step.consumes ?? [],
  };
}

export function getStepExecutionMode(step: Pick<Step, 'executionMode' | 'autonomy' | 'interruptMode' | 'isInterrupt'>): ExecutionMode {
  if (step.executionMode) return step.executionMode;
  if (step.autonomy === 'background_wait') return 'background_wait';
  if (step.autonomy === 'needs_user') return 'user_involved';
  if (step.interruptMode && step.interruptMode !== 'never') return 'user_involved';
  if (step.isInterrupt) return 'user_involved';
  return 'solo';
}

export function autonomyFromExecutionMode(mode: ExecutionMode): AutonomyMode {
  if (mode === 'background_wait') return 'background_wait';
  if (mode === 'user_involved') return 'needs_user';
  return 'autonomous';
}

export function interruptModeFromExecutionMode(mode: ExecutionMode): InterruptMode {
  return mode === 'user_involved' ? 'allowed' : 'never';
}

export function isStopAllowedExecutionMode(mode: ExecutionMode): boolean {
  return mode !== 'solo';
}

export function stopAllowedStepsFromSteps(steps: Array<Pick<Step, 'key' | 'executionMode' | 'autonomy' | 'interruptMode' | 'isInterrupt'>>): string[] {
  return steps
    .filter(step => isStopAllowedExecutionMode(getStepExecutionMode(step)))
    .map(step => step.key);
}

export function withExecutionMode<T extends Step>(step: T, executionMode: ExecutionMode): T {
  return {
    ...step,
    executionMode,
    autonomy: autonomyFromExecutionMode(executionMode),
    interruptMode: interruptModeFromExecutionMode(executionMode),
    isInterrupt: executionMode === 'user_involved',
  };
}

export function createDefaultRuntimeProfile(hooks?: HookConfig): RuntimeProfile {
  const interruptSteps = hooks?.interruptSteps ?? [];
  return {
    id: 'basic_stateful',
    version: '0.1.0',
    assets: [
      { ...inferSkillAsset('run.sh'), required: true },
      { ...inferSkillAsset('lib/init-workflow.sh'), required: true },
      { ...inferSkillAsset('lib/complete-step.sh'), required: true },
      { ...inferSkillAsset('lib/resume-workflow.sh'), required: true },
      { ...inferSkillAsset('lib/rewind-step.sh'), required: false },
      { ...inferSkillAsset('lib/render-step.py'), required: true },
      { ...inferSkillAsset('lib/find-hook-state.py'), required: true },
      { ...inferSkillAsset('lib/get-data.sh'), required: false },
      { ...inferSkillAsset('lib/set-data.sh'), required: false },
      { ...inferSkillAsset('stop-guard.sh'), required: true },
      { ...inferSkillAsset('user-interrupt.sh'), required: false },
      { ...inferSkillAsset('scripts/agent-interrupt.sh'), required: true },
    ],
    commands: {
      init: 'bash run.sh init',
      resume: 'bash run.sh resume',
      complete: 'bash run.sh complete',
      interrupt: 'bash run.sh interrupt',
      rewind: 'bash run.sh rewind',
    },
    hookPolicy: {
      stopGuardEnabled: hooks?.stopGuardEnabled ?? true,
      userInterruptEnabled: hooks?.userInterruptEnabled ?? true,
      interruptSteps,
    },
  };
}

export function createDefaultStateSchema(steps: StepDefinition[] = []): StateSchema {
  return mergeStateSchemaWithStepRefs(undefined, steps);
}

export function mergeStateSchemaWithStepRefs(schema: StateSchema | undefined, steps: StepDefinition[] = []): StateSchema {
  const baseFields = createControlStateFields();
  const fieldMap = new Map<string, StateField>();

  for (const field of schema?.fields ?? []) {
    if (field.path.startsWith('control.')) continue;
    fieldMap.set(field.path, {
      ...field,
      reserved: false,
      producingSteps: field.producingSteps ?? [],
      consumingSteps: field.consumingSteps ?? [],
    });
  }

  const produced = new Set(steps.flatMap(step => step.produces));
  const consumed = new Set(steps.flatMap(step => step.consumes));
  for (const path of [...new Set([...produced, ...consumed])].filter(path => path.startsWith('data.'))) {
    const current = fieldMap.get(path);
    fieldMap.set(path, {
      path,
      type: current?.type ?? 'string',
      defaultValue: current?.defaultValue,
      reserved: false,
      producingSteps: steps.filter(step => step.produces.includes(path)).map(step => step.key),
      consumingSteps: steps.filter(step => step.consumes.includes(path)).map(step => step.key),
    });
  }

  return {
    fields: [
      ...baseFields,
      ...[...fieldMap.values()].sort((a, b) => a.path.localeCompare(b.path)),
    ],
  };
}

export function createControlStateFields(): StateField[] {
  return [
    { path: 'control.workflow_id', type: 'string', reserved: true, producingSteps: [], consumingSteps: [] },
    { path: 'control.track', type: 'string', reserved: true, producingSteps: [], consumingSteps: [] },
    { path: 'control.status', type: 'string', reserved: true, producingSteps: [], consumingSteps: [] },
    { path: 'control.current_step', type: 'string', reserved: true, producingSteps: [], consumingSteps: [] },
    { path: 'control.interrupted', type: 'boolean', reserved: true, producingSteps: [], consumingSteps: [] },
    { path: 'control.interrupt_reason', type: 'string', reserved: true, producingSteps: [], consumingSteps: [] },
    { path: 'control.steps', type: 'object', reserved: true, producingSteps: [], consumingSteps: [] },
  ];
}

export function createSkillProjectFromWorkflowConfig(
  config: WorkflowConfig,
  options: CreateSkillProjectOptions = {},
): SkillProject {
  const name = options.name || config.name || 'untitled-skill';
  const steps = config.steps.map(normalizeStepDefinition);
  const stopAllowedSteps = stopAllowedStepsFromSteps(steps);
  const runtime = options.runtime ?? createDefaultRuntimeProfile(config.hooks);
  const providedAssets = options.assets ?? config.assets;
  const assets = mergeAssetInventory(config, runtime.assets, providedAssets ?? []);
  const trigger = config.trigger || inferTriggers(config.skillMd)[0] || name;
  const startCommand = config.startCommand || runtime.commands.init;

  return {
    id: options.id ?? stableProjectId(name, options.rootDir ?? ''),
    name,
    rootDir: options.rootDir ?? '',
    entrypoint: {
      path: 'SKILL.md',
      name,
      description: config.description,
      triggers: [trigger],
      role: 'checklist_executor',
      startCommand,
      haltRules: [
        'Use runtime commands for state transitions.',
        'Do not embed all step content in SKILL.md.',
      ],
    },
    workflow: {
      steps,
      tracks: config.tracks.map(track => ({
        ...track,
        defaultAutonomy: track.defaultAutonomy ?? 'autonomous',
      })),
      helpers: config.helpers,
      stateSchema: mergeStateSchemaWithStepRefs(config.stateSchema, steps),
      interruptPolicy: {
        defaultMode: 'never',
        interruptSteps: stopAllowedSteps,
        stopGuardEnabled: config.hooks.stopGuardEnabled,
        userInterruptEnabled: config.hooks.userInterruptEnabled,
        allowAgentInterruptCommand: true,
      },
      graph: { edges: config.graph?.edges ?? [] },
    },
    runtime,
    assets,
    validation: options.validation ?? validateWorkflowConfig({ ...config, trigger, startCommand }, runtime, assets),
    sync: options.sync ?? { status: options.rootDir ? 'clean' : 'unbound' },
  };
}

export function workflowConfigFromSkillProject(project: SkillProject): WorkflowConfig {
  return {
    name: project.name,
    description: project.entrypoint.description,
    trigger: project.entrypoint.triggers[0],
    startCommand: project.entrypoint.startCommand,
    steps: project.workflow.steps.map(step => ({
      key: step.key,
      number: step.number,
      filename: step.filename,
      title: step.title,
      content: step.body,
      isInterrupt: step.executionMode === 'user_involved',
      helperRefs: step.helperRefs,
      scriptRefs: step.scriptRefs,
      executionMode: step.executionMode,
      interruptMode: step.interruptMode,
      autonomy: step.autonomy,
      produces: step.produces,
      consumes: step.consumes,
    })),
    groups: groupSteps(project.workflow.steps),
    tracks: project.workflow.tracks,
    helpers: project.workflow.helpers,
    scripts: project.assets
      .filter(asset => isShellScriptAsset(asset))
      .map(assetToShellScript),
    hooks: {
      interruptSteps: stopAllowedStepsFromSteps(project.workflow.steps),
      stopGuardEnabled: project.workflow.interruptPolicy.stopGuardEnabled,
      userInterruptEnabled: project.workflow.interruptPolicy.userInterruptEnabled,
    },
    skillMd: '',
    assets: project.assets,
    stateSchema: project.workflow.stateSchema,
    graph: project.workflow.graph,
  };
}

export function validateWorkflowConfig(
  config: WorkflowConfig,
  runtime: RuntimeProfile = createDefaultRuntimeProfile(config.hooks),
  assets: SkillAsset[] = config.assets ?? [],
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const stepKeys = new Set(config.steps.map(step => step.key));
  const helperKeys = new Set(config.helpers.map(helper => helper.key));
  const knownScriptPaths = new Set([
    ...assets.map(asset => asset.path),
    ...config.scripts.map(script => script.path),
  ]);
  const duplicatedStepKeys = findDuplicates(config.steps.map(step => step.key));
  const duplicatedTrackNames = findDuplicates(config.tracks.map(track => track.name));
  const duplicatedHelperKeys = findDuplicates(config.helpers.map(helper => helper.key));

  for (const stepKey of duplicatedStepKeys) {
    issues.push({
      id: `duplicate-step-${stepKey}`,
      severity: 'error',
      category: 'structure',
      message: `Step key "${stepKey}" is duplicated.`,
      entityKey: stepKey,
    });
  }

  for (const trackName of duplicatedTrackNames) {
    issues.push({
      id: `duplicate-track-${trackName}`,
      severity: 'error',
      category: 'structure',
      message: `Track name "${trackName}" is duplicated.`,
      entityKey: trackName,
    });
  }

  for (const helperKey of duplicatedHelperKeys) {
    issues.push({
      id: `duplicate-helper-${helperKey}`,
      severity: 'error',
      category: 'structure',
      message: `Helper key "${helperKey}" is duplicated.`,
      entityKey: helperKey,
    });
  }

  for (const track of config.tracks) {
    for (const stepKey of track.steps) {
      if (!stepKeys.has(stepKey)) {
        issues.push({
          id: `missing-track-step-${track.name}-${stepKey}`,
          severity: 'error',
          category: 'structure',
          message: `Track "${track.name}" references missing step "${stepKey}".`,
          entityKey: track.name,
        });
      }
    }
    validateFixTrackOrder(track, issues);
  }

  const controlFields = new Map(createControlStateFields().map(field => [field.path, field]));
  for (const field of config.stateSchema?.fields ?? []) {
    const controlField = controlFields.get(field.path);
    if (field.path.startsWith('control.') && (!controlField || !field.reserved || field.type !== controlField.type)) {
      issues.push({
        id: `reserved-state-${field.path}`,
        severity: 'error',
        category: 'structure',
        message: `${field.path} is reserved runtime state and cannot be edited as workflow metadata.`,
        path: field.path,
      });
    }
  }

  for (const step of config.steps) {
    const executionMode = getStepExecutionMode(step);
    if (executionMode === 'solo' && hasApprovalLanguage(step.content)) {
      issues.push({
        id: `execution-approval-language-${step.key}`,
        severity: 'warning',
        category: 'execution',
        message: `${step.key} runs solo but its instruction asks for user confirmation.`,
        entityKey: step.key,
        path: step.filename,
      });
    }

    const helperRefs = new Set([...(step.helperRefs ?? []), ...extractHelperRefsFromMarkdown(step.content)]);
    for (const helperRef of helperRefs) {
      if (!helperKeys.has(helperRef)) {
        issues.push({
          id: `missing-helper-${step.key}-${helperRef}`,
          severity: 'error',
          category: 'reference',
          message: `${step.key} references unknown helper "${helperRef}".`,
          entityKey: step.key,
          path: step.filename,
        });
      }
    }

    const scriptRefs = new Set([...(step.scriptRefs ?? []), ...extractScriptRefsFromMarkdown(step.content)]);
    for (const scriptRef of scriptRefs) {
      if (!knownScriptPaths.has(scriptRef)) {
        issues.push({
          id: `missing-script-${step.key}-${scriptRef}`,
          severity: 'error',
          category: 'reference',
          message: `${step.key} references missing script "${scriptRef}".`,
          entityKey: step.key,
          path: step.filename,
        });
      }
    }
  }

  const assetPaths = new Set(assets.map(asset => asset.path));
  const requiredWorkflowAssets = ['SKILL.md', 'step-registry.json', 'track-steps.json', 'helpers.yaml'];
  if (!config.stateSchema) {
    requiredWorkflowAssets.push('state-schema.json');
  }
  for (const assetPath of requiredWorkflowAssets) {
    if (assets.length > 0 && !assetPaths.has(assetPath)) {
      issues.push({
        id: `missing-workflow-asset-${assetPath}`,
        severity: 'error',
        category: 'structure',
        message: `Required workflow asset ${assetPath} is missing.`,
        path: assetPath,
      });
    }
  }
  for (const step of config.steps) {
    if (assets.length > 0 && !assetPaths.has(step.filename)) {
      issues.push({
        id: `missing-step-file-${step.filename}`,
        severity: 'error',
        category: 'structure',
        message: `Step file ${step.filename} is missing from the asset inventory.`,
        entityKey: step.key,
        path: step.filename,
      });
    }
  }
  for (const asset of runtime.assets.filter(asset => asset.required)) {
    if (assets.length > 0 && !assetPaths.has(asset.path)) {
      issues.push({
        id: `missing-runtime-asset-${asset.path}`,
        severity: 'error',
        category: 'runtime',
        message: `Required runtime asset ${asset.path} is missing.`,
        path: asset.path,
      });
    }
  }

  for (const asset of assets) {
    if (asset.role === 'user_script' && asset.overwritePolicy !== 'preserve') {
      issues.push({
        id: `unsafe-user-script-overwrite-${asset.path}`,
        severity: 'warning',
        category: 'ownership',
        message: `${asset.path} is a user script but overwrite policy is ${asset.overwritePolicy}.`,
        path: asset.path,
      });
    }
    if (asset.owner === 'user' && asset.overwritePolicy === 'replace_on_upgrade') {
      issues.push({
        id: `user-owned-replace-on-upgrade-${asset.path}`,
        severity: 'error',
        category: 'ownership',
        message: `${asset.path} is user-owned and cannot use replace_on_upgrade.`,
        path: asset.path,
      });
    }
    if (asset.role === 'platform_runtime' && asset.owner !== 'platform') {
      issues.push({
        id: `platform-runtime-owner-${asset.path}`,
        severity: 'warning',
        category: 'ownership',
        message: `${asset.path} is platform runtime but owner is ${asset.owner}.`,
        path: asset.path,
      });
    }
    if (asset.role === 'workflow_utility' && asset.owner === 'platform') {
      issues.push({
        id: `workflow-utility-owner-${asset.path}`,
        severity: 'warning',
        category: 'ownership',
        message: `${asset.path} is a workflow utility and should not be platform-owned.`,
        path: asset.path,
      });
    }
  }

  const knownGraphNodes = createKnownGraphNodeSet(config);
  for (const edge of config.graph?.edges ?? []) {
    if (!knownGraphNodes.has(edge.source)) {
      issues.push({
        id: `missing-edge-source-${edge.id}`,
        severity: 'error',
        category: 'edge',
        message: `Semantic edge "${edge.id}" references missing source "${edge.source}".`,
        entityKey: edge.id,
      });
    }
    if (!knownGraphNodes.has(edge.target)) {
      issues.push({
        id: `missing-edge-target-${edge.id}`,
        severity: 'error',
        category: 'edge',
        message: `Semantic edge "${edge.id}" references missing target "${edge.target}".`,
        entityKey: edge.id,
      });
    }
  }

  const hasError = issues.some(issue => issue.severity === 'error');
  const hasWarning = issues.some(issue => issue.severity === 'warning');
  const summary = summarizeValidationIssues(issues);
  return {
    status: hasError ? 'invalid' : hasWarning ? 'warning' : 'valid',
    issues,
    updatedAt: new Date().toISOString(),
    summary,
  };
}

export function inferSkillAsset(path: string, description = ''): SkillAsset {
  const normalized = normalizeAssetPath(path);
  const basename = normalized.split('/').pop() ?? normalized;
  const platformRuntimeFiles = new Set([
    'run.sh',
    'stop-guard.sh',
    'user-interrupt.sh',
    'lib/init-workflow.sh',
    'lib/complete-step.sh',
    'lib/resume-workflow.sh',
    'lib/rewind-step.sh',
    'lib/render-step.py',
    'lib/find-hook-state.py',
    'lib/get-data.sh',
    'lib/set-data.sh',
    'lib/install-hooks.sh',
    'lib/preflight-check.sh',
    'lib/env-check.sh',
    'lib/config.py',
    'scripts/agent-interrupt.sh',
  ]);
  const workflowUtilityFiles = new Set([
    'scripts/observe-ci.sh',
    'scripts/observe-reviews.sh',
    'scripts/check-merge-status.sh',
    'scripts/wait-for-ci.sh',
  ]);
  const workflowContentFiles = new Set([
    'SKILL.md',
    'step-registry.json',
    'track-steps.json',
    'helpers.yaml',
    'state-schema.json',
  ]);

  if (
    platformRuntimeFiles.has(normalized) ||
    (normalized.startsWith('lib/') && /\.(?:sh|py)$/.test(normalized))
  ) {
    return {
      path: normalized,
      role: 'platform_runtime',
      owner: 'platform',
      generated: true,
      overwritePolicy: 'replace_on_upgrade',
      roleSource: 'inferred',
      description,
    };
  }

  if (workflowUtilityFiles.has(normalized)) {
    return {
      path: normalized,
      role: 'workflow_utility',
      owner: 'template',
      generated: false,
      overwritePolicy: 'preserve',
      roleSource: 'inferred',
      description,
    };
  }

  if (workflowContentFiles.has(normalized) || /^\d{3}-.+\.md$/.test(basename)) {
    return {
      path: normalized,
      role: 'workflow_content',
      owner: 'user',
      generated: false,
      overwritePolicy: 'merge',
      roleSource: 'inferred',
      description,
    };
  }

  if (normalized.startsWith('scripts/') && normalized.endsWith('.sh')) {
    return {
      path: normalized,
      role: 'user_script',
      owner: 'user',
      generated: false,
      overwritePolicy: 'preserve',
      roleSource: 'inferred',
      description,
    };
  }

  if (normalized.endsWith('.md')) {
    return {
      path: normalized,
      role: 'docs',
      owner: 'user',
      generated: false,
      overwritePolicy: 'preserve',
      roleSource: 'inferred',
      description,
    };
  }

  return {
    path: normalized,
    role: 'config_template',
    owner: 'template',
    generated: false,
    overwritePolicy: 'ask',
    roleSource: 'inferred',
    description,
  };
}

export function assetToShellScript(asset: SkillAsset): ShellScript {
  return {
    name: asset.path.split('/').pop() ?? asset.path,
    path: asset.path,
    description: asset.description ?? '',
    role: asset.role,
    owner: asset.owner,
    generated: asset.generated,
    overwritePolicy: asset.overwritePolicy,
    roleSource: asset.roleSource,
  };
}

export function createEmptyConfig(): WorkflowConfig {
  return {
    name: '',
    description: '',
    steps: [],
    groups: [],
    tracks: [],
    helpers: [],
    scripts: [],
    hooks: {
      interruptSteps: [],
      stopGuardEnabled: true,
      userInterruptEnabled: true,
    },
    skillMd: '',
    assets: [],
    graph: { edges: [] },
  };
}

export function createStarterWorkflowConfig(input: NewStatefulSkillInput): WorkflowConfig {
  const normalizedName = input.name.trim() || 'new-stateful-skill';
  const trigger = input.trigger.trim() || normalizedName;
  const description = input.description.trim() || 'Stateful automation skill.';

  const steps: Step[] = [
    {
      key: 'SETUP',
      number: 1,
      filename: '001-setup.md',
      title: 'Setup',
      content: '# Step 001: SETUP\n\n## Goal\n\nPrepare context and validate prerequisites.\n\n## Checklist\n\n- [ ] Inspect the request and available files\n- [ ] Record required workflow data\n- [ ] Continue without asking for approval unless blocked\n',
      isInterrupt: false,
      helperRefs: ['state_transition'],
      scriptRefs: [],
      executionMode: 'solo',
      interruptMode: 'never',
      autonomy: 'autonomous',
      produces: ['data.task_description'],
      consumes: [],
    },
    {
      key: 'PLAN',
      number: 30,
      filename: '030-plan.md',
      title: 'Plan',
      content: '# Step 030: PLAN\n\n## Goal\n\nCreate the execution plan for the workflow task.\n\n## Checklist\n\n- [ ] Break the task into concrete actions\n- [ ] Identify verification commands\n- [ ] Proceed without normal approval prompts\n',
      isInterrupt: false,
      helperRefs: ['state_transition'],
      scriptRefs: [],
      executionMode: 'solo',
      interruptMode: 'never',
      autonomy: 'autonomous',
      produces: ['data.plan_path'],
      consumes: ['data.task_description'],
    },
    {
      key: 'IMPLEMENT',
      number: 50,
      filename: '050-implement.md',
      title: 'Implement',
      content: '# Step 050: IMPLEMENT\n\n## Goal\n\nExecute the plan and update workflow outputs.\n\n## Checklist\n\n- [ ] Make the required changes\n- [ ] Run verification\n- [ ] Save completion notes\n',
      isInterrupt: false,
      helperRefs: ['state_transition'],
      scriptRefs: [],
      executionMode: 'solo',
      interruptMode: 'never',
      autonomy: 'autonomous',
      produces: ['data.verification_summary'],
      consumes: ['data.plan_path'],
    },
    {
      key: 'REPORT',
      number: 90,
      filename: '090-report.md',
      title: 'Report',
      content: '# Step 090: REPORT\n\n## Goal\n\nSummarize the completed workflow and final state.\n\n## Checklist\n\n- [ ] Summarize what changed\n- [ ] Include verification results\n- [ ] Mark the workflow complete\n',
      isInterrupt: true,
      helperRefs: ['state_transition'],
      scriptRefs: [],
      executionMode: 'user_involved',
      interruptMode: 'allowed',
      autonomy: 'needs_user',
      produces: [],
      consumes: ['data.verification_summary'],
    },
  ];

  const hooks: HookConfig = {
    interruptSteps: ['REPORT'],
    stopGuardEnabled: true,
    userInterruptEnabled: true,
  };

  return {
    name: normalizedName,
    description,
    steps,
    groups: groupSteps(steps),
    tracks: [
      {
        name: 'default',
        description: 'Default autonomous workflow',
        steps: steps.map(step => step.key),
      },
    ],
    helpers: [
      {
        key: 'state_transition',
        type: 'always',
        body: '## State Transition\n\nUse the generated runtime command to complete, resume, or interrupt workflow state. Do not edit `control.*` state directly.',
      },
    ],
    scripts: [],
    hooks,
    skillMd: createThinSkillMd(normalizedName, trigger, description),
    assets: [],
    graph: { edges: [] },
  };
}

function collectWorkflowContentAssets(config: WorkflowConfig, runtimeAssets: RuntimeAsset[]): SkillAsset[] {
  const assets = new Map<string, SkillAsset>();

  for (const asset of runtimeAssets) {
    assets.set(asset.path, asset);
  }
  for (const path of ['SKILL.md', 'step-registry.json', 'track-steps.json', 'helpers.yaml', 'state-schema.json']) {
    assets.set(path, inferSkillAsset(path));
  }
  for (const step of config.steps) {
    assets.set(step.filename, inferSkillAsset(step.filename));
  }
  for (const script of config.scripts) {
    assets.set(script.path, {
      path: normalizeAssetPath(script.path),
      role: script.role,
      owner: script.owner,
      generated: script.generated,
      overwritePolicy: script.overwritePolicy,
      roleSource: script.roleSource,
      description: script.description,
    });
  }

  return [...assets.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function mergeAssetInventory(config: WorkflowConfig, runtimeAssets: RuntimeAsset[], providedAssets: SkillAsset[]): SkillAsset[] {
  const collected = collectWorkflowContentAssets(config, runtimeAssets);
  const merged = new Map(collected.map(asset => [asset.path, asset]));

  for (const asset of providedAssets) {
    const normalizedPath = normalizeAssetPath(asset.path);
    const existing = merged.get(normalizedPath);
    merged.set(normalizedPath, {
      ...(existing ?? inferSkillAsset(normalizedPath, asset.description)),
      ...asset,
      path: normalizedPath,
    });
  }

  return [...merged.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function isShellScriptAsset(asset: SkillAsset): boolean {
  return asset.path.endsWith('.sh') && (
    asset.path.startsWith('scripts/') ||
    asset.path.startsWith('lib/') ||
    asset.path === 'run.sh' ||
    asset.path === 'stop-guard.sh' ||
    asset.path === 'user-interrupt.sh'
  );
}

export function inferTriggers(skillMd: string): string[] {
  const triggers = new Set<string>();
  const triggerLine = skillMd.match(/^trigger:\s*(.+)$/m)?.[1];
  if (triggerLine) {
    triggers.add(triggerLine.trim().replace(/^['"]|['"]$/g, ''));
  }
  const nameLine = skillMd.match(/^name:\s*(.+)$/m)?.[1];
  if (nameLine) {
    triggers.add(nameLine.trim().replace(/^['"]|['"]$/g, ''));
  }
  return [...triggers];
}

export function createThinSkillMd(
  name: string,
  trigger: string,
  description: string,
  startCommand = 'bash run.sh init default "<task description>"',
  target: SkillExportTarget = 'claude-code',
): string {
  const command = startCommand.trim() || 'bash run.sh init default "<task description>"';
  const resolvedCommand = command.replace(/^bash\s+run\.sh\b/, 'bash "$SKILL_DIR/run.sh"');
  const skillDirCommand = `SKILL_DIR="<directory containing this SKILL.md>"; ${resolvedCommand}`;
  const summary = (description.trim() || `Use when the user asks to run the ${name} stateful automation workflow.`).replace(/\s+/g, ' ');
  if (target === 'codex') {
    return `---
name: ${name}
scope: task
trigger: ${quoteYaml(trigger || name)}
description: ${quoteYaml(summary)}
---

# ${name}

Use this Codex skill as a thin entrypoint for a stateful automation workflow.

## Path Resolution

This file lives at \`<SKILL_DIR>/SKILL.md\`. When this skill is activated, note the directory that contains this file and use it as \`SKILL_DIR\`.

Run workflow commands from the user's current working directory. Do not \`cd\` into \`SKILL_DIR\`; call \`run.sh\` through its absolute skill path so workflow state is created in the user's workspace.

Start the workflow with:

\`\`\`bash
${skillDirCommand}
\`\`\`

Follow only the current rendered step. Complete steps through runtime commands instead of loading every step file at once.
`;
  }

  return `---
name: ${name}
description: |
  ${summary}
  Trigger: ${trigger || name}
---

# ${name}

Use this Claude Code skill as a thin entrypoint for a stateful automation workflow.

## Path Resolution

This file lives at \`<SKILL_DIR>/SKILL.md\`. When this skill is activated, note the directory that contains this file and use it as \`SKILL_DIR\`.

Run workflow commands from the user's current working directory. Do not \`cd\` into \`SKILL_DIR\`; call \`run.sh\` through its absolute skill path so workflow state is created in the user's workspace.

Start the workflow with:

\`\`\`bash
${skillDirCommand}
\`\`\`

Follow only the current rendered step. Complete steps through runtime commands instead of loading every step file at once.
`;
}

function quoteYaml(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function hasApprovalLanguage(content: string): boolean {
  return [
    /\bask (?:the )?user\b/i,
    /\bconfirm(?:ation)?\b/i,
    /\bwait for approval\b/i,
    /\buser approval\b/i,
    /\bget approval\b/i,
  ].some(pattern => pattern.test(content));
}

function extractHelperRefsFromMarkdown(content: string): string[] {
  const refs = new Set<string>();
  const re = /helpers#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    refs.add(match[1]);
  }
  return [...refs];
}

function extractScriptRefsFromMarkdown(content: string): string[] {
  const refs = new Set<string>();
  const re = /\b((?:scripts|lib)\/[a-zA-Z0-9._/-]+\.(?:sh|py|js|ts))\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content))) {
    refs.add(match[1]);
  }
  return [...refs];
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates];
}

function validateFixTrackOrder(track: Track, issues: ValidationIssue[]): void {
  if (!/fix|bug/i.test(track.name)) return;
  const implementationIndex = track.steps.findIndex(stepKey => /^(FIX|PATCH|IMPLEMENT)(?:_|$)/i.test(stepKey));
  if (implementationIndex < 0) return;
  const reproduceIndex = track.steps.findIndex(stepKey => /REPRO|REPRODUCE|INVESTIGATE/i.test(stepKey));
  const verifyIndex = track.steps.findIndex(stepKey => /VERIFY|VALIDATE|REPORT/i.test(stepKey));
  if (reproduceIndex < 0 || reproduceIndex > implementationIndex) {
    issues.push({
      id: `fix-track-reproduce-before-implementation-${track.name}`,
      severity: 'error',
      category: 'structure',
      message: `Fix track "${track.name}" must run reproduction before implementation.`,
      entityKey: track.name,
    });
  }
  if (verifyIndex < 0 || verifyIndex > implementationIndex) {
    issues.push({
      id: `fix-track-verify-before-implementation-${track.name}`,
      severity: 'warning',
      category: 'structure',
      message: `Fix track "${track.name}" should verify reproduction before implementation.`,
      entityKey: track.name,
    });
  }
}

function createKnownGraphNodeSet(config: WorkflowConfig): Set<string> {
  const nodes = new Set<string>();
  for (const step of config.steps) {
    nodes.add(`step:${step.key}`);
    nodes.add(`step-${step.key}`);
  }
  for (const group of groupSteps(config.steps)) {
    nodes.add(`group:${group.range[0]}`);
    nodes.add(`group-${group.range[0]}`);
  }
  return nodes;
}

function summarizeValidationIssues(issues: ValidationIssue[]): ValidationSummary {
  const errors = issues.filter(issue => issue.severity === 'error').length;
  const warnings = issues.filter(issue => issue.severity === 'warning').length;
  const info = issues.filter(issue => issue.severity === 'info').length;
  return {
    errors,
    warnings,
    info,
    highestSeverity: errors > 0 ? 'error' : warnings > 0 ? 'warning' : info > 0 ? 'info' : 'none',
    runnable: errors === 0,
  };
}

function stableProjectId(name: string, rootDir: string): string {
  const seed = `${name}:${rootDir}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `skill-${Math.abs(hash).toString(36)}`;
}

function normalizeAssetPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}
