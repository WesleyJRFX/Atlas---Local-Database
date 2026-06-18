---
name: polish-polls-nextjs-project
description: >
  Use for C:\Users\jouwn\Desktop\strona sondaze, the polish-polls Next.js political polling website. Covers Next.js 16 App Router, React 19, Tailwind 4, MySQL, political pages, party comparison, polls, SEO, RSS, sitemap, and production build/lint checks.
---

# Polish Polls Next.js Project

## Activation Rule

Use this skill when working in or referencing:

```text
C:\Users\jouwn\Desktop\strona sondaze
```

Also use it for tasks involving `polish-polls`, Polish election/polling pages, `app/`, `lib/poll-engine.ts`, political party data, Next.js App Router pages, SEO metadata, RSS/sitemap, or this project's npm scripts.

## Project Identity

This is a Polish political polling and election-information website using:

- Next.js `16.1.2` App Router;
- React `19.2.3`;
- TypeScript;
- Tailwind CSS 4;
- MySQL via `mysql2`;
- data/scraper utilities in `lib/` and `scripts/`;
- SEO routes like `robots.ts`, `sitemap.ts`, `rss.xml/`, OpenGraph/Twitter images.

Important local paths:

- `app/` - routes/pages/API routes;
- `lib/` - polling engine, data service, DB, scraper, party/politician data, political test engine;
- `data/`, `content/` - content/data sources;
- `scripts/` and root debug scripts - regression/debug utilities;
- `public/` - assets.

## Workflow

1. Read `package.json` and relevant `app/`/`lib/` files before editing.
2. Preserve App Router conventions and existing route structure.
3. Keep Polish language, Polish political names, diacritics, and party abbreviations accurate.
4. Treat `.env` and `.env.production` as sensitive; do not expose secrets.
5. For data changes, inspect data source, engine logic, and UI consumers together.
6. Avoid changing generated `.next/` or `tsconfig.tsbuildinfo`.

## Project Commands

Use npm, because project has `package-lock.json`.

```cmd
npm run lint
npm run build
npm run test:political
npm run test:parties-encoding
```

Run targeted commands when practical. Do not mix pnpm/yarn/bun in this project.

## Quality Rules

- Preserve SEO behavior for public pages.
- Use server/client components intentionally; do not add `use client` unless needed.
- Keep API routes validating input and rate limits where relevant.
- Handle Polish encoding and diacritics carefully.
- For charts/statistics, avoid misleading calculations and document uncertainty.
- Do not trust scraped data blindly; validate/parsing failures should be explicit.

## Verification

- For UI/page work: run `npm run lint` and, if feasible, `npm run build`.
- For political quiz/engine work: run `npm run test:political`.
- For party text/encoding: run `npm run test:parties-encoding`.
- For DB-dependent work: state if DB/env is unavailable.

## Final Response

Mention files changed, relevant command results, and any manual route to check locally under `http://localhost:3000`.
