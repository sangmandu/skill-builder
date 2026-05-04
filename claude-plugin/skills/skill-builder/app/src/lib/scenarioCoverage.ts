export type ScenarioCoverageKind = 'unit' | 'integration' | 'e2e' | 'manual';
export type ScenarioCoverageStatus = 'implemented' | 'planned' | 'manual';

export interface ScenarioCoverageRule {
  prefix: string;
  kind: ScenarioCoverageKind;
  status: ScenarioCoverageStatus;
  target: string;
}

export interface ScenarioCoverageEntry extends ScenarioCoverageRule {
  id: string;
}

export const SCENARIO_COVERAGE_RULES: ScenarioCoverageRule[] = [
  { prefix: 'NEW', kind: 'e2e', status: 'planned', target: 'skill creation flow' },
  { prefix: 'SKILL', kind: 'integration', status: 'implemented', target: 'thin entrypoint and step renderer' },
  { prefix: 'SCR', kind: 'unit', status: 'implemented', target: 'asset role and overwrite policy validation' },
  { prefix: 'STEP', kind: 'integration', status: 'planned', target: 'registry and step file sync' },
  { prefix: 'TRK', kind: 'integration', status: 'planned', target: 'track editor and execution order' },
  { prefix: 'STATE', kind: 'unit', status: 'implemented', target: 'state schema validation' },
  { prefix: 'AUTO', kind: 'unit', status: 'implemented', target: 'execution mode validation and stop guard' },
  { prefix: 'INT', kind: 'integration', status: 'implemented', target: 'interrupt runtime flow' },
  { prefix: 'BAS', kind: 'manual', status: 'manual', target: 'builder-as-a-skill launcher' },
  { prefix: 'FS', kind: 'integration', status: 'planned', target: 'live filesystem sync' },
  { prefix: 'CHAT', kind: 'manual', status: 'manual', target: 'conversational editing workflow' },
  { prefix: 'EDGE', kind: 'integration', status: 'implemented', target: 'semantic edge persistence' },
  { prefix: 'RUN', kind: 'e2e', status: 'implemented', target: 'generated runtime commands' },
  { prefix: 'VAL', kind: 'unit', status: 'implemented', target: 'validation engine' },
  { prefix: 'E2E', kind: 'e2e', status: 'planned', target: 'end-to-end workflow fixtures' },
];

export function getScenarioCoverage(id: string): ScenarioCoverageEntry | null {
  const prefix = id.split('-')[0];
  const rule = SCENARIO_COVERAGE_RULES.find(item => item.prefix === prefix);
  return rule ? { ...rule, id } : null;
}

export function createScenarioCoverageReport(ids: string[]): ScenarioCoverageEntry[] {
  return ids
    .map(getScenarioCoverage)
    .filter((entry): entry is ScenarioCoverageEntry => entry != null);
}
