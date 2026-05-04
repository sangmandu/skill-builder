import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  createDefaultRuntimeProfile,
  createDefaultStateSchema,
  createSkillProjectFromWorkflowConfig,
  createThinSkillMd,
  groupSteps,
  inferSkillAsset,
  getStepExecutionMode,
  validateWorkflowConfig,
  type WorkflowConfig,
} from '../src/lib/schema.ts';
import { SCENARIO_COVERAGE_RULES, getScenarioCoverage } from '../src/lib/scenarioCoverage.ts';
import { loadSkillDir } from '../src/server/routes/files.ts';
import { writeSkillPackage } from '../src/server/lib/skillPackageWriter.ts';
import { PRESETS } from '../src/server/routes/presets.ts';

function testScenarioCoverageMap() {
  const ids = SCENARIO_COVERAGE_RULES.map(rule => `${rule.prefix}-001`);
  assert.ok(ids.length > 0, 'Scenario coverage rules should contain scenario prefixes');
  const missing = ids.filter(id => !getScenarioCoverage(id));
  assert.deepEqual(missing, []);
}

function testValidationEngine() {
  const config: WorkflowConfig = {
    name: 'validation-fixture',
    description: 'Validation fixture',
    steps: [
      {
        key: 'SETUP',
        number: 1,
        filename: '001-setup.md',
        title: 'Setup',
        content: '# Setup\n\nAsk the user for confirmation.\n\nRun scripts/missing.sh and helpers#missing_helper.\n',
        isInterrupt: false,
        helperRefs: ['missing_helper'],
        scriptRefs: ['scripts/missing.sh'],
        executionMode: 'solo',
        interruptMode: 'never',
        autonomy: 'autonomous',
        produces: [],
        consumes: [],
      },
      {
        key: 'IMPLEMENT',
        number: 50,
        filename: '050-implement.md',
        title: 'Implement',
        content: '# Implement\n',
        isInterrupt: false,
        helperRefs: [],
        scriptRefs: [],
        executionMode: 'solo',
        interruptMode: 'never',
        autonomy: 'autonomous',
        produces: [],
        consumes: [],
      },
    ],
    groups: [],
    tracks: [{ name: 'fix', description: 'Broken fix track', steps: ['SETUP', 'MISSING', 'IMPLEMENT'] }],
    helpers: [{ key: 'state_transition', type: 'always', body: 'Complete state.' }],
    scripts: [],
    hooks: { interruptSteps: [], stopGuardEnabled: true, userInterruptEnabled: true },
    skillMd: '',
    assets: [
      inferSkillAsset('run.sh'),
      {
        ...inferSkillAsset('scripts/custom.sh'),
        role: 'user_script',
        owner: 'user',
        overwritePolicy: 'replace_on_upgrade',
        roleSource: 'explicit',
      },
    ],
    stateSchema: createDefaultStateSchema(),
    graph: { edges: [{ id: 'bad-edge', source: 'group:999', target: 'group:0', type: 'dependency' }] },
  };
  const result = validateWorkflowConfig(config, createDefaultRuntimeProfile(config.hooks), config.assets);
  const ids = new Set(result.issues.map(issue => issue.id));
  assert.equal(result.status, 'invalid');
  assert.equal(result.summary?.runnable, false);
  assert.ok(ids.has('missing-track-step-fix-MISSING'));
  assert.ok(ids.has('missing-helper-SETUP-missing_helper'));
  assert.ok(ids.has('missing-script-SETUP-scripts/missing.sh'));
  assert.ok(ids.has('execution-approval-language-SETUP'));
  assert.ok(ids.has('missing-runtime-asset-lib/init-workflow.sh'));
  assert.ok(ids.has('user-owned-replace-on-upgrade-scripts/custom.sh'));
  assert.ok(ids.has('missing-edge-source-bad-edge'));
  assert.ok(ids.has('fix-track-reproduce-before-implementation-fix'));
}

function testWfLikeTemplate() {
  const preset = PRESETS.find(item => item.id === 'wf-like-advanced');
  assert.ok(preset, 'WF-like advanced preset should exist');
  const config = preset.config as WorkflowConfig;
  const project = createSkillProjectFromWorkflowConfig(config);
  const trackNames = new Set(config.tracks.map(track => track.name));
  assert.deepEqual([...trackNames].sort(), ['brainstorm', 'feature', 'fix', 'light']);
  const fixTrack = config.tracks.find(track => track.name === 'fix');
  assert.ok(fixTrack);
  assert.ok(fixTrack.steps.indexOf('REPRODUCE') < fixTrack.steps.indexOf('FIX'));
  assert.ok(fixTrack.steps.indexOf('VERIFY_REPRO') < fixTrack.steps.indexOf('FIX'));
  assert.equal(project.assets.find(asset => asset.path === 'scripts/observe-ci.sh')?.role, 'workflow_utility');
  assert.equal(validateWorkflowConfig(config, project.runtime, project.assets).summary?.runnable, true);
}

