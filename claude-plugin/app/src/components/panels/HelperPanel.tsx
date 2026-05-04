import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Lock, Unlock, Info } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';

interface HelperPanelProps {
  store: WorkflowStore;
}

export function HelperPanel({ store }: HelperPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState<'always' | 'on_demand'>('on_demand');

  const handleAdd = () => {
    if (!newKey.trim()) return;
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    store.addHelper(key, newType);
    setNewKey('');
    setAdding(false);
    setExpanded(key);
  };

  const alwaysHelpers = store.helpers.filter(h => h.type === 'always');
  const onDemandHelpers = store.helpers.filter(h => h.type === 'on_demand');
  const helperUsage = new Map(
    store.helpers.map(helper => [
      helper.key,
      store.steps.filter(step => step.helperRefs.includes(helper.key)).length,
    ]),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Helpers</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="rounded-md border border-slate-700 bg-slate-950/35 px-2.5 py-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
          <Info className="h-3.5 w-3.5 text-violet-300" />
          Common skill instructions
        </div>
        <p className="mt-1 text-[11px] leading-snug text-slate-400">
          Reusable rules, guardrails, writing style, and repeated procedures that steps can share.
        </p>
      </div>

      {adding && (
        <div className="space-y-1.5 rounded-md border border-slate-700 bg-slate-950/35 p-2">
          <input
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="helper_key"
            className="w-full px-2 py-1 text-xs font-mono border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-400"
            autoFocus
          />
          <div className="flex gap-1">
            <HelperModeButton
              active={newType === 'always'}
              label="Always"
              detail="Applies across the skill. Use for global rules and guardrails."
              onClick={() => setNewType('always')}
              activeClassName="bg-emerald-950/55 text-emerald-200 ring-1 ring-emerald-700"
            />
            <HelperModeButton
              active={newType === 'on_demand'}
              label="On Demand"
              detail="Attach only to selected steps. Use for reusable procedures."
              onClick={() => setNewType('on_demand')}
              activeClassName="bg-cyan-950/55 text-cyan-200 ring-1 ring-cyan-700"
            />
          </div>
          <button onClick={handleAdd} className="w-full px-2 py-1 text-xs bg-violet-700 text-white rounded hover:bg-violet-600">Add</button>
        </div>
      )}

      {alwaysHelpers.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-300 mb-1" title="Always helpers are included as common instructions across the skill.">
            <Lock className="w-3 h-3" /> Always Applied
          </div>
          {alwaysHelpers.map(h => (
            <HelperItem
              key={h.key}
              helper={h}
              usedBy={helperUsage.get(h.key) ?? 0}
              expanded={expanded === h.key}
              onToggle={() => setExpanded(expanded === h.key ? null : h.key)}
              onUpdate={(body) => store.updateHelper(h.key, { body })}
              onDelete={() => store.removeHelper(h.key)}
            />
          ))}
        </div>
      )}

      {onDemandHelpers.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-cyan-300 mb-1" title="On demand helpers are reusable instructions attached to selected steps.">
            <Unlock className="w-3 h-3" /> On Demand
          </div>
          {onDemandHelpers.map(h => (
            <HelperItem
              key={h.key}
              helper={h}
              usedBy={helperUsage.get(h.key) ?? 0}
              expanded={expanded === h.key}
              onToggle={() => setExpanded(expanded === h.key ? null : h.key)}
              onUpdate={(body) => store.updateHelper(h.key, { body })}
              onDelete={() => store.removeHelper(h.key)}
            />
          ))}
        </div>
      )}

      {store.helpers.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-2">No helpers yet</p>
      )}
    </div>
  );
}

function HelperItem({
  helper,
  usedBy,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  helper: { key: string; type: string; body: string };
  usedBy: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (body: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="border rounded-md mb-1 overflow-hidden">
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={onToggle}
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <span className="text-xs font-mono flex-1">{helper.key}</span>
        <span className="text-[10px] text-gray-400">{usedBy} refs</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {expanded && (
        <div className="px-2 pb-2">
          <textarea
            value={helper.body}
            onChange={e => onUpdate(e.target.value)}
            className="w-full h-32 px-2 py-1.5 text-xs font-mono border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-400 resize-y"
          />
        </div>
      )}
    </div>
  );
}

function HelperModeButton({
  active,
  label,
  detail,
  activeClassName,
  onClick,
}: {
  active: boolean;
  label: string;
  detail: string;
  activeClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={detail}
      className={`group relative flex-1 rounded px-2 py-1 text-xs transition-colors ${
        active ? activeClassName : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {label}
      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {detail}
      </span>
    </button>
  );
}
