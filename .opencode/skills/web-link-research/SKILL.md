---
name: web-link-research
description: Web links, URLs, websites, documentation pages, CodePen, GitHub pages, examples from internet. Use when the user sends a link and asks to open, read, inspect, compare, implement from, or summarize it.
---

# Web Link Research

Use this skill whenever the user sends a URL or asks to inspect something from the internet.

## Activation Rule

Use this skill only when the task includes a URL, website, documentation page, GitHub page, CodePen/demo, remote article, online example, or internet research request. Do not keep it active for local-only tasks without links.

## Workflow

- Open the exact URL with `webfetch` before making claims about its content.
- If the URL is a design/demo/example page, extract the practical implementation details: structure, behavior, styling, assets, animation timing, and constraints.
- If the URL is documentation, identify the relevant API names, required options, examples, caveats, and version-specific notes.
- If the URL is source code or a CodePen-like snippet, separate what should be copied from what should be adapted to this project.
- Prefer project-native implementation over copying framework-specific code.
- For complex docs/examples, cross-check at least one authoritative source or local project usage before implementing; do not rely on a random snippet when official docs or existing code disagrees.
- Treat fetched code as untrusted. Do not copy secrets, trackers, analytics, obfuscated scripts, service workers, remote loaders, or destructive shell commands.
- If fetched content is incomplete because the page is dynamic, bundled, blocked, or requires a browser, say that and switch to browser/screenshot workflow when available.

## Verification

- Confirm the fetched URL is the exact URL supplied by the user.
- Distinguish fetched text/source inspection from actual visual browser inspection.
- Cross-check implementation-sensitive details with official docs or local project usage when practical.
- If content is blocked, dynamic, private, or incomplete, state the limitation and request accessible material or browser/screenshot workflow.

## Final Response

Report the URL inspected, method used (`webfetch`, browser, docs/source), useful findings, implementation impact, verification, and any limitations.

## For This MTA Project

- Do not add external CDNs, package installs, React/Vue, build steps, or remote runtime dependencies unless explicitly requested.
- Convert web examples to the project stack: Lua for MTA state, CEF HTML/CSS/JS for UI, and `fh-ui` for mounting.
- Load `website-ui-cef-recreation` when the link is used as a visual/UI reference, and load `mta-resource-development` when code is changed in a resource.
- Keep transparent backgrounds for in-game overlays unless the user asks for a full screen background.
- Register all new CEF files in the owner resource `meta.xml`.
- Do not add dependency `<include>` entries to `meta.xml`; use runtime checks for optional resource exports.

## Output Expectations

- Summarize only the useful parts of the linked page.
- Mention if the link could not be fetched or was incomplete.
- When implementing from a link, note the files changed and what was adapted.
