import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';

interface TrackPanelProps {
  store: WorkflowStore;
  activeTrack: string | null;
  onTrackSelect: (name: string | null) => void;
}

const TRACK_COLORS: Record<string, string> = {
  feature: '#3b82f6',
  fix: '#ef4444',
  light: '#22c55e',
  brainstorm: '#a855f7',
  default: '#6366f1',
};

function getTrackColor(name: string): string {
  return TRACK_COLORS[name] ?? `hsl(${[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 60%, 55%)`;
}

export function TrackPanel({ store, activeTrack, onTrackSelect }: TrackPanelProps) {
  const [newTrackName, setNewTrackName] = useState('');
  const [adding, setAdding] = useState(false);
  const selectedTrack = activeTrack ? store.tracks.find(track => track.name === activeTrack) : null;
  const stepMap = new Map(store.steps.map(step => [step.key, step]));

  const handleAdd = () => {
    if (!newTrackName.trim()) return;
    const name = newTrackName.trim().toLowerCase().replace(/\s+/g, '_');
    store.addTrack(name);
    setNewTrackName('');
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-gray-500">
          Track arrays control execution order. Step file numbers only group files visually.
        </p>
        <button
          onClick={() => setAdding(!adding)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {adding && (
        <div className="flex gap-1">
          <input
            value={newTrackName}
            onChange={e => setNewTrackName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="track name"
            className="flex-1 px-2 py-1 text-xs border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
          <button onClick={handleAdd} className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">
            Add
          </button>
        </div>
      )}

      <button
        onClick={() => onTrackSelect(null)}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
          activeTrack === null
            ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-400 dark:bg-purple-900/50 dark:text-purple-300 dark:ring-purple-700'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        All Steps
        <span className="ml-auto text-gray-400">{store.steps.length}</span>
      </button>

      {store.tracks.map(track => {
        const color = getTrackColor(track.name);
        return (
          <div key={track.name} className="flex items-center gap-1">
            <button
              onClick={() => onTrackSelect(track.name)}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTrack === track.name
                  ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-400 dark:bg-purple-900/50 dark:text-purple-300 dark:ring-purple-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {track.name}
              <span className="ml-auto text-gray-400">{track.steps.length}</span>
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete track "${track.name}"?`)) {
                  store.removeTrack(track.name);
                  if (activeTrack === track.name) onTrackSelect(null);
                }
              }}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {selectedTrack && (
        <section className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Execution Order</div>
            <p className="text-[10px] text-amber-500 mt-1">
              Running .workflow/state.json keeps its current position until runtime resume/reset.
            </p>
          </div>

          <div className="space-y-1">
            {selectedTrack.steps.map((stepKey, index) => {
              const step = stepMap.get(stepKey);
              return (
                <div
                  key={stepKey}
                  className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5"
                >
                  <span className="w-5 text-[10px] font-mono text-gray-500 text-center tabular-nums">{index + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-medium truncate">{step?.title ?? stepKey}</span>
                    <span className="block text-[9px] font-mono text-gray-400 truncate">{stepKey}</span>
                  </span>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => store.moveTrackStep(selectedTrack.name, stepKey, -1)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === selectedTrack.steps.length - 1}
                    onClick={() => store.moveTrackStep(selectedTrack.name, stepKey, 1)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Step Pool</div>
            <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-1">
              {store.steps.map(step => {
                const included = selectedTrack.steps.includes(step.key);
                return (
                  <label key={step.key} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-[11px]">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => store.toggleStepInTrack(selectedTrack.name, step.key)}
                      className="w-3 h-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-mono text-gray-400 w-8">{String(step.number).padStart(3, '0')}</span>
                    <span className="truncate">{step.title || step.key}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
