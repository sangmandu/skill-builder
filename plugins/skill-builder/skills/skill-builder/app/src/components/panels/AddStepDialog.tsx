import { useState } from 'react';
import { X } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';

interface AddStepDialogProps {
  store: WorkflowStore;
  activeTrack: string | null;
  onClose: () => void;
}

export function AddStepDialog({ store, activeTrack, onClose }: AddStepDialogProps) {
  const [key, setKey] = useState('');
  const [number, setNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const k = key.trim().toUpperCase().replace(/\s+/g, '_');
    const n = parseInt(number, 10);
    if (!k || isNaN(n) || n < 0 || n > 999) return;
    if (store.steps.some(s => s.key === k)) {
      alert(`Step ${k} already exists`);
      return;
    }
    store.addStep(k, n);
    if (activeTrack) {
      store.toggleStepInTrack(activeTrack, k);
    }
    onClose();
  };

  const suggestedNumber = (() => {
    if (store.steps.length === 0) return 10;
    const max = Math.max(...store.steps.map(s => s.number));
    const nextDecade = Math.ceil((max + 1) / 10) * 10;
    return Math.min(nextDecade, 999);
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl border shadow-xl w-96 p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Add Step</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step Key</label>
            <input
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="MY_NEW_STEP"
              className="mt-1 w-full px-3 py-2 text-sm font-mono border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            <p className="text-[10px] text-gray-400 mt-1">UPPER_SNAKE_CASE</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Number</label>
            <input
              type="number"
              value={number || suggestedNumber}
              onChange={e => setNumber(e.target.value)}
              min={0}
              max={999}
              className="mt-1 w-full px-3 py-2 text-sm font-mono border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[10px] text-gray-400 mt-1">Groups by decade: 0-9 = Setup, 10-19 = Investigate, etc.</p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Create Step
          </button>
        </form>
      </div>
    </div>
  );
}
