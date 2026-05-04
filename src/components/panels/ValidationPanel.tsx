import { CircleAlert, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { SCENARIO_COVERAGE_RULES } from '@/lib/scenarioCoverage';
import type { ValidationIssue } from '@/lib/schema';
import type { WorkflowStore } from '@/lib/store';

interface ValidationPanelProps {
  store: WorkflowStore;
}

const CATEGORY_LABELS: Record<ValidationIssue['category'], string> = {
  structure: 'Structure',
  runtime: 'Runtime',
  ownership: 'Ownership',
  execution: 'Execution',
  sync: 'Sync',
  reference: 'References',
  edge: 'Edges',
  coverage: 'Coverage',
};

export function ValidationPanel({ store }: ValidationPanelProps) {
  const summary = store.validation.summary;
  const issues = store.validation.issues;
  const grouped = groupIssues(issues);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Validation</h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Structural, runtime, policy, ownership, and edge checks.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="Errors" value={summary?.errors ?? 0} tone="error" />
        <Metric label="Warnings" value={summary?.warnings ?? 0} tone="warning" />
        <Metric label="Runnable" value={summary?.runnable ? 'yes' : 'no'} tone={summary?.runnable ? 'ok' : 'error'} />
      </div>

      {issues.length === 0 ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
          No validation issues.
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map(group => (
            <section key={group.category}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                {CATEGORY_LABELS[group.category]}
              </div>
              <div className="space-y-1">
                {group.issues.map(issue => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Scenario Coverage</div>
        <div className="space-y-1">
          {SCENARIO_COVERAGE_RULES.map(rule => (
            <div key={rule.prefix} className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px]">{rule.prefix}-*</span>
                <span className="text-[10px] text-gray-400">{rule.kind}</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{rule.target}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const Icon = issue.severity === 'error' ? ShieldAlert : issue.severity === 'warning' ? CircleAlert : Info;
  const color = issue.severity === 'error'
    ? 'text-red-600 dark:text-red-300'
    : issue.severity === 'warning'
      ? 'text-amber-600 dark:text-amber-300'
      : 'text-sky-600 dark:text-sky-300';
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1.5">
      <div className="flex items-start gap-1.5">
        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
        <div className="min-w-0">
          <div className="text-[11px] text-gray-800 dark:text-gray-100">{issue.message}</div>
          <div className="text-[10px] text-gray-400 font-mono truncate">
            {issue.path || issue.entityKey || issue.id}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone: 'ok' | 'warning' | 'error' }) {
  const className = tone === 'ok'
    ? 'border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300'
    : tone === 'warning'
      ? 'border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-300'
      : 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-300';
  return (
    <div className={`rounded-md border px-2 py-1.5 ${className}`}>
      <div className="text-[10px] uppercase">{label}</div>
      <div className="text-xs font-semibold">{value}</div>
    </div>
  );
}

function groupIssues(issues: ValidationIssue[]): Array<{ category: ValidationIssue['category']; issues: ValidationIssue[] }> {
  const order: ValidationIssue['category'][] = ['structure', 'reference', 'runtime', 'ownership', 'execution', 'edge', 'sync', 'coverage'];
  return order
    .map(category => ({ category, issues: issues.filter(issue => issue.category === category) }))
    .filter(group => group.issues.length > 0);
}