function testDefaultPresetTemplate() {
  const preset = PRESETS.find(item => item.id === 'full-pipeline');
  assert.ok(preset, 'Default preset should exist');
  const config = preset.config as WorkflowConfig;
  const featureTrack = config.tracks.find(track => track.name === 'feature');
  const lightTrack = config.tracks.find(track => track.name === 'light');
  assert.ok(featureTrack);
  assert.ok(lightTrack);
  assert.deepEqual(featureTrack.steps, ['SPECIFY', 'PLAN', 'DEBATE_PLAN', 'EXPLAIN_PLAN', 'SETUP_TEST', 'EXPLAIN_TEST', 'IMPLEMENT', 'SELF_REVIEW', 'TEST', 'COMMIT']);
  assert.deepEqual(lightTrack.steps, ['SPECIFY', 'PLAN', 'EXPLAIN_PLAN', 'IMPLEMENT', 'SELF_REVIEW', 'COMMIT']);
  const steps = new Map(config.steps.map(step => [step.key, step]));
  assert.deepEqual(featureTrack.steps.map(key => steps.get(key)?.number), [10, 20, 21, 22, 30, 31, 40, 50, 60, 70]);
  assert.deepEqual(featureTrack.steps.map(key => steps.get(key)?.filename), [
    '010-specify.md',
    '020-plan.md',
    '021-debate-plan.md',
    '022-explain-plan.md',
    '030-setup-test.md',
    '031-explain-test.md',
    '040-implement.md',
    '050-self-review.md',
    '060-test.md',
    '070-commit.md',
  ]);
  const groups = groupSteps(config.steps);
  assert.deepEqual(groups.find(group => group.label === 'Plan')?.steps.map(step => step.key), ['PLAN', 'DEBATE_PLAN', 'EXPLAIN_PLAN']);
  assert.deepEqual(groups.find(group => group.id === 'group-30')?.label, 'Test');
  assert.deepEqual(groups.find(group => group.id === 'group-30')?.steps.map(step => step.key), ['SETUP_TEST', 'EXPLAIN_TEST']);
  assert.equal(getStepExecutionMode(steps.get('EXPLAIN_PLAN')!), 'user_involved');
  assert.equal(getStepExecutionMode(steps.get('EXPLAIN_TEST')!), 'user_involved');
  assert.equal(getStepExecutionMode(steps.get('SELF_REVIEW')!), 'background_wait');
  assert.equal(getStepExecutionMode(steps.get('PLAN')!), 'solo');
  const project = createSkillProjectFromWorkflowConfig(config);
  assert.deepEqual(project.workflow.interruptPolicy.interruptSteps, ['EXPLAIN_PLAN', 'EXPLAIN_TEST', 'SELF_REVIEW']);
  assert.equal(validateWorkflowConfig(config, project.runtime, project.assets).summary?.runnable, true);
}

