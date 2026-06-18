---
name: security-review-hardening
description: >
  Use for authentication, authorization, permissions, input validation, secrets,
  injection risks, file/network access, dependency risk, admin actions, payments,
  user data, and security-sensitive code review or implementation.
---

# Security Review Hardening

## Purpose

Build and review code with security boundaries explicit. Prevent common vulnerabilities without overengineering or breaking legitimate workflows.

## When To Use

- User touches login, auth, sessions, roles, admin panels, tokens, API keys, user data, billing, uploads, file paths, external requests, database writes, remote events, or destructive actions.
- Code accepts input from users, clients, webhooks, files, URLs, environment variables, or third-party services.
- A screenshot/log may expose secrets.
- User asks for security review, hardening, validation, permissions, or safe handling.

## Security Protocol

1. Identify trust boundaries:
   - browser/client;
   - API/server;
   - database;
   - filesystem;
   - third-party service;
   - admin-only surface.
2. List untrusted inputs and validate them close to the boundary.
3. Check authorization separately from authentication.
4. Ensure sensitive operations are server-side/authoritative.
5. Avoid leaking secrets in logs, errors, screenshots, or final responses.
6. Add targeted tests or manual verification for denial paths.

## Input Validation

- Validate type, range, length, format, enum membership, ownership, and permissions.
- Reject or safely normalize unexpected fields.
- Use allowlists for actions, file types, domains, and sort/filter fields.
- Do not trust client-sent prices, roles, account ids, ownership, completion status, paths, URLs, or permission flags.

## Common Risks

- SQL/NoSQL/command injection.
- XSS through unsanitized HTML, markdown, URLs, or scriptable attributes.
- CSRF/state-changing GET requests when applicable.
- Path traversal and unsafe file operations.
- SSRF through arbitrary URL fetches.
- Insecure direct object reference: user changes another user's resource by id.
- Missing server-side permission check for hidden UI/admin buttons.
- Secrets committed, printed, or exposed to frontend bundles.
- Unsafe deserialization or eval-like execution.

## Secrets Handling

- Never hardcode tokens, passwords, private keys, or production credentials.
- Do not repeat full secrets from files/images/logs unless explicitly necessary; mask them.
- Use environment/config mechanisms already present in the project.
- If a secret appears exposed, warn the user to rotate it.

## Error Handling

- Return meaningful but non-sensitive errors.
- Log enough context for operators without logging secrets or personal data unnecessarily.
- Avoid exposing stack traces to public clients in production paths.

## Dependency and Supply Chain

- Avoid adding packages for trivial tasks.
- Check package reputation, maintenance, license, and transitive risk before adding dependencies.
- Prefer standard library or existing project utilities for security-sensitive parsing/crypto.
- Do not copy random internet code into privileged paths without review.

## Verification

- Test valid and invalid inputs.
- Test unauthorized access and cross-user access.
- Search for secret-like values before committing/reporting.
- Run security linters/audits when available, but do not rely only on them.

## Final Response

Include:

- security boundary addressed;
- validation/authorization changes;
- files changed;
- verification performed;
- any remaining operational action such as rotating exposed secrets.
