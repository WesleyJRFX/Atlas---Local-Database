---
name: mta-resource-development
description: MTA, Lua, fh-* resources, meta.xml, exports, events, migrations, autostart, resource lifecycle. Use when creating or changing ForzaHorizon MTA resources or gameplay/server/client code.
---

# MTA Resource Development

## Activation Rule

Use this skill only when the current task matches this domain, project type, file type, reference material, or risk profile. Select it through skill-router or obvious task context; do not keep all skills active at once. Inspect relevant files and verify results before final response.

Use this skill whenever the task changes project resources, Lua gameplay code, server/client integration, `meta.xml`, exports, database migrations, autostart, or `fh-*` architecture outside pure visual analysis.

## Goal

Implement changes as safe MTA resources that fit the current ForzaHorizon architecture:

- keep Lua responsible for gameplay, persistence, resource lifecycle, keybinds, timers, camera, vehicles, and events;
- keep CEF UI in owner resources and mounted through `fh-ui`;
- avoid hard dependencies that break resource startup order;
- validate paths, exports, events, migrations, and restart/reload requirements before reporting done.

## Read First

- Read `AGENT_STATE.md` for current project state and do not rewrite it unless an important architecture decision changes.
- Inspect the target resource `meta.xml`, client/server Lua, config files, and closest existing resource pattern before editing.
- For UI-backed features, also inspect `fh-ui/README.md`, `fh-ui/client.lua`, `fh-ui/web/js/runtime.js`, and a similar resource with `ui/` files.
- For complex work, search for the same event/export/elementData/database table name across the repo before editing so the full data flow is understood.
- Preserve user changes in a dirty worktree; do not revert unrelated edits.

## Advanced Operating Protocol

Use this protocol for complicated scripts, resources, rewrites, bug hunts, race conditions, or multi-resource features:

1. Define the feature boundary before coding: owner resource, server responsibilities, client responsibilities, CEF responsibilities, database state, dependencies, commands/keys, and test command.
2. Build a data-flow map: where data is created, validated, cached, synced, displayed, persisted, and cleaned up.
3. Identify contracts before implementation: event names, export names, payload fields, elementData keys, database columns, CEF component names, and command arguments.
4. Check existing patterns first and copy the project's architecture style, not generic MTA examples.
5. Make the smallest coherent change that solves the request; do not combine unrelated cleanup, redesign, renames, or architecture changes in one pass.
6. Treat resource restart as a normal path. Initialization must be idempotent, cleanup must run on stop, and duplicate event handlers/timers/render loops must not accumulate.
7. Prefer explicit state machines for complex flows such as race lifecycle, garage purchase, admin action confirmation, GPS/autodrive, cinematic sequences, rewards, or account/session transitions.
8. After editing, run a second pass only for failure modes: nil exports, wrong client/server side, stale timers, duplicate handlers, missing `meta.xml` files, untrusted client data, and CEF cache/reload problems.
9. If exact MTA API behavior is uncertain, load `mta-wiki-resource-development` and verify the official Wiki before coding.

## Professional Task Execution Standard

For large or difficult tasks, operate like a senior maintainer of this codebase:

- Start by understanding the existing resource flow before editing. Search first, then read the relevant files in full enough context.
- Separate facts from assumptions. If a behavior depends on MTA API semantics, database schema, runtime export availability, or CEF behavior, verify it instead of guessing.
- Make responsibilities explicit: server authority, client presentation/control, CEF rendering, database persistence, and cross-resource contracts.
- Prefer small, complete, reversible changes over wide rewrites. A large feature can be split into coherent phases, but every phase must leave resources startable.
- Do not silently change UX, commands, keybinds, resource ownership, database meaning, or public exports unless the user requested it or it is necessary and safe.
- Keep compatibility with existing test/demo commands and current resources unless the task is specifically to replace them.
- When multiple resources are involved, design the contract first and then implement both sides. Avoid half-wired events/exports.
- After implementation, review the diff mentally as if doing code review: correctness, lifecycle, trust boundary, performance, regression risk, and reload/test path.

