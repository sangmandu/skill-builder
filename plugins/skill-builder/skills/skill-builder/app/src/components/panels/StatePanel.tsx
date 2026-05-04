import { useState } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import type { StateField, StateFieldType } from '@/lib/schema';
import type { WorkflowStore } from '@/lib/store';

interface StatePanelProps {
  store: WorkflowStore;
}

const FIELD_TYPES: StateFieldType[] = ['string', 'number', 'boolean', 'object', 'array', 'json', 'null'];

export function StatePanel({ store }: StatePanelProps) {
  const [newField, setNewField] = useState('ticket_id');
  const controlFields = store.stateFields.filter(field => field.reserved);
  const dataFields = store.stateFields.filter(field => !field.reserved);

  const handleAdd = () => {
    store.addStateField(newField);
    setNewField('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">State Schema</h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Runtime control fields are locked. Workflow data fields describe produced and consumed metadata.
        </p>
      </div>

      <section>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Control Fields</div>
        <div className="space-y-1">
          {controlFields.map(field => (
            <div key={field.path} className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5">
              <Lock className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="font-mono text-[11px] truncate">{field.path}</span>
              <span className="ml-auto text-[10px] text-gray-400">{field.type}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Data Fields</div>
          <div className="text-[10px] text-gray-400">{dataFields.length} fields</div>
        </div>

        <div className="flex gap-1 mb-2">
          <input
            value={newField}
            onChange={event => setNewField(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && handleAdd()}
            placeholder="ticket_id"
            className="flex-1 px-2 py-1 text-xs border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {dataFields.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No workflow data fields yet</p>
          ) : dataFields.map(field => (
            <StateFieldEditor key={field.path} store={store} field={field} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StateFieldEditor({ store, field }: { store: WorkflowStore; field: StateField }) {
  const [path, setPath] = useState(field.path);
  const [defaultValue, setDefaultValue] = useState(formatDefaultValue(field.defaultValue));
  const producer = field.producingSteps[0] ?? '';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 space-y-2">
      <div className="flex items-center gap-1">
        <input
          value={path}
          onChange={event => setPath(event.target.value)}
          onBlur={() => {
            if (path !== field.path) store.updateStateField(field.path, { path });
          }}
          className="flex-1 px-2 py-1 text-[11px] font-mono border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="button"
          onClick={() => store.removeStateField(field.path)}
          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <label>
          <span className="block text-[10px] text-gray-500 mb-0.5">Type</span>
          <select
            value={field.type}
            onChange={event => store.updateStateField(field.path, { type: event.target.value as StateFieldType })}
            className="w-full px-2 py-1 text-[11px] border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {FIELD_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[10px] text-gray-500 mb-0.5">Default</span>
          <input
            value={defaultValue}
            onChange={event => setDefaultValue(event.target.value)}
            onBlur={() => store.updateStateField(field.path, { defaultValue })}
            className="w-full px-2 py-1 text-[11px] border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </label>
      </div>

      <label>
        <span className="block text-[10px] text-gray-500 mb-0.5">Producer</span>
        <select
          value={producer}
          onChange={event => store.updateStateField(field.path, { producingSteps: event.target.value ? [event.target.value] : [] })}
          className="w-full px-2 py-1 text-[11px] border rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">None</option>
          {store.steps.map(step => (
            <option key={step.key} value={step.key}>{step.key}</option>
          ))}
        </select>
      </label>

      <div>
        <span className="block text-[10px] text-gray-500 mb-1">Consumers</span>
        <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
          {store.steps.map(step => {
            const checked = field.consumingSteps.includes(step.key);
            return (
              <label key={step.key} className="flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const consumingSteps = checked
                      ? field.consumingSteps.filter(key => key !== step.key)
                      : [...field.consumingSteps, step.key];
                    store.updateStateField(field.path, { consumingSteps });
                  }}
                  className="w-3 h-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="font-mono truncate">{step.key}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDefaultValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
