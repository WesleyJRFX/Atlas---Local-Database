---
name: dependency-upgrade-risk-control
description: >
  Use for adding, removing, upgrading, auditing, or replacing dependencies,
  packages, libraries, lockfiles, package managers, framework versions, and
  supply-chain risk decisions.
---

# Dependency Upgrade Risk Control

## Purpose

Change dependencies deliberately. Minimize supply-chain, compatibility, bundle, license, and maintenance risks.

## When To Use

- User asks to install/add/update/remove a package/library/framework/plugin.
- A fix may require a new dependency.
- Lockfiles or dependency manifests change.
- Dependency audit/vulnerability/build conflict appears.

## Decision Protocol

1. Check if existing code or standard library can solve the task.
2. Inspect current package manager and lockfile.
3. Evaluate dependency need:
   - functionality size;
   - maintenance health;
   - license;
   - security history;
   - bundle/runtime size;
   - transitive dependencies;
   - compatibility with project runtime.
4. Prefer small, established, project-consistent libraries.
5. Update lockfile using the correct package manager only.
6. Run tests/build/typecheck.

## Add Dependency Rules

- Do not add a dependency for trivial helpers.
- Do not mix package managers or create a second lockfile.
- Do not add remote CDN runtime scripts unless user explicitly asks and project allows it.
- Avoid abandoned packages and packages with postinstall surprises unless necessary and understood.
- Document why the package is needed if not obvious.

## Upgrade Rules

- Read changelog/release notes for major/minor upgrades that can break behavior.
- Upgrade narrowly unless user asks for broad updates.
- Watch peer dependency conflicts.
- For major upgrades, identify migration steps and breaking changes before editing.
- Run affected tests and build.

## Remove/Replace Rules

- Search all imports, dynamic requires, config references, scripts, docs, and lockfile impact.
- Replace functionality before removing package.
- Verify bundle/build/test after removal.

## Security Audit Rules

- Distinguish direct vs transitive vulnerabilities.
- Prefer patch/minor updates that fix advisories without broad churn.
- Do not blindly run audit fix with breaking upgrades unless user accepts risk.
- If no safe fix exists, explain mitigation and affected path.

## Verification

- Confirm manifest and lockfile are consistent.
- Run install only when needed and safe.
- Run tests/build/typecheck/lint.
- Check bundle size or runtime impact for frontend-heavy deps where relevant.

## Final Response

Include:

- dependency change made or avoided;
- reason;
- manifest/lockfile changed;
- compatibility/security notes;
- verification.
