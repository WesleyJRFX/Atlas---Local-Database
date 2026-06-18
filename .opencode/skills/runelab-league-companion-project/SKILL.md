---
name: runelab-league-companion-project
description: >
  Use for C:\Users\jouwn\Documents\RuneLab\runelab, RuneLab League of Legends companion project. Covers project architecture, Riot/LCU integration, desktop/web UI, local app state, data fetching, builds, and safe handling of game/client data.
---

# RuneLab League Companion Project

## Activation Rule

Use this skill when working in or referencing:

```text
C:\Users\jouwn\Documents\RuneLab\runelab
```

Also use for RuneLab, Riot API, League of Legends companion features, LCU client integration, champion/rune/build pages, desktop app packaging, local game-client communication, or project-specific UI/data flows.

## Project Identity

RuneLab is a Windows desktop companion for League of Legends using a pnpm monorepo:

- package name: `league-companion-desktop`;
- package manager: `pnpm@9.15.0`;
- apps: `apps/desktop`, `apps/server`, `apps/web`;
- packages: shared workspace packages under `packages/`;
- technologies indicated by project metadata: Electron, React, Express, TypeScript, Prisma/database scripts, scraping scripts.

Important commands from root `package.json`:

```cmd
pnpm dev
pnpm dev:web
pnpm build
pnpm typecheck
pnpm lint
pnpm data:counterstats:check
pnpm data:ugg-runes:check
pnpm db:generate
pnpm db:migrate
```

Use pnpm only. Do not mix npm/yarn/bun in this project.

## Project Recognition Workflow

1. Inspect `package.json`, `pnpm-workspace.yaml`, lockfile, config files, and app entrypoints before editing.
2. Identify whether the active task is web UI, desktop/Electron, Riot/LCU integration, local storage, or build tooling.
3. Reuse existing project patterns for state, routing, API calls, components, and styling.
4. Treat local Riot/LCU credentials, tokens, ports, and lockfile data as sensitive.
5. Verify against available scripts from `package.json`.

## Companion Skills

Load as relevant:

- `runelab-electron-desktop` for desktop shell, preload/IPC, packaging;
- `runelab-riot-lcu-integration` for League client local API/LCU;
- `runelab-data-scraping` for champion/rune/item metadata ingestion;
- `react-component-engineering` or framework-specific UI skill based on stack;
- `security-review-hardening` for tokens/local auth;
- `error-handling-observability` for game-client connection failures.

## Quality Rules

- Do not expose Riot/LCU credentials or tokens in logs/final response.
- Handle League client closed/unavailable/offline states clearly.
- Keep UI responsive during data fetches and client polling.
- Do not assume game/client paths or ports are constant unless the project already does.
- Cache static game data carefully with version awareness.
- Preserve user settings and avoid destructive resets unless requested.

## Verification

- Run project-specific lint/typecheck/build/test scripts found in `package.json`.
- For LCU features, verify behavior when League client is running and when it is closed.
- For desktop packaging, verify main/renderer/preload boundaries if Electron exists.
- If Riot/LCU is unavailable, state limitation and provide manual checks.

## Final Response

Mention project area changed, files touched, verification command results, and manual RuneLab/League client test steps.