## Large Resource Exploration Protocol

Use this protocol before editing a large resource or when the task is ambiguous/complex:

1. Identify the entrypoints: commands, keybinds, exports, events, timers, render handlers, database callbacks, and CEF component registration.
2. Trace the happy path and at least three failure paths: dependency missing, invalid player/vehicle/account, resource restart, and user closing/leaving mid-flow.
3. Search for shared names across the repo: event names, elementData keys, component names, database table/column names, exports, command names, CSS classes, and asset paths.
4. Read adjacent resources that already solved a similar problem and reuse their style before inventing a new pattern.
5. Decide whether the task is a bugfix, feature addition, refactor, UI recreation, integration, or migration. Do not mix categories unless required.
6. For broad changes, keep a local checklist of affected contracts and verify each one before final response.
7. If more information from the user would materially change architecture, ask a focused question. Otherwise choose the safest project-consistent path and implement.

## Architecture Decision Rules

- The owner resource is the one that owns the user-facing feature and lifecycle. Shared resources provide primitives only.
- Cross-resource integration should use guarded exports/events and capability checks, not hard startup includes.
- New persistent state needs a migration, load path, cache/update path, save path, and restart/quit handling.
- New UI needs owner-resource HTML/CSS/assets, `meta.xml` file entries, component registration, data contract, input lifecycle, and reload instructions.
- New gameplay systems need server authority, anti-spam/idempotency, cleanup on stop, and safe behavior when dependencies are stopped.
- New admin actions need server-side permission checks, destructive-action confirmation direction, target validation, and audit-friendly context.
- New commands/keybinds must avoid collisions with known project bindings and must have a safe disabled/failure state.
- Do not create a global manager/resource if a focused owner resource solves the task. Do create a shared resource only for repeated patterns used by multiple resources.

## Refactor Standard

- Refactor only when it directly improves the requested task or removes a real source of bugs.
- Preserve public behavior, exported function names, event names, command names, and UI data payloads unless explicitly changing the contract.
- When renaming, search and update every call site. Do not leave compatibility gaps between client/server/CEF files.
- When deleting code/assets, verify they are not referenced by `meta.xml`, CSS URLs, JS imports, Lua file paths, exports, autostart, or runtime string names.
- Prefer extracting helpers inside the same resource before introducing shared abstractions.
- Keep refactors incremental: first make behavior safe, then simplify structure, then remove dead code.
- Do not hide behavior changes inside formatting or cleanup.

## State Machine Rules

For complex flows, define explicit states and transitions instead of scattered booleans:

- Good examples: login cinematic, account selection, admin spectate, photo mode, GPS/autodrive, race lifecycle, reward payout, wheelspin, garage preview, weather transition.
- Every state needs enter actions, update behavior, exit cleanup, allowed transitions, and invalid transition handling.
- Store per-player server state keyed by player element/account id and clean it on quit/logout/resource stop.
- Store client state in one local table per resource and reset it on resource stop or feature close.
- Avoid impossible combinations such as `isOpen=true` while input is disabled, active route without destination, race active without vehicle, or reward visible before server confirmation.

## Regression Prevention

Before finalizing non-trivial edits, check:

- resource still starts with optional dependencies missing or delayed;
- reload/restart does not duplicate handlers, timers, markers, blips, vehicles, browsers, or CEF components;
- existing commands and keybinds still work;
- existing dashboard/admin/test integrations still find the same exports/component names;
- UI files still load after `/fhuireload` and owner resource restart;
- database migration order remains sequential;
- server never trusts client-reported money, rewards, ownership, completion, admin rank, or account id;
- no high-frequency loop does database writes, heavy searches, full CEF table patches, or repeated asset creation.

## Project Resource Map

Use this map from the current ForzaHorizon project state when choosing where logic belongs:

### Core Runtime

