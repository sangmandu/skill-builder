import { CheckCircle2, CircleAlert, PlayCircle, RefreshCw, TerminalSquare } from 'lucide-react';
import type { RuntimeProfileId } from '@/lib/schema';
import type { WorkflowStore } from '@/lib/store';

interface RuntimePanelProps {
  store: WorkflowStore;
}

const PROFILE_LABELS: Record<RuntimeProfileId, string> = {
  basic_stateful: 'Basic Stateful',
  wf_like: 'WF-like',
  custom: 'Custom',
};

export function RuntimePanel({ store }: RuntimePanelProps) {
  const runtime = store.runtimeProfile;
  const projectAssetPaths = new Set(store.assets.map(asset => asset.path));
  const commands = Object.entries(runtime.commands).filter((entry): entry is [string, string] => Boolean(entry[1]));
  const replaceableRuntime = runtime.assets.filter(asset => asset.overwritePolicy === 'replace_on_upgrade');
  const preservedUserAssets = store.assets.filter(asset => asset.role === 'user_script' || asset.overwritePolicy === 'preserve');
  const runtimeState = store.runtimeState;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Runtime</h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Runtime profiles define state commands and skill-bundled assets.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Profile</span>
        <select
          value={runtime.id}
          onChange={event => store.updateRuntimeProfileId(event.target.value as RuntimeProfileId)}
          className="w-full px-2 py-1.5 text-xs border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {Object.entries(PROFILE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Version" value={runtime.version} />
        <Metric label="Hooks" value={runtime.hookPolicy.stopGuardEnabled ? 'guarded' : 'manual'} />
      </div>

      <button
        type="button"
        disabled={!store.rootDir || store.syncState.status === 'syncing'}
        onClick={() => void store.syncNow()}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600"
        title={store.rootDir || 'Export or import a project folder before generating runtime files'}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${store.syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
        Generate Runtime
      </button>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-500">
            <PlayCircle className="w-3 h-3" /> Runtime Status
          </div>
          <button
            type="button"
            disabled={!store.rootDir}
            onClick={() => void store.loadRuntimeState()}
            className="px-2 py-1 text-[10px] border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            Load
          </button>
        </div>
        <div className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 space-y-1">
          <PreviewLine label="Status" value={runtimeState.status} />
          <PreviewLine label="Track" value={runtimeState.track || '-'} />
          <PreviewLine label="Current" value={runtimeState.currentStep || '-'} />
          <PreviewLine label="Interrupted" value={runtimeState.interrupted ? 'yes' : 'no'} />
          <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
            {runtimeState.nextAction || 'No runtime state loaded.'}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-purple-500 mb-1.5">
          <TerminalSquare className="w-3 h-3" /> Commands
        </div>
        <div className="space-y-1">
          {commands.map(([name, command]) => (
            <div key={name} className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5">
              <div className="text-[10px] uppercase text-gray-500">{name}</div>
              <div className="font-mono text-[11px] truncate" title={command}>{command}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Upgrade Preview</div>
          <div className="text-[10px] text-gray-400">{replaceableRuntime.length} replaceable</div>
        </div>
        <div className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5 space-y-1">
          <PreviewLine label="Runtime replace" value={replaceableRuntime.length} />
          <PreviewLine label="User preserved" value={preservedUserAssets.length} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Required Assets</div>
          <div className="text-[10px] text-gray-400">{runtime.assets.filter(asset => asset.required).length} required</div>
        </div>
        <div className="space-y-1">
          {runtime.assets.map(asset => {
            const exists = projectAssetPaths.has(asset.path);
            return (
              <div key={asset.path} className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  {exists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <CircleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="font-mono text-[11px] truncate" title={asset.path}>{asset.path}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{asset.required ? 'required' : 'optional'}</span>
                </div>
                <div className="mt-1 flex gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">{asset.owner}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">{asset.overwritePolicy}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">{exists ? 'present' : 'missing'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5">
      <div className="text-[10px] uppercase text-gray-500">{label}</div>
      <div className="text-xs font-medium truncate">{value}</div>
    </div>
  );
}
