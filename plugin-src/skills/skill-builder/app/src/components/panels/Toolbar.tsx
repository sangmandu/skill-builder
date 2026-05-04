import { useState } from 'react';
import type { ReactNode } from 'react';
import { BookTemplate, CircleAlert, CheckCircle2, Download, FolderOpen, Loader2, Plus, RefreshCw } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';
import type { SkillExportTarget } from '@/lib/schema';

interface ToolbarProps {
  store: WorkflowStore;
  onAddStep: () => void;
  onNew: () => void;
}

interface StatusDescriptor {
  label: string;
  className: string;
  icon: ReactNode;
}

export function Toolbar({ store, onAddStep, onNew }: ToolbarProps) {
  const [importing, setImporting] = useState(false);
  const [importPath, setImportPath] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportPath, setExportPath] = useState('');
  const [exportTarget, setExportTarget] = useState<SkillExportTarget>('claude-code');
  const [showConflicts, setShowConflicts] = useState(false);
  const syncStatus = getSyncStatus(store);
  const validationStatus = getValidationStatus(store);

  const handleImport = async () => {
    if (!importPath.trim()) return;
    try {
      await store.loadFromDir(importPath.trim());
      setImporting(false);
      setImportPath('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Import failed: ${msg}`);
    }
  };

  const handleExport = async () => {
    if (!exportPath.trim()) return;
    try {
      await store.exportTo(exportPath.trim(), exportTarget);
      setExporting(false);
      setExportPath('');
      alert('Exported successfully!');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Export failed: ${msg}`);
    }
  };

  return (
    <div className="relative flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2 flex-1">
        <h1 className="text-sm font-bold tracking-tight text-violet-600 dark:text-violet-300">
          Skill Builder
        </h1>
        <input
          value={store.name}
          onChange={event => store.updateEntrypoint({ name: event.target.value })}
          placeholder="skill-name"
          className="w-40 px-2 py-1 text-xs font-mono border rounded-md bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-violet-400"
          aria-label="Skill name"
        />
        <StatusBadge
          status={syncStatus}
          title={getSyncTooltipTitle(store)}
          tooltip={renderSyncTooltip(store)}
        />
        <StatusBadge
          status={validationStatus}
          title={getValidationTooltipTitle(store)}
          tooltip={renderValidationTooltip(store)}
        />
        {store.loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onNew}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <BookTemplate className="w-3.5 h-3.5" /> New
        </button>

        {store.rootDir && (
          <button
            onClick={() => void store.syncNow()}
            disabled={!store.dirty || store.syncState.status === 'syncing' || store.syncState.status === 'conflict'}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            title={store.rootDir}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${store.syncState.status === 'syncing' ? 'animate-spin' : ''}`} /> Sync
          </button>
        )}

        {store.syncState.status === 'conflict' && store.syncState.conflicts?.length ? (
          <button
            type="button"
            onClick={() => setShowConflicts(value => !value)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950 transition-colors"
          >
            <CircleAlert className="w-3.5 h-3.5" /> Resolve
          </button>
        ) : null}

        <button
          onClick={onAddStep}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Step
        </button>

        {importing ? (
          <div className="flex items-center gap-1">
            <input
              value={importPath}
              onChange={e => setImportPath(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              placeholder="~/path/to/skills/wf"
              className="px-2 py-1 text-xs border rounded bg-transparent w-52 focus:outline-none focus:ring-1 focus:ring-violet-400"
              autoFocus
            />
            <button onClick={handleImport} className="px-2 py-1 text-xs bg-violet-700 text-white rounded hover:bg-violet-600">Load</button>
            <button onClick={() => setImporting(false)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setImporting(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Import
          </button>
        )}

        {exporting ? (
          <div className="flex items-center gap-1">
            <select
              value={exportTarget}
              onChange={e => {
                const nextTarget = e.target.value as SkillExportTarget;
                setExportTarget(nextTarget);
                setExportPath(defaultExportPath(store.name, nextTarget));
              }}
              className="px-2 py-1 text-xs border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-400"
              aria-label="Export target"
            >
              <option value="claude-code">Claude Code</option>
              <option value="codex">Codex</option>
            </select>
            <input
              value={exportPath}
              onChange={e => setExportPath(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExport()}
              placeholder={defaultExportPath(store.name, exportTarget)}
              className="px-2 py-1 text-xs border rounded bg-transparent w-52 focus:outline-none focus:ring-1 focus:ring-violet-400"
              autoFocus
            />
            <button onClick={handleExport} className="px-2 py-1 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-600">Export</button>
            <button onClick={() => setExporting(false)} className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => {
              setExportTarget(store.exportTarget);
              setExportPath(defaultExportPath(store.name, store.exportTarget));
              setExporting(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-violet-700 text-white rounded-md hover:bg-violet-600 transition-colors"
            disabled={store.steps.length === 0}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        )}
      </div>

      {showConflicts && store.syncState.status === 'conflict' && store.syncState.conflicts?.length ? (
        <div className="absolute right-4 top-11 z-30 w-[420px] rounded-lg border border-red-200 bg-white shadow-xl dark:border-red-900 dark:bg-gray-950">
          <div className="px-3 py-2 border-b border-red-100 dark:border-red-900">
            <div className="text-xs font-semibold text-red-600 dark:text-red-300">Sync Conflicts</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{store.syncState.message}</div>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
            {store.syncState.conflicts.map(conflict => (
              <div key={conflict.path} className="rounded-md border border-gray-200 dark:border-gray-800 px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] truncate flex-1" title={conflict.path}>{conflict.path}</span>
                  <span className="text-[10px] text-gray-400">{conflict.role}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {recommendationLabel(conflict.recommendation)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                void store.preserveExternalConflict();
                setShowConflicts(false);
              }}
              className="flex-1 px-2 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Preserve FS
            </button>
            <button
              type="button"
              onClick={() => {
                void store.overwriteConflictWithUi();
                setShowConflicts(false);
              }}
              className="flex-1 px-2 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Use UI
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
  title,
  tooltip,
}: {
  status: StatusDescriptor;
  title: string;
  tooltip: ReactNode;
}) {
  return (
    <span
      tabIndex={0}
      title={title}
      className={`group relative inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] outline-none ring-offset-2 ring-offset-slate-900 focus:ring-1 focus:ring-slate-500 ${status.className}`}
    >
      {status.icon}
      {status.label}
      <span className="pointer-events-none absolute left-0 top-full z-40 mt-2 w-72 rounded-md border border-slate-700 bg-slate-950 p-2 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {tooltip}
      </span>
    </span>
  );
}

function defaultExportPath(name: string, target: SkillExportTarget): string {
  const slug = (name || 'my-skill')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-skill';
  return target === 'codex' ? `~/.codex/skills/${slug}` : `~/.claude/skills/${slug}`;
}

function recommendationLabel(recommendation: string): string {
  if (recommendation === 'preserve_external') {
    return 'Recommended: preserve the filesystem version because this is user-owned work.';
  }
  if (recommendation === 'regenerate_platform') {
    return 'Recommended: regenerate from the platform runtime profile if the UI version is intended.';
  }
  return 'Recommended: review both versions before choosing a winner.';
}

function renderSyncTooltip(store: WorkflowStore): ReactNode {
  const state = store.syncState.status;
  const message = store.syncState.message;
  const root = store.rootDir;
  const summary = state === 'unbound'
    ? 'No filesystem folder is bound to this workflow yet.'
    : state === 'clean'
      ? 'UI state and the bound filesystem folder are in sync.'
      : state === 'dirty'
        ? 'The UI has edits that have not been written to the filesystem yet.'
        : state === 'syncing'
          ? 'Filesystem sync is currently running.'
          : state === 'conflict'
            ? 'The UI and filesystem both changed, so a winner must be chosen.'
            : 'Filesystem sync is blocked.';

  return (
    <div className="space-y-1.5">
      <div className="font-semibold text-slate-100">Filesystem binding</div>
      <div>{summary}</div>
      <div className="break-words text-slate-400">
        {root ? `Path: ${root}` : 'Bind by importing a skill folder or exporting this workflow.'}
      </div>
      {message ? <div className="break-words text-slate-400">{message}</div> : null}
    </div>
  );
}

function getSyncTooltipTitle(store: WorkflowStore): string {
  if (store.syncState.message) return store.syncState.message;
  if (store.rootDir) return `Bound to ${store.rootDir}`;
  return 'No filesystem folder bound';
}

function renderValidationTooltip(store: WorkflowStore): ReactNode {
  const summary = store.validation.summary;
  const issues = store.validation.issues.slice(0, 5);
  const hiddenCount = Math.max(0, store.validation.issues.length - issues.length);
  const status = summary?.highestSeverity === 'error'
    ? 'This workflow has blocking validation errors.'
    : summary?.highestSeverity === 'warning'
      ? 'This workflow is usable, but has warnings to review.'
      : 'This workflow passes the current validation checks.';

  return (
    <div className="space-y-1.5">
      <div className="font-semibold text-slate-100">Validation status</div>
      <div>{status}</div>
      <div className="text-slate-400">
        {summary?.errors ?? 0} errors, {summary?.warnings ?? 0} warnings, {summary?.info ?? 0} info
      </div>
      {issues.length ? (
        <div className="space-y-1 pt-1">
          {issues.map(issue => (
            <div key={issue.id} className="flex gap-1.5">
              <span className="shrink-0 uppercase text-slate-500">{issue.severity}</span>
              <span className="min-w-0 break-words text-slate-300">
                {issue.path ? `${issue.path}: ` : ''}
                {issue.entityKey ? `${issue.entityKey}: ` : ''}
                {issue.message}
              </span>
            </div>
          ))}
          {hiddenCount ? <div className="text-slate-500">+{hiddenCount} more issues</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function getValidationTooltipTitle(store: WorkflowStore): string {
  const summary = store.validation.summary;
  const firstIssue = store.validation.issues[0];
  if (firstIssue) return firstIssue.message;
  return `${summary?.errors ?? 0} errors, ${summary?.warnings ?? 0} warnings`;
}

function getValidationStatus(store: WorkflowStore): StatusDescriptor {
  const summary = store.validation.summary;
  if (summary?.highestSeverity === 'error') {
    return {
      label: 'invalid',
      className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      icon: <CircleAlert className="w-3 h-3" />,
    };
  }
  if (summary?.highestSeverity === 'warning') {
    return {
      label: 'warnings',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      icon: <CircleAlert className="w-3 h-3" />,
    };
  }
  return {
    label: 'valid',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  };
}

function getSyncStatus(store: WorkflowStore): StatusDescriptor {
  switch (store.syncState.status) {
    case 'clean':
      return {
        label: 'synced',
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case 'dirty':
      return {
        label: 'sync pending',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
        icon: <RefreshCw className="w-3 h-3" />,
      };
    case 'syncing':
      return {
        label: 'syncing',
        className: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
        icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      };
    case 'blocked':
      return {
        label: 'sync blocked',
        className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        icon: <CircleAlert className="w-3 h-3" />,
      };
    case 'conflict':
      return {
        label: 'sync conflict',
        className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        icon: <CircleAlert className="w-3 h-3" />,
      };
    case 'unbound':
    default:
      return {
        label: 'unbound',
        className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
        icon: <CircleAlert className="w-3 h-3" />,
      };
  }
}
