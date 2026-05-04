import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { GroupNodeData } from '@/lib/layout';

function GroupNodeInner({ data }: NodeProps) {
  const { label, stepCount, color } = data as unknown as GroupNodeData;

  return (
    <div
      className="rounded-lg border w-full h-full relative overflow-hidden"
      style={{
        borderColor: color,
        background: 'rgba(15, 23, 42, 0.62)',
        boxShadow: '0 14px 32px rgba(2, 6, 23, 0.22)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 text-white text-xs font-semibold"
        style={{ background: color }}
      >
        <span>{label}</span>
        <span className="rounded bg-black/15 px-1.5 py-0.5 text-[10px] tabular-nums opacity-80">{stepCount}</span>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !rounded-full !border-2 !border-white/50"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !rounded-full !border-2 !border-white/50"
        style={{ background: color }}
      />
    </div>
  );
}

export const GroupNode = memo(GroupNodeInner);
