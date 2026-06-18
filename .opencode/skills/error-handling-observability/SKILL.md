---
name: error-handling-observability
description: >
  Use for improving error handling, logging, metrics, tracing, retries, user-facing
  errors, debug output, observability, operational diagnostics, and reliability of
  failure paths.
---

# Error Handling Observability

## Purpose

Make failures understandable, safe, and recoverable. Add useful diagnostics without leaking sensitive data or spamming logs.

## When To Use

- User asks to improve errors/logging/debugging/observability.
- A bug lacks enough information to diagnose.
- Code catches errors silently or throws unclear messages.
- Background jobs, APIs, integrations, file operations, or async flows need reliable failure handling.

## Error Handling Principles

- Handle expected failures close to where they occur.
- Let unexpected failures propagate to the project’s central error boundary/logger when appropriate.
- Never swallow errors silently.
- Preserve original cause/context where language/runtime supports it.
- Return user-facing errors that are helpful but non-sensitive.
- Log operator-facing context with identifiers, not secrets.

## Error Taxonomy

Classify failures:

- validation/user input;
- unauthorized/forbidden;
- not found;
- conflict/state transition;
- dependency unavailable;
- timeout/retryable;
- permanent external failure;
- programmer bug/invariant violation.

Each class should map to consistent status code/message/retry behavior.

## Logging Rules

- Log action, resource id, actor id, correlation/request id when available, and safe failure reason.
- Do not log passwords, tokens, API keys, full personal data, payment details, or raw untrusted blobs.
- Avoid per-frame/per-loop/per-request spam in hot paths.
- Use structured logging style when the project has it.
- Make debug logs easy to remove or gate behind config if noisy.

## Retry and Timeout Rules

- Set timeouts on external/network operations.
- Retry only idempotent or explicitly safe actions.
- Use bounded retries with backoff when project pattern exists.
- Avoid retry storms; cap concurrency and respect cancellation.
- Surface final failure clearly.

## UI Error States

- Show loading, empty, error, and retry states where users need feedback.
- Keep errors actionable.
- Prevent double-submit and stuck spinners.
- Restore controls/cursor/state on failure paths.

## Verification

- Test success and failure paths.
- Force/mock dependency failure when feasible.
- Confirm logs contain enough context and no secrets.
- Confirm UI/API returns consistent errors.

## Final Response

Mention:

- failure paths improved;
- logging/error behavior added;
- sensitive data protections;
- verification performed.
