---
name: codebase-architecture-discovery
description: >
  Use before non-trivial changes in unfamiliar repositories, large features,
  integrations, architecture questions, or when the correct owner/module/pattern
  must be discovered before coding.
---

# Codebase Architecture Discovery

## Purpose

Use this skill to understand a repository before changing it. The goal is to preserve architecture, reuse existing patterns, and choose the correct files/modules instead of inventing parallel systems.

## When To Use

- Starting work in an unfamiliar project or folder.
- The task affects multiple files, modules, resources, packages, services, or layers.
- The correct owner of a feature is unclear.
- The user asks to add a feature and there may already be similar code.
- You need to answer how something works in the codebase.

## Discovery Workflow

1. Inspect repository root:
   - package/build/config files;
   - README/AGENT/CONTRIBUTING docs;
   - source/test directories;
   - monorepo workspace files.
2. Identify the stack:
   - language/runtime/framework;
   - package manager;
   - build/test/lint commands;
   - backend/frontend/database/deployment boundaries.
3. Locate relevant existing patterns:
   - similar feature;
   - neighboring component/resource/module;
   - route/controller/service/store/test style;
   - naming and file organization conventions.
4. Trace data flow:
   - entrypoint;
   - validation;
   - state/storage;
   - business logic;
   - UI/API/output;
   - cleanup/error handling.
5. Decide the smallest correct implementation location.

## Search Strategy

- Search names from the user request, related domain terms, route names, UI labels, event names, config keys, and database table names.
- Search for similar verbs: create/update/delete/list/show/toggle/sync/register.
- Search test files for expected behavior and fixtures.
- Search docs for architectural constraints.
- Prefer exact local examples over generic framework habits.

## Architecture Rules

- Do not create a new abstraction if an existing local pattern solves the problem.
- Do not put feature code into shared/core modules unless it is genuinely reusable.
- Respect boundaries: UI vs state, API vs service, client vs server, persistence vs presentation.
- Keep dependency direction consistent. Avoid circular imports and hidden global state.
- Preserve public contracts unless the user asked for a breaking change.
- If adding a new module, mirror naming, exports, tests, and folder structure of nearby modules.

## Implementation Planning Output

Before coding non-trivial changes, maintain a compact mental or todo map:

- owner module/resource/package;
- files likely to change;
- existing pattern to copy;
- data contract and validation points;
- test/verification command;
- risks or unknowns.

## Red Flags

- Multiple similar implementations already exist.
- A change requires editing generated files.
- The task crosses authentication, permissions, billing, database schema, or deployment config.
- The repo has project-specific runtime conventions that differ from framework defaults.
- A simple request implies hidden lifecycle or state synchronization concerns.

## Verification

- After editing, re-check references and imports.
- Run targeted tests/build/typecheck where available.
- Confirm no duplicate architecture path was introduced.
- Confirm new files are included in manifests/configs when the project requires explicit registration.

## Final Response

Include:

- architecture location chosen;
- files changed;
- pattern reused;
- verification performed;
- manual follow-up if runtime validation is needed.
