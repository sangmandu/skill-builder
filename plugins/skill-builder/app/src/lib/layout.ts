import { MarkerType, type Node, type Edge } from '@xyflow/react';
import type { StepGroup, Track, Step, ValidationIssue } from './schema';

export const GROUP_GAP = 60;
export const GROUP_ROW_GAP = 80;
export const GROUP_PADDING = 20;
export const STEP_W = 150;
export const STEP_H = 60;
export const STEP_GAP = 16;
export const GROUP_HEADER = 40;
const WRAP_WIDTH = 1120;
export const FLOW_GROUP_EDGE_COLOR = 'hsl(216 16% 52%)';

export interface GroupNodeData {
  label: string;
  range: [number, number];
  stepCount: number;
  color: string;
  [key: string]: unknown;
}

export interface StepNodeData {
  step: Step;
  isInterrupt: boolean;
  trackMembership: Record<string, boolean>;
  issues: ValidationIssue[];
  [key: string]: unknown;
}

const GROUP_COLORS: Record<number, string> = {
  0: 'hsl(218 48% 55%)',
  10: 'hsl(264 30% 58%)',
  20: 'hsl(199 44% 48%)',
  30: 'hsl(164 34% 42%)',
  40: 'hsl(40 48% 50%)',
  50: 'hsl(18 38% 52%)',
  60: 'hsl(338 32% 54%)',
  70: 'hsl(190 38% 46%)',
  80: 'hsl(252 30% 56%)',
  90: 'hsl(124 28% 44%)',
  100: 'hsl(292 30% 55%)',
};

const GROUP_LABELS: Record<number, string> = {
  0: 'Setup',
  10: 'Investigate',
  20: 'Ticket & Branch',
  30: 'Plan',
  40: 'Test',
  50: 'Implement',
  60: 'Commit & PR',
  70: 'CI',
  80: 'Review',
  90: 'Complete',
  100: 'Brainstorm',
};

function getGroupColor(decade: number): string {
  return GROUP_COLORS[decade] ?? `hsl(${(decade * 37) % 360} 34% 52%)`;
}

function getGroupLabel(decade: number): string {
  return GROUP_LABELS[decade] ?? `Group ${decade}`;
}

function makeStepNode(
  step: Step,
  groupId: string,
  posX: number,
  tracks: Track[],
  validationIssues: ValidationIssue[],
  allowStepDrag: boolean,
): Node {
  const trackMembership: Record<string, boolean> = {};
  for (const t of tracks) {
    trackMembership[t.name] = t.steps.includes(step.key);
  }
  return {
    id: `step-${step.key}`,
    type: 'stepNode',
    position: { x: posX, y: GROUP_HEADER + GROUP_PADDING },
    parentId: groupId,
    draggable: allowStepDrag,
    extent: 'parent' as const,
    data: { step, isInterrupt: step.isInterrupt, trackMembership, issues: validationIssues.filter(issue => issue.entityKey === step.key) } satisfies StepNodeData,
    style: { width: STEP_W, height: STEP_H },
  };
}

function makeGroupNode(
  groupId: string,
  x: number,
  y: number,
  stepCount: number,
  decade: number,
  label: string,
  color: string,
): Node {
  const groupW = Math.max(
    STEP_W + GROUP_PADDING * 2,
    stepCount * (STEP_W + STEP_GAP) - STEP_GAP + GROUP_PADDING * 2,
  );
  const groupH = STEP_H + GROUP_HEADER + GROUP_PADDING * 2;
  return {
    id: groupId,
    type: 'groupNode',
    position: { x, y },
    draggable: true,
    data: { label, range: [decade, decade + 9] as [number, number], stepCount, color } satisfies GroupNodeData,
    style: { width: groupW, height: groupH },
  };
}

function groupWidth(stepCount: number): number {
  return Math.max(
    STEP_W + GROUP_PADDING * 2,
    stepCount * (STEP_W + STEP_GAP) - STEP_GAP + GROUP_PADDING * 2,
  );
}

function groupHeight(): number {
  return STEP_H + GROUP_HEADER + GROUP_PADDING * 2;
}

function placeGroup(
  cursor: { x: number; y: number },
  stepCount: number,
): { x: number; y: number } {
  const width = groupWidth(stepCount);
  if (cursor.x > 0 && cursor.x + width > WRAP_WIDTH) {
    cursor.x = 0;
    cursor.y += groupHeight() + GROUP_ROW_GAP;
  }

  const position = { x: cursor.x, y: cursor.y };
  cursor.x += width + GROUP_GAP;
  return position;
}