- `fh-ui`: one global fullscreen CEF browser, component runtime, `registerComponent`, show/hide/update/patch exports, input mode, UI reload.
- `fh-reload`: controlled resource reload overlay; do not restart global `fh-ui` for normal reload flows.
- `fh-autostart`: sequential startup list with retry. Add resources only when they should start by default and order them after runtime dependencies.
- `fh-debug`: debugscript helper, `F7` copies recent debug logs.
- `fh-fonts`: shared Lua `dxDraw` font cache via `getFont(name, size)`.

### Identity, Persistence, Economy

- `fh-database`: external MySQL connection and sequential migrations. Add schema via `fh-database/migrations/NNN.sql` only.
- `fh-login`: account selection/login CEF plus cinematic camera. UI belongs to `fh-login/ui`, Lua runs state/cinematic only.
- `fh-discord`: serial-to-Discord linking, `/discord`, bot service, avatars.
- `fh-progression`: authoritative CR/EXP/level rewards and account progress. Use its exports instead of duplicating economy logic.
- `fh-stats`: shared driving stats, milestones, dashboard stats.
- `fh-accolades`: long-term achievement checklist using stats/discovery/boards/level.

### UI / HUD / Menus

- `fh-hud`: custom driving HUD/speedometer through `fh-ui`; hides default MTA HUD.
- `fh-dashboard`: pause/dashboard on `Escape`/`F5`, map tiles, blips from other resources, player stats/accolades.
- `fh-admin`: admin workspace on `F10`/`/adminpanel`; includes player, vehicle, resource, server, and test actions with permission-sensitive destructive operations.
- `fh-radio`: SomaFM radio UI/audio, stations changed only by `[` and `]`, left side above radar.
- `fh-photo-mode`: free camera on `F9`/commands, CEF overlay, blocks controls while active.
- `fh-weather`: dynamic weather/time plus CEF transition overlay; do not re-add the removed rain-droplet effect unless explicitly requested.
- `fh-luna`: quick radial/menu actions from radar under `K`, including photo mode, autodrive, what's next, lights.
- `fh-nametags`: custom nametags with Discord avatars, currently local player only.

### Vehicles, World, Activities

- `fh-vehicles`: source of truth for custom vehicle catalog, model streaming, vehicle slug, lights/damage protection.
- `fh-handling`: per-slug handling generated from `fh-vehicles` catalog and `fh-handling/data.lua`; reload command `/fhhandlingreload`.
- `fh-gps`: route/destination provider used by dashboard/LUNA/autodrive.
- `fh-discovery`: discovery markers/blips, account-scoped rewards and `user_discoveries`.
- `fh-boards`: bonus boards, account-scoped rewards and `user_bonus_boards`.
- `fh-points`: skill chain/combo system, banks rewards through `fh-progression`.
- `fh-races`: test race flow, event/lobby/countdown/checkpoints/race HUD, `/racetest` and related commands.
- `fh-race-finish`: separate test finish screen, not wired to `fh-races` yet.
- `wheelspin-test`: separate test wheelspin UI, not wired to real `fh-wheelspin`.

### Project Direction

- Prefer owner-resource UI files registered through `fh-ui`; only reusable runtime primitives belong in `fh-ui`.
- Use existing data providers instead of duplicate state: `fh-vehicles` for cars, `fh-progression` for CR/EXP/levels, `fh-stats` for stats, dashboard blip providers for map markers.
- Treat `AGENT_STATE.md` "Następne kroki" as project context, not automatic tasks.
- When a feature crosses resources, define the owner resource and use guarded runtime exports/events instead of hard dependency includes.

## Resource Architecture Rules

- Do not add `<include resource="..." />` to `meta.xml` for ordinary dependencies.
- Check optional dependencies at runtime with `getResourceFromName`, `getResourceState`, and guarded `pcall` around exports.
- Keep feature files inside the owning `fh-RESOURCE` folder; do not put feature UI into `fh-ui` unless it is a reusable runtime/core component.
- Keep config data in `config.lua` or data modules where existing resources do that; avoid hard-coded large tables inside handlers.
- Add new resources to `fh-autostart/config.lua` only when they should run by default, and place them after their runtime dependencies.
- Do not restart or stop protected core resources from admin/test flows unless explicitly requested and safely confirmed.
- Prefer narrow owner resources over bloating an existing resource. Use shared resources only for reusable primitives, not one-off feature logic.
- When adding exports, events, commands, elementData, or database tables, choose names that include the resource/feature prefix and search for collisions first.
- Keep resource startup tolerant: missing optional dependencies should delay, no-op, or degrade gracefully instead of crashing the whole feature.

