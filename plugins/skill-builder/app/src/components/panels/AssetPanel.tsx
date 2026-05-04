import { useMemo, useState } from 'react';
import { FileCode2, FileText, LockKeyhole, Package, ScrollText, SlidersHorizontal, Wrench } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';
import type { AssetRole, SkillAsset } from '@/lib/schema';

interface AssetPanelProps {
  store: WorkflowStore;
}

const ROLE_OPTIONS: Array<{ role: AssetRole; label: string; icon: typeof Package; color: string }> = [
  { role: 'platform_runtime', label: 'Platform Runtime', icon: LockKeyhole, color: 'text-rose-500' },
  { role: 'workflow_utility', label: 'Workflow Utility', icon: Wrench, color: 'text-sky-500' },
  { role: 'user_script', label: 'User Script', icon: FileCode2, color: 'text-emerald-500' },
  { role: 'workflow_content', label: 'Workflow Content', icon: ScrollText, color: 'text-violet-500' },
  { role: 'docs', label: 'Docs', icon: FileText, color: 'text-amber-500' },
  { role: 'config_template', label: 'Config Template', icon: SlidersHorizontal, color: 'text-gray-500' },
];

const ROLE_LABELS = new Map(ROLE_OPTIONS.map(option => [option.role, option.label]));

export function AssetPanel({ store }: AssetPanelProps) {
  const [activeRole, setActiveRole] = useState<AssetRole | 'all'>('all');
  const assets = store.assets;

  const counts = useMemo(() => {
    const result = new Map<AssetRole, number>();
    for (const option of ROLE_OPTIONS) result.set(option.role, 0);
    for (const asset of assets) {
      result.set(asset.role, (result.get(asset.role) ?? 0) + 1);
    }
    return result;
  }, [assets]);

  const visibleAssets = activeRole === 'all'
    ? assets
    : assets.filter(asset => asset.role === activeRole);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assets</h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Roles control runtime ownership and overwrite behavior.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveRole('all')}
          className={`px-2 py-1.5 text-left rounded-md border text-[10px] ${
            activeRole === 'all'
              ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <span className="font-medium">All</span>
          <span className="float-right tabular-nums text-gray-400">{assets.length}</span>
        </button>
        {ROLE_OPTIONS.map(option => {
          const Icon = option.icon;
          const count = counts.get(option.role) ?? 0;
          return (
            <button
              key={option.role}
              type="button"
              onClick={() => setActiveRole(option.role)}
              className={`px-2 py-1.5 text-left rounded-md border text-[10px] ${
                activeRole === option.role
                  ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center gap-1 min-w-0">
                <Icon className={`w-3 h-3 shrink-0 ${option.color}`} />
                <span className="truncate">{option.label}</span>
                <span className="ml-auto tabular-nums text-gray-400">{count}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        {visibleAssets.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No assets found</p>
        ) : visibleAssets.map(asset => (
          <AssetItem
            key={asset.path}
            asset={asset}
            onRoleChange={(role) => store.updateAsset(asset.path, { role })}
          />
        ))}
      </div>
    </div>
  );
}

function AssetItem({
  asset,
  onRoleChange,
}: {
  asset: SkillAsset;
  onRoleChange: (role: AssetRole) => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md px-2 py-2 bg-white/50 dark:bg-gray-900/50">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-mono truncate" title={asset.path}>{asset.path}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">
              {asset.owner}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">
              {asset.overwritePolicy}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500">
              {asset.roleSource}
            </span>
            {asset.hash && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 font-mono" title={asset.hash}>
                {asset.hash.slice(0, 8)}
              </span>
            )}
          </div>
        </div>
      </div>
      <select
        value={asset.role}
        onChange={event => onRoleChange(event.target.value as AssetRole)}
        className="mt-2 w-full px-2 py-1 text-[11px] border border-gray-200 dark:border-gray-700 rounded bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
        aria-label={`Role for ${asset.path}`}
      >
        {ROLE_OPTIONS.map(option => (
          <option key={option.role} value={option.role}>
            {ROLE_LABELS.get(option.role)}
          </option>
        ))}
      </select>
    </div>
  );
}