function testTargetRuntimeExportShapes() {
  const preset = PRESETS.find(item => item.id === 'full-pipeline');
  assert.ok(preset, 'Default preset should exist');
  const config = preset.config as WorkflowConfig;
  const project = createSkillProjectFromWorkflowConfig(config);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-builder-target-runtime-'));

  const claudeDir = path.join(root, 'claude-skill');
  writeSkillPackage({
    targetDir: claudeDir,
    workflowName: config.name,
    steps: config.steps,
    tracks: config.tracks,
    helpers: config.helpers,
    hooks: config.hooks,
    skillMd: createThinSkillMd(config.name, config.name, config.description, 'bash run.sh init feature "<task description>"', 'claude-code'),
    assets: project.assets,
    stateSchema: project.workflow.stateSchema,
    graph: project.workflow.graph,
    targetRuntime: 'claude-code',
  });
  const claudeSkill = fs.readFileSync(path.join(claudeDir, 'SKILL.md'), 'utf-8');
  const claudeModel = JSON.parse(fs.readFileSync(path.join(claudeDir, '.skill-builder/model.json'), 'utf-8'));
  assert.ok(claudeSkill.includes('Use this Claude Code skill'));
  assert.ok(claudeSkill.includes('SKILL_DIR="<directory containing this SKILL.md>"; bash "$SKILL_DIR/run.sh" init feature "<task description>"'));
  assert.ok(!claudeSkill.includes('scope: task'));
  assert.equal(claudeModel.targetRuntime, 'claude-code');

  const codexDir = path.join(root, 'codex-skill');
  writeSkillPackage({
    targetDir: codexDir,
    workflowName: config.name,
    steps: config.steps,
    tracks: config.tracks,
    helpers: config.helpers,
    hooks: config.hooks,
    skillMd: createThinSkillMd(config.name, config.name, config.description, 'bash run.sh init feature "<task description>"', 'codex'),
    assets: project.assets,
    stateSchema: project.workflow.stateSchema,
    graph: project.workflow.graph,
    targetRuntime: 'codex',
  });
  const codexSkill = fs.readFileSync(path.join(codexDir, 'SKILL.md'), 'utf-8');
  const codexModel = JSON.parse(fs.readFileSync(path.join(codexDir, '.skill-builder/model.json'), 'utf-8'));
  assert.ok(codexSkill.includes('Use this Codex skill'));
  assert.ok(codexSkill.includes('SKILL_DIR="<directory containing this SKILL.md>"; bash "$SKILL_DIR/run.sh" init feature "<task description>"'));
  assert.ok(codexSkill.includes('scope: task'));
  assert.ok(codexSkill.includes('trigger:'));
  assert.equal(codexModel.targetRuntime, 'codex');
}

function testLegacyWfImportCompatibility() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-builder-legacy-wf-'));
  const steps = {
    SETUP: ['001-setup.md', '# Step 001: SETUP\n'],
    INVESTIGATE: ['010-investigate.md', '# Step 010: INVESTIGATE\n'],
    VERIFY: ['011-verify.md', '# Step 011: VERIFY\n'],
    REPORT: ['012-report.md', '# Step 012: REPORT\n'],
    MAKE_TEST: ['040-make-test.md', '# Step 040: MAKE_TEST\n\nDispatch a sub-agent and wait for completion.\n'],
    IMPLEMENT: ['050-implement.md', '# Step 050: IMPLEMENT\n'],
  } as const;
  fs.writeFileSync(path.join(root, 'SKILL.md'), '---\nname: wf\n---\n# wf\n', 'utf-8');
  fs.writeFileSync(path.join(root, 'step-registry.json'), JSON.stringify(Object.fromEntries(Object.entries(steps).map(([key, [file]]) => [key, file])), null, 2), 'utf-8');
  fs.writeFileSync(path.join(root, 'track-steps.json'), JSON.stringify({ fix: ['SETUP', 'INVESTIGATE', 'VERIFY', 'REPORT', 'MAKE_TEST', 'IMPLEMENT'] }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(root, 'helpers.yaml'), 'always:\n  state_transition:\n    body: Complete step.\n', 'utf-8');
  fs.writeFileSync(path.join(root, 'stop-guard.sh'), 'INTERRUPT_STEPS=(\n  REPORT\n)\n', 'utf-8');
  for (const [, [file, content]] of Object.entries(steps)) {
    fs.writeFileSync(path.join(root, file), content, 'utf-8');
  }
  for (const file of [
    'run.sh',
    'lib/init-workflow.sh',
    'lib/complete-step.sh',
    'lib/resume-workflow.sh',
    'lib/render-step.py',
    'lib/find-hook-state.py',
    'lib/get-data.sh',
    'lib/set-data.sh',
    'scripts/agent-interrupt.sh',
  ]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), '#!/usr/bin/env bash\n', 'utf-8');
  }

  const loaded = loadSkillDir(root);
  const config: WorkflowConfig = {
    name: loaded.project.name,
    description: loaded.project.description,
    steps: loaded.steps,
    groups: [],
    tracks: loaded.tracks,
    helpers: loaded.helpers,
    scripts: loaded.scripts,
    hooks: loaded.hooks,
    skillMd: loaded.skillMd,
    assets: loaded.assets,
    stateSchema: loaded.project.workflow.stateSchema,
    graph: loaded.project.workflow.graph,
  };
  const validation = validateWorkflowConfig(config, loaded.project.runtime, loaded.assets);
  const ids = new Set(validation.issues.map(issue => issue.id));
  assert.notEqual(validation.status, 'invalid');
  assert.equal(ids.has('missing-workflow-asset-state-schema.json'), false);
  assert.equal(ids.has('fix-track-reproduce-before-implementation-fix'), false);
  assert.equal(loaded.steps.find(step => step.key === 'MAKE_TEST')?.executionMode, 'background_wait');
}

