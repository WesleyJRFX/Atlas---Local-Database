$ErrorActionPreference = 'Stop'

$skillsPath = 'C:\Users\jouwn\.opencode\skills'
if (-not (Test-Path -LiteralPath $skillsPath)) {
    throw "Skills path not found: $skillsPath"
}

$skills = @(
    @{ n='mobile-ios-engineering'; d='Use for iOS, Swift, SwiftUI, UIKit, Xcode, iPhone/iPad behavior, provisioning, App Store constraints, and mobile UI/performance issues.' },
    @{ n='android-engineering'; d='Use for Android, Kotlin/Java Android, Jetpack Compose, Gradle Android, activities/fragments, permissions, Play Store, and device compatibility.' },
    @{ n='react-native-engineering'; d='Use for React Native, Expo, native modules, Metro, mobile navigation, bridge issues, gestures, permissions, and cross-platform mobile UI.' },
    @{ n='electron-desktop-engineering'; d='Use for Electron desktop apps, main/renderer process boundaries, preload scripts, IPC, packaging, auto-update, desktop security, and native integrations.' },
    @{ n='pwa-offline-engineering'; d='Use for Progressive Web Apps, service workers, offline mode, cache strategies, manifests, installability, background sync, and web push constraints.' },
    @{ n='browser-extension-engineering'; d='Use for Chrome/Firefox extensions, manifests, content scripts, background service workers, permissions, messaging, storage, and extension security.' },
    @{ n='wordpress-engineering'; d='Use for WordPress themes, plugins, hooks, shortcodes, custom post types, Gutenberg, WooCommerce basics, PHP templates, and WP security.' },
    @{ n='shopify-engineering'; d='Use for Shopify themes, Liquid templates, sections, storefront customization, checkout limitations, app integrations, and commerce UI changes.' },
    @{ n='cms-content-modeling'; d='Use for CMS schemas, content types, slugs, editorial workflows, previews, rich text, media fields, migrations, and headless CMS integrations.' },
    @{ n='game-development-general'; d='Use for general game development, loops, state machines, input, UI/HUD, physics integration, save systems, assets, and runtime performance.' },
    @{ n='unity-engineering'; d='Use for Unity C#, scenes, prefabs, MonoBehaviour lifecycle, ScriptableObjects, UI, physics, asset bundles, and Unity performance/debugging.' },
    @{ n='unreal-engineering'; d='Use for Unreal Engine, Blueprints, C++, UMG, replication, actors/components, packaging, asset references, and performance profiling.' },
    @{ n='graphics-canvas-webgl'; d='Use for Canvas, WebGL, shaders, drawing performance, rendering loops, transforms, high-DPI scaling, and graphics debugging.' },
    @{ n='map-geospatial-engineering'; d='Use for maps, geospatial coordinates, GIS data, tiles, markers, routing, projections, clustering, geofencing, and map UI performance.' },
    @{ n='ai-llm-integration'; d='Use for integrating LLM APIs, model selection, tool calling, structured outputs, token limits, safety, latency, cost, and prompt/data boundaries.' },
    @{ n='prompt-engineering-workflows'; d='Use for designing prompts, system instructions, evaluation prompts, structured outputs, few-shot examples, and reducing hallucinations in AI workflows.' },
    @{ n='rag-vector-search'; d='Use for retrieval augmented generation, vector stores, chunking, embeddings, reranking, citations, context windows, and knowledge-base QA.' },
    @{ n='embedding-search-engineering'; d='Use for embedding generation, semantic search, similarity metrics, vector indexes, metadata filters, deduplication, and search relevance tuning.' },
    @{ n='data-science-notebook-engineering'; d='Use for notebooks, pandas/numpy, exploratory data analysis, reproducibility, charts, data cleaning, statistical checks, and research-to-production handoff.' },
    @{ n='mlops-model-serving'; d='Use for ML model serving, inference APIs, model versioning, batch prediction, monitoring, drift, feature pipelines, and deployment reliability.' },
    @{ n='data-pipeline-etl'; d='Use for ETL/ELT pipelines, batch processing, transformations, schema drift, incremental loads, data quality checks, and pipeline observability.' },
    @{ n='stream-processing-engineering'; d='Use for streaming data, Kafka-like flows, event time, windows, offsets, consumers, backpressure, exactly-once/idempotent processing, and lag debugging.' },
    @{ n='message-broker-engineering'; d='Use for queues, brokers, pub/sub, RabbitMQ, Kafka, NATS, topics, routing keys, acknowledgements, retries, and dead-letter handling.' },
    @{ n='redis-cache-engineering'; d='Use for Redis, cache keys, TTL, locks, rate limits, pub/sub, sessions, sorted sets, invalidation, and Redis performance/debugging.' },
    @{ n='elasticsearch-opensearch-engineering'; d='Use for Elasticsearch/OpenSearch, indexing, analyzers, mappings, queries, aggregations, relevance, pagination, and search cluster issues.' },
    @{ n='postgresql-engineering'; d='Use for PostgreSQL, SQL queries, indexes, constraints, JSONB, transactions, migrations, query plans, locks, and database performance.' },
    @{ n='mysql-mariadb-engineering'; d='Use for MySQL/MariaDB, schema design, indexes, migrations, transactions, query tuning, character sets, and MySQL-specific behavior.' },
    @{ n='sqlite-engineering'; d='Use for SQLite, local databases, migrations, locking, WAL mode, embedded storage, SQL compatibility, and lightweight persistence.' },
    @{ n='mongodb-engineering'; d='Use for MongoDB, document modeling, indexes, aggregation pipelines, transactions, schema validation, ObjectIds, and query performance.' },
    @{ n='prisma-orm-engineering'; d='Use for Prisma schema, migrations, generated clients, relations, transactions, seeding, query performance, and TypeScript database types.' },
    @{ n='drizzle-orm-engineering'; d='Use for Drizzle ORM, schema definitions, migrations, SQL builders, relations, TypeScript types, and query correctness.' },
    @{ n='terraform-infrastructure'; d='Use for Terraform, infrastructure as code, modules, plans, state, providers, variables, drift, remote state, and safe infrastructure changes.' },
    @{ n='kubernetes-engineering'; d='Use for Kubernetes, deployments, services, ingress, config maps, secrets, probes, resources, rollouts, Helm, and cluster debugging.' },
    @{ n='nginx-reverse-proxy'; d='Use for Nginx, reverse proxy, TLS, routing, static assets, caching, compression, headers, upstreams, and web server troubleshooting.' },
    @{ n='aws-cloud-engineering'; d='Use for AWS services, IAM, Lambda, S3, ECS, RDS, CloudFront, CloudWatch, networking, permissions, and cloud deployment safety.' },
    @{ n='azure-cloud-engineering'; d='Use for Microsoft Azure services, App Service, Functions, Storage, Key Vault, Entra ID, pipelines, monitoring, and cloud configuration.' },
    @{ n='gcp-cloud-engineering'; d='Use for Google Cloud services, Cloud Run, Functions, Storage, IAM, Firebase, Pub/Sub, monitoring, and deployment configuration.' },
    @{ n='serverless-engineering'; d='Use for serverless functions, cold starts, runtime limits, triggers, IAM permissions, deployment packaging, retries, and event-driven architecture.' },
    @{ n='monitoring-alerting-engineering'; d='Use for metrics, alerts, dashboards, SLOs, logs, traces, health checks, incident signals, and actionable operational monitoring.' },
    @{ n='incident-response-engineering'; d='Use for production incidents, outages, triage, mitigation, rollback decisions, communication, postmortems, and preventing recurrence.' },
    @{ n='sla-reliability-engineering'; d='Use for reliability targets, SLO/SLA thinking, availability, graceful degradation, health checks, retries, capacity, and resilience improvements.' },
    @{ n='load-testing-capacity'; d='Use for load tests, stress tests, capacity planning, bottleneck discovery, rate limits, concurrency, and performance validation under traffic.' },
    @{ n='playwright-e2e-engineering'; d='Use for Playwright E2E tests, selectors, fixtures, browser contexts, traces, screenshots, flake reduction, and UI flow automation.' },
    @{ n='cypress-e2e-engineering'; d='Use for Cypress tests, commands, fixtures, intercepts, browser automation, flake reduction, and front-end integration test flows.' },
    @{ n='visual-regression-testing'; d='Use for screenshot diffs, visual baselines, UI regression testing, pixel thresholds, deterministic rendering, and visual QA workflows.' },
    @{ n='snapshot-testing-quality'; d='Use for snapshot tests, approval tests, serializer updates, avoiding brittle snapshots, and reviewing intentional output changes.' },
    @{ n='mutation-testing-quality'; d='Use for mutation testing, test strength analysis, surviving mutants, improving assertions, and meaningful coverage quality.' },
    @{ n='contract-testing-engineering'; d='Use for consumer/provider contract tests, Pact-like workflows, API compatibility, schema contracts, and integration boundary verification.' },
    @{ n='mock-service-worker-testing'; d='Use for MSW, mocked APIs, browser/node request handlers, test fixtures, realistic network failures, and frontend integration testing.' },
    @{ n='browser-devtools-debugging'; d='Use for browser DevTools workflows, console/network/performance/application panels, DOM/CSS inspection, storage, and client-side debugging.' },
    @{ n='sourcemap-debugging'; d='Use for sourcemaps, minified stack traces, production error mapping, bundle debugging, release artifact matching, and frontend crash diagnosis.' },
    @{ n='vite-bundler-engineering'; d='Use for Vite, dev server, plugins, HMR, build output, assets, aliases, env variables, and Vite troubleshooting.' },
    @{ n='webpack-bundler-engineering'; d='Use for Webpack, loaders, plugins, module resolution, chunking, dev server, asset handling, and legacy bundler issues.' },
    @{ n='tailwind-css-engineering'; d='Use for Tailwind CSS, utility classes, config, theme tokens, responsive variants, dark mode, purge/content paths, and component styling.' },
    @{ n='design-system-engineering'; d='Use for design systems, tokens, components, variants, theming, documentation, consistency, and reusable UI architecture.' },
    @{ n='icon-asset-pipeline'; d='Use for icons, SVG cleanup, asset organization, sprite systems, currentColor, optimization, licensing, and visual consistency.' },
    @{ n='image-optimization-engineering'; d='Use for image formats, compression, responsive images, lazy loading, thumbnails, metadata stripping, CDN delivery, and visual performance.' },
    @{ n='technical-seo-engineering'; d='Use for technical SEO, metadata, canonical URLs, structured data, robots, sitemaps, performance, crawlability, and social previews.' },
    @{ n='markdown-mdx-content'; d='Use for Markdown/MDX, docs sites, frontmatter, content rendering, code blocks, sanitization, and content-driven pages.' },
    @{ n='accessibility-testing-tools'; d='Use for axe, Lighthouse accessibility, screen reader checks, keyboard audits, automated a11y tests, and accessibility regression prevention.' },
    @{ n='web-security-headers'; d='Use for CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy, COOP/COEP, and secure browser headers.' },
    @{ n='cors-cookie-debugging'; d='Use for CORS, cookies, SameSite, credentials, preflight requests, CSRF symptoms, cross-origin auth, and browser network debugging.' },
    @{ n='oauth-oidc-engineering'; d='Use for OAuth2/OIDC, authorization code flow, PKCE, refresh tokens, scopes, identity providers, callback URLs, and auth integration.' },
    @{ n='cryptography-safe-use'; d='Use for hashing, encryption, signing, password storage, random tokens, key management, TLS concepts, and avoiding custom crypto mistakes.' },
    @{ n='webhook-engineering'; d='Use for webhook receivers, signature verification, idempotency, retries, event ordering, dead-letter handling, and third-party event integrations.' },
    @{ n='rate-limiting-abuse-prevention'; d='Use for rate limits, throttling, abuse prevention, brute-force protection, quotas, bot mitigation, and fair-use controls.' },
    @{ n='admin-panel-safety'; d='Use for admin panels, dangerous actions, confirmations, audit logs, permissions, bulk operations, impersonation, and operational safeguards.' },
    @{ n='permissions-rbac-abac'; d='Use for roles, permissions, RBAC, ABAC, policies, ownership checks, privilege escalation risks, and authorization modeling.' },
    @{ n='audit-log-engineering'; d='Use for audit trails, admin actions, security events, immutable logs, actor/resource context, retention, and compliance diagnostics.' },
    @{ n='multi-tenant-architecture'; d='Use for multi-tenant systems, tenant isolation, scoped queries, per-tenant config, authorization, billing boundaries, and data leakage prevention.' },
    @{ n='data-consistency-integrity'; d='Use for invariants, constraints, transactions, duplicate prevention, reconciliation, eventual consistency, and data correctness bugs.' },
    @{ n='numeric-money-precision'; d='Use for decimal precision, currency, rounding, tax, totals, financial calculations, floating-point bugs, and money-safe data types.' },
    @{ n='idempotency-deduplication'; d='Use for idempotency keys, duplicate request handling, webhook retries, safe creates, exactly-once illusions, and repeated side effects.' },
    @{ n='slug-url-routing'; d='Use for slugs, routing, redirects, URL normalization, canonical paths, route params, collisions, and human-readable identifiers.' },
    @{ n='file-system-watcher'; d='Use for file watchers, hot reload, debounce, recursive watching, path filters, cross-platform filesystem events, and watcher leaks.' },
    @{ n='code-generation-scaffolding'; d='Use for generators, scaffolding, templates, codegen outputs, API clients, schema-generated files, and keeping generated code reproducible.' },
    @{ n='template-engineering'; d='Use for template engines, server-rendered views, placeholders, escaping, partials, layouts, email templates, and injection-safe rendering.' },
    @{ n='pdf-generation-engineering'; d='Use for PDF generation, print layouts, invoices, reports, fonts, pagination, browser-to-PDF tools, and document rendering.' },
    @{ n='excel-spreadsheet-processing'; d='Use for Excel/XLSX/CSV spreadsheets, formulas, sheets, imports, exports, cell types, encoding, and report workbooks.' },
    @{ n='printing-reporting-engineering'; d='Use for print styles, reports, page breaks, headers/footers, printable UI, generated reports, and layout fidelity.' },
    @{ n='localization-rtl-layout'; d='Use for right-to-left UI, bidirectional text, Arabic/Hebrew layouts, mirrored icons, locale-specific spacing, and RTL testing.' },
    @{ n='timezone-scheduling-engineering'; d='Use for scheduling, recurring events, calendars, timezone conversions, DST, reminders, cron, and date boundary bugs.' },
    @{ n='calendar-integration'; d='Use for calendar integrations, ICS files, Google/Outlook calendar APIs, event sync, reminders, recurrence, and time zone correctness.' },
    @{ n='geolocation-permissions'; d='Use for browser/device geolocation, permissions, accuracy, privacy, maps, location tracking, and fallback behavior.' },
    @{ n='webrtc-media-streaming'; d='Use for WebRTC, getUserMedia, peer connections, ICE/STUN/TURN, audio/video streams, permissions, and realtime media debugging.' },
    @{ n='audio-video-processing'; d='Use for audio/video encoding, ffmpeg workflows, codecs, thumbnails, waveforms, duration metadata, transcoding, and media pipeline issues.' },
    @{ n='push-notifications-engineering'; d='Use for web/mobile push notifications, service workers, device tokens, permissions, delivery, payloads, and notification UX.' },
    @{ n='sms-integration-engineering'; d='Use for SMS providers, phone validation, OTP flows, delivery status, rate limits, templates, and abuse prevention.' },
    @{ n='maps-routing-ui'; d='Use for map UI, route drawing, directions, distance/time display, marker clustering, geocoding, and spatial interaction UX.' },
    @{ n='hardware-serial-io'; d='Use for serial ports, USB devices, scanners, printers, hardware protocols, permissions, timeouts, and device integration debugging.' },
    @{ n='iot-mqtt-engineering'; d='Use for IoT, MQTT, device telemetry, topics, retained messages, QoS, offline devices, provisioning, and sensor data flows.' },
    @{ n='embedded-firmware-engineering'; d='Use for embedded firmware, microcontrollers, C/C++, RTOS basics, memory constraints, serial debugging, and hardware-adjacent code.' },
    @{ n='accessibility-screenreader'; d='Use for screen reader behavior, ARIA announcements, live regions, semantic navigation, focus management, and assistive technology testing.' },
    @{ n='legal-license-compliance'; d='Use for open-source licenses, third-party assets, attribution, dependency license checks, copyright-sensitive copying, and compliance notes.' },
    @{ n='open-source-maintainership'; d='Use for public repos, issue templates, contribution guidelines, semantic commits, community support, release hygiene, and maintainership workflows.' },
    @{ n='benchmark-regression-testing'; d='Use for benchmarks, performance regression tests, baseline comparisons, statistical noise, micro/macro benchmarks, and performance CI.' },
    @{ n='code-coverage-analysis'; d='Use for coverage reports, uncovered critical paths, branch coverage, meaningful tests, coverage thresholds, and test gap analysis.' },
    @{ n='lint-format-standardization'; d='Use for ESLint, Prettier, Ruff, Black, gofmt, rustfmt, EditorConfig, formatting conflicts, and style automation.' },
    @{ n='editor-lsp-tooling'; d='Use for editor configuration, LSP issues, tsserver, language servers, workspace settings, code intelligence, and developer experience.' },
    @{ n='dependency-injection-architecture'; d='Use for dependency injection, service containers, inversion of control, test seams, lifecycle scopes, and decoupling architecture.' },
    @{ n='domain-driven-design'; d='Use for domain modeling, aggregates, entities, value objects, repositories, ubiquitous language, and complex business logic structure.' },
    @{ n='clean-architecture-boundaries'; d='Use for clean architecture, ports/adapters, dependency direction, use cases, infrastructure boundaries, and maintainable layering.' },
    @{ n='event-sourcing-engineering'; d='Use for event sourcing, event stores, projections, replay, snapshots, versioning, and append-only domain histories.' },
    @{ n='cqrs-architecture'; d='Use for CQRS, command/query separation, read models, write models, projections, consistency boundaries, and complex domain flows.' },
    @{ n='schema-validation-zod'; d='Use for Zod or schema validators, runtime validation, typed DTOs, parsing untrusted data, and TypeScript validation contracts.' },
    @{ n='json-yaml-toml-config'; d='Use for JSON, YAML, TOML, config schemas, parsing, comments/anchors, formatting, validation, and configuration file safety.' },
    @{ n='xml-soap-legacy-integration'; d='Use for XML, SOAP, WSDL, namespaces, XPath, legacy enterprise integrations, schema validation, and XML parsing safety.' },
    @{ n='csv-edge-cases'; d='Use for CSV parsing/writing, delimiters, quotes, newlines, BOM, encodings, Excel compatibility, and malformed row handling.' },
    @{ n='unicode-encoding-engineering'; d='Use for Unicode, UTF-8/UTF-16, mojibake, normalization, emojis, accents, collation, encodings, and cross-system text bugs.' },
    @{ n='windows-service-scheduled-tasks'; d='Use for Windows services, scheduled tasks, service accounts, permissions, startup, logs, PowerShell automation, and Windows ops.' },
    @{ n='linux-systemd-services'; d='Use for Linux services, systemd units, timers, logs, permissions, environment files, restart policies, and server process management.' },
    @{ n='ssh-remote-server-ops'; d='Use for SSH workflows, remote commands, server file inspection, safe deployment, key handling, rsync/scp, and remote troubleshooting.' },
    @{ n='archive-compression-engineering'; d='Use for zip/tar archives, compression, extraction safety, path traversal prevention, packaging, backups, and artifact handling.' },
    @{ n='project-bootstrap-onboarding'; d='Use for setting up unfamiliar projects, installing dependencies, finding commands, environment setup, first run, and onboarding documentation.' },
    @{ n='troubleshooting-decision-tree'; d='Use for broad unknown failures where multiple subsystems may be responsible and a structured decision tree prevents random guessing.' }
)

