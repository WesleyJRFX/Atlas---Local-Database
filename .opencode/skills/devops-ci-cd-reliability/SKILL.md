---
name: devops-ci-cd-reliability
description: >
  Use for CI/CD, Docker, deployment scripts, environment config, build pipelines,
  GitHub Actions, release automation, infrastructure scripts, reproducibility,
  and operational reliability.
---

# DevOps CI CD Reliability

## Purpose

Keep build, test, deploy, and runtime automation reliable, reproducible, secure, and understandable.

## When To Use

- Editing CI workflows, Dockerfiles, compose files, deployment scripts, package scripts, environment templates, build config, release automation, or server ops docs.
- Debugging CI failures, flaky builds, cache issues, deployment failures, environment mismatch, or missing secrets.

## Investigation Workflow

1. Identify failing job/step/command and exact log error.
2. Inspect workflow/script/config that runs it.
3. Reproduce locally when possible with equivalent command.
4. Check environment differences:
   - OS/shell;
   - Node/Python/etc version;
   - package manager;
   - env vars/secrets;
   - working directory;
   - cache state;
   - path separators.
5. Fix the responsible step with minimal changes.

## CI Rules

- Keep commands deterministic and non-interactive.
- Pin or use project-defined runtime versions.
- Use dependency caches carefully; cache keys must invalidate when lockfiles change.
- Do not print secrets.
- Do not bypass tests/lint/build unless user explicitly requests and understands risk.
- Separate install, lint, test, build, and deploy steps for clear failures.
- Prefer explicit working directories in monorepos.

## Docker/Runtime Rules

- Keep images minimal but debuggable enough for the project.
- Avoid copying secrets into images.
- Use `.dockerignore` to avoid bloated contexts.
- Preserve lockfile-based installs.
- Make health checks and startup order explicit when relevant.
- Avoid running production containers as root when project can support non-root safely.

## Environment Config

- Use `.env.example` or existing template patterns for required variables.
- Validate required env vars at startup where the project has config validation.
- Do not hardcode local absolute paths, ports, tokens, or machine-specific values.
- Document manual secret setup without exposing values.

## Deployment Safety

- Identify destructive actions: database resets, force pushes, prod deploys, resource deletion, secret rotation.
- Ask for confirmation before destructive or production-impacting commands.
- Keep rollback/manual recovery notes when changing deploy behavior.

## Verification

- Run the changed command locally if feasible.
- Validate YAML/JSON/shell syntax where possible.
- For CI fixes, explain the expected job behavior and what remains to verify in remote CI.
- For Docker, build or at least check Dockerfile paths/context.

## Final Response

Include:

- CI/devops file changed;
- root cause of failure if debugging;
- reliability/security improvement;
- verification run;
- remaining remote/manual validation.
