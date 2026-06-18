---
name: api-backend-engineering
description: >
  Use for backend endpoints, controllers, services, validation, authentication,
  authorization, API contracts, webhooks, queues, background jobs, server-side
  business logic, and integration boundaries.
---

# API Backend Engineering

## Purpose

Build backend/API changes with clear contracts, validation, security, error handling, and tests. Keep business logic server-side and maintainable.

## When To Use

- Creating or changing API endpoints, routes, controllers, services, resolvers, webhooks, jobs, or server-side logic.
- Modifying request/response payloads, validation, auth, permissions, database writes, or external integrations.
- Debugging backend errors or API contract mismatches.

## Backend Workflow

1. Identify route/entrypoint and existing pattern.
2. Define contract:
   - method/path/event;
   - auth requirement;
   - request shape;
   - response shape;
   - errors/status codes;
   - side effects.
3. Validate input at the boundary.
4. Authorize the actor for the target resource/action.
5. Keep business rules in service/domain layer where the project does that.
6. Handle failures with meaningful errors and safe logs.
7. Add/update tests or manual API checks.

## Contract Rules

- Preserve existing response fields unless intentionally versioning/breaking.
- Do not leak internal errors, stack traces, secrets, or unrelated user data.
- Use consistent status codes/error shapes from nearby code.
- Enforce pagination/limits for list endpoints.
- Treat idempotency deliberately for create/update/webhook/retry flows.
- Keep time zones, currency, rounding, and locale behavior explicit.

## Validation and Authorization

- Validate type, format, enum, length, range, ownership, and state transitions.
- Authorization must be server-side and independent of hidden UI controls.
- Do not trust client-provided user/account/role/price/permission fields.
- Check cross-tenant/cross-user access for every id-based operation.

## Data and Transactions

- Use repository/ORM/database patterns already present.
- Wrap multi-step writes in transactions when partial updates would corrupt state.
- Handle duplicate/constraint failures gracefully.
- Avoid N+1 queries; use joins/includes/batching where appropriate.
- Keep audit/log context for important admin or financial operations.

## External Integrations

- Time out external calls.
- Validate webhook signatures when available.
- Make retries idempotent.
- Do not block user requests on slow non-critical side effects if the project has jobs/queues.
- Sanitize remote data before storing or rendering.

## Verification

- Run backend tests or targeted endpoint checks.
- Test success, validation failure, unauthorized, not found, and conflict cases.
- Check logs for safe useful errors.
- Verify database side effects and rollback/cleanup paths.

## Final Response

Include:

- endpoint/service changed;
- contract behavior;
- validation/authorization added;
- tests/checks run;
- migration/restart notes if relevant.