function testGeneratedRuntimeFixture() {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-builder-test-runtime-'));
  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-builder-test-worktree-'));
  const config: WorkflowConfig = {
    name: 'runtime-fixture',
    description: 'Runtime fixture',
    steps: [
      {
        key: 'SETUP',
        number: 1,
        filename: '001-setup.md',
        title: 'Setup',
        content: '# Setup\n\nhelpers#state_transition\n',
        isInterrupt: false,
        helperRefs: ['state_transition'],
        scriptRefs: [],
        executionMode: 'solo',
        interruptMode: 'never',
        autonomy: 'autonomous',
        produces: [],
        consumes: [],
      },
      {
        key: 'REPORT',
        number: 90,
        filename: '090-report.md',
        title: 'Report',
        content: '# Report\n',
        isInterrupt: true,
        helperRefs: ['state_transition'],
        scriptRefs: [],
        executionMode: 'user_involved',
        interruptMode: 'allowed',
        autonomy: 'needs_user',
        produces: [],
        consumes: [],
      },
    ],
    groups: [],
    tracks: [{ name: 'default', description: 'Default', steps: ['SETUP', 'REPORT'] }],
    helpers: [{ key: 'state_transition', type: 'always', body: 'Complete current step.' }],
    scripts: [],
    hooks: { interruptSteps: ['REPORT'], stopGuardEnabled: true, userInterruptEnabled: true },
    skillMd: '',
    assets: [],
    stateSchema: createDefaultStateSchema(),
    graph: { edges: [] },
  };
  const project = createSkillProjectFromWorkflowConfig(config);
  writeSkillPackage({
    targetDir,
    workflowName: config.name,
    steps: config.steps,
    tracks: config.tracks,
    helpers: config.helpers,
    hooks: config.hooks,
    skillMd: config.skillMd,
    assets: project.assets,
    stateSchema: project.workflow.stateSchema,
    graph: project.workflow.graph,
  });
  run(targetDir, worktree, ['init', 'default', 'task']);
  const guardBlock = spawnSync('bash', [path.join(targetDir, 'stop-guard.sh')], { cwd: worktree, input: '{}', encoding: 'utf-8' });
  assert.ok(guardBlock.stdout.includes('"decision": "block"'));
  run(targetDir, worktree, ['complete', 'SETUP']);
  const guardAllow = spawnSync('bash', [path.join(targetDir, 'stop-guard.sh')], { cwd: worktree, input: '{}', encoding: 'utf-8' });
  assert.equal(guardAllow.status, 0);
  assert.equal(guardAllow.stdout.trim(), '');
  let state = JSON.parse(fs.readFileSync(path.join(worktree, '.workflow/state.json'), 'utf-8'));
  assert.equal(state.control.interrupted, false);
  const promptHook = spawnSync('bash', [path.join(targetDir, 'user-interrupt.sh')], { cwd: worktree, input: '{}', encoding: 'utf-8' });
  assert.equal(promptHook.status, 0);
  assert.ok(promptHook.stdout.includes('UserPromptSubmit'));
  state = JSON.parse(fs.readFileSync(path.join(worktree, '.workflow/state.json'), 'utf-8'));
  assert.equal(state.control.status, 'running');
  assert.equal(state.control.interrupted, false);
  run(targetDir, worktree, ['resume']);
  run(targetDir, worktree, ['interrupt', 'need user']);
  state = JSON.parse(fs.readFileSync(path.join(worktree, '.workflow/state.json'), 'utf-8'));
  assert.equal(state.control.status, 'interrupted');
  assert.equal(state.control.interrupt_reason, 'need user');
}

function run(skillDir: string, cwd: string, args: string[]) {
  const result = spawnSync('bash', [path.join(skillDir, 'run.sh'), ...args], { cwd, encoding: 'utf-8' });
  assert.equal(result.status, 0, `${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

testScenarioCoverageMap();
testValidationEngine();
testDefaultPresetTemplate();
testTargetRuntimeExportShapes();
testLegacyWfImportCompatibility();
testWfLikeTemplate();
testGeneratedRuntimeFixture();
console.log('Scenario coverage tests passed.');
