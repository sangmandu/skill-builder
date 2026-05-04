import { Clock3, ShieldCheck, UserRound } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';
import { getStepExecutionMode, type Step } from '@/lib/schema';

interface StepListPanelProps {
  store: WorkflowStore;
  activeTrack: string | null;
  onTrackSelect: (name: string) => void;
  onStepSelect: (key: string) => void;
  selectedStep: string | null;
}

export function StepListPanel({ store, activeTrack, onTrackSelect, onStepSelect, selectedStep }: StepListPanelProps) {
  const track = activeTrack ? store.tracks.find(t => t.name === activeTrack) : null;

  let visibleSteps: Step[];
  if (track) {
    const stepMap = new Map(store.steps.map(s => [s.key, s]));
    visibleSteps = track.steps
      .map(key => stepMap.get(key))
      .filter((s): s is Step => s != null);
  } else {
    visibleSteps = store.steps;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Steps</h3>
          <span className="text-[10px] text-gray-500">{visibleSteps.length}</span>
        </div>
        <select
          value={activeTrack ?? store.tracks[0]?.name ?? ''}
          onChange={event => onTrackSelect(event.target.value)}
          className="w-full px-2 py-1.5 text-xs border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-400"
        >
          {store.tracks.map(track => (
            <option key={track.name} value={track.name}>{track.name}</option>
          ))}
        </select>
      </div>
      {visibleSteps.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No steps yet</p>
      )}
      <div className="space-y-1">
        {visibleSteps.map((step, idx) => (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepSelect(step.key)}
            className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left transition-colors ${
              selectedStep === step.key
                ? 'bg-violet-100 dark:bg-violet-950/45 ring-1 ring-violet-400/70'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {activeTrack ? (
              <span className="text-[10px] font-mono text-gray-500 w-5 shrink-0 tabular-nums text-center">
                {idx + 1}
              </span>
            ) : null}
            <span className="text-[10px] font-mono text-gray-400 w-7 shrink-0 tabular-nums">
              {String(step.number).padStart(3, '0')}
            </span>
            <span className="text-xs font-medium truncate flex-1">{step.title || step.key}</span>
            <StepModeIcon step={step} />
          </button>
        ))}
      </div>
    </div>
  );
}

function StepModeIcon({ step }: { step: Step }) {
  const mode = getStepExecutionMode(step);
  if (mode === 'background_wait') {
    return <Clock3 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />;
  }
  if (mode === 'user_involved') {
    return <UserRound className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
  }
  return <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />;
}
