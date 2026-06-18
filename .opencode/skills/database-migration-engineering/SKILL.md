---
name: database-migration-engineering
description: >
  Use for database schema changes, migrations, queries, indexes, constraints,
  seed data, persistence bugs, ORM changes, data backfills, and safe rollout of
  storage changes.
---

# Database Migration Engineering

## Purpose

Make database changes safely with explicit schema intent, migration order, rollback/compatibility awareness, and application code alignment.

## When To Use

- Adding/changing/removing tables, columns, indexes, constraints, migrations, seed data, ORM models, queries, or persistence logic.
- Fixing data corruption, duplicate rows, slow queries, or migration failures.
- Introducing new persistent state.

## Migration Workflow

1. Inspect existing migration system and latest migration number/name.
2. Understand current schema and related models/queries.
3. Define desired data contract:
   - table/column names;
   - types/nullability/defaults;
   - indexes/unique constraints;
   - foreign-key behavior if used;
   - backfill needs.
4. Write migration in project style.
5. Update application read/write paths.
6. Add/adjust tests and verification.

## Safety Rules

- Never concatenate untrusted input into SQL.
- Avoid destructive schema changes without explicit user request and migration strategy.
- For non-null columns on existing tables, provide default/backfill or multi-step rollout.
- Ensure unique constraints handle existing duplicates before adding.
- Keep migrations idempotent if the project expects it.
- Do not edit old applied migrations unless the project is clearly pre-release and user accepts it.
- Consider rollback/down migration if project uses reversible migrations.

## Query Quality

- Add indexes for new lookup patterns, joins, filters, and unique constraints.
- Avoid N+1 queries in list/detail endpoints.
- Bound result sets with pagination/limits.
- Use transactions for multi-write invariants.
- Handle constraint errors as meaningful application errors.

## Data Model Alignment

- Update ORM/schema types, validators, serializers, fixtures, seeds, docs, and API payloads as needed.
- Ensure default values are consistent between DB and application.
- Decide ownership of timestamps, soft delete, account/user scoping, and audit fields.
- Keep migration naming descriptive.

## Verification

- Run migration command if safe and configured.
- Run tests touching persistence.
- Check generated schema/types if project uses them.
- Manually inspect SQL for syntax, order, indexes, and destructive operations.
- For slow queries, inspect explain plans when available.

## Final Response

Mention:

- migration/schema changes;
- application paths updated;
- data safety/backfill notes;
- commands/checks run;
- deployment/restart considerations.
