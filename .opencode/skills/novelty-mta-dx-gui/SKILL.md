---
name: novelty-mta-dx-gui
description: >
  Use for MTA native DX GUI work in the local server project: dxDraw UI, HUDs, scaling, fonts, input/cursor logic, animations, and cleanup on resource stop.
---

# Novelty Mta Dx Gui

## Activation Rule

Use this skill when the current task matches this project-specific area, uses the related project path, or touches files/logic named in the description. Select it together with the broader project skill and generic engineering skills through `skill-router`.

## Specialized Focus

Use for MTA native DX GUI work in the local server project: dxDraw UI, HUDs, scaling, fonts, input/cursor logic, animations, and cleanup on resource stop.

## Novelty DX Rules

- Draw most UI manually with `dxDraw*` functions.
- Use `n-gui` mainly for inputs, checkboxes, and sometimes buttons.
- Use `exports["n-fonts"]:getFont(...)` instead of local `dxCreateFont` unless there is a strong reason.
- Use common fonts: `Inter-Regular`, `Inter-Medium`, `Inter-Bold`, `Inter-SemiBold`, `Inter-ExtraBold`.
- Load textures first and register asset files in `meta.xml`.
- Handle clicks manually with `onClientClick` and `isMouseInPosition` where project does so.
- Show cursor only while UI is open.
- On close/resource stop, destroy `n-gui` elements, textures, and remove render/click handlers.

## Workflow

1. Identify the exact project path and owner module/resource before editing.
2. Read nearby working code first; follow existing naming, folder structure, and data contracts.
3. Preserve project-specific domain rules and user-facing behavior.
4. Treat external inputs, scraped data, local tokens, game/client data, and server events as untrusted until validated.
5. Make small, testable changes and update manifests/config/tests when needed.
6. Verify with the closest project command or manual runtime workflow.

## Quality Rules

- Do not leak `.env`, tokens, lockfile credentials, API keys, passwords, or local private data.
- Do not hardcode local absolute paths in application/resource code unless the project explicitly uses local tooling config.
- Handle unavailable external services/client/game/server states gracefully.
- Keep UI/UX consistent with the existing project style.
- Add regression checks when changing calculations, parsers, scoring, or contracts.

## Verification

Use the parent project's known commands and context-specific manual checks. If the required runtime is unavailable, state exactly what could not be verified and provide manual test steps.

## Final Response

Mention project area, files changed, domain rules considered, verification performed, and manual follow-up.
