---
name: novelty-mta-server-project
description: >
  Use for C:\Users\jouwn\Desktop\[serwer 24.03.2026], a local MTA server workspace. Covers resource folders, server configuration, MTA Lua resources, ForzaHorizon resource collection, server lifecycle, and safe project-wide changes.
---

# Novelty MTA Server Project

## Activation Rule

Use this skill when working in or referencing:

```text
C:\Users\jouwn\Desktop\[serwer 24.03.2026]
```

Also use for local MTA server resources, server config, resource collection changes, cross-resource integration, and project-wide server workspace tasks.

## Project Scope

This is a local MTA San Andreas server workspace with project documentation:

```text
AGENTS.md
NOVELTY_PROJECT_AI_GUIDE.md
[novelty-project]\
resources\
```

Important rules from `AGENTS.md`:

- first check whether a similar system already exists;
- keep resources small and specialized;
- cross-resource communication goes through `exports[...]`;
- client/server communication uses `triggerServerEvent` and `triggerClientEvent`;
- GUI is mostly manually drawn with DX;
- `n-gui` is mainly for inputs, checkboxes, and sometimes buttons;
- runtime state uses module globals and `elementData`;
- persistent data uses `exports["n-db"]:query(...)`;
- new exports, events, `elementData` keys, DB tables, or large configs must be documented in `AGENTS.md` / `NOVELTY_PROJECT_AI_GUIDE.md`.

Treat this as a runnable/dev server copy, not a generic folder.

## Workflow

1. Identify exact resource group and resource owner before editing.
2. Avoid broad edits across all resources unless task explicitly asks for it.
3. Read `meta.xml` and related client/server files before modifying Lua or assets.
4. Keep cross-resource contracts explicit: events, exports, element data, database keys, ACL/admin checks.
5. Preserve server-specific configs and local paths; do not leak them in code or final answers.

## Companion Skills

- `forzahorizon-mta-project` for `[forzahorizon]` resources.
- `mta-resource-development` for general resource work.
- `mta-wiki-resource-development` when MTA APIs need confirmation.
- `novelty-mta-dx-gui` for native DX GUI/HUD work.
- `forzahorizon-fh-ui-cef` for CEF/fh-ui work.

## Safety Rules

- Do not delete or overwrite resources without explicit confirmation.
- Do not hardcode machine-specific absolute paths into resource code.
- Validate server-side permissions for admin/economy/destructive actions.
- Clean up event handlers, timers, markers, colshapes, blips, vehicles, and CEF browsers on resource stop.

## Verification

Use relevant in-game/server checks:

```text
restart <resource-name>
refresh
/fhuireload
```

Check server console and F8 logs.

## Final Response

Mention exact resource path, files changed, cross-resource contracts affected, and reload/test steps.
