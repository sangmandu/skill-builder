# Story 5.4: Add Scenario-Based Test Coverage

## Status

review

## Story

As a Workflow Reviewer,
I want the documented user scenarios to map to automated or manual tests,
So that every important action is covered before implementation is trusted.

## Acceptance Criteria

- Given `user-scenarios-test-cases.md` contains scenario IDs, when the test coverage view loads, then each scenario maps to a planned unit, integration, E2E, or manual test.
- Given a generated runtime fixture exists, when runtime tests run, then init, complete, resume, interrupt, stop guard, and helper rendering are covered.
- Given asset role fixtures exist, when validation tests run, then platform runtime, workflow utility, and user script overwrite rules are covered.

## Tasks / Subtasks

- [x] Add scenario coverage mapping rules.
- [x] Add validation-engine fixture tests.
- [x] Add WF-like template fixture test.
- [x] Add generated runtime command fixture test.
- [x] Add `npm run test:scenarios`.

## Dev Agent Record

### Completion Notes

- `src/lib/scenarioCoverage.ts` maps scenario ID prefixes to unit, integration, E2E, or manual coverage.
- `tests/scenarioCoverage.test.ts` parses the scenario matrix and verifies every documented scenario ID has a coverage rule.
- The same test file exercises validation behavior, advanced template structure, workflow utility role classification, and generated runtime command execution.

### File List

- `src/lib/scenarioCoverage.ts`
- `tests/scenarioCoverage.test.ts`
- `package.json`

### Verification

- `npm run lint`
- `npm run build`
- `npm run test:scenarios`

### Change Log

- 2026-05-03: Added scenario coverage mapping and executable scenario fixtures.