## Code Quality Rules

- Keep Lua files cohesive: config/data, client runtime, server runtime, and UI bridge should not be mixed into one giant file unless the existing resource is tiny.
- Use descriptive local helper names and state table fields. Avoid one-letter variables except short loop indices or vector unpacking.
- Keep functions small enough to reason about. Extract validation, payload formatting, cleanup, and UI update helpers when handlers grow complex.
- Return early for invalid state to reduce nested branches, especially in event handlers and command handlers.
- Keep payload shapes consistent. If Lua sends `{ level, money, exp }`, CEF should not expect different names such as `{ playerLevel, credits }` unless mapped deliberately.
- Use constants/config tables for repeated command names, event names, component names, timings, distances, and reward values.
- Avoid hidden globals. If a shared table is needed, intentionally create it in a shared helper like existing project patterns.
- Do not add comments unless explicitly asked; make code clear through naming and structure.

## Lua / MTA Safety

- Use local helper functions and local state tables instead of accidental globals.
- Validate elements with `isElement` before acting on vehicles, players, markers, blips, browsers, or timers.
- Check timer handles with `isTimer` before killing them and nil the handle after cleanup.
- Kill timers and remove event handlers on resource stop when they are not automatically scoped or when duplicated starts are possible.
- Keep high-frequency client loops throttled; prefer `onClientPreRender` for camera/vehicle cinematic logic and avoid unnecessary `onClientRender` UI drawing when CEF is the intended layer.
- Guard server events: validate `client`, target player, account/session state, numeric ranges, string lengths, table sizes, and permissions before destructive actions.
- Never trust player-sent prices, rewards, account ids, vehicle ownership, admin level, position, target player identity, or completion state. Recompute or verify server-side.
- Keep admin/test commands isolated and permission-aware; do not expose destructive actions to all players.
- Use server-side authority for economy, rewards, inventory/vehicles, race results, progression, account selection, bans/kicks, and persistence.
- For element data, use stable project prefixes such as `fh-resource:key` and avoid high-frequency server-synced element data when local state is enough.
- For client performance, avoid creating/destroying markers, blips, shaders, fonts, textures, or render targets every frame. Cache resources and destroy them on stop.
- Do not use `getElementsByType` or distance scans every frame across large sets without caching, spatial filtering, throttling, or early exits.
- Debounce commands, keybinds, UI buttons, and remote events that can trigger expensive work, rewards, spawns, database writes, or resource restarts.
- Keep public event payloads simple and version-tolerant: validate type defaults, ignore unknown fields, and avoid depending on table key iteration order.

## Client/Server Event Contracts

- Define one clear direction for every event: client -> server request, server -> client state push, or local UI event. Do not use one event name for multiple meanings.
- For remote server events, call `addEvent(eventName, true)` only for events that must be remotely triggerable. Keep internal events local-only.
- In server handlers triggered by clients, use the built-in `client` variable as the authority for who sent the event. Do not accept a player element in the payload as the actor.
- For target actions, resolve and validate the target server-side, then check distance/permissions/session/resource state before applying the effect.
- For server-to-client updates, target only the relevant player(s) unless the data is genuinely global.
- Avoid sending high-frequency full tables to CEF or all clients; send small patches, throttle updates, and batch changes when possible.
- Add debug messages for important failure branches, but do not spam per-frame or per-tick logs.

## Async / Timing Rules

