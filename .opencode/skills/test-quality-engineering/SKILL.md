---
name: test-quality-engineering
description: >
  Use when adding, fixing, reviewing, or running tests; improving test coverage;
  debugging flaky tests; creating regression tests; or validating features with
  reliable automated and manual checks.
---

# Test Quality Engineering

## Purpose

Create meaningful tests that protect behavior without becoming brittle. Use tests to verify fixes, document contracts, and prevent regressions.

## When To Use

- User asks to add tests, fix tests, improve coverage, or run verification.
- A bug fix should include a regression test.
- A feature changes behavior, API contracts, data formatting, permissions, state transitions, or UI interaction.
- CI/test failures need diagnosis.

## Test Discovery

1. Identify test framework and commands from package/config files.
2. Find similar tests near the target feature.
3. Understand fixture factories, mocks, setup/teardown, snapshots, and naming conventions.
4. Determine test level needed:
   - unit for pure logic;
   - integration for API/database/service contracts;
   - component/UI for rendering and interactions;
   - e2e/manual for full flows when automation is unavailable.

## Test Design Rules

- Test observable behavior, not implementation details.
- Prefer one clear reason to fail per test.
- Include both success and important failure/edge cases.
- Use realistic fixtures but keep them minimal.
- Avoid sleeps, arbitrary timing, and network dependence.
- Mock at system boundaries, not the code under test.
- Avoid excessive snapshots; assert meaningful text/state/attributes/data.
- For bugs, write or identify a regression case that fails before the fix when practical.

## Coverage Priorities

Prioritize tests for:

- validation and error handling;
- permissions/security boundaries;
- money/billing/rewards/persistence;
- parsing/formatting edge cases;
- async state and cleanup;
- migrations/data transformations;
- public API responses;
- complex UI state transitions.

## Flaky Test Protocol

- Read the failure and test code carefully.
- Check async waits, timers, shared global state, test order dependence, random data, time zones, network calls, filesystem leftovers, and cleanup.
- Fix the race or isolation issue; do not simply increase timeouts unless justified.
- Ensure mocks are reset and resources are disposed.

## Verification Workflow

- Run the most targeted test first.
- Then run the affected suite.
- If quick enough, run full test/typecheck/build.
- If tests cannot run due environment/dependencies, state the exact blocker and provide manual verification steps.

## Test Maintenance

- Update tests when behavior intentionally changes.
- Do not weaken assertions to pass unless the old assertion encoded incorrect behavior.
- Keep test names descriptive: condition + expected result.
- Keep helper abstractions readable and local unless reused broadly.

## Final Response

Mention:

- tests added/updated;
- behavior covered;
- commands run and results;
- remaining manual checks if any.