if ($skills.Count -gt 100) {
    $skills = @($skills | Select-Object -First 100)
}
if ($skills.Count -ne 100) {
    throw "Expected 100 skills, got $($skills.Count)"
}

function Convert-ToTitle([string] $Name) {
    return (($Name -split '-') | ForEach-Object {
        if ($_.Length -gt 0) { $_.Substring(0,1).ToUpperInvariant() + $_.Substring(1) } else { $_ }
    }) -join ' '
}

$common = @'

## Activation Rule

Use this skill only when the current task matches its description, file types, errors, tools, runtime, or risk profile. It should be selected by `skill-router` or by obvious task context. Do not keep all skills active at once.

## Professional Workflow

1. Clarify the desired outcome and constraints when they materially affect implementation.
2. Inspect relevant code, configuration, logs, tests, and existing project conventions before editing.
3. Identify the correct owner/module/layer and the closest existing pattern.
4. Implement the smallest maintainable change that solves the real problem.
5. Handle edge cases, failure paths, cleanup/lifecycle, security, privacy, and performance implications.
6. Verify with targeted tests, builds, linters, type checks, smoke tests, or precise manual validation.
7. Summarize changes, rationale, verification, and remaining risks.

## Quality Checklist

- Existing architecture and naming conventions are preserved.
- Public contracts, data formats, and user-facing behavior are intentionally changed only when required.
- Inputs from users, files, network, clients, webhooks, or external systems are treated as untrusted.
- Errors are meaningful and not silently swallowed.
- Sensitive data and secrets are not exposed in code, logs, screenshots, or final responses.
- New dependencies are avoided unless they are justified and consistent with the project.
- Verification is performed or the exact blocker is stated.

