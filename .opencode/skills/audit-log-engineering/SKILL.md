---
name: audit-log-engineering
description: >
  Use for audit trails, admin actions, security events, immutable logs, actor/resource context, retention, and compliance diagnostics.
---

# Audit Log Engineering

## Specialized Focus

Use for audit trails, admin actions, security events, immutable logs, actor/resource context, retention, and compliance diagnostics.

This skill exists to make work in this area more deliberate, safer, and more complete. It should improve final output quality by forcing targeted inspection, domain-specific edge case handling, and appropriate verification.

## When To Use

- The user request directly mentions this domain, technology, workflow, or risk.
- Files, logs, configs, screenshots, dependencies, commands, or errors indicate this domain is involved.
- A change in this area could affect correctness, security, data integrity, user experience, reliability, deployment, or maintainability.

## Domain-Specific Checks

- Identify the exact runtime/tool/framework/version involved before assuming behavior.
- Read local examples and project conventions first; prefer project-native patterns.
- Check boundary conditions, lifecycle, cleanup, permissions, configuration, and failure modes.
- Consider how the change behaves in development, test, CI, and production-like environments.
- Add or update tests/docs/config only when they improve correctness or maintainability.

## Activation Rule

Use this skill only when the current task matches its description, file types, errors, tools, runtime, or risk profile. It should be selected by `skill-router` or by obvious task context. Do not keep all skills active at once.

## Professional Workflow

1. Clarify the desired outcome and constraints when they materially affect implementation.
2. Inspect relevant code, configuration, logs, tests, and existing project conventions before editing.
3. Identify the correct owner/module/layer and the closest existing pattern.
4. Implement the smallest maintainable change that solves the real problem.
5. Handle edge cases, failure paths, cleanup/lifecycle, security, privacy, and performance implications.
6. Verify with targeted tests, builds, linters, type checks, smoke tests, or precise manual validation.
7. Summarize changes, rationale, verification, and remaining risks.

## Quality Checklist

- Existing architecture and naming conventions are preserved.
- Public contracts, data formats, and user-facing behavior are intentionally changed only when required.
- Inputs from users, files, network, clients, webhooks, or external systems are treated as untrusted.
- Errors are meaningful and not silently swallowed.
- Sensitive data and secrets are not exposed in code, logs, screenshots, or final responses.
- New dependencies are avoided unless they are justified and consistent with the project.
- Verification is performed or the exact blocker is stated.

## Final Response Requirements

Include what changed, why this approach fits the task, what was verified, and any follow-up needed by the user.