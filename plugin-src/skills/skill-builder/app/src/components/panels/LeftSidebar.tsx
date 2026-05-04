import { useState } from 'react';
import { Clock3, Layers, Puzzle, ShieldCheck, UserRound } from 'lucide-react';
import { HelperPanel } from './HelperPanel';
import { StepListPanel } from './StepListPanel';
import type { WorkflowStore } from '@/lib/store';

type Tab = 'steps' | 'helpers';

interface LeftSidebarProps {
  store: WorkflowStore;
  activeTrack: string | null;
  onTrackSelect: (name: string) => void;
  onStepSelect: (key: string) => void;
  selectedStep: string | null;
}

const tabs: { id: Tab; label: string; icon: typeof Layers }[] = [
  { id: 'steps', label: 'Steps', icon: Layers },
  { id: 'helpers', label: 'Helpers', icon: Puzzle },
];

const executionModes = [
  {
    label: 'Solo',
    detail: 'Agent continues this step without normal user input.',
    icon: ShieldCheck,
    className: 'text-emerald-300',
  },
  {
    label: 'User',
    detail: 'This step intentionally reports to or asks the user.',
    icon: UserRound,
    className: 'text-amber-300',
  },
  {
    label: 'Wait',
    detail: 'Agent may wait on background work before continuing.',
    icon: Clock3,
    className: 'text-cyan-300',
  },
];

export function LeftSidebar({ store, activeTrack, onTrackSelect, onStepSelect, selectedStep }: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('steps');

  return (
    <div className="w-72 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/70 flex flex-col h-full shrink-0">
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-violet-400 text-violet-600 dark:text-violet-300'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'steps' && (
          <StepListPanel
            store={store}
            activeTrack={activeTrack}
            onTrackSelect={onTrackSelect}
            onStepSelect={onStepSelect}
            selectedStep={selectedStep}
          />
        )}
        {activeTab === 'helpers' && (
          <HelperPanel store={store} />
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-slate-700 px-3 py-2">
        <div className="flex flex-wrap items-center justify-start gap-1.5 text-[10px] text-slate-400">
          {executionModes.map(mode => {
            const Icon = mode.icon;
            return (
              <span
                key={mode.label}
                tabIndex={0}
                title={mode.detail}
                className="group relative inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950/45 px-2 outline-none transition-colors hover:border-slate-500 hover:text-slate-200 focus:border-slate-500 focus:text-slate-200"
              >
                <Icon className={`h-3.5 w-3.5 ${mode.className}`} />
                <span>{mode.label}</span>
                <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  {mode.detail}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
