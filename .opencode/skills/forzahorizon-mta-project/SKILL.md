---
name: forzahorizon-mta-project
description: >
  Use for MTA San Andreas Forza Horizon style resources under C:\Program Files (x86)\MTA San Andreas 1.7\server\mods\deathmatch\resources\[forzahorizon] or C:\Users\jouwn\Desktop\[serwer 24.03.2026]\resources\[forzahorizon]. Covers Lua resources, meta.xml, fh-ui, CEF, resource lifecycle, client/server events, and in-game verification.
---

# ForzaHorizon MTA Project

## Activation Rule

Use this skill when working in or referencing either path:

```text
C:\Program Files (x86)\MTA San Andreas 1.7\server\mods\deathmatch\resources\[forzahorizon]
C:\Users\jouwn\Desktop\[serwer 24.03.2026]\resources\[forzahorizon]
```

Also use for any `fh-*` resource, MTA Lua resource, `meta.xml`, CEF UI, `fh-ui`, Forza-style HUD/dashboard/login, or server/client event integration.

## Project Identity

This is an MTA San Andreas 1.7 resource collection for a Forza Horizon style server. It commonly uses:

- Lua client/server scripts;
- `meta.xml` resource manifests;
- CEF HTML/CSS/JS UI mounted through `fh-ui`;
- resource-owned feature folders such as login, HUD, dashboard, vehicle/race systems;
- MTA client/server events, exports, timers, keybinds, cursor/focus lifecycle.

## Mandatory Companion Skills

Load as needed:

- `mta-resource-development` for Lua/resource lifecycle;
- `forzahorizon-fh-ui-cef` for CEF UI mounted through `fh-ui`;
- `mta-wiki-resource-development` when MTA API behavior is uncertain;
- `svg-icon-ui` for icons;
- `figma-mta-ui`, `website-ui-cef-recreation`, or `detailed-image-recognition` when implementing from visual reference.

## Workflow

1. Identify exact resource owner before editing.
2. Read existing `meta.xml`, `client.lua`, `server.lua`, and `ui/` files.
3. Follow existing patterns from nearby working resources instead of inventing new architecture.
4. Keep authoritative game/economy/permission decisions in Lua/server, not CEF JavaScript.
5. Register new files in `meta.xml` exactly when adding assets/scripts.
6. Define lifecycle: resource start/stop, player login/logout, browser open/close, cursor/focus, timers, keybind cleanup.

## Safety Rules

- Do not hardcode local absolute paths inside resources.
- Do not let client/CEF decide rewards, ownership, money, admin permissions, or race completion.
- Validate event payloads on server side.
- Avoid duplicate event handlers and timers on resource restart.
- Keep CEF updates throttled for HUD/high-frequency data.

## Verification

Recommended manual reload:

```text
restart <resource-name>
/fhuireload
```

Check F8/client logs and server console for Lua errors, missing assets, duplicate handlers, and CEF console issues.

## Final Response

Mention resource changed, `meta.xml` changes, Lua events/exports affected, UI files changed, and exact in-game reload/test steps.
