import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LayoutGrid, Lock, Unlock } from 'lucide-react';
import { GroupNode } from './nodes/GroupNode';
import { StepNode } from './nodes/StepNode';
import { FLOW_GROUP_EDGE_COLOR, GROUP_HEADER, GROUP_PADDING, STEP_GAP, STEP_W, buildFlowLayout } from '@/lib/layout';
import { groupSteps } from '@/lib/schema';
import type { WorkflowEdgeType } from '@/lib/schema';
import type { WorkflowStore } from '@/lib/store';

const nodeTypes = {
  groupNode: GroupNode,
  stepNode: StepNode,
};

const EDGE_CHOICES: Array<{ type: WorkflowEdgeType; label: string; detail: string }> = [
  { type: 'visual_note', label: 'Visual note', detail: 'Keep execution order unchanged.' },
  { type: 'track_order', label: 'Track reorder', detail: 'Move the source group before the target group.' },
  { type: 'dependency', label: 'Dependency', detail: 'Record a dependency edge.' },
  { type: 'branch', label: 'Branch', detail: 'Record a branch edge.' },
  { type: 'validation_constraint', label: 'Validation constraint', detail: 'Record a validation rule edge.' },
];

interface PendingSemanticEdge {
  connection: Connection;
  sourceRef: string;
  targetRef: string;
  sourceStepKeys: string[];
  targetStepKeys: string[];
}

interface FlowCanvasProps {
  store: WorkflowStore;
  activeTrack: string | null;
  onStepSelect: (key: string) => void;
}