- Treat database callbacks, timers, browser readiness, resource start order, model loading, and streamed-in elements as asynchronous.
- Re-check player/vehicle/resource/component validity inside callbacks, not only before starting the async operation.
- Store request tokens or state versions when an older callback could overwrite newer state, especially for UI lists, selected account/vehicle, admin target, GPS route, or race session.
- Cancel or ignore stale callbacks when the player logs out, leaves a vehicle, closes a panel, changes account, restarts a resource, or starts another activity.
- Do not assume CEF is ready immediately after resource start; use existing `fh-ui` patterns and retry/no-op safely when unavailable.
- For cinematic/camera/control flows, always restore camera target, controls, cursor, chat/HUD visibility, dimension/interior, and input mode on every exit path.

## Database And Persistence

- Add schema changes as sequential `fh-database/migrations/NNN.sql` files; do not execute ad-hoc schema Lua in normal resources.
- Keep migrations idempotent when possible and compatible with the existing MySQL loader.
- Store account-scoped progression/discovery/stat data by user/account id, not by display name.
- Use existing progression exports for CR/EXP rewards instead of duplicating money/level logic.
- If a resource depends on database state, handle database/resource not-ready cases gracefully and retry or no-op with a clear debug message.
- Never build SQL by concatenating untrusted player input. Use existing database helper/export patterns or parameterized `dbQuery`/`dbExec` placeholders where direct database access is used.
- Keep writes bounded and intentional. Batch or debounce stat/progression saves instead of writing every frame, every marker tick, or every UI patch.
- When adding account data, define how it loads on login, caches during session, saves on logout/resource stop, and handles reconnect/resource restart.
- For migrations, inspect the latest `fh-database/migrations/NNN.sql`, choose the next number, and update only schema/data that belongs to the requested feature.
- When a migration adds unique constraints, indexes, or foreign-key-like relations, ensure the server code handles duplicate/constraint failures gracefully.

## CEF / fh-ui Integration

- Register owner-resource components before showing them:

```lua
exports['fh-ui']:registerComponent('component-name', 'fh-resource', 'ui/view.html', 'ui/view.css', 'ui/view.js')
```

- Use HTML/CSS only plus `data-ui-*` bindings for simple static views; add JS only for DOM generation, interaction, or animation sequencing.
- Show temporary views with `showComponent`, update live data with `patchComponentData`, and close with `hideComponent` so the DOM is unmounted.
- Use `setInputMode(true)` only for interactive panels and always restore it on close/resource stop.
- Add every HTML, CSS, JS, image, icon, font, audio, and other CEF asset to the owner `meta.xml` as `<file src="..." />`.
- Keep browser paths relative to the CSS/HTML file location and avoid external URLs/CDNs for runtime assets.
- On owner resource stop, hide temporary components, restore input mode, and unregister owner components with `unregisterResourceComponents` when the resource registered CEF views.
- Do not call `executeBrowserJavascript` with hand-built strings containing player input. Send data through existing `fh-ui` exports or JSON serialization patterns.
- Keep JS state presentational. Server truth remains in Lua; CEF must not decide rewards, permissions, prices, ownership, or completion.
- Namespace CSS with a component root class and avoid global `body`, `button`, `*`, or generic `.card` rules unless editing the shared `fh-ui` runtime intentionally.
- For interactive CEF panels, define close paths for `Esc`, resource stop, command toggle, and external state changes so cursor/input cannot get stuck.
- Avoid remount storms. For HUD/speedometer/live widgets, mount once and patch small fields at a throttled interval.

## Integration Decision Matrix

Use this matrix before creating or changing a resource:

