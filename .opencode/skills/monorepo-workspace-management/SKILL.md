---
name: monorepo-workspace-management
description: >
  Use for monorepos, workspaces, multi-package repos, shared libraries, package boundaries, affected builds, and cross-package dependency changes.
---

# Monorepo Workspace Management

## Focus
Respect package boundaries and workspace tooling.

## Checks
- Identify root vs package commands.
- Update correct package manifests and references.
- Run affected package checks where possible.
## Activation Rule

Use this skill only when the current task matches its description. Do not keep every skill active at once. Select it because the user request, file types, errors, technologies, or implementation risk indicate it is relevant.

## Professional Workflow

1. Identify the exact scope and desired outcome.
2. Inspect existing project files, conventions, tests, and configuration before editing.
3. Choose the smallest safe change that fits the local architecture.
4. Handle edge cases, errors, lifecycle, and security implications.
5. Verify with targeted tests, builds, linting, type checks, or clear manual steps.
6. Report changed files, reasoning, verification, and remaining risks briefly.

## Quality Rules

- Do not guess APIs, paths, commands, or behavior; inspect first.
- Preserve existing architecture and naming conventions.
- Avoid broad rewrites unless the task truly requires them.
- Keep changes focused and reversible.
- Protect secrets and user data.
- Prefer project-native solutions over new dependencies.
- Add comments only for non-obvious constraints.

## Output Expectations

When this skill is used, final response should state what was done, why it was correct for this task, how it was verified, and any manual follow-up.
## Practical Impact Rules

- Before editing, identify the exact files, commands, and runtime behavior affected by this skill.
- Prefer the project-specific implementation path over generic examples.
- Check at least one edge case and one failure path relevant to this domain.
- If the task touches security, data, permissions, money, filesystem, deployment, or user privacy, combine this skill with the matching safety skill.
- Do not finish with only code changes; include verification or explain the blocker precisely.
