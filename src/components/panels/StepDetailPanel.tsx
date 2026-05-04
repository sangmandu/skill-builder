import { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock3, Info, Save, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { getStepExecutionMode, type ExecutionMode } from '@/lib/schema';
import type { WorkflowStore } from '@/lib/store';

interface StepDetailPanelProps {
  store: WorkflowStore;
  stepKey: string;
  activeTrack: string | null;
  onClose: () => void;
}

const TRACK_COLORS: Record<string, string> = {
  feature: 'hsl(218 48% 55%)',
  fix: 'hsl(0 45% 56%)',
  light: 'hsl(150 38% 48%)',
  brainstorm: 'hsl(292 30% 55%)',
  default: 'hsl(216 16% 52%)',
};

const EXECUTION_MODES: Array<{
  value: ExecutionMode;
  label: string;
  tone: string;
  detail: string;
  iconClassName: string;
  icon: typeof ShieldCheck;
}> = [
  {
    value: 'solo',
    label: 'Solo',
    tone: 'emerald',
    detail: 'Agent continues without normal user input.',
    iconClassName: 'text-emerald-300',
    icon: ShieldCheck,
  },
  {
    value: 'user_involved',
    label: 'User',
    tone: 'amber',
    detail: 'This step intentionally reports to or asks the user.',
    iconClassName: 'text-amber-300',
    icon: UserRound,
  },
  {
    value: 'background_wait',
    label: 'Wait',
    tone: 'cyan',
    detail: 'Agent may wait on background work before continuing.',
    iconClassName: 'text-cyan-300',
    icon: Clock3,
  },
];

function getTrackColor(name: string): string {
  return TRACK_COLORS[name] ?? `hsl(${[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360} 34% 52%)`;
}

export function StepDetailPanel({ store, stepKey, activeTrack, onClose }: StepDetailPanelProps) {
  const step = store.steps.find(s => s.key === stepKey);

  const [content, setContent] = useState(step?.content ?? '');
  const [title, setTitle] = useState(step?.title ?? '');
  const [helperToAdd, setHelperToAdd] = useState('');

  if (!step) return null;

  const handleSave = () => {
    store.updateStep(stepKey, { content, title });
  };

  const handleDelete = () => {
    if (confirm(`Delete step ${stepKey}?`)) {
      store.removeStep(stepKey);
      onClose();
    }
  };

  const reorderTrackName = activeTrack
    ?? store.tracks.find(t => t.steps.includes(stepKey))?.name
    ?? null;

  const reorderTrack = reorderTrackName
    ? store.tracks.find(t => t.name === reorderTrackName)
    : null;

  const decade = Math.floor(step.number / 10) * 10;
  const sameGroupKeysInTrack = reorderTrack
    ? reorderTrack.steps.filter(k => {
        const s = store.steps.find(x => x.key === k);
        return s && Math.floor(s.number / 10) * 10 === decade;
      })
    : [];

  const positionInGroup = sameGroupKeysInTrack.indexOf(stepKey);
  const canMoveEarlier = positionInGroup > 0;
  const canMoveLater = positionInGroup >= 0 && positionInGroup < sameGroupKeysInTrack.length - 1;
  const stepIssues = store.validation.issues.filter(issue => issue.entityKey === stepKey);
  const executionMode = getStepExecutionMode(step);
  const availableHelpers = store.helpers.filter(helper => !step.helperRefs.includes(helper.key));
  const helperLookup = new Map(store.helpers.map(helper => [helper.key, helper]));

  const moveInTrack = (direction: -1 | 1) => {
    if (!reorderTrack) return;
    const trackSteps = [...reorderTrack.steps];
    const idxInTrack = trackSteps.indexOf(stepKey);
    const neighborKey = sameGroupKeysInTrack[positionInGroup + direction];
    const neighborIdxInTrack = trackSteps.indexOf(neighborKey);
    if (idxInTrack < 0 || neighborIdxInTrack < 0) return;
    [trackSteps[idxInTrack], trackSteps[neighborIdxInTrack]] = [trackSteps[neighborIdxInTrack], trackSteps[idxInTrack]];
    store.updateTrack(reorderTrack.name, { steps: trackSteps });
  };

  const addCommonInstruction = (helperKey: string) => {
    if (!helperKey) return;
    store.updateStep(stepKey, { helperRefs: [...new Set([...step.helperRefs, helperKey])] });
    setHelperToAdd('');
  };

  const removeCommonInstruction = (helperKey: string) => {
    store.updateStep(stepKey, { helperRefs: step.helperRefs.filter(ref => ref !== helperKey) });
  };

  return (
    <div className="w-[380px] border-l border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-700">
        <div className="min-w-0 flex items-center gap-2">
          <span className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 tabular-nums dark:border-slate-700 dark:bg-slate-950/35 dark:text-slate-400">
            {String(step.number).padStart(3, '0')}
          </span>
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{stepKey}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Title</span>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-950/25 dark:text-slate-100"
          />
        </div>

        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Execution Mode</span>
          <div className="grid grid-cols-3 gap-1.5">
            {EXECUTION_MODES.map(mode => {
              const Icon = mode.icon;
              const active = executionMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => store.updateStepExecutionMode(stepKey, mode.value)}
                  title={mode.detail}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? modeActiveClass(mode.tone)
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-950/30'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${mode.iconClassName}`} />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {stepIssues.length > 0 && (
          <div className="space-y-1">
            {stepIssues.map(issue => (
              <div
                key={issue.id}
                className={`flex gap-2 rounded-lg border px-2.5 py-2 text-xs leading-snug ${
                  issue.severity === 'error'
                    ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/25 dark:text-red-300'
                    : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Track Membership</span>
          <div className="grid grid-cols-2 gap-1.5">
            {store.tracks.map(track => {
              const inTrack = track.steps.includes(stepKey);
              const color = getTrackColor(track.name);
              return (
                <label
                  key={track.name}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                    inTrack
                    ? 'border-gray-300 bg-gray-50 dark:border-slate-500 dark:bg-slate-950/30 dark:text-slate-200'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                  checked={inTrack}
                  onChange={() => store.toggleStepInTrack(track.name, stepKey)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
                  />
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium">{track.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        {reorderTrack && sameGroupKeysInTrack.length > 1 && (
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
              Reorder in group — {positionInGroup + 1} of {sameGroupKeysInTrack.length}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={!canMoveEarlier}
                onClick={() => moveInTrack(-1)}
                  className={`flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  canMoveEarlier
                    ? 'text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-950/30'
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Earlier
              </button>
              <button
                type="button"
                disabled={!canMoveLater}
                onClick={() => moveInTrack(1)}
                  className={`flex items-center justify-center gap-1 px-3 py-2 border rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  canMoveLater
                    ? 'text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-950/30'
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                Later <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Common Instructions</span>
            <span
              tabIndex={0}
              title="Attach reusable helper instructions to this step."
              className="group relative inline-flex outline-none"
            >
              <Info className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 group-focus:text-slate-300" />
              <span className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-56 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                Attach shared helper instructions to this step. Use this for repeated rules, guardrails, style, or procedures instead of copying the same text into every step.
              </span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {step.helperRefs.length > 0 ? step.helperRefs.map(ref => {
              const helper = helperLookup.get(ref);
              return (
              <button
                key={ref}
                type="button"
                onClick={() => removeCommonInstruction(ref)}
                title={helper ? `${helper.type === 'always' ? 'Always applied' : 'On demand'} helper: ${helper.body}` : 'Remove common instruction'}
                className="rounded bg-cyan-50 px-2 py-0.5 font-mono text-xs text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-950/35 dark:text-cyan-300 dark:hover:bg-cyan-950/60"
              >
                {ref} ×
              </button>
              );
            }) : (
              <span className="text-xs text-gray-400">No common instructions</span>
            )}
          </div>
          <div className="flex gap-1.5">
            <select
              value={helperToAdd}
              onChange={event => {
                setHelperToAdd(event.target.value);
                addCommonInstruction(event.target.value);
              }}
              disabled={availableHelpers.length === 0}
              title="Select a helper to attach its reusable instruction to this step."
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-transparent px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-950/25"
            >
              <option value="">{availableHelpers.length === 0 ? 'No instructions left' : 'Add instruction'}</option>
              {availableHelpers.map(helper => (
                <option key={helper.key} value={helper.key}>{helper.key}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Step Instruction</span>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="h-56 w-full resize-y rounded-lg border border-gray-200 bg-transparent px-3 py-2 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-400 dark:border-slate-700 dark:bg-slate-950/25 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-slate-700">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-medium text-white transition-colors cursor-pointer hover:bg-violet-600"
        >
          <Save className="w-3.5 h-3.5" /> Save Changes
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 transition-colors cursor-pointer hover:bg-red-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function modeActiveClass(tone: string): string {
  if (tone === 'amber') {
    return 'border-amber-600 bg-amber-50 text-amber-700 ring-1 ring-amber-300 dark:bg-slate-950/35 dark:text-amber-200 dark:ring-amber-900/70';
  }
  if (tone === 'cyan') {
    return 'border-cyan-600 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-300 dark:bg-slate-950/35 dark:text-cyan-200 dark:ring-cyan-900/70';
  }
  return 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300 dark:bg-slate-950/35 dark:text-emerald-200 dark:ring-emerald-900/70';
}
