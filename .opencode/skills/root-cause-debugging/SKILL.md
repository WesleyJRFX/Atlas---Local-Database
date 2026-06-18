---
name: root-cause-debugging
description: >
  Use for bugs, crashes, failing tests, regressions, unexpected behavior, logs,
  stack traces, broken builds, flaky behavior, production-like incidents, and any
  task where the real cause must be found before editing code.
---

# Root Cause Debugging

## Purpose

Use this skill to diagnose problems professionally instead of patching symptoms. The goal is to identify the smallest responsible cause, prove it from evidence, fix it safely, and verify the behavior cannot regress easily.

## When To Use

- User reports a bug, crash, failure, regression, broken command, wrong UI behavior, or failing test.
- There is an error message, log, stack trace, screenshot, CI failure, or unexpected output.
- The requested fix is vague, for example: `napraw`, `nie działa`, `fix this`, `debug`, `why fails`.
- A change could hide symptoms without addressing the underlying data flow, state, configuration, dependency, or lifecycle issue.

## Debugging Protocol

1. Capture the exact failure:
   - command run;
   - error text;
   - stack trace;
   - expected vs actual behavior;
   - environment/config when visible.
2. Locate the responsible subsystem:
   - search for exact error text, function names, event names, routes, selectors, or config keys;
   - read the relevant files before editing;
   - identify entrypoint, call chain, and data flow.
3. Form a hypothesis from code evidence, not guesses.
4. Test the hypothesis with the smallest useful check:
   - run the failing command/test;
   - inspect logs;
   - add temporary reasoning only mentally unless instrumentation is needed;
   - compare similar working code.
5. Fix the root cause with the smallest coherent change.
6. Verify the original failure path and at least one adjacent path.

## Evidence Rules

- Do not claim the cause until you can point to the file/function/config responsible.
- If multiple causes are plausible, rank them and eliminate using searches or tests.
- If the error is from a generated/bundled file, trace back to the source file.
- If the failure is intermittent, inspect async timing, cleanup, caching, resource startup order, race conditions, and stale state.
- If the bug appeared after a change, inspect diff/history only when useful; do not revert unrelated work.

## Fix Quality Rules

- Prefer guard clauses, correct validation, lifecycle cleanup, and contract alignment over broad rewrites.
- Do not suppress errors silently. Convert them to meaningful failures or handle the specific expected case.
- Preserve public APIs, event names, routes, payload shapes, and user-facing behavior unless the fix requires a contract change.
- Avoid adding sleeps/timeouts as a primary fix unless the real problem is documented async readiness and no better signal exists.
- Do not delete tests to make a failure pass.

## Common Root Cause Areas

- Wrong file path or missing asset/reference.
- Mismatched data contract between frontend/backend/client/server.
- Async callback uses stale state after close, logout, navigation, restart, or unmount.
- Duplicate event handlers, timers, intervals, subscriptions, or render loops.
- Dependency/resource not ready or optional dependency missing.
- Incorrect environment variable, config value, base URL, port, or build mode.
- Type mismatch, null/undefined/nil access, invalid element/handle, wrong side/client-server context.
- Cached stale output, build artifact, CEF/browser cache, test fixture mismatch.

## Verification

- Re-run the exact failing command or explain why it cannot be run.
- Run the closest targeted tests before broad test suites when debugging is localized.
- For UI bugs, verify state transitions and reload/cache steps.
- For backend/API bugs, test invalid and valid inputs.
- For lifecycle bugs, inspect cleanup/start/stop/unmount paths.

## Final Response

Report briefly:

- root cause;
- files changed;
- why the fix addresses the cause;
- verification performed;
- remaining risks or manual test steps.