- Login/account/cinematic login screen -> `fh-login`; do not move login UI into `fh-ui`.
- CR/EXP/level/money rewards -> `fh-progression`; world systems should call its reward API.
- Long-term stat counters -> `fh-stats`; dashboard reads from it.
- Achievements/checklists -> `fh-accolades`; do not bury accolade completion in unrelated resources.
- Car catalog/model/slug/streaming -> `fh-vehicles`; handling tweaks -> `fh-handling`.
- Buying/selecting/spawning owned cars in future -> new `fh-garage`/`fh-autoshow` style resource, using `fh-vehicles` and `fh-progression`.
- Map markers/blips for dashboard -> expose/provider pattern like `getDashboardBlips()` instead of hardcoding in dashboard.
- Bonus board/discovery reward persistence -> `fh-boards`/`fh-discovery`, not dashboard.
- Skill chain/drift/air/speed combo -> `fh-points`; final banked reward goes to `fh-progression`.
- Race gameplay -> `fh-races`; finish presentation currently lives in separate `fh-race-finish` unless user asks to wire them.
- Radio station/audio metadata -> `fh-radio`; do not reintroduce scroll station changing.
- Photo camera/control overlay -> `fh-photo-mode`; restore controls/camera/input on every exit path.
- Weather/time timeline -> `fh-weather`; keep removed rain-droplet effect removed unless user explicitly requests it.
- Admin/server destructive actions -> `fh-admin`, with server-side permissions and confirmation/audit direction.
- Generic notifications/dialogs/settings/audio/keybar/router are planned future shared resources; do not invent partial shared systems unless the user asks.

## Complex Feature Patterns

### Race / Activity Flow

- Model lifecycle explicitly: discovery/preview -> join -> setup -> countdown -> active -> finish/fail/leave -> reward -> cleanup.
- Keep race/activity authority server-side for entry rules, checkpoint completion, timing validation, rewards, cooldowns, and persistence.
- Client may render checkpoints/HUD and predict visuals, but server must validate finish and rewards.
- Always handle player quit, death, vehicle exit/destroy, resource stop, timeout, and manual leave.

### Vehicle / Garage / Autoshow Flow

- Use `fh-vehicles` catalog/slug as the source of truth for custom vehicles. Do not duplicate model lists in unrelated resources.
- Validate ownership, selected account, price, currency, spawn position, and model availability server-side.
- Apply slug/model/handling through existing `fh-vehicles` and `fh-handling` patterns instead of creating separate custom-model logic.
- Clean up preview/test vehicles and reset camera/input/interior/dimension on exit or resource stop.

### Admin / Permission Flow

- Check permissions server-side for every admin action even if the CEF button is hidden.
- Add confirmation or explicit command separation for destructive actions such as ban, kick, shutdown, restart core resources, mass reward, or data reset.
- Log enough context for audit-worthy actions: admin, target, action, payload, and result, without logging secrets.
- Do not expose raw resource control or server settings to lower ranks through client-provided action names.

### GPS / Autodrive / World Systems

- Treat route, destination, driver, vehicle, and activity state as separate state fields. Clear them independently when invalid.
- Validate vehicle existence, driver seat, player control, active route, and distance from route before applying autodrive control.
- Throttle route/path calculations and nearest-blip scans; cache dashboard/discovery/board/speedcamera providers where practical.
- Always provide a safe cancel path for autopilot, cinematic camera, forced controls, and temporary dimensions/interiors.

### Rewards / Progression / Economy

- Use `fh-progression:awardReward` or the existing progression API for CR/EXP whenever available.
- Server decides final reward amounts. Client UI may display predicted or returned values only.
- Add anti-spam/cooldown/idempotency for repeatable events, pickup-like triggers, finish events, and client-reported achievements.
- Persist one-time completion state before or atomically with reward payout where possible, so reconnect/retrigger does not duplicate rewards.

## Project Debug / Reload / Test Commands

Use existing project commands when validating or explaining in-game checks:

- Controlled resource reload: `/fhr <resource>` or `/fhreload <resource>` through `fh-reload` when available.
- Global CEF reload: `/fhuireload` or `F6` when UI assets/runtime need refresh.
- Debug log copy: `F7` through `fh-debug`.
- Handling reload: `/fhhandlingreload`.
- Common UI/system tests: `/pointstest`, `/progressiontest`, `/leveluptest`, `/statstest`, `/accoladestest`, `/weathertest [index]`, `/boardsreset`, `/racetest`, `/raceui`, `/raceleave`, `/finishuitest`, `/racefinishtest`, `/wheelspintestui`, `/wheelspinopen`.
- Admin panel: `F10` or `/adminpanel`; dashboard/pause: `Escape` or `F5`; photo mode: `F9`, `/photomode`, `/foto`; LUNA quick menu: `K`; radio station change: `[` and `]`.

