import { Router } from 'express';
import { inferSkillAsset } from '../../lib/schema.js';

export const presetRouter = Router();

function workflowUtility(path: string, description: string) {
  return {
    ...inferSkillAsset(path, description),
    role: 'workflow_utility' as const,
    owner: 'template' as const,
    generated: false,
    overwritePolicy: 'preserve' as const,
    roleSource: 'explicit' as const,
    description,
  };
}

export const PRESETS = [
  {
    id: 'plan-implement-test',
    name: 'Plan → Implement → Test',
    description: 'Basic development flow: plan, implement, test, commit',
    config: {
      steps: [
        { key: 'SETUP', number: 1, filename: '001-setup.md', title: 'Setup', content: '# Step 001: SETUP\n\nVerify environment and dependencies.\n\n## Checklist\n\n- [ ] Check required tools are installed\n- [ ] Verify project configuration\n', isInterrupt: false, helperRefs: [] },
        { key: 'PLAN', number: 30, filename: '030-plan.md', title: 'Plan', content: '# Step 030: PLAN\n\nCreate implementation plan.\n\n## Checklist\n\n- [ ] Analyze requirements\n- [ ] Write `.workflow/plan.md`\n- [ ] Do NOT wait for user approval\n', isInterrupt: false, helperRefs: ['state_transition'] },
        { key: 'EXPLAIN_PLAN', number: 33, filename: '033-explain-plan.md', title: 'Explain Plan', content: '# Step 033: EXPLAIN_PLAN\n\nPresent the plan to the user for feedback.\n\n## Checklist\n\n- [ ] Summarize the plan\n- [ ] Ask for user confirmation\n', isInterrupt: true, helperRefs: ['state_transition'] },
        { key: 'IMPLEMENT', number: 50, filename: '050-implement.md', title: 'Implement', content: '# Step 050: IMPLEMENT\n\nExecute the plan.\n\n## Checklist\n\n- [ ] Implement changes\n- [ ] Run linting\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'] },
        { key: 'TEST', number: 51, filename: '051-test.md', title: 'Test', content: '# Step 051: TEST\n\nRun tests and verify.\n\n## Checklist\n\n- [ ] Run test suite\n- [ ] Verify all pass\n', isInterrupt: false, helperRefs: ['state_transition'] },
        { key: 'COMMIT', number: 60, filename: '060-commit.md', title: 'Commit', content: '# Step 060: COMMIT\n\nCommit changes.\n\n## Checklist\n\n- [ ] Stage relevant files\n- [ ] Create commit\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'] },
      ],
      tracks: [
        { name: 'default', description: 'Standard flow', steps: ['SETUP', 'PLAN', 'EXPLAIN_PLAN', 'IMPLEMENT', 'TEST', 'COMMIT'] },
      ],
      helpers: [
        { key: 'state_transition', type: 'always' as const, body: '## State-Transition\n\nUse `set-data.sh` / `get-data.sh` to read/write state. Run `complete-step.sh $STEP` when done.' },
        { key: 'git_rules', type: 'on_demand' as const, body: '## Git-Rules\n\n- Stage only relevant files\n- Push only to feature branch\n- Commit format: `type(scope): Description`' },
      ],
      hooks: { interruptSteps: ['EXPLAIN_PLAN'], stopGuardEnabled: true, userInterruptEnabled: true },
      scripts: [],
      groups: [],
      name: 'plan-implement-test',
      description: 'Basic development flow',
      skillMd: '',
    },
  },
  {
    id: 'fix-reproduce-patch',
    name: 'Fix: Reproduce → Patch',
    description: 'Bug fix flow with mandatory reproduction before fix',
    config: {
      steps: [
        { key: 'SETUP', number: 1, filename: '001-setup.md', title: 'Setup', content: '# Step 001: SETUP\n\nVerify environment.\n\n## Checklist\n\n- [ ] Check tools\n', isInterrupt: false, helperRefs: [] },
        { key: 'INVESTIGATE', number: 10, filename: '010-investigate.md', title: 'Investigate', content: '# Step 010: INVESTIGATE\n\nInvestigate the bug.\n\n## Checklist\n\n- [ ] Read bug report\n- [ ] Trace code path\n- [ ] Form hypothesis\n', isInterrupt: false, helperRefs: ['state_transition'] },
        { key: 'REPRODUCE', number: 11, filename: '011-reproduce.md', title: 'Reproduce', content: '# Step 011: REPRODUCE\n\nReproduce the bug in real environment.\n\n## Checklist\n\n- [ ] Set up reproduction environment\n- [ ] Confirm bug exists\n- [ ] Document reproduction steps\n', isInterrupt: false, helperRefs: ['state_transition'] },
        { key: 'REPORT', number: 12, filename: '012-report.md', title: 'Report', content: '# Step 012: REPORT\n\nReport findings to user.\n\n## Checklist\n\n- [ ] Present root cause\n- [ ] Get user confirmation\n', isInterrupt: true, helperRefs: ['state_transition'] },
        { key: 'FIX', number: 50, filename: '050-fix.md', title: 'Fix', content: '# Step 050: FIX\n\nApply the fix.\n\n## Checklist\n\n- [ ] Apply minimal fix\n- [ ] Verify reproduction no longer fails\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'] },
        { key: 'COMMIT', number: 60, filename: '060-commit.md', title: 'Commit', content: '# Step 060: COMMIT\n\nCommit the fix.\n\n## Checklist\n\n- [ ] Stage files\n- [ ] Create commit\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'] },
      ],
      tracks: [
        { name: 'fix', description: 'Bug fix with reproduction gate', steps: ['SETUP', 'INVESTIGATE', 'REPRODUCE', 'REPORT', 'FIX', 'COMMIT'] },
      ],
      helpers: [
        { key: 'state_transition', type: 'always' as const, body: '## State-Transition\n\nUse `set-data.sh` / `get-data.sh` to read/write state. Run `complete-step.sh $STEP` when done.' },
        { key: 'git_rules', type: 'on_demand' as const, body: '## Git-Rules\n\n- Stage only relevant files\n- Commit format: `fix(scope): Description`' },
      ],
      hooks: { interruptSteps: ['REPORT'], stopGuardEnabled: true, userInterruptEnabled: true },
      scripts: [],
      groups: [],
      name: 'fix-reproduce-patch',
      description: 'Bug fix flow with reproduction gate',
      skillMd: '',
    },
  },
  {
    id: 'full-pipeline',
    name: 'Preset Workflow',
    description: 'Focused workflow: specify, plan, review, implement, test, commit',
    config: {
      steps: [
        { key: 'SPECIFY', number: 10, filename: '010-specify.md', title: 'Specify', content: '# Step 010: SPECIFY\n\nClarify the task scope from the request and repository context.\n\n## Checklist\n\n- [ ] Restate the concrete goal\n- [ ] Identify touched areas and constraints\n- [ ] Capture assumptions in workflow data\n- [ ] Continue without asking the user unless blocked\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.task_scope'], consumes: [] },
        { key: 'PLAN', number: 20, filename: '020-plan.md', title: 'Plan', content: '# Step 020: PLAN\n\nCreate the implementation plan.\n\n## Checklist\n\n- [ ] Break the task into concrete steps\n- [ ] Identify files to inspect or change\n- [ ] Identify verification commands\n- [ ] Save the plan summary\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.plan_summary'], consumes: ['data.task_scope'] },
        { key: 'DEBATE_PLAN', number: 21, filename: '021-debate-plan.md', title: 'Debate Plan', content: '# Step 021: DEBATE_PLAN\n\nStress-test the plan before implementation.\n\n## Checklist\n\n- [ ] Review the plan from pro, neutral, and critical angles\n- [ ] Record risks and tradeoffs\n- [ ] Keep the final plan focused\n', isInterrupt: false, helperRefs: ['state_transition', 'debate_protocol'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.plan_verdict'], consumes: ['data.plan_summary'] },
        { key: 'EXPLAIN_PLAN', number: 22, filename: '022-explain-plan.md', title: 'Explain Plan', content: '# Step 022: EXPLAIN_PLAN\n\nExplain the plan to the user when plan confirmation or visibility is required.\n\n## Checklist\n\n- [ ] Summarize the planned change\n- [ ] Call out risks or assumptions\n- [ ] Continue after the user-facing topic is resolved\n', isInterrupt: true, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'user_involved', interruptMode: 'allowed', autonomy: 'needs_user', produces: [], consumes: ['data.plan_summary', 'data.plan_verdict'] },
        { key: 'SETUP_TEST', number: 30, filename: '030-setup-test.md', title: 'Setup Test', content: '# Step 030: SETUP_TEST\n\nPrepare the verification strategy before implementation.\n\n## Checklist\n\n- [ ] Decide which tests or checks prove the change\n- [ ] Add or update test scaffolding if needed\n- [ ] Record the exact verification commands\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.test_plan'], consumes: ['data.plan_summary'] },
        { key: 'EXPLAIN_TEST', number: 31, filename: '031-explain-test.md', title: 'Explain Test', content: '# Step 031: EXPLAIN_TEST\n\nExplain the verification approach to the user when test strategy visibility is required.\n\n## Checklist\n\n- [ ] Summarize what will be tested\n- [ ] Explain any untested or risky area\n- [ ] Continue after the user-facing topic is resolved\n', isInterrupt: true, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'user_involved', interruptMode: 'allowed', autonomy: 'needs_user', produces: [], consumes: ['data.test_plan'] },
        { key: 'IMPLEMENT', number: 40, filename: '040-implement.md', title: 'Implement', content: '# Step 040: IMPLEMENT\n\nExecute the scoped change.\n\n## Checklist\n\n- [ ] Make the planned edits\n- [ ] Keep changes focused\n- [ ] Update related docs or metadata when needed\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.implementation_summary'], consumes: ['data.plan_summary', 'data.test_plan'] },
        { key: 'SELF_REVIEW', number: 50, filename: '050-self-review.md', title: 'Self Review', content: '# Step 050: SELF_REVIEW\n\nAsk a sub-agent to review the implementation before final testing.\n\n## Checklist\n\n- [ ] Request a sub-agent review of the changed files and acceptance criteria\n- [ ] Wait for the review result\n- [ ] Apply clear fixes or record why no change is needed\n- [ ] Save review notes\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'background_wait', interruptMode: 'never', autonomy: 'background_wait', produces: ['data.review_notes'], consumes: ['data.implementation_summary'] },
        { key: 'TEST', number: 60, filename: '060-test.md', title: 'Test', content: '# Step 060: TEST\n\nRun verification after implementation and review.\n\n## Checklist\n\n- [ ] Run the verification commands\n- [ ] Fix failures or record limitations\n- [ ] Save verification results\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.verification_summary'], consumes: ['data.test_plan', 'data.review_notes'] },
        { key: 'COMMIT', number: 70, filename: '070-commit.md', title: 'Commit', content: '# Step 070: COMMIT\n\nCommit the completed change when appropriate.\n\n## Checklist\n\n- [ ] Review changed files\n- [ ] Stage only relevant files\n- [ ] Commit with a scoped message\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], executionMode: 'solo', interruptMode: 'never', autonomy: 'autonomous', produces: ['data.commit_sha'], consumes: ['data.verification_summary'] },
      ],
      tracks: [
        { name: 'feature', description: 'Default feature workflow', steps: ['SPECIFY', 'PLAN', 'DEBATE_PLAN', 'EXPLAIN_PLAN', 'SETUP_TEST', 'EXPLAIN_TEST', 'IMPLEMENT', 'SELF_REVIEW', 'TEST', 'COMMIT'] },
        { name: 'light', description: 'Short path for small changes', steps: ['SPECIFY', 'PLAN', 'EXPLAIN_PLAN', 'IMPLEMENT', 'SELF_REVIEW', 'COMMIT'] },
      ],
      helpers: [
        { key: 'state_transition', type: 'always' as const, body: '## State-Transition\n\nUse helper scripts for state management.' },
        { key: 'git_rules', type: 'on_demand' as const, body: '## Git-Rules\n\nStandard git practices.' },
        { key: 'debate_protocol', type: 'on_demand' as const, body: '## Debate-Protocol\n\n3-way debate: PRO / NEUTRAL / CON → Verdict agent.' },
      ],
      hooks: { interruptSteps: ['EXPLAIN_PLAN', 'EXPLAIN_TEST', 'SELF_REVIEW'], stopGuardEnabled: true, userInterruptEnabled: true },
      scripts: [],
      groups: [],
      name: 'full-pipeline',
      description: 'Focused feature and light workflow preset',
      skillMd: '',
    },
  },
  {
    id: 'wf-like-advanced',
    name: 'WF-like Advanced',
    description: 'Feature, fix, light, and brainstorm tracks with runtime utilities',
    config: {
      steps: [
        { key: 'SETUP', number: 1, filename: '001-setup.md', title: 'Setup', content: '# Step 001: SETUP\n\n## Checklist\n\n- [ ] Inspect request and repository state\n- [ ] Initialize workflow data\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.task_description'], consumes: [] },
        { key: 'BRAINSTORM', number: 10, filename: '010-brainstorm.md', title: 'Brainstorm', content: '# Step 010: BRAINSTORM\n\n## Checklist\n\n- [ ] Explore options\n- [ ] Capture candidate approaches\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.options'], consumes: ['data.task_description'] },
        { key: 'REPRODUCE', number: 12, filename: '012-reproduce.md', title: 'Reproduce', content: '# Step 012: REPRODUCE\n\n## Checklist\n\n- [ ] Reproduce the reported behavior in the real environment\n- [ ] Record exact reproduction evidence\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.reproduction'], consumes: ['data.task_description'] },
        { key: 'VERIFY_REPRO', number: 13, filename: '013-verify-repro.md', title: 'Verify Reproduction', content: '# Step 013: VERIFY_REPRO\n\n## Checklist\n\n- [ ] Verify the reproduction is stable\n- [ ] Do not start implementation until reproduction is confirmed\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.reproduction_verified'], consumes: ['data.reproduction'] },
        { key: 'TICKET', number: 20, filename: '020-ticket.md', title: 'Ticket & Branch', content: '# Step 020: TICKET\n\n## Checklist\n\n- [ ] Create or update tracking ticket\n- [ ] Prepare branch if needed\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.ticket_id'], consumes: ['data.task_description'] },
        { key: 'PLAN', number: 30, filename: '030-plan.md', title: 'Plan', content: '# Step 030: PLAN\n\n## Checklist\n\n- [ ] Write the implementation plan\n- [ ] Identify validation commands\n- [ ] Continue without normal approval prompts\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.plan_path'], consumes: ['data.task_description'] },
        { key: 'DEBATE_PLAN', number: 32, filename: '032-debate-plan.md', title: 'Debate Plan', content: '# Step 032: DEBATE_PLAN\n\n## Checklist\n\n- [ ] Run structured debate on the plan\n- [ ] Record verdict\n', isInterrupt: false, helperRefs: ['state_transition', 'debate_protocol'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.plan_verdict'], consumes: ['data.plan_path'] },
        { key: 'EXPLAIN_PLAN', number: 33, filename: '033-explain-plan.md', title: 'Explain Plan', content: '# Step 033: EXPLAIN_PLAN\n\n## Checklist\n\n- [ ] Present the plan only when user decision is required\n- [ ] Resume after the topic is resolved\n', isInterrupt: true, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'allowed', autonomy: 'needs_user', produces: [], consumes: ['data.plan_path'] },
        { key: 'MAKE_TEST', number: 40, filename: '040-make-test.md', title: 'Write Tests', content: '# Step 040: MAKE_TEST\n\n## Checklist\n\n- [ ] Add or update tests before implementation\n- [ ] Confirm expected failing behavior when applicable\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.test_plan'], consumes: ['data.plan_path'] },
        { key: 'IMPLEMENT', number: 50, filename: '050-implement.md', title: 'Implement', content: '# Step 050: IMPLEMENT\n\n## Checklist\n\n- [ ] Implement the scoped change\n- [ ] Keep edits focused\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.implementation_summary'], consumes: ['data.plan_path'] },
        { key: 'FIX', number: 51, filename: '051-fix.md', title: 'Fix', content: '# Step 051: FIX\n\n## Checklist\n\n- [ ] Apply the minimal fix\n- [ ] Preserve the reproduction case\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.fix_summary'], consumes: ['data.reproduction_verified'] },
        { key: 'SELF_REVIEW', number: 52, filename: '052-self-review.md', title: 'Self Review', content: '# Step 052: SELF_REVIEW\n\n## Checklist\n\n- [ ] Review own changes\n- [ ] Address obvious issues\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.review_notes'], consumes: ['data.implementation_summary'] },
        { key: 'COMMIT', number: 60, filename: '060-commit.md', title: 'Commit', content: '# Step 060: COMMIT\n\n## Checklist\n\n- [ ] Stage only relevant files\n- [ ] Commit with scoped message\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.commit_sha'], consumes: ['data.implementation_summary'] },
        { key: 'PR', number: 61, filename: '061-pr.md', title: 'Create PR', content: '# Step 061: PR\n\n## Checklist\n\n- [ ] Create or update pull request\n- [ ] Link ticket and verification\n', isInterrupt: false, helperRefs: ['state_transition', 'git_rules'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.pr_url'], consumes: ['data.commit_sha'] },
        { key: 'CI_WAIT', number: 70, filename: '070-ci-wait.md', title: 'Wait for CI', content: '# Step 070: CI_WAIT\n\n## Checklist\n\n- [ ] Run scripts/observe-ci.sh\n- [ ] Handle CI failures before continuing\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: ['scripts/observe-ci.sh'], interruptMode: 'never', autonomy: 'background_wait', produces: ['data.ci_status'], consumes: ['data.pr_url'] },
        { key: 'REVIEW', number: 80, filename: '080-review.md', title: 'Handle Review', content: '# Step 080: REVIEW\n\n## Checklist\n\n- [ ] Run scripts/observe-reviews.sh\n- [ ] Address review comments\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: ['scripts/observe-reviews.sh'], interruptMode: 'never', autonomy: 'background_wait', produces: ['data.review_status'], consumes: ['data.pr_url'] },
        { key: 'VERIFY_FIX', number: 84, filename: '084-verify-fix.md', title: 'Verify Fix', content: '# Step 084: VERIFY_FIX\n\n## Checklist\n\n- [ ] Verify the fix against the reproduction\n- [ ] Record verification result\n', isInterrupt: false, helperRefs: ['state_transition'], scriptRefs: [], interruptMode: 'never', autonomy: 'autonomous', produces: ['data.fix_verified'], consumes: ['data.fix_summary'] },
        { key: 'MERGE', number: 92, filename: '092-merge.md', title: 'Merge', content: '# Step 092: MERGE\n\n## Checklist\n\n- [ ] Run scripts/check-merge-status.sh\n- [ ] Merge when checks and policy allow it\n', isInterrupt: true, helperRefs: ['state_transition'], scriptRefs: ['scripts/check-merge-status.sh'], interruptMode: 'allowed', autonomy: 'needs_user', produces: ['data.merge_status'], consumes: ['data.pr_url', 'data.ci_status'] },
      ],
      tracks: [
        { name: 'feature', description: 'Full feature pipeline', defaultAutonomy: 'autonomous', steps: ['SETUP', 'TICKET', 'PLAN', 'DEBATE_PLAN', 'EXPLAIN_PLAN', 'MAKE_TEST', 'IMPLEMENT', 'SELF_REVIEW', 'COMMIT', 'PR', 'CI_WAIT', 'REVIEW', 'MERGE'] },
        { name: 'fix', description: 'Bug fix pipeline with reproduction gate', defaultAutonomy: 'autonomous', steps: ['SETUP', 'REPRODUCE', 'VERIFY_REPRO', 'PLAN', 'FIX', 'VERIFY_FIX', 'SELF_REVIEW', 'COMMIT', 'PR', 'CI_WAIT', 'REVIEW', 'MERGE'] },
        { name: 'light', description: 'Short path for small changes', defaultAutonomy: 'autonomous', steps: ['SETUP', 'PLAN', 'IMPLEMENT', 'SELF_REVIEW', 'COMMIT'] },
        { name: 'brainstorm', description: 'Idea exploration path', defaultAutonomy: 'interactive', steps: ['SETUP', 'BRAINSTORM', 'DEBATE_PLAN', 'EXPLAIN_PLAN'] },
      ],
      helpers: [
        { key: 'state_transition', type: 'always' as const, body: '## State Transition\n\nUse generated runtime commands for init, complete, interrupt, resume, and rewind. Never edit `control.*` state directly.' },
        { key: 'git_rules', type: 'on_demand' as const, body: '## Git Rules\n\n- Stage only relevant files\n- Keep branches scoped\n- Include verification in PR notes' },
        { key: 'debate_protocol', type: 'on_demand' as const, body: '## Debate Protocol\n\nRun opposing plan review, record tradeoffs, then continue with the selected path.' },
      ],
      hooks: { interruptSteps: ['EXPLAIN_PLAN', 'MERGE'], stopGuardEnabled: true, userInterruptEnabled: true },
      scripts: [
        { ...workflowUtility('scripts/observe-ci.sh', 'Poll CI status for a pull request'), name: 'observe-ci.sh' },
        { ...workflowUtility('scripts/observe-reviews.sh', 'Read review status and comments'), name: 'observe-reviews.sh' },
        { ...workflowUtility('scripts/check-merge-status.sh', 'Check whether a PR is mergeable'), name: 'check-merge-status.sh' },
      ],
      assets: [
        workflowUtility('scripts/observe-ci.sh', 'Poll CI status for a pull request'),
        workflowUtility('scripts/observe-reviews.sh', 'Read review status and comments'),
        workflowUtility('scripts/check-merge-status.sh', 'Check whether a PR is mergeable'),
      ],
      groups: [],
      graph: { edges: [] },
      name: 'wf-like-advanced',
      description: 'WF-like multi-track automation template',
      startCommand: 'bash run.sh init feature "<task description>"',
      skillMd: '',
    },
  },
];

presetRouter.get('/', (_req, res) => {
  res.json(PRESETS.map(({ id, name, description }) => ({ id, name, description })));
});

presetRouter.get('/:id', (req, res) => {
  const preset = PRESETS.find(p => p.id === req.params.id);
  if (!preset) {
    res.status(404).json({ error: 'Preset not found' });
    return;
  }
  res.json(preset);
});
