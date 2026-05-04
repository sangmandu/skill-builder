import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  Step,
  Track,
  Helper,
  ShellScript,
  HookConfig,
  StepGroup,
  WorkflowConfig,
  SkillAsset,
  RuntimeProfile,
  RuntimeProfileId,
  NewStatefulSkillInput,
  StateField,
  StateFieldType,
  SkillEntrypointUpdate,
  SyncState,
  SyncConflict,
  WorkflowEdge,
  RuntimeStateSnapshot,
  ExecutionMode,
  SkillExportTarget,
} from './schema';
import {
  createDefaultRuntimeProfile,
  createDefaultStateSchema,
  createEmptyConfig,
  createSkillProjectFromWorkflowConfig,
  createStarterWorkflowConfig,
  createThinSkillMd,
  getStepExecutionMode,
  groupSteps,
  inferSkillAsset,
  inferTriggers,
  mergeStateSchemaWithStepRefs,
  normalizeStepDefinition,
  stepKeyToFilename,
  stopAllowedStepsFromSteps,
  validateWorkflowConfig,
  withExecutionMode,
} from './schema';

const API = '/api';

export function useWorkflowStore() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [scripts, setScripts] = useState<ShellScript[]>([]);
  const [assets, setAssetsState] = useState<SkillAsset[]>([]);
  const [rootDir, setRootDir] = useState('');
  const [runtimeProfile, setRuntimeProfile] = useState<RuntimeProfile>(() => createDefaultRuntimeProfile());
  const [hooks, setHooks] = useState<HookConfig>({
    interruptSteps: [],
    stopGuardEnabled: true,
    userInterruptEnabled: true,
  });
  const [, setSkillMd] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('');
  const [startCommand, setStartCommand] = useState('bash run.sh init default "<task description>"');
  const [stateFields, setStateFields] = useState<StateField[]>(() => createDefaultStateSchema().fields);
  const [graphEdges, setGraphEdges] = useState<WorkflowEdge[]>([]);
  const [runtimeState, setRuntimeState] = useState<RuntimeStateSnapshot>({ status: 'missing' });
  const [syncState, setSyncState] = useState<SyncState>({ status: 'unbound' });
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaceStarted, setWorkspaceStarted] = useState(false);
  const [exportTarget, setExportTarget] = useState<SkillExportTarget>('claude-code');

  const groups: StepGroup[] = groupSteps(steps);
  const thinSkillMd = useMemo(
    () => createThinSkillMd(name || 'untitled-skill', trigger || name || 'untitled-skill', description, startCommand, exportTarget),
    [name, trigger, description, startCommand, exportTarget],
  );
  const derivedHooks = useMemo<HookConfig>(() => ({
    ...hooks,
    interruptSteps: stopAllowedStepsFromSteps(steps),
  }), [hooks, steps]);
  const syncedRuntimeProfile = useMemo<RuntimeProfile>(() => ({
    ...runtimeProfile,
    commands: {
      ...runtimeProfile.commands,
      init: startCommand || runtimeProfile.commands.init,
    },
    hookPolicy: {
      ...runtimeProfile.hookPolicy,
      interruptSteps: derivedHooks.interruptSteps,
      stopGuardEnabled: derivedHooks.stopGuardEnabled,
      userInterruptEnabled: derivedHooks.userInterruptEnabled,
    },
  }), [runtimeProfile, derivedHooks, startCommand]);
  const stateSchema = useMemo(
    () => mergeStateSchemaWithStepRefs({ fields: stateFields }, steps.map(normalizeStepDefinition)),
    [stateFields, steps],
  );
  const workflowConfig = useMemo<WorkflowConfig>(() => ({
    name,
    description,
    trigger,
    startCommand,
    steps,
    groups,
    tracks,
    helpers,
    scripts,
    hooks: derivedHooks,
    skillMd: thinSkillMd,
    assets,
    stateSchema,
    graph: { edges: graphEdges },
  }), [name, description, trigger, startCommand, steps, groups, tracks, helpers, scripts, derivedHooks, thinSkillMd, assets, stateSchema, graphEdges]);
  const validation = useMemo(
    () => validateWorkflowConfig(workflowConfig, syncedRuntimeProfile, assets),
    [workflowConfig, syncedRuntimeProfile, assets],
  );
  const effectiveSyncState = useMemo<SyncState>(() => {
    if (!rootDir) return { status: 'unbound' };
    if (syncState.status === 'conflict') return syncState;
    if (dirty && validation.issues.some(issue => issue.severity === 'error')) {
      return {
        ...syncState,
        status: 'blocked',
        dirtySource: 'ui',
        message: validation.issues.find(issue => issue.severity === 'error')?.message,
      };
    }
    if (dirty && syncState.status !== 'syncing') {
      return { ...syncState, status: 'dirty', dirtySource: 'ui', message: undefined };
    }
    if (!dirty && syncState.status !== 'clean') {
      return { ...syncState, status: 'clean', message: undefined };
    }
    return syncState;
  }, [rootDir, dirty, syncState, validation]);

  const project = useMemo(
    () => createSkillProjectFromWorkflowConfig(workflowConfig, {
      rootDir,
      assets,
      runtime: syncedRuntimeProfile,
      validation,
      sync: effectiveSyncState,
    }),
    [workflowConfig, rootDir, assets, syncedRuntimeProfile, validation, effectiveSyncState],
  );

  const syncNow = useCallback(async (force = false) => {
    if (!rootDir || steps.length === 0) return null;
    if (syncState.status === 'conflict' && !force) return null;

    const blockingIssue = validation.issues.find(issue => issue.severity === 'error');
    if (blockingIssue) {
      setSyncState({
        status: 'blocked',
        dirtySource: 'ui',
        message: blockingIssue.message,
      });
      return null;
    }

    setSyncState(prev => ({
      ...prev,
      status: 'syncing',
      dirtySource: 'ui',
      message: undefined,
    }));

    const res = await fetch(`${API}/project/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rootDir,
        workflowName: name,
        steps,
        tracks,
        helpers,
        hooks: derivedHooks,
        skillMd: thinSkillMd,
        assets,
        stateSchema,
        graph: { edges: graphEdges },
        targetRuntime: exportTarget,
        validation,
        force,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.conflicts) {
        setSyncState({
          status: 'conflict',
          dirtySource: 'external',
          message: 'External file changes conflict with unsynced UI edits.',
          conflicts: data.conflicts,
        });
        return null;
      }
      setSyncState({
        status: res.status === 409 ? 'blocked' : 'conflict',
        dirtySource: 'ui',
        message: data.issue?.message || data.error || 'Sync failed',
      });
      return null;
    }

    setAssetsState(data.assets || assets);
    setDirty(false);
    setSyncState({
      status: 'clean',
      lastSyncedAt: data.lastSyncedAt,
    });
    return data;
  }, [rootDir, steps, syncState.status, validation, name, tracks, helpers, derivedHooks, thinSkillMd, assets, stateSchema, graphEdges, exportTarget]);

  useEffect(() => {
    if (!rootDir || !dirty || loading || steps.length === 0 || syncState.status === 'conflict' || syncState.status === 'syncing') return;

    const blockingIssue = validation.issues.find(issue => issue.severity === 'error');
    if (blockingIssue) return;

    const timer = window.setTimeout(() => {
      void syncNow();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [rootDir, dirty, loading, steps.length, syncState.status, validation, syncNow]);

  const setAssets = useCallback((nextAssets: SkillAsset[]) => {
    setAssetsState(nextAssets);
    setDirty(true);
  }, []);

  const updateAsset = useCallback((assetPath: string, updates: Partial<SkillAsset>) => {
    const explicitUpdates: Partial<SkillAsset> = {
      ...updates,
      roleSource: updates.role ? 'explicit' : updates.roleSource,
    };

    setAssetsState(prev => prev.map(asset =>
      asset.path === assetPath ? { ...asset, ...explicitUpdates } : asset,
    ));
    setScripts(prev => prev.map(script =>
      script.path === assetPath ? { ...script, ...explicitUpdates } : script,
    ));
    setDirty(true);
  }, []);

  const updateRuntimeProfileId = useCallback((id: RuntimeProfileId) => {
    const nextRuntime = createDefaultRuntimeProfile(hooks);
    setRuntimeProfile({ ...nextRuntime, id });
    setDirty(true);
  }, [hooks]);

  const loadFromDir = useCallback(async (dirPath: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/files/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSteps(data.steps);
      setTracks(data.tracks);
      setHelpers(data.helpers);
      setScripts(data.scripts);
      setAssetsState(data.assets || data.project?.assets || []);
      setRootDir(data.rootDir || dirPath.trim());
      setRuntimeProfile(data.project?.runtime || createDefaultRuntimeProfile(data.hooks));
      setHooks(data.hooks);
      setSkillMd(data.skillMd);
      setName(data.project?.name || dirPath.split('/').pop() || '');
      setDescription(data.project?.entrypoint?.description || '');
      setTrigger(data.project?.entrypoint?.triggers?.[0] || inferTriggers(data.skillMd)[0] || dirPath.split('/').pop() || '');
      setStartCommand(data.project?.entrypoint?.startCommand || createDefaultRuntimeProfile(data.hooks).commands.init);
      setStateFields(data.project?.workflow?.stateSchema?.fields || createDefaultStateSchema(data.steps.map(normalizeStepDefinition)).fields);
      setGraphEdges(data.project?.workflow?.graph?.edges || []);
      setExportTarget(data.targetRuntime || 'claude-code');
      setRuntimeState({ status: 'missing' });
      setDirty(false);
      setSyncState({ status: 'clean', lastSyncedAt: data.project?.sync?.lastSyncedAt });
      setWorkspaceStarted(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rootDir) return;

    const source = new EventSource(`${API}/project/events?rootDir=${encodeURIComponent(rootDir)}`);
    let timer: number | undefined;

    source.onmessage = event => {
      const payload = parseProjectEvent(event.data);
      if (!payload || payload.type === 'ready') return;
      if (payload.type === 'error') {
        setSyncState({
          status: 'conflict',
          dirtySource: 'external',
          message: payload.error || 'Project watcher failed.',
        });
        return;
      }

      if (syncState.status === 'syncing') return;

      if (dirty) {
        setSyncState({
          status: 'conflict',
          dirtySource: 'external',
          message: 'External file changes conflict with unsynced UI edits.',
          conflicts: createExternalConflicts(payload.paths ?? [], assets),
        });
        return;
      }

      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void loadFromDir(rootDir);
      }, 250);
    };

    source.onerror = () => {
      setSyncState({
        status: 'conflict',
        dirtySource: 'external',
        message: 'Project watcher connection failed.',
      });
    };

    return () => {
      if (timer) window.clearTimeout(timer);
      source.close();
    };
  }, [rootDir, dirty, syncState.status, assets, loadFromDir]);

  const preserveExternalConflict = useCallback(async () => {
    if (!rootDir) return;
    await loadFromDir(rootDir);
  }, [rootDir, loadFromDir]);

  const overwriteConflictWithUi = useCallback(async () => {
    await syncNow(true);
  }, [syncNow]);

  const loadPreset = useCallback(async (presetId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/presets/${presetId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const cfg = data.config as WorkflowConfig;
      const presetSteps = cfg.steps.map(normalizeStepDefinition);
      const presetHooks = { ...cfg.hooks, interruptSteps: stopAllowedStepsFromSteps(presetSteps) };
      const presetRuntime = createDefaultRuntimeProfile(presetHooks);
      const presetStateSchema = cfg.stateSchema || createDefaultStateSchema(presetSteps);
      const presetProject = createSkillProjectFromWorkflowConfig(
        { ...cfg, steps: presetSteps, hooks: presetHooks, stateSchema: presetStateSchema },
        { runtime: presetRuntime },
      );
      setSteps(presetSteps);
      setTracks(cfg.tracks);
      setHelpers(cfg.helpers);
      setScripts(cfg.scripts || []);
      setAssetsState(cfg.assets?.length ? cfg.assets : presetProject.assets);
      setRootDir('');
      setRuntimeProfile(presetRuntime);
      setHooks(presetHooks);
      setSkillMd(cfg.skillMd || '');
      setName(data.name);
      setDescription(cfg.description || data.description || '');
      setTrigger(cfg.trigger || inferTriggers(cfg.skillMd || '')[0] || cfg.name || data.name);
      setStartCommand(cfg.startCommand || presetRuntime.commands.init);
      setStateFields(presetProject.workflow.stateSchema.fields);
      setGraphEdges(cfg.graph?.edges ?? []);
      setRuntimeState({ status: 'missing' });
      setDirty(true);
      setSyncState({ status: 'unbound' });
      setWorkspaceStarted(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const createScratch = useCallback(() => {
    const runtime = createDefaultRuntimeProfile();
    const cfg = createEmptyConfig();
    setSteps(cfg.steps);
    setTracks(cfg.tracks);
    setHelpers(cfg.helpers);
    setScripts(cfg.scripts || []);
    setAssetsState(cfg.assets || []);
    setRootDir('');
    setRuntimeProfile(runtime);
    setHooks(cfg.hooks);
    setSkillMd('');
    setName('');
    setDescription('');
    setTrigger('');
    setStartCommand(runtime.commands.init);
    setStateFields(createDefaultStateSchema().fields);
    setGraphEdges([]);
    setRuntimeState({ status: 'missing' });
    setDirty(true);
    setSyncState({ status: 'unbound' });
    setWorkspaceStarted(true);
  }, []);

  const exportTo = useCallback(async (targetDir: string, targetRuntime: SkillExportTarget = exportTarget) => {
    const exportSkillMd = createThinSkillMd(name || 'untitled-skill', trigger || name || 'untitled-skill', description, startCommand, targetRuntime);
    const res = await fetch(`${API}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetDir,
        workflowName: name,
        steps,
        tracks,
        helpers,
        hooks: derivedHooks,
        skillMd: exportSkillMd,
        assets,
        stateSchema,
        graph: { edges: graphEdges },
        targetRuntime,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setRootDir(data.path || targetDir.trim());
    setAssetsState(data.assets || assets);
    setExportTarget(targetRuntime);
    setDirty(false);
    setWorkspaceStarted(true);
    setSyncState({ status: 'clean', lastSyncedAt: data.lastSyncedAt });
    return data;
  }, [assets, description, derivedHooks, exportTarget, graphEdges, helpers, name, startCommand, stateSchema, steps, tracks, trigger]);

  const addStep = useCallback((key: string, number: number) => {
    const newStep: Step = {
      key,
      number,
      filename: stepKeyToFilename(key, number),
      title: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      content: `# Step ${String(number).padStart(3, '0')}: ${key}\n\n## Checklist\n\n- [ ] TODO\n`,
      isInterrupt: false,
      helperRefs: ['state_transition'],
      scriptRefs: [],
      executionMode: 'solo',
      interruptMode: 'never',
      autonomy: 'autonomous',
      produces: [],
      consumes: [],
    };
    setSteps(prev => [...prev, newStep].sort((a, b) => a.number - b.number));
    setDirty(true);
    return newStep;
  }, []);

  const createNewSkill = useCallback((input: NewStatefulSkillInput) => {
    const cfg = createStarterWorkflowConfig(input);
    const runtime = createDefaultRuntimeProfile(cfg.hooks);
    const project = createSkillProjectFromWorkflowConfig(cfg, {
      runtime: { ...runtime, id: input.runtimeProfileId },
    });

    setSteps(cfg.steps);
    setTracks(cfg.tracks);
    setHelpers(cfg.helpers);
    setScripts(cfg.scripts);
    setHooks(cfg.hooks);
    setSkillMd(cfg.skillMd);
    setName(cfg.name);
    setDescription(cfg.description);
    setTrigger(input.trigger);
    setStartCommand(project.entrypoint.startCommand);
    setStateFields(project.workflow.stateSchema.fields);
    setGraphEdges(project.workflow.graph.edges);
    setRuntimeState({ status: 'missing' });
    setAssetsState(project.assets);
    setRuntimeProfile(project.runtime);
    setRootDir('');
    setDirty(true);
    setWorkspaceStarted(true);
  }, []);

  const addGraphEdge = useCallback((edge: WorkflowEdge) => {
    setGraphEdges(prev => [
      ...prev.filter(existing => existing.source !== edge.source || existing.target !== edge.target),
      edge,
    ]);
    setDirty(true);
  }, []);

  const removeGraphEdge = useCallback((edgeId: string) => {
    setGraphEdges(prev => prev.filter(edge => edge.id !== edgeId));
    setDirty(true);
  }, []);

  const loadRuntimeState = useCallback(async () => {
    if (!rootDir) {
      setRuntimeState({ status: 'missing' });
      return null;
    }
    const res = await fetch(`${API}/project/runtime-status?rootDir=${encodeURIComponent(rootDir)}`);
    const data = await res.json();
    if (!res.ok) {
      const snapshot: RuntimeStateSnapshot = {
        status: 'unknown',
        nextAction: data.error || 'Runtime status failed to load.',
      };
      setRuntimeState(snapshot);
      return snapshot;
    }
    setRuntimeState(data.runtimeState);
    return data.runtimeState as RuntimeStateSnapshot;
  }, [rootDir]);

  const updateEntrypoint = useCallback((updates: SkillEntrypointUpdate) => {
    if (updates.name != null) setName(updates.name);
    if (updates.description != null) setDescription(updates.description);
    if (updates.trigger != null) setTrigger(updates.trigger);
    if (updates.startCommand != null) setStartCommand(updates.startCommand);
    setDirty(true);
  }, []);

  const updateStep = useCallback((key: string, updates: Partial<Step>) => {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, ...updates } : s));
    setDirty(true);
  }, []);

  const updateStepExecutionMode = useCallback((key: string, executionMode: ExecutionMode) => {
    setSteps(prev => prev.map(step => step.key === key ? withExecutionMode(step, executionMode) : step));
    setDirty(true);
  }, []);

  const removeStep = useCallback((key: string) => {
    setSteps(prev => prev.filter(s => s.key !== key));
    setTracks(prev => prev.map(t => ({ ...t, steps: t.steps.filter(s => s !== key) })));
    setHooks(prev => ({
      ...prev,
      interruptSteps: prev.interruptSteps.filter(s => s !== key),
    }));
    setDirty(true);
  }, []);

  const addTrack = useCallback((trackName: string) => {
    setTracks(prev => [...prev, { name: trackName, description: '', steps: [] }]);
    setDirty(true);
  }, []);

  const updateTrack = useCallback((trackName: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.name === trackName ? { ...t, ...updates } : t));
    setDirty(true);
  }, []);

  const moveTrackStep = useCallback((trackName: string, stepKey: string, direction: -1 | 1) => {
    setTracks(prev => prev.map(track => {
      if (track.name !== trackName) return track;
      const index = track.steps.indexOf(stepKey);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= track.steps.length) return track;
      const nextSteps = [...track.steps];
      [nextSteps[index], nextSteps[target]] = [nextSteps[target], nextSteps[index]];
      return { ...track, steps: nextSteps };
    }));
    setDirty(true);
  }, []);

  const removeTrack = useCallback((trackName: string) => {
    setTracks(prev => prev.filter(t => t.name !== trackName));
    setDirty(true);
  }, []);

  const toggleStepInTrack = useCallback((trackName: string, stepKey: string) => {
    setTracks(prev => {
      const currentSteps = steps;
      return prev.map(t => {
        if (t.name !== trackName) return t;
        const has = t.steps.includes(stepKey);
        const newSteps = has
          ? t.steps.filter(s => s !== stepKey)
          : [...t.steps, stepKey].sort((a, b) => {
              const sa = currentSteps.find(s => s.key === a);
              const sb = currentSteps.find(s => s.key === b);
              return (sa?.number ?? 0) - (sb?.number ?? 0);
            });
        return { ...t, steps: newSteps };
      });
    });
    setDirty(true);
  }, [steps]);

  const toggleInterrupt = useCallback((stepKey: string) => {
    const step = steps.find(s => s.key === stepKey);
    updateStepExecutionMode(stepKey, step && getStepExecutionMode(step) === 'user_involved' ? 'solo' : 'user_involved');
  }, [steps, updateStepExecutionMode]);

  const addStateField = useCallback((path: string, type: StateFieldType = 'string') => {
    const normalized = normalizeStatePath(path);
    if (!normalized.startsWith('data.')) return;
    setStateFields(prev => {
      if (prev.some(field => field.path === normalized)) return prev;
      return [...prev, {
        path: normalized,
        type,
        reserved: false,
        producingSteps: [],
        consumingSteps: [],
      }].sort((a, b) => a.path.localeCompare(b.path));
    });
    setDirty(true);
  }, []);

  const updateStateField = useCallback((path: string, updates: Partial<StateField>) => {
    if (path.startsWith('control.')) return;
    const nextPath = updates.path ? normalizeStatePath(updates.path) : path;
    if (!nextPath.startsWith('data.')) return;
    setStateFields(prev => prev.map(field =>
      field.path === path ? { ...field, ...updates, path: nextPath, reserved: false } : field,
    ));
    syncStepStateRefs(path, nextPath, updates, setSteps);
    setDirty(true);
  }, []);

  const removeStateField = useCallback((path: string) => {
    if (path.startsWith('control.')) return;
    setStateFields(prev => prev.filter(field => field.path !== path));
    setSteps(prev => prev.map(step => ({
      ...step,
      produces: (step.produces ?? []).filter(ref => ref !== path),
      consumes: (step.consumes ?? []).filter(ref => ref !== path),
    })));
    setDirty(true);
  }, []);

  const addHelper = useCallback((key: string, type: 'always' | 'on_demand') => {
    setHelpers(prev => [...prev, { key, type, body: `## ${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n\nTODO` }]);
    setDirty(true);
  }, []);

  const updateHelper = useCallback((key: string, updates: Partial<Helper>) => {
    setHelpers(prev => prev.map(h => h.key === key ? { ...h, ...updates } : h));
    setDirty(true);
  }, []);

  const removeHelper = useCallback((key: string) => {
    setHelpers(prev => prev.filter(h => h.key !== key));
    setDirty(true);
  }, []);

  return {
    steps, tracks, helpers, scripts, hooks: derivedHooks, skillMd: thinSkillMd, name, description, trigger, startCommand, dirty, loading, groups,
    workspaceStarted, exportTarget,
    assets, rootDir, runtimeProfile: syncedRuntimeProfile, project, stateFields: stateSchema.fields, graphEdges, runtimeState, validation, syncState: effectiveSyncState,
    setName, setDescription, setTrigger, setStartCommand, setSkillMd, setHooks,
    updateEntrypoint,
    setAssets, updateAsset, setRootDir, setRuntimeProfile, updateRuntimeProfileId,
    loadFromDir, loadPreset, createNewSkill, createScratch, exportTo, syncNow, preserveExternalConflict, overwriteConflictWithUi, loadRuntimeState,
    addStep, updateStep, updateStepExecutionMode, removeStep,
    addTrack, updateTrack, moveTrackStep, removeTrack, toggleStepInTrack,
    toggleInterrupt,
    addStateField, updateStateField, removeStateField,
    addGraphEdge, removeGraphEdge,
    addHelper, updateHelper, removeHelper,
    setDirty,
  };
}

