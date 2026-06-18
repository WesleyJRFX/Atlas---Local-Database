---
name: svg-icon-ui
description: SVG icons, ikonki, icon set, Lucide, Heroicons, Tabler, Feather, Material Symbols, Font Awesome. Use when adding or replacing UI icons in CEF/fh-ui, HTML/CSS/JS, dashboards, menus, HUDs or panels.
---

# SVG Icon UI

Use this skill whenever a task involves adding, replacing, styling, or fixing icons in this MTA CEF/fh-ui project.

## Core Rule

Do not hand-draw fake icons with CSS boxes, numbers, emoji, text glyphs, or improvised pseudo-elements when an actual icon is needed.

Use real SVG icons from a consistent icon set, store them locally, and color them through CSS variables or `currentColor`.

## Preferred Sources

Prefer clean, open-source SVG icon libraries:

- Lucide: `https://lucide.dev/icons/`
- Tabler Icons: `https://tabler.io/icons`
- Heroicons: `https://heroicons.com/`
- Feather Icons: `https://feathericons.com/`
- Bootstrap Icons: `https://icons.getbootstrap.com/`
- Font Awesome Free: `https://fontawesome.com/search?o=r&m=free`
- Material Symbols: `https://fonts.google.com/icons`

If internet access is available, search or fetch the icon source before editing. Pick icons that match the UI style and use one library per component whenever possible.

## Licensing

- Use only icons that are free/open-source for the intended usage.
- Do not copy proprietary icon assets from random websites unless the license clearly allows it.
- Keep attribution/license files when a library requires it.
- If license terms are unclear, choose Lucide, Tabler, Heroicons, Feather, Bootstrap Icons, or Font Awesome Free instead.

## Project Placement

Load `mta-resource-development` too when icon work also changes Lua registration, resource lifecycle, or `meta.xml` structure beyond adding asset files.

Use the owner resource already responsible for the UI:

- dashboard/map/stats/accolades icons -> `fh-dashboard/ui/icons/`;
- admin sidebar/actions/tests/server/player icons -> `fh-admin/ui/icons/`;
- radio icons/logos -> `fh-radio/ui/` or its existing asset folder;
- HUD/speedometer/key hints -> `fh-hud/ui/icons/`;
- login/photo/weather/discovery/points/race/finish/wheelspin icons -> their owner `ui/icons/` folder;
- shared icon primitives only belong in `fh-ui` if they are genuinely reused by multiple owner resources and the user asked for shared runtime work.

For CEF UI resources, store icons inside the owning resource, usually:

```text
fh-RESOURCE/ui/icons/name.svg
```

Then add each file to the owning resource `meta.xml`:

```xml
<file src="ui/icons/name.svg" />
```

Do not leave icons as remote URLs. MTA CEF should load local resource files.

## SVG Preparation

Before saving an SVG into the repo:

- Keep it small and readable.
- Remove scripts, event handlers, external references, comments, metadata, and inline styles that are not needed.
- Prefer `viewBox="0 0 24 24"` icons for menus and controls.
- Use `fill="none"` plus `stroke="currentColor"` for outline icons.
- Use `fill="currentColor"` for solid icons.
- Avoid hard-coded colors like `#000`, `#fff`, `red`, or `rgb(...)` unless the icon intentionally has brand colors.
- Preserve important stroke attributes: `stroke-width`, `stroke-linecap`, `stroke-linejoin`.
- Add `aria-hidden="true"` only when the SVG is inline in HTML. For file-based SVGs referenced with CSS masks, accessibility is handled by the button text/label.

Good outline SVG pattern:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="..." />
</svg>
```

Good solid SVG pattern:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
  <path d="..." />
</svg>
```

## How To Render Icons

### Preferred: CSS Mask With Local SVG

Use a shared icon class and color with `color`:

```html
<i class="ui-icon ui-icon--dashboard" aria-hidden="true"></i>
```

```css
.ui-icon {
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    display: inline-block;
    color: var(--icon-color, currentColor);
    background: currentColor;
    -webkit-mask: var(--icon-url) center / contain no-repeat;
    mask: var(--icon-url) center / contain no-repeat;
}

.ui-icon--dashboard { --icon-url: url("icons/layout-dashboard.svg"); }
.button.is-active .ui-icon { color: var(--accent); }
```

This keeps SVG files local, makes recoloring simple, and avoids duplicate inline SVG code.

### Alternative: Inline SVG

Use inline SVG when the icon needs multiple independently colored parts, animation, gradients, or exact accessibility labels.

```html
<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24">
  <path d="..." />
</svg>
```

```css
.ui-icon { width: 20px; height: 20px; color: var(--accent); }
.ui-icon path { stroke: currentColor; }
```

## Color Rules

- Icons should inherit text state by default: `color: currentColor`.
- Set normal, hover, active, disabled, danger, warning, and success colors in CSS states, not inside the SVG file.
- Use CSS variables for theme colors: `--icon-muted`, `--icon-active`, `--accent`, `--danger`.
- Ensure contrast against the panel background; muted icons still need to be readable.
- In dark UI, avoid pure white for inactive icons. Use muted blue/gray and brighten on hover/active.

Example:

```css
.sidebar button { color: var(--muted); }
.sidebar button:hover,
.sidebar button.is-active { color: var(--accent); }
.sidebar button[data-danger] { color: var(--danger); }
```

## Icon Selection Rules

- Match semantics, not just appearance: dashboard = layout/grid icon, players = users icon, vehicles = car icon, resources = server/package/layers icon, settings = sliders/cog, tests = flask/beaker.
- Keep stroke width and corner style consistent across one UI.
- Use one size rhythm: 16px for dense tables, 18-20px for sidebars, 22-24px for large action tiles.
- Do not mix outline and filled icons in the same nav unless the design intentionally uses active filled variants.
- Do not replace readable labels with icon-only controls unless a tooltip/title or accessible label exists.

## Implementation Workflow

1. Identify each icon needed and its semantic meaning.
2. Pick one icon library for the whole component.
3. Fetch/search exact SVGs from an allowed source.
4. Save SVG files under the owner resource `ui/icons/` folder.
5. Add icons to `meta.xml`.
6. Replace numeric/text/CSS-drawn icons with `<i class="...">` or inline SVG.
7. Style through `currentColor`, CSS variables, hover/active states, and theme classes.
8. Verify paths, colors, CEF compatibility, and visual consistency.

## MTA CEF Notes

- Use relative URLs from the CSS file location, for example `url("icons/users.svg")` when CSS lives in `ui/panel.css` and icons live in `ui/icons/`.
- If icons do not load after editing, restart the owner resource and reload CEF with `/fhuireload`.
- Avoid external icon fonts and CDN scripts; local SVG files are more reliable in MTA CEF.
- If the CEF build does not support unprefixed `mask`, include `-webkit-mask` too.

## Verification

Check icon rendering path, CEF/browser compatibility, color inheritance, hover/active/disabled states if used, and `meta.xml` registration for MTA resources.

## Reporting

When implementing icons, report:

- icon library/source used;
- files added under `ui/icons/`;
- `meta.xml` entries added;
- CSS classes/states used for coloring;
- verification performed and required restart/reload commands.
