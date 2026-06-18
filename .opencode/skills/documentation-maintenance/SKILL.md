---
name: documentation-maintenance
description: >
  Use for README, docs, comments, changelogs, architecture notes, API docs,
  setup instructions, usage examples, migration notes, and keeping documentation
  accurate after code changes.
---

# Documentation Maintenance

## Purpose

Maintain clear, accurate documentation that helps users and future maintainers without creating unnecessary docs noise.

## When To Use

- User asks to write/update docs, README, comments, examples, changelog, or migration notes.
- Code changes alter setup, commands, config, APIs, behavior, architecture, or operational steps.
- A final answer should include precise usage or verification instructions.

## Documentation Rules

- Do not create new documentation files unless the user explicitly requests or the repo clearly requires them for the change.
- Prefer updating existing docs near the affected feature.
- Keep docs accurate to actual code, not desired future behavior.
- Avoid marketing filler. Write actionable, testable instructions.
- Include examples only when they reduce ambiguity.
- Do not document secrets or machine-specific absolute paths unless intentionally local instructions.

## What To Document

Document changes to:

- public APIs/routes/events/exports;
- CLI commands and flags;
- environment variables;
- setup/build/test/deploy steps;
- migration or upgrade steps;
- feature behavior visible to users;
- architecture decisions that affect future work;
- known limitations/manual validation.

## Comments vs Docs

- Prefer clear code over comments.
- Add comments for non-obvious invariants, external API quirks, security decisions, performance constraints, or lifecycle details.
- Do not add comments that restate obvious code.
- Keep comments updated when changing surrounding behavior.

## API Docs

- Include request/response shapes, status/error cases, auth requirements, examples, and version/compatibility notes.
- Ensure examples match validation and actual field names.
- Avoid promising behavior not implemented.

## Changelog/Release Notes

- Group user-facing changes, fixes, breaking changes, migrations, and operational steps.
- Mention compatibility risks and required manual actions.
- Keep entries concise and scoped to actual changes.

## Verification

- Cross-check docs against changed code/config/tests.
- Run documented commands if feasible.
- Check links and file paths.
- Ensure docs do not expose secrets or stale instructions.

## Final Response

Include:

- docs changed or why no docs file was needed;
- key instructions updated;
- verification of accuracy.
