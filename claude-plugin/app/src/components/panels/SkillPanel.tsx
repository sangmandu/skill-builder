import { FileText, Play } from 'lucide-react';
import type { WorkflowStore } from '@/lib/store';

interface SkillPanelProps {
  store: WorkflowStore;
}

export function SkillPanel({ store }: SkillPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skill Entrypoint</h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Thin SKILL.md metadata and startup command.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Name</span>
        <input
          value={store.name}
          onChange={event => store.updateEntrypoint({ name: event.target.value })}
          className="w-full px-2 py-1.5 text-xs border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Trigger</span>
        <input
          value={store.trigger}
          onChange={event => store.updateEntrypoint({ trigger: event.target.value })}
          className="w-full px-2 py-1.5 text-xs border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Description</span>
        <textarea
          value={store.description}
          onChange={event => store.updateEntrypoint({ description: event.target.value })}
          className="w-full h-20 px-2 py-1.5 text-xs border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Start Command</span>
        <div className="relative">
          <Play className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-400" />
          <input
            value={store.startCommand}
            onChange={event => store.updateEntrypoint({ startCommand: event.target.value })}
            className="w-full pl-7 pr-2 py-1.5 text-xs font-mono border rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </label>

      <section>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-purple-500 mb-1.5">
          <FileText className="w-3 h-3" /> Generated SKILL.md
        </div>
        <textarea
          value={store.skillMd}
          readOnly
          className="w-full h-56 px-2 py-2 text-[10px] font-mono border rounded-lg bg-gray-100 dark:bg-gray-950/60 text-gray-600 dark:text-gray-300 resize-none"
        />
      </section>
    </div>
  );
}
