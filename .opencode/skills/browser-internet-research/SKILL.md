---
name: browser-internet-research
description: Browser, przegladarka, internet research, live websites, pages that need visual/manual browsing, dynamic pages, docs, CodePen, GitHub, examples. Use when the user asks to browse the internet or inspect a live web page.
---

# Browser Internet Research

Use this skill when the user asks to use a browser/przegladarka, browse the internet, inspect a live website, open a link, or research examples online.

## When To Use

- The user sends a URL and asks to inspect it, copy behavior, implement from it, or compare it with the project.
- The user asks for documentation, examples, CodePen demos, GitHub references, or internet research.
- The page may be dynamic, visual, or needs more than plain text reading.
- The user says: `browser`, `przegladarka`, `otworz link`, `sprawdz strone`, `poszukaj w internecie`, `CodePen`, `docs`, `documentation`.

## Tool Priority

- First try `webfetch` for normal pages, documentation, raw snippets, and CodePen/source pages.
- If a browser/MCP browser tool is available in the current opencode session, use it for dynamic pages, visual inspection, login-free interactive pages, and layout verification.
- If no browser tool is available, say that only text fetching is available and use `webfetch` instead.
- Do not claim to have visually inspected a page unless an actual browser/screenshot tool was used.

## Research Workflow

- Open the exact link the user provided; do not substitute a similar page unless the original is unavailable.
- Identify the useful implementation details: layout, interaction, animation, CSS properties, JS logic, assets, endpoints, and constraints.
- For CodePen or demos, extract the HTML/CSS/JS idea and adapt it to this project instead of copying framework-specific code blindly.
- For docs, capture API names, required parameters, version notes, warnings, and minimal examples.
- For visual pages, note viewport assumptions and what should be tested in-game after implementation.

## MTA / fh-ui Adaptation Rules

- Convert examples to project-native code: Lua for MTA state, CEF HTML/CSS/JS for UI, `fh-ui` for mounting.
- Load `website-ui-cef-recreation` for visual UI recreation from a page and `mta-resource-development` when implementing the result in `fh-*` resources.
- Do not add React, Vue, Tailwind build steps, package installs, CDN dependencies, or remote runtime scripts unless the user explicitly asks.
- Keep in-game overlays transparent unless the design needs a panel/background.
- Add all new CEF files/assets to the owner resource `meta.xml`.
- Prefer small isolated resources/components over changing `fh-ui` runtime unless the change is clearly reusable.

## Verification

- Mention which URL was inspected.
- State whether inspection used `webfetch`, browser, screenshot, source code, docs, or a fallback.
- Summarize only relevant findings and separate observed facts from inferred behavior.
- If implementing, list changed files and what was adapted.
- If the page could not be fetched or needs a browser that is unavailable, state that clearly and continue with the best fallback.

## Final Response

Report URL, method, findings, implementation impact, verification, and remaining limits.
