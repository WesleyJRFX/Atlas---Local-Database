---
name: polish-polls-political-test-engine
description: >
  Use for polish-polls political quiz/test engine, answer scoring, party matching, ideological axes, regression tests, and explaining calculated results fairly.
---

# Polish Polls Political Test Engine

## Activation Rule

Use this skill when the current task matches this project-specific area, uses the related project path, or touches files/logic named in the description. Select it together with the broader project skill and generic engineering skills through `skill-router`.

## Specialized Focus

Use for polish-polls political quiz/test engine, answer scoring, party matching, ideological axes, regression tests, and explaining calculated results fairly.

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
## Practical Impact Rules

- Before editing, identify the exact files, commands, and runtime behavior affected by this skill.
- Prefer the project-specific implementation path over generic examples.
- Check at least one edge case and one failure path relevant to this domain.
- If the task touches security, data, permissions, money, filesystem, deployment, or user privacy, combine this skill with the matching safety skill.
- Do not finish with only code changes; include verification or explain the blocker precisely.
