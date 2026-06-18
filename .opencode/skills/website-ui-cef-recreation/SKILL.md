---
name: website-ui-cef-recreation
description: UI strony internetowej z linku, HTML, CSS, JS, JSON, layout, style, assets, animations. Use when the user sends a website URL and wants its UI analyzed or recreated as MTA CEF/fh-ui resource.
---

# Website UI CEF Recreation

## Activation Rule

Use this skill only when the current task matches this domain, project type, file type, reference material, or risk profile. Select it through skill-router or obvious task context; do not keep all skills active at once. Inspect relevant files and verify results before final response.

Use this skill when the user sends a web page link and asks to read, inspect, copy, recreate, adapt, or implement its UI in this MTA project.

## Goal

Turn a linked website into practical implementation guidance or project-native CEF UI:

- identify visible layout, typography, spacing, colors, components, assets, icons, motion, and responsive behavior;
- inspect available HTML, CSS, JavaScript, JSON, inline data, APIs, and static assets;
- adapt the result to this project without external frameworks, build steps, or remote runtime dependencies;
- implement as owner-resource CEF files registered through `fh-ui` when the user asks for code.

## Tool Priority

- Load `web-link-research` too when the task starts from a URL.
- Load `browser-internet-research` too when the page is dynamic, visual, animated, SPA-based, or needs viewport/layout verification.
- Use `webfetch` first for readable HTML, documentation, raw assets, JSON endpoints, and static pages.
- Use a browser/screenshot-capable tool when available for dynamic pages, computed visual layout, interaction states, hover/open menus, carousels, modals, and animations.
- Do not claim visual inspection unless a browser/screenshot was actually used; if only HTML was fetched, say so.

## Inspection Checklist

- **Page identity**: URL, page purpose, main sections, user flow, viewport sizes worth matching.
- **Layout**: grid/flex structure, fixed/sticky areas, stacking, breakpoints, safe areas, panel sizes, gutters, z-index layers.
- **Typography**: font family, weights, sizes, line heights, letter spacing, casing, headings/body/labels/numbers.
- **Colors**: background treatments, gradients, overlays, borders, shadows, glass/blur effects, semantic colors, opacity values.
- **Components**: navigation, cards, tabs, buttons, inputs, badges, lists, tables, toasts, dialogs, media blocks, HUD-like elements.
- **Assets**: images, SVGs, icons, logos, videos, fonts; note source URLs and whether they must be downloaded or recreated locally.
- **CSS details**: variables, reset rules, media queries, pseudo-elements, filters, transforms, transitions, keyframes.
- **JavaScript behavior**: state changes, routing, data fetches, timers, scroll effects, event handlers, animations, generated DOM.
- **Data**: JSON blobs, API endpoints, embedded props, localization strings, config objects, item lists.
- **Responsive states**: desktop, laptop, mobile, ultrawide; collapsed menus and overflow behavior.

## Extraction Rules

- Prefer facts from source code, computed styles, screenshots, and network data over visual guesses.
- When CSS is bundled/minified, extract only the relevant selectors, variables, dimensions, colors, and keyframes.
- When JS is bundled/minified, identify behavior and data contracts instead of copying entire bundles.
- If assets are remote, avoid leaving them as remote dependencies; create local asset paths and tell the user if files need to be downloaded manually or via a safe command.
- If the site uses React/Vue/Svelte/Next/Tailwind/etc., translate the output to plain HTML/CSS/vanilla JS for CEF.
- Do not add CDNs, npm packages, build tools, analytics scripts, tracking scripts, ads, or remote runtime scripts unless the user explicitly asks.

## ForzaHorizon Resource Mapping

When adapting website UI, map it to the existing owner resource instead of creating generic web folders:

