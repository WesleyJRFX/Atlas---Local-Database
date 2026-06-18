---
name: safe-refactor-engineering
description: >
  Use for refactoring, renaming, cleanup, extracting helpers, reorganizing code,
  reducing duplication, improving maintainability, and changing structure while
  preserving behavior.
---

# Safe Refactor Engineering

## Purpose

Refactor code without breaking behavior. This skill emphasizes contracts, call-site completeness, incremental changes, and verification.

## When To Use

- User asks for refactor, cleanup, rename, simplify, reorganize, or deduplicate.
- You need to change structure to implement a feature safely.
- A bug fix benefits from extracting validation or lifecycle helpers.
- Repeated code exists and a shared helper is clearly justified.

## Refactor Protocol

1. Define preserved behavior:
   - public API;
   - routes/events/exports;
   - UI data payloads;
   - config keys;
   - database meaning;
   - tests that should still pass.
2. Search all call sites before renaming or moving code.
3. Make the smallest behavior-preserving transformation first.
4. Run targeted checks after each coherent step when possible.
5. Only then layer functional changes if the user requested them.

## Rules

- Do not mix broad formatting cleanup with logic changes.
- Do not rename public contracts unless explicitly requested or fully migrated.
- Avoid moving files without updating imports, manifests, tests, docs, build config, and runtime references.
- Keep compatibility shims only when needed and document them in the final response.
- Prefer extracting local helpers before creating global utilities.
- Delete dead code only after confirming it is unreferenced by static and runtime string references.

## Rename Checklist

- Search exact identifier.
- Search string references, config, docs, tests, CSS selectors, data attributes, event names, routes, exports, and filenames.
- Update imports/exports and barrels/index files.
- Check case-sensitive path issues.
- Verify build/typecheck/tests.

## Extraction Checklist

- Extract pure logic first when possible.
- Keep side effects at the original boundary unless deliberately moving responsibility.
- Preserve error behavior and return types.
- Preserve async ordering and cleanup.
- Add or adjust tests around extracted logic when the project has tests.

## Duplication Reduction

Deduplicate only when duplicated code has the same meaning, not just similar shape. Do not prematurely unify code with different business rules, permissions, lifecycle, or error behavior.

## Risk Controls

- For large files, refactor in sections with clear anchors.
- For generated or vendored code, avoid edits unless the repo expects manual modifications.
- For public libraries/APIs, preserve semantic version expectations.
- For UI, ensure CSS selector scope and DOM structure changes do not break styling or tests.

## Verification

- Run typecheck/lint/tests/build where available.
- Search for old names after renames.
- Inspect diff for accidental behavior changes.
- For runtime manifests, verify moved/added files are referenced correctly.

## Final Response

State:

- what was refactored;
- behavior intended to remain unchanged;
- important call sites updated;
- verification performed;
- any compatibility note.
