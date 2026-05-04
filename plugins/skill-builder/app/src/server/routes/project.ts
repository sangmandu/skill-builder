import { Router } from 'express';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { SkillPackageConflictError, writeSkillPackage, type SkillPackageWriteBody } from '../lib/skillPackageWriter.js';
import type { RuntimeStateSnapshot, ValidationResult } from '../../lib/schema.js';

export const projectRouter = Router();

interface ProjectSyncBody extends Omit<SkillPackageWriteBody, 'targetDir'> {
  rootDir: string;
  validation?: ValidationResult;
  force?: boolean;
}

projectRouter.post('/sync', (req, res) => {
  const body = req.body as ProjectSyncBody;
  if (!body.rootDir) {
    res.status(400).json({ error: 'rootDir required' });
    return;
  }

  const blockingIssue = body.validation?.issues.find(issue => issue.severity === 'error');
  if (blockingIssue) {
    res.status(409).json({
      error: 'Validation blocked sync',
      issue: blockingIssue,
    });
    return;
  }

  try {
    const result = writeSkillPackage({
      ...body,
      targetDir: body.rootDir,
      detectConflicts: !body.force,
    });
    res.json({ success: true, sync: { status: 'clean', lastSyncedAt: result.lastSyncedAt }, ...result });
  } catch (e: unknown) {
    if (e instanceof SkillPackageConflictError) {
      res.status(409).json({
        error: 'Sync conflict',
        conflicts: e.conflicts,
      });
      return;
    }
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

projectRouter.get('/events', (req, res) => {
  const rootDir = typeof req.query.rootDir === 'string' ? req.query.rootDir : '';
  if (!rootDir) {
    res.status(400).json({ error: 'rootDir required' });
    return;
  }

  const resolved = path.resolve(rootDir.replace(/^~/, process.env.HOME || ''));

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  const send = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  let timer: NodeJS.Timeout | undefined;
  const changedPaths = new Set<string>();
  const flush = (event: string, filePath: string) => {
    changedPaths.add(path.relative(resolved, filePath).split(path.sep).join('/'));
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      send({
        type: 'changed',
        event,
        rootDir: resolved,
        paths: [...changedPaths].sort(),
        updatedAt: new Date().toISOString(),
      });
      changedPaths.clear();
    }, 250);
  };

  const watcher = chokidar.watch(resolved, {
    ignoreInitial: true,
    ignored: [
      '**/.git/**',
      '**/node_modules/**',
      '**/.workflow/**',
    ],
  });

  watcher
    .on('add', filePath => flush('add', filePath))
    .on('change', filePath => flush('change', filePath))
    .on('unlink', filePath => flush('unlink', filePath))
    .on('ready', () => send({ type: 'ready', rootDir: resolved }))
    .on('error', error => send({ type: 'error', error: error instanceof Error ? error.message : String(error) }));

  req.on('close', () => {
    if (timer) clearTimeout(timer);
    void watcher.close();
  });
});

projectRouter.get('/runtime-status', (req, res) => {
  const rootDir = typeof req.query.rootDir === 'string' ? req.query.rootDir : '';
  if (!rootDir) {
    res.status(400).json({ error: 'rootDir required' });
    return;
  }

  const resolved = path.resolve(rootDir.replace(/^~/, process.env.HOME || ''));
  const statePath = path.join(resolved, '.workflow/state.json');
  if (!fs.existsSync(statePath)) {
    res.json({
      runtimeState: {
        status: 'missing',
        statePath,
        nextAction: 'Start the workflow with run.sh init.',
      } satisfies RuntimeStateSnapshot,
    });
    return;
  }

  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as {
      control?: {
        status?: string;
        track?: string;
        current_step?: string;
        interrupted?: boolean;
        interrupt_reason?: string;
        updated_at?: string;
      };
    };
    const control = state.control ?? {};
    const status = normalizeRuntimeStatus(control.status);
    const currentStep = control.current_step || undefined;
    const interrupted = control.interrupted === true || status === 'interrupted';
    const runtimeState: RuntimeStateSnapshot = {
      status,
      track: control.track,
      currentStep,
      interrupted,
      interruptReason: control.interrupt_reason,
      updatedAt: control.updated_at,
      statePath,
      nextAction: nextRuntimeAction(status, interrupted, currentStep),
    };
    res.json({ runtimeState });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: msg });
  }
});

function normalizeRuntimeStatus(status: string | undefined): RuntimeStateSnapshot['status'] {
  if (status === 'running' || status === 'interrupted' || status === 'completed') return status;
  return status ? 'unknown' : 'missing';
}

function nextRuntimeAction(
  status: RuntimeStateSnapshot['status'],
  interrupted: boolean,
  currentStep: string | undefined,
): string {
  if (status === 'missing') return 'Start the workflow with run.sh init.';
  if (status === 'completed') return 'Workflow is complete.';
  if (interrupted) return 'Resolve the user input, then run run.sh resume.';
  if (status === 'running' && currentStep) return `Continue ${currentStep} or run run.sh complete ${currentStep}.`;
  return 'Inspect workflow state before continuing.';
}
