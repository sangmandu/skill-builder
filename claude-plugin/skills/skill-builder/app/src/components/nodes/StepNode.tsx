import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { CircleAlert, Clock3, ShieldCheck, UserRound } from 'lucide-react';
import type { StepNodeData } from '@/lib/layout';
import { getStepExecutionMode } from '@/lib/schema';

function StepNodeInner({ data }: NodeProps) {
  const { step, issues } = data as unknown as StepNodeData;
  const hasError = issues.some(issue => issue.severity === 'error');
  const hasWarning = issues.length > 0 && !hasError;
  const executionMode = getStepExecutionMode(step);
  const ModeIcon = executionMode === 'background_wait' ? Clock3 : executionMode === 'user_involved' ? UserRound : ShieldCheck;
  const modeColor = executionMode === 'background_wait' ? 'text-cyan-300' : executionMode === 'user_involved' ? 'text-amber-300' : 'text-emerald-300';
  const modeBorder = executionMode === 'background_wait' ? 'border-l-cyan-400' : executionMode === 'user_involved' ? 'border-l-amber-400' : 'border-l-emerald-400';

  return (
    <div
      className={`
        rounded-lg border w-full h-full cursor-pointer
        border-l-[3px] bg-slate-900/95 border-slate-700
        transition-all hover:shadow-md hover:shadow-slate-950/30 hover:scale-[1.02]
        ${modeBorder}
      `}
    >
      <div className="px-2.5 py-1.5 h-full flex flex-col justify-center">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-mono text-gray-400 tabular-nums">
            {String(step.number).padStart(3, '0')}
          </span>
          <span className="flex items-center gap-1">
            {hasError || hasWarning ? (
              <CircleAlert className={`w-3 h-3 ${hasError ? 'text-red-400' : 'text-amber-300'}`} />
            ) : null}
            <ModeIcon className={`w-3 h-3 ${modeColor}`} />
          </span>
        </div>
        <div className="text-[11px] font-semibold truncate leading-tight text-gray-800 dark:text-gray-100">
          {step.title || step.key}
        </div>
        <div className="text-[9px] text-gray-400 font-mono truncate mt-0.5">
          {step.key}
        </div>
      </div>
    </div>
  );
}

export const StepNode = memo(StepNodeInner);