export function buildFlowLayout(
  groups: StepGroup[],
  tracks: Track[],
  activeTrack: string | null,
  validationIssues: ValidationIssue[] = [],
): { nodes: Node[]; edges: Edge[] } {
  if (activeTrack) {
    return buildTrackOrderLayout(groups, tracks, activeTrack, validationIssues);
  }
  return buildDecadeLayout(groups, tracks, validationIssues);
}

function buildDecadeLayout(
  groups: StepGroup[],
  tracks: Track[],
  validationIssues: ValidationIssue[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const cursor = { x: 0, y: 0 };

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    const decade = group.range[0];
    const color = getGroupColor(decade);
    const groupId = `group-${decade}`;
    const position = placeGroup(cursor, group.steps.length);

    nodes.push(makeGroupNode(groupId, position.x, position.y, group.steps.length, decade, group.label, color));

    for (let si = 0; si < group.steps.length; si++) {
      nodes.push(makeStepNode(
        group.steps[si],
        groupId,
        GROUP_PADDING + si * (STEP_W + STEP_GAP),
        tracks,
        validationIssues,
        false,
      ));
    }

    if (gi > 0) {
      const prevDecade = groups[gi - 1].range[0];
      edges.push({
        id: `edge-g${prevDecade}-g${decade}`,
        source: `group-${prevDecade}`,
        target: groupId,
        type: 'smoothstep',
        style: { stroke: FLOW_GROUP_EDGE_COLOR, strokeWidth: 2.25, opacity: 0.72 },
        markerEnd: { type: MarkerType.ArrowClosed, color: FLOW_GROUP_EDGE_COLOR, width: 16, height: 16 },
      });
    }
  }

  return { nodes, edges };
}

function buildTrackOrderLayout(
  groups: StepGroup[],
  tracks: Track[],
  activeTrack: string,
  validationIssues: ValidationIssue[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const track = tracks.find(t => t.name === activeTrack);
  if (!track) return { nodes, edges };

  const allSteps = new Map<string, Step>();
  const groupLabels = new Map<number, string>();
  for (const g of groups) {
    groupLabels.set(g.range[0], g.label);
    for (const s of g.steps) {
      allSteps.set(s.key, s);
    }
  }

  const orderedSteps = track.steps
    .map(key => allSteps.get(key))
    .filter((s): s is Step => s != null);

  if (orderedSteps.length === 0) return { nodes, edges };

  const sequentialGroups: { decade: number; label: string; color: string; steps: Step[] }[] = [];
  for (const step of orderedSteps) {
    const decade = Math.floor(step.number / 10) * 10;
    const last = sequentialGroups[sequentialGroups.length - 1];
    if (last && last.decade === decade) {
      last.steps.push(step);
    } else {
      sequentialGroups.push({
        decade,
        label: groupLabels.get(decade) ?? getGroupLabel(decade),
        color: getGroupColor(decade),
        steps: [step],
      });
    }
  }

  const cursor = { x: 0, y: 0 };

  for (let gi = 0; gi < sequentialGroups.length; gi++) {
    const sg = sequentialGroups[gi];
    const groupId = `group-${gi}-${sg.decade}`;
    const position = placeGroup(cursor, sg.steps.length);

    nodes.push(makeGroupNode(groupId, position.x, position.y, sg.steps.length, sg.decade, sg.label, sg.color));

    for (let si = 0; si < sg.steps.length; si++) {
      nodes.push(makeStepNode(sg.steps[si], groupId, GROUP_PADDING + si * (STEP_W + STEP_GAP), tracks, validationIssues, true));
    }

    if (gi > 0) {
      const prevGroupId = `group-${gi - 1}-${sequentialGroups[gi - 1].decade}`;
      edges.push({
        id: `edge-${prevGroupId}-${groupId}`,
        source: prevGroupId,
        target: groupId,
        type: 'smoothstep',
        style: { stroke: FLOW_GROUP_EDGE_COLOR, strokeWidth: 2.25, opacity: 0.72 },
        markerEnd: { type: MarkerType.ArrowClosed, color: FLOW_GROUP_EDGE_COLOR, width: 16, height: 16 },
      });
    }
  }

  return { nodes, edges };
}