## Final Response Requirements

Include what changed, why this approach fits the task, what was verified, and any follow-up needed by the user.
'@

foreach ($skill in $skills) {
    $dir = Join-Path $skillsPath $skill.n
    if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }

    $title = Convert-ToTitle $skill.n
    $content = @"
---
name: $($skill.n)
description: >
  $($skill.d)
---

# $title

## Specialized Focus

$($skill.d)

This skill exists to make work in this area more deliberate, safer, and more complete. It should improve final output quality by forcing targeted inspection, domain-specific edge case handling, and appropriate verification.

## When To Use

- The user request directly mentions this domain, technology, workflow, or risk.
- Files, logs, configs, screenshots, dependencies, commands, or errors indicate this domain is involved.
- A change in this area could affect correctness, security, data integrity, user experience, reliability, deployment, or maintainability.

## Domain-Specific Checks

- Identify the exact runtime/tool/framework/version involved before assuming behavior.
- Read local examples and project conventions first; prefer project-native patterns.
- Check boundary conditions, lifecycle, cleanup, permissions, configuration, and failure modes.
- Consider how the change behaves in development, test, CI, and production-like environments.
- Add or update tests/docs/config only when they improve correctness or maintainability.
$common
"@

    [System.IO.File]::WriteAllText((Join-Path $dir 'SKILL.md'), $content, [System.Text.UTF8Encoding]::new($false))
}

"Generated additional skills: $($skills.Count)"