export function FlowCanvas({ store, activeTrack, onStepSelect }: FlowCanvasProps) {
  const { steps, tracks } = store;
  const { fitView } = useReactFlow();
  const skipNextLayoutRef = useRef(false);
  const groupPositionsRef = useRef(new Map<string, { x: number; y: number }>());
  const [pendingEdge, setPendingEdge] = useState<PendingSemanticEdge | null>(null);
  const [layoutLocked, setLayoutLocked] = useState(false);

  const groups = useMemo(() => groupSteps(steps), [steps]);

  const layout = useMemo(
    () => buildFlowLayout(groups, tracks, activeTrack, store.validation.issues),
    [groups, tracks, activeTrack, store.validation.issues],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (skipNextLayoutRef.current) {
      skipNextLayoutRef.current = false;
      return;
    }
    const positionedNodes = applySavedGroupPositions(layout.nodes, groupPositionsRef.current);
    setNodes(positionedNodes);
    setEdges(applySemanticEdges(layout.edges, positionedNodes, store.graphEdges));
  }, [layout, setNodes, setEdges, store.graphEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('step-')) {
        onStepSelect(node.id.replace('step-', ''));
      }
    },
    [onStepSelect],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      if (draggedNode.type === 'groupNode') {
        groupPositionsRef.current.set(draggedNode.id, draggedNode.position);
        setNodes(prev => snapGroupChildren(prev, draggedNode.id));
        return;
      }

      if (!draggedNode.id.startsWith('step-') || !activeTrack || !draggedNode.parentId) {
        return;
      }
      const parentId = draggedNode.parentId;

      const track = tracks.find(t => t.name === activeTrack);
      if (!track) {
        return;
      }

      const latestNodes = nodes.map(node => node.id === draggedNode.id ? draggedNode : node);

      const sameGroupSteps = latestNodes
        .filter(n =>
          n.type === 'stepNode' &&
          n.parentId === parentId &&
          track.steps.includes(n.id.replace('step-', '')),
        );

      const sorted = [...sameGroupSteps].sort((a, b) => stepSortPosition(a) - stepSortPosition(b));
      const newGroupOrder = sorted.map(n => n.id.replace('step-', ''));
      const sortedNodeIds = sorted.map(node => node.id);

      const oldGroupOrder = track.steps.filter(k =>
        sameGroupSteps.some(n => n.id === `step-${k}`),
      );

      if (newGroupOrder.join(',') !== oldGroupOrder.join(',')) {
        const newTrackSteps = [...track.steps];
        const firstIdx = newTrackSteps.indexOf(oldGroupOrder[0]);
        for (let i = 0; i < newGroupOrder.length; i++) {
          newTrackSteps[firstIdx + i] = newGroupOrder[i];
        }
        store.updateTrack(activeTrack, { steps: newTrackSteps });
      }
      setNodes(prev => snapGroupChildren(prev, parentId, sortedNodeIds));
    },
    [activeTrack, tracks, nodes, setNodes, store],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const edge: Edge = {
        id: `manual-${connection.source}-${connection.sourceHandle ?? 'source'}-${connection.target}-${connection.targetHandle ?? 'target'}`,
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
        type: 'smoothstep',
        animated: true,
        style: { stroke: FLOW_GROUP_EDGE_COLOR, strokeWidth: 2 },
      };

      if (isGroupNodeId(connection.source) && isGroupNodeId(connection.target)) {
        const sourceNode = nodes.find(node => node.id === connection.source);
        const targetNode = nodes.find(node => node.id === connection.target);
        const sourceRef = getSemanticGroupRef(sourceNode);
        const targetRef = getSemanticGroupRef(targetNode);
        if (!sourceRef || !targetRef) return;
        setPendingEdge({
          connection,
          sourceRef,
          targetRef,
          sourceStepKeys: getGroupStepKeys(nodes, connection.source),
          targetStepKeys: getGroupStepKeys(nodes, connection.target),
        });
        return;
      }

      setEdges(prev => addEdge<Edge>(edge, prev));
    },
    [nodes, setEdges],
  );

  const saveSemanticEdge = useCallback((type: WorkflowEdgeType) => {
    if (!pendingEdge) return;
    const edgeId = `semantic-${type}-${pendingEdge.sourceRef}-${pendingEdge.targetRef}`;
    store.addGraphEdge({
      id: edgeId,
      source: pendingEdge.sourceRef,
      target: pendingEdge.targetRef,
      type,
      label: EDGE_CHOICES.find(choice => choice.type === type)?.label,
    });

    if (type === 'track_order') {
      const trackName = activeTrack ?? tracks[0]?.name;
      const track = tracks.find(item => item.name === trackName);
      if (track) {
        const nextSteps = reorderGroupSegment(track.steps, pendingEdge.sourceStepKeys, pendingEdge.targetStepKeys);
        store.updateTrack(track.name, { steps: nextSteps });
      }
    }

    setPendingEdge(null);
  }, [activeTrack, pendingEdge, store, tracks]);

  const alignGroups = useCallback(() => {
    groupPositionsRef.current.clear();
    setNodes(layout.nodes);
    setEdges(applySemanticEdges(layout.edges, layout.nodes, store.graphEdges));
    window.requestAnimationFrame(() => {
      void fitView({ padding: 0.3, duration: 180 });
    });
  }, [fitView, layout, setEdges, setNodes, store.graphEdges]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodesDraggable={!layoutLocked}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        connectOnClick={false}
        style={{ backgroundColor: 'hsl(220 18% 6%)' }}
      >
        <Background gap={24} size={1} color="hsl(220 12% 22%)" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          style={{ backgroundColor: 'hsl(220 16% 9%)' }}
          maskColor="rgba(148, 163, 184, 0.14)"
          nodeColor={(node: Node) => {
            if (node.type === 'groupNode') {
              return (node.data as Record<string, unknown>).color as string ?? '#555';
            }
            return 'hsl(220 10% 38%)';
          }}
        />
      </ReactFlow>
      <div className="absolute bottom-4 left-16 z-20 flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/90 p-1 shadow-lg">
        <button
          type="button"
          onClick={() => setLayoutLocked(value => !value)}
          className={`p-1.5 rounded text-slate-300 hover:bg-slate-800 ${layoutLocked ? 'text-violet-300 bg-violet-950/60' : ''}`}
          title={layoutLocked ? 'Unlock group movement' : 'Lock group movement'}
        >
          {layoutLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={alignGroups}
          className="p-1.5 rounded text-slate-300 hover:bg-slate-800"
          title="Align groups"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
      {pendingEdge ? (
        <div className="absolute top-4 right-4 z-20 w-64 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-950">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Edge Meaning</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {pendingEdge.sourceRef} to {pendingEdge.targetRef}
            </div>
          </div>
          <div className="p-2 space-y-1">
            {EDGE_CHOICES.map(choice => (
              <button
                key={choice.type}
                type="button"
                onClick={() => saveSemanticEdge(choice.type)}
                className="w-full text-left px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/45"
              >
                <div className="text-[11px] font-medium text-gray-800 dark:text-gray-100">{choice.label}</div>
                <div className="text-[10px] text-gray-500">{choice.detail}</div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setPendingEdge(null)}
              className="w-full px-2 py-1.5 text-xs border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function stepSortPosition(node: Node): number {
  const width = typeof node.style?.width === 'number' ? node.style.width : 150;
  return node.position.x + width / 2;
}

function applySavedGroupPositions(
  nodes: Node[],
  savedPositions: Map<string, { x: number; y: number }>,
): Node[] {
  return nodes.map(node => {
    if (node.type !== 'groupNode') return node;
    const saved = savedPositions.get(node.id);
    return saved ? { ...node, position: saved } : node;
  });
}

function snapGroupChildren(nodes: Node[], groupId: string, orderedNodeIds?: string[]): Node[] {
  const children = nodes.filter(node => node.type === 'stepNode' && node.parentId === groupId);
  const order = orderedNodeIds ?? children
    .slice()
    .sort((a, b) => stepSortPosition(a) - stepSortPosition(b))
    .map(node => node.id);
  const orderMap = new Map(order.map((id, index) => [id, index]));

  return nodes.map(node => {
    if (node.type !== 'stepNode' || node.parentId !== groupId) return node;
    const index = orderMap.get(node.id);
    if (index == null) return node;
    return {
      ...node,
      position: {
        x: GROUP_PADDING + index * (STEP_W + STEP_GAP),
        y: GROUP_HEADER + GROUP_PADDING,
      },
    };
  });
}

function isGroupNodeId(id: string): boolean {
  return id.startsWith('group-');
}

function applySemanticEdges(
  baseEdges: Edge[],
  nodes: Node[],
  graphEdges: WorkflowStore['graphEdges'],
): Edge[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  const activeOverrides = graphEdges
    .map(edge => workflowEdgeToFlowEdge(edge, nodes))
    .filter((edge): edge is Edge => {
      if (!edge) return false;
      return nodeIds.has(edge.source) && nodeIds.has(edge.target);
    });

  const overriddenSources = new Set(activeOverrides.map(edge => edge.source));
  const overriddenTargets = new Set(activeOverrides.map(edge => edge.target));

  return [
    ...baseEdges.filter(edge =>
      !overriddenSources.has(edge.source) &&
      !overriddenTargets.has(edge.target) &&
      !edge.id.startsWith('manual-'),
    ),
    ...activeOverrides,
  ];
}

function workflowEdgeToFlowEdge(edge: WorkflowStore['graphEdges'][number], nodes: Node[]): Edge | null {
  const source = resolveSemanticNode(edge.source, nodes);
  const target = resolveSemanticNode(edge.target, nodes);
  if (!source || !target) return null;
  const color = semanticEdgeColor(edge.type);
  return {
    id: edge.id,
    source,
    target,
    type: 'smoothstep',
    label: edge.label,
    animated: edge.type === 'track_order' || edge.type === 'branch',
    style: { stroke: color, strokeWidth: 2.5, strokeDasharray: edge.type === 'visual_note' ? '6 5' : undefined },
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
  };
}

function resolveSemanticNode(ref: string, nodes: Node[]): string | null {
  if (ref.startsWith('step:')) {
    const nodeId = `step-${ref.slice('step:'.length)}`;
    return nodes.some(node => node.id === nodeId) ? nodeId : null;
  }
  if (ref.startsWith('group:')) {
    const decade = Number(ref.slice('group:'.length));
    const node = nodes.find(item => {
      if (item.type !== 'groupNode') return false;
      const range = (item.data as { range?: [number, number] }).range;
      return range?.[0] === decade;
    });
    return node?.id ?? null;
  }
  return nodes.some(node => node.id === ref) ? ref : null;
}

function semanticEdgeColor(type: WorkflowEdgeType): string {
  if (type === 'track_order') return FLOW_GROUP_EDGE_COLOR;
  if (type === 'dependency') return 'hsl(199 42% 54%)';
  if (type === 'branch') return 'hsl(38 46% 56%)';
  if (type === 'validation_constraint') return 'hsl(0 58% 58%)';
  return 'hsl(215 16% 62%)';
}

function getSemanticGroupRef(node: Node | undefined): string | null {
  if (!node || node.type !== 'groupNode') return null;
  const range = (node.data as { range?: [number, number] }).range;
  return range ? `group:${range[0]}` : null;
}

function getGroupStepKeys(nodes: Node[], groupId: string): string[] {
  return nodes
    .filter(node => node.type === 'stepNode' && node.parentId === groupId)
    .sort((a, b) => stepSortPosition(a) - stepSortPosition(b))
    .map(node => node.id.replace('step-', ''));
}

function reorderGroupSegment(trackSteps: string[], sourceStepKeys: string[], targetStepKeys: string[]): string[] {
  const sourceSet = new Set(sourceStepKeys);
  const targetSet = new Set(targetStepKeys);
  const remaining = trackSteps.filter(stepKey => !sourceSet.has(stepKey));
  const targetIndex = remaining.findIndex(stepKey => targetSet.has(stepKey));
  if (targetIndex < 0) return trackSteps;
  const sourceSegment = trackSteps.filter(stepKey => sourceSet.has(stepKey));
  return [
    ...remaining.slice(0, targetIndex),
    ...sourceSegment,
    ...remaining.slice(targetIndex),
  ];
}
