---
name: typescript-javascript-quality
description: >
  Use for TypeScript/JavaScript code quality, types, async behavior, modules,
  runtime validation, strict typing, frontend/backend JS, Node, React, vanilla JS,
  build errors, and lint/typecheck fixes.
---

# TypeScript JavaScript Quality

## Purpose

Write robust TypeScript/JavaScript with strong types, safe async behavior, clear modules, and minimal runtime surprises.

## When To Use

- Editing `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` files.
- Fixing typecheck, lint, bundler, module, async, or runtime JS errors.
- Designing data types, component props, API payloads, state, or utility functions.

## Core Rules

- Preserve strict typing where possible.
- Avoid `any`; use `unknown` plus narrowing when input is untrusted.
- Do not silence errors with broad casts unless you can prove the invariant.
- Keep runtime validation for data crossing network/storage/user boundaries.
- Prefer explicit return types for exported functions and complex helpers.
- Keep side effects isolated from pure utilities.

## Type Design

- Model domain states with discriminated unions when state variants differ.
- Use narrow literal unions for enums/options.
- Avoid optional fields when a state-specific required field is clearer.
- Reuse existing project types instead of creating parallel near-duplicates.
- Keep API DTO types distinct from internal domain models when they differ.

## Async Rules

- Always handle rejected promises in user-triggered/background flows.
- Avoid fire-and-forget unless failure is intentionally non-blocking and logged/contained.
- Cancel or ignore stale async work when components unmount, requests are superseded, or sessions change.
- Avoid race conditions from out-of-order responses; use request tokens/version checks when needed.

## Module and Build Rules

- Follow existing module format and import path conventions.
- Avoid circular dependencies; extract shared types/utilities carefully.
- Do not add dependencies for trivial helpers.
- Keep browser/server-only code separated.
- Ensure environment variables are accessed through existing config wrappers when present.

## Runtime Safety

- Guard null/undefined from DOM queries, optional config, localStorage, JSON parsing, API responses, and query params.
- Validate arrays/object shapes before iterating untrusted data.
- Avoid unsafe `innerHTML`; sanitize or render text safely.
- Be explicit with number parsing, dates, time zones, and currency formatting.

## Verification

- Run typecheck, lint, tests, and build where available.
- If fixing a type error, verify no broad suppression hid real runtime risk.
- For UI code, test state transitions and cleanup.
- For Node/backend code, test error paths and untrusted inputs.

## Final Response

Include:

- JS/TS issue addressed;
- type/runtime safety improvement;
- commands run;
- any remaining type compromises.
