---
name: skill-router
description: >
  ALWAYS use this lightweight router at the start of any non-trivial task to decide
  which specialized skills should be activated. It prevents loading all skills at
  once and selects only the skills relevant to the user request, files, errors,
  technologies, and risk profile.
---

# Skill Router

## Purpose

Use this skill as a routing layer. Do not keep every available skill active. Select a small set of relevant skills for the current task, then follow those skills deeply.

## Mandatory Use

Use this router at the beginning of:

- any coding task;
- debugging task;
- refactor;
- test/build failure;
- UI/API/database/security/devops work;
- task involving files outside the current project;
- task involving images, screenshots, videos, links, Figma, or media;
- broad or ambiguous task.

Skip only for very simple conversational answers that require no tools or project inspection.

## Routing Algorithm

1. Read the user request and identify signals:
   - nouns: API, UI, DB, Docker, test, screenshot, login, cache, etc.;
   - verbs: fix, add, refactor, review, optimize, deploy, migrate, analyze;
   - file types: `.ts`, `.lua`, `.py`, `Dockerfile`, SQL, CSS, etc.;
   - evidence: stack trace, screenshot, logs, URL, YouTube, Figma link;
   - risk: security, money, data deletion, production, privacy.
2. Select 1-5 skills that directly match the task.
3. Prefer specific skills over generic skills.
4. Add safety/review skills when risk is high.
5. Use no more skills than needed. More is not better.
6. If uncertainty remains, search the skills index or run the helper script.

## Priority Rules

- Visual input always selects `detailed-image-recognition`.
- YouTube/video selects `youtube-video-ui-analysis` and often `local-media-ui-analysis`.
- URL/link selects `web-link-research`; dynamic visual pages also select `browser-internet-research` and possibly `website-ui-cef-recreation`.
- Figma/design selects `figma-mta-ui` or UI-specific skills.
- MTA/fh-* resource work selects `mta-resource-development`; uncertain MTA API selects `mta-wiki-resource-development`.
- Bugs/failures select `root-cause-debugging`; logs select `log-analysis`; build failures select `build-system-troubleshooting`.
- Security/auth/money/user data selects `security-review-hardening` plus domain-specific skill.
- Database schema/persistence selects `database-migration-engineering`.
- Frontend/UI selects `frontend-ui-quality`; accessibility selects `accessibility-a11y-audit`; CSS selects `css-layout-animation`.
- TypeScript/JavaScript selects `typescript-javascript-quality`; language-specific tasks select the matching language skill.
- Refactors select `safe-refactor-engineering`; reviews select `code-review-senior`; final quality gate selects `final-verification-handoff`.

## Skill Selection Matrix