Do not invent new test commands when an existing one already covers the feature. If a new command is needed, make it admin-safe and temporary/test-scoped.

## Bugfix / Debugging Protocol

- Reproduce the bug path from code when in-game reproduction is unavailable: command/key -> event/export -> state mutation -> UI/data update -> cleanup.
- Search for duplicate event handlers, duplicate timers, stale CEF component names, wrong resource names, and mismatched event payload fields before rewriting logic.
- For CEF issues, check in this order: file listed in `meta.xml`, component registered, HTML/CSS/JS path correct, runtime binding name matches data key, component is visible, z-index/input mode, CEF cache/reload.
- For nil export errors, check resource state and export name/type before changing call sites.
- For intermittent bugs, look for resource restart order, async database callbacks, delayed browser creation, timers firing after cleanup, and stale element handles.
- Prefer adding small guard clauses and lifecycle cleanup over broad rewrites when the existing architecture is sound.

## meta.xml Checklist

- Include all Lua files with the correct `type="client"`, `type="server"`, or shared loading pattern used by that resource.
- Include all CEF/static files with `<file src="..." />`; missing entries often appear as CEF load failures in-game.
- Keep script order intentional: shared config/data before files that consume it, client/server entrypoints after helpers.
- Export only stable functions that other resources need; document new exports briefly in the final response or README when appropriate.
- Do not add dependency includes; use runtime checks instead.

## Senior Code Review Checklist

Before saying a difficult task is done, review the change against these questions:

- Does every new event/export/command have exactly one intended owner and clear direction?
- Can a malicious client trigger this path with forged data and gain money, rewards, admin power, vehicles, or persistence changes?
- What happens if the player quits, resource restarts, dependency stops, vehicle is destroyed, CEF reloads, or DB callback returns late?
- Are timers/render handlers/event handlers added once and cleaned up?
- Are all new files referenced by `meta.xml`, and are all removed/renamed files unreferenced?
- Are data payload keys consistent across Lua, JS, HTML bindings, and CSS variables?
- Is the implementation using existing project providers instead of duplicating state?
- Is any loop too frequent for its work, especially distance scans, CEF patches, database writes, or asset creation?
- Did the change accidentally alter unrelated UI/commands/resources or future architecture notes?
- Is there a practical in-game validation command/path the user can run?

## Verification

- Check `meta.xml` paths against actual files after adding/removing assets.
- Run a lightweight Lua syntax check if available, or at least inspect changed Lua for missing `end`, invalid event names, and accidental globals.
- For UI changes, verify the component is registered, shown/hidden correctly, and reload instructions are clear: restart owner resource and `/fhuireload` when needed.
- For database changes, confirm the migration number is next in sequence and mention that `fh-database` must run migrations.
- For autostart changes, confirm the resource order still starts dependencies before consumers.
- For server/client contracts, re-check every new or changed event/export call site for matching name, side, payload fields, and validation.
- For lifecycle-sensitive features, inspect start/stop/restart paths: event handlers, timers, element cleanup, cursor/input mode, browser components, vehicles, markers, blips, and dimensions/interiors.
- When no test command exists and the feature is non-trivial, add or reuse a safe admin/test command only if the project pattern supports it and the command is permission-safe.
- If no automated lint/typecheck exists for Lua, use targeted static checks: search changed files for `addEventHandler`, `setTimer`, `triggerServerEvent`, `triggerClientEvent`, `exports[`, `executeBrowserJavascript`, and `setElementData`, then verify each risky call manually.

## Reporting

- State files changed and the feature/resource affected.
- State verification performed, including path/syntax checks or why in-game validation is still needed.
- Mention required reload commands only when relevant, for example restart `fh-resource` and `/fhuireload`.
- Keep the response short; do not summarize the whole project or `AGENT_STATE.md`.