interface ProjectEventPayload {
  type: 'ready' | 'changed' | 'error';
  paths?: string[];
  error?: string;
}

function parseProjectEvent(data: string): ProjectEventPayload | null {
  try {
    return JSON.parse(data) as ProjectEventPayload;
  } catch {
    return null;
  }
}

function createExternalConflicts(paths: string[], assets: SkillAsset[]): SyncConflict[] {
  const assetsByPath = new Map(assets.map(asset => [asset.path, asset]));
  return paths.map(path => {
    const inferred = inferSkillAsset(path);
    const asset = assetsByPath.get(path);
    const role = asset?.role ?? inferred.role;
    return {
      path,
      role,
      owner: asset?.owner ?? inferred.owner,
      overwritePolicy: asset?.overwritePolicy ?? inferred.overwritePolicy,
      baselineHash: asset?.hash,
      recommendation: role === 'user_script'
        ? 'preserve_external'
        : role === 'platform_runtime'
          ? 'regenerate_platform'
          : 'review_manually',
    };
  });
}

export type WorkflowStore = ReturnType<typeof useWorkflowStore>;

function normalizeStatePath(path: string): string {
  const trimmed = path.trim().replace(/\s+/g, '_');
  if (!trimmed) return '';
  return trimmed.startsWith('data.') ? trimmed : `data.${trimmed.replace(/^(control|data)\./, '')}`;
}

function syncStepStateRefs(
  oldPath: string,
  nextPath: string,
  updates: Partial<StateField>,
  setSteps: Dispatch<SetStateAction<Step[]>>,
) {
  if (!updates.producingSteps && !updates.consumingSteps && oldPath === nextPath) return;

  setSteps(prev => prev.map(step => {
    const produces = new Set((step.produces ?? []).map(ref => ref === oldPath ? nextPath : ref));
    const consumes = new Set((step.consumes ?? []).map(ref => ref === oldPath ? nextPath : ref));

    if (updates.producingSteps) {
      if (updates.producingSteps.includes(step.key)) {
        produces.add(nextPath);
      } else {
        produces.delete(nextPath);
      }
    }

    if (updates.consumingSteps) {
      if (updates.consumingSteps.includes(step.key)) {
        consumes.add(nextPath);
      } else {
        consumes.delete(nextPath);
      }
    }

    return {
      ...step,
      produces: [...produces],
      consumes: [...consumes],
    };
  }));
}