| Signal | Use skills |
| --- | --- |
| Ambiguous request | `requirements-clarification`, `acceptance-criteria-definition` |
| Multi-step feature | `task-planning-execution`, domain skill, `final-verification-handoff` |
| Bug/crash/failing test | `root-cause-debugging`, `bug-reproduction-minimization`, `test-quality-engineering` |
| Logs/stack trace | `log-analysis`, `root-cause-debugging` |
| Build/CI failure | `build-system-troubleshooting`, `devops-ci-cd-reliability` |
| Git/commit/PR | `git-change-management` |
| Dependency install/upgrade | `dependency-upgrade-risk-control`, `package-manager-workflows` |
| Backend/API | `api-backend-engineering`, `security-review-hardening`, `error-handling-observability` |
| REST/OpenAPI | `api-contract-openapi`, `api-backend-engineering` |
| GraphQL | `graphql-engineering`, `api-backend-engineering` |
| WebSocket/realtime | `websocket-realtime-engineering`, `state-management-data-flow` |
| Auth/session | `auth-session-engineering`, `security-review-hardening` |
| Payment/billing | `payment-billing-safety`, `security-review-hardening`, `database-migration-engineering` |
| Database/migration | `database-migration-engineering`, `backup-restore-safety` when destructive |
| Performance | `performance-profiling-optimization`, plus relevant domain skill |
| Memory leak | `memory-leak-investigation`, `performance-profiling-optimization` |
| Race condition | `concurrency-race-condition`, `root-cause-debugging` |
| Frontend/UI | `frontend-ui-quality`, `css-layout-animation`, `responsive-design-qa` |
| Accessibility | `accessibility-a11y-audit`, `frontend-ui-quality` |
| Forms | `form-validation-ux`, `security-review-hardening` |
| State/store/cache | `state-management-data-flow`, `caching-strategy` |
| i18n/timezone | `internationalization-localization`, `time-date-timezone` |
| File upload/import | `file-upload-processing`, `data-import-export`, `security-review-hardening` |
| Background jobs | `background-jobs-queues`, `error-handling-observability` |
| Config/env | `config-environment-management`, `security-review-hardening` |
| Release | `release-versioning-changelog`, `git-change-management` |
| Docs | `documentation-maintenance` |
| Cross-platform | `cross-platform-compatibility`, `shell-powershell-scripting` |
| Mobile app | `mobile-ios-engineering`, `android-engineering`, `react-native-engineering` as applicable |
| Desktop app | `electron-desktop-engineering` |
| PWA/offline | `pwa-offline-engineering`, `push-notifications-engineering` |
| Browser extension | `browser-extension-engineering`, `web-security-headers` |
| CMS/ecommerce | `wordpress-engineering`, `shopify-engineering`, `cms-content-modeling` |
| Game engine | `game-development-general`, `unity-engineering`, `unreal-engineering` |
| Graphics/maps | `graphics-canvas-webgl`, `map-geospatial-engineering`, `maps-routing-ui` |
| AI/LLM/RAG | `ai-llm-integration`, `prompt-engineering-workflows`, `rag-vector-search`, `embedding-search-engineering` |
| Data/ML pipelines | `data-science-notebook-engineering`, `mlops-model-serving`, `data-pipeline-etl`, `stream-processing-engineering` |
| Message/cache/search infra | `message-broker-engineering`, `redis-cache-engineering`, `elasticsearch-opensearch-engineering` |
| Specific database | `postgresql-engineering`, `mysql-mariadb-engineering`, `sqlite-engineering`, `mongodb-engineering` |
| ORM | `prisma-orm-engineering`, `drizzle-orm-engineering` |
| Cloud/infra | `terraform-infrastructure`, `kubernetes-engineering`, `nginx-reverse-proxy`, `aws-cloud-engineering`, `azure-cloud-engineering`, `gcp-cloud-engineering`, `serverless-engineering` |
| Reliability/incident | `monitoring-alerting-engineering`, `incident-response-engineering`, `sla-reliability-engineering`, `load-testing-capacity` |
| E2E/visual testing | `playwright-e2e-engineering`, `cypress-e2e-engineering`, `visual-regression-testing` |
| Test depth | `snapshot-testing-quality`, `mutation-testing-quality`, `contract-testing-engineering`, `mock-service-worker-testing`, `code-coverage-analysis` |
| Browser debugging | `browser-devtools-debugging`, `sourcemap-debugging`, `cors-cookie-debugging` |
| Bundlers/style systems | `vite-bundler-engineering`, `webpack-bundler-engineering`, `tailwind-css-engineering`, `design-system-engineering` |
| Assets/SEO/content | `icon-asset-pipeline`, `image-optimization-engineering`, `technical-seo-engineering`, `markdown-mdx-content` |
| Web security | `web-security-headers`, `oauth-oidc-engineering`, `cryptography-safe-use`, `webhook-engineering`, `rate-limiting-abuse-prevention` |
| Permissions/admin/audit | `admin-panel-safety`, `permissions-rbac-abac`, `audit-log-engineering`, `multi-tenant-architecture` |
| Data correctness | `data-consistency-integrity`, `numeric-money-precision`, `idempotency-deduplication` |
| Routing/files/templates | `slug-url-routing`, `file-system-watcher`, `code-generation-scaffolding`, `template-engineering` |
| Documents/reports | `pdf-generation-engineering`, `excel-spreadsheet-processing`, `printing-reporting-engineering` |
| Locale/time/calendar | `localization-rtl-layout`, `timezone-scheduling-engineering`, `calendar-integration` |
| Device/media/integration | `geolocation-permissions`, `webrtc-media-streaming`, `audio-video-processing`, `sms-integration-engineering` |
| Hardware/IoT | `hardware-serial-io`, `iot-mqtt-engineering`, `embedded-firmware-engineering` |
| Compliance/community | `legal-license-compliance`, `open-source-maintainership` |
| Architecture patterns | `dependency-injection-architecture`, `domain-driven-design`, `clean-architecture-boundaries`, `event-sourcing-engineering`, `cqrs-architecture` |
| Schemas/formats | `schema-validation-zod`, `json-yaml-toml-config`, `xml-soap-legacy-integration`, `csv-edge-cases`, `unicode-encoding-engineering` |
| OS/server ops | `windows-service-scheduled-tasks`, `linux-systemd-services`, `ssh-remote-server-ops`, `archive-compression-engineering` |
| Project unknown setup | `project-bootstrap-onboarding`, `troubleshooting-decision-tree` |
| `C:\Users\jouwn\Desktop\strona sondaze` | `polish-polls-nextjs-project`, plus `polish-polls-data-scraping`, `polish-polls-political-test-engine`, `polish-polls-sejm-calculator` as needed |
| `C:\Users\jouwn\Desktop\[serwer 24.03.2026]` | `novelty-mta-server-project`, `novelty-mta-dx-gui`, and `forzahorizon-mta-project` for `[forzahorizon]` resources |
| `C:\Program Files (x86)\MTA San Andreas 1.7\server\mods\deathmatch\resources\[forzahorizon]` | `forzahorizon-mta-project`, `forzahorizon-fh-ui-cef`, `mta-resource-development` |
| `C:\Users\jouwn\Documents\RuneLab\runelab` | `runelab-league-companion-project`, `runelab-electron-desktop`, `runelab-riot-lcu-integration`, `runelab-data-scraping` |

## Helper Script

A helper script exists at:

```text
C:\Users\jouwn\.opencode\scripts\find-skills.ps1
```

Use it when the right skill is unclear:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\jouwn\.opencode\scripts\find-skills.ps1" "fix failing React test with auth API"
```

It ranks skills by matching query terms against skill names and descriptions. It is advisory; final choice still depends on project context.

## Verification

Before final response on non-trivial tasks, confirm that selected skills matched the actual project, files, errors, technologies, and risk. If a better skill becomes obvious during investigation, switch to it and do not keep irrelevant skills active.

## Output Discipline

Do not announce every routing decision unless useful. Internally select skills, then work normally. In final response, mention only skills/areas that materially affected the work when helpful.