- login/account UI -> `fh-login/ui`;
- driving HUD/speedometer -> `fh-hud/ui`;
- pause/dashboard/map/stats/admin-like dashboard -> `fh-dashboard/ui` or `fh-admin/ui` depending on purpose;
- radio/music overlay -> `fh-radio/ui`;
- progression/level/reward/skill chain -> `fh-progression/ui`, `fh-points/ui`, or future reward resource depending on ownership;
- discovery/boards/world marker UI -> owner world resource and dashboard blip provider pattern;
- photo/weather/race/wheelspin/finish screens -> corresponding owner resource;
- truly reusable UI primitives -> future shared resource only if the user asks, not automatic changes to `fh-ui`.

## MTA CEF / fh-ui Adaptation

- Load `mta-resource-development` too when implementing a linked UI as an actual resource change.
- Create UI inside the owner resource, for example `fh-RESOURCE/ui/name.html`, `name.css`, and optionally `name.js`.
- Register the component with `exports['fh-ui']:registerComponent(name, resourceName, htmlPath, cssPath)` from Lua.
- Show/hide/update through `fh-ui` exports; keep Lua responsible for game state and CEF responsible for DOM rendering.
- Keep fullscreen overlays transparent unless the source design is a full page or the user asks for a full screen background.
- Add all HTML/CSS/JS/assets to the owner resource `meta.xml`.
- Do not add resource dependency `<include>` entries; use runtime resource/export checks in Lua.
- Avoid framework syntax and build-only features; write browser-compatible vanilla CEF code.
- Use `window.FHUI.register(name, component)` only when DOM logic is required; use static HTML plus `data-ui-text` for simple text-only views.
- Match the original UI spirit, not just its content: spacing rhythm, contrast, hierarchy, animation pacing, and component density.
- Treat website code as reference, not as trusted code. Remove analytics, trackers, third-party embeds, service workers, remote script loaders, obfuscated logic, and anything unrelated to the UI behavior being recreated.
- Convert remote API/data examples into local Lua/CEF payload contracts. Do not leave gameplay UI dependent on live web endpoints unless the project already has that integration and the user asks for it.
- Scope imported CSS aggressively under the component root so website resets and generic selectors do not break other mounted `fh-ui` components.

## Large Website / Demo Decomposition

When the linked UI is complex, do not copy it as one blob. Decompose it first:

- identify the exact screen/state the user wants, ignoring unrelated routes/sections;
- separate shell layout, reusable cards/list items, controls, overlays/modals, transitions, and assets;
- extract only relevant CSS variables, dimensions, colors, typography, and keyframes;
- replace framework state/routing with a small `fh-ui` data contract and vanilla JS only where needed;
- remove responsive/mobile states that do not apply to in-game CEF unless they help smaller MTA windows;
- replace network/API data with Lua-provided data unless the project already owns that web integration;
- preserve the visual hierarchy and motion, not the website's build architecture.

## Implementation Workflow

1. Inspect the link and collect layout/style/behavior details before editing code.
2. Find the closest existing resource/component pattern in this repo and reuse its `fh-ui` integration style.
3. Build local HTML/CSS/JS with local assets and project naming conventions.
4. Wire Lua registration, visibility, data patching, input mode, and commands/keys if needed.
5. Update `meta.xml` with every new CEF file and asset.
6. Run a lightweight validation: check paths, basic syntax, and obvious missing references.
7. Tell the user what URL was used, what was adapted, changed files, and any parts that could not be inspected.

## Reporting Template

When only analyzing:

- URL inspected and method used (`webfetch`, browser, screenshot, source files).
- Key layout/style/behavior findings.
- Assets/data/endpoints discovered.
- How it should map to `fh-ui` CEF.

When implementing:

- Files changed.
- Which page features were recreated.
- What was adapted or intentionally omitted.
- Verification performed and any required in-game reload commands, usually restart the owner resource and `/fhuireload`.

## Important Limits

- Respect licensing and terms: recreate structure/style and use allowed assets only; do not blindly copy proprietary code/assets into the repo.
- Do not preserve malicious, tracking, analytics, or third-party script behavior.
- If a page requires login, payment, secrets, or private access, ask for a public reference or screenshots instead of trying to bypass access.
