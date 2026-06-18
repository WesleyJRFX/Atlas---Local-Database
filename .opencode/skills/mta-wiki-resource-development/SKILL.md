---
name: mta-wiki-resource-development
description: MTA Wiki, wiki.multitheftauto.com, Lua API, CEF/browser UI, events, elements, meta.xml, client/server functions. Use when creating or changing MTA resources and you need current knowledge from the official Multi Theft Auto Wiki.
---

# MTA Wiki Resource Development

## Activation Rule

Use this skill only when the current task matches this domain, project type, file type, reference material, or risk profile. Select it through skill-router or obvious task context; do not keep all skills active at once. Inspect relevant files and verify results before final response.

Use this skill when a task depends on exact MTA API behavior, official Lua function names, event signatures, element types, ACL/admin details, `meta.xml` syntax, CEF/browser behavior, vehicles, markers, blips, database functions, or other documentation from the official MTA Wiki.

Primary reference:

- `https://wiki.multitheftauto.com/wiki/Strona_g%C5%82%C3%B3wna` - Polish MTA Wiki main page.
- Prefer direct function/event pages once the needed API name is known, for example `https://wiki.multitheftauto.com/wiki/CreateVehicle`.

## When To Trigger

- The user asks to create, fix, or review MTA resources and the implementation needs API details beyond existing project patterns.
- The task mentions MTA Wiki, official docs, Lua API, events, elements, `meta.xml`, ACL, CEF/browser UI, `createBrowser`, `guiCreateBrowser`, browser events, input injection, local HTML, OOP syntax, shaders, vehicles, markers, colshapes, pickups, commands, or exports.
- You are unsure about exact parameter order, return values, client/server availability, event source/client semantics, required element type, or version notes.
- Existing code uses an MTA function/event that may have edge cases or deprecated behavior.

## Research Workflow

1. Identify the exact MTA concepts needed: function, event, element type, XML tag, ACL right, or scripting topic.
2. Fetch the official MTA Wiki page before guessing when exact syntax matters.
3. Prefer English direct pages for function/event names because URLs usually match API identifiers; use the Polish main page as the starting point when browsing categories or tutorials.
4. Cross-check related pages when needed: for example function page plus event page, element type page, or `meta.xml` page.
5. Extract only implementation-critical facts: syntax, required arguments, optional arguments, return values, client/server side, source/client behavior, version notes, examples, and warnings.
6. Apply the information to the local resource using the project's existing ForzaHorizon conventions.

## Wiki-Backed Coding Protocol

Use this stricter protocol whenever code correctness depends on official API behavior:

1. Before editing, write down the exact API facts that matter: side, source element, predefined variables, return value, failure cases, and required `addEvent`/ACL/meta entry.
2. Compare those facts against the local script side and loading order. If a function is client-only, it must not be reachable from server Lua, and the opposite applies too.
3. For event handlers, verify what `source`, `client`, `this`, and handler arguments mean for that event. Do not assume `source` is the player.
4. For element functions, verify the required element type and what happens when the element is destroyed or invalid.
5. For optional arguments, do not rely on memory. Check default values if behavior changes safety, visibility, dimension/interior, sync, or persistence.
6. For functions returning `false`, handle the failure branch explicitly instead of continuing with invalid handles.
7. For performance-sensitive APIs, check whether the function is safe to call per frame or should be throttled/cached.

## Implementation Rules For This Project

- Combine this skill with `mta-resource-development` for actual changes in `fh-*` resources.
- Do not add `<include resource="..." />` to `meta.xml`; use runtime checks with `getResourceFromName`, `getResourceState`, and guarded `pcall` exports.
- Keep owner-resource CEF files in the owner resource and register them through `fh-ui`.
- Validate `meta.xml` asset paths whenever docs lead to adding files, scripts, exports, or HTML/CEF assets.
- Keep client/server API separation strict. If the Wiki marks a function as client-only or server-only, place the call on that side and bridge with events only when needed.
- For events triggered from client to server, validate `client`, element validity, permissions, numeric ranges, string lengths, table sizes, and account/session state before trusting payloads.
- For server-to-client events, prefer explicit target players and avoid broadcasting high-frequency data unless necessary.
- Use the Wiki examples only as API demonstrations. Rewrite them to match local state tables, runtime dependency checks, permissions, cleanup, and `fh-ui` patterns.
- If a Wiki page mentions version changes or deprecation and this server version may differ, choose the safer older-compatible pattern or state that in-game validation is required.

## Security-Critical MTA Semantics

- The `client` variable in a server event handler is the sender. Use it as the actor and reject/ignore payloads that claim a different actor unless the action explicitly targets another player and permission checks pass.
- `source` can be the event source element chosen by the trigger, not necessarily the player. Check the event page before relying on it.
- `addEvent(name, true)` makes a custom event remotely triggerable. Do not set `true` for internal-only events.
- Client-side checks, hidden buttons, disabled controls, and CEF state are not permissions. Repeat all destructive/economy/persistence permission checks server-side.
- Element handles can become invalid between timer ticks, async callbacks, event triggers, and resource restarts. Check `isElement` close to use.
- ACL/resource permission functions have side effects on who may perform server actions; verify exact object names and rights before using them.

## CEF / Browser UI Knowledge From MTA Wiki

When creating UI in CEF, use the MTA Wiki browser pages as the source of truth and capture the details that affect implementation:

- MTA uses `browser` elements for CEF pages. The common functions are `createBrowser` for custom DX-rendered browsers and `guiCreateBrowser` for CEGUI-managed browser elements.
- `guiCreateBrowser` handles inputs internally and can be attached to GUI windows; `createBrowser` is better for custom DX interfaces and manual rendering/input handling.
- Browser creation is asynchronous. Do not call `loadBrowserURL` immediately after `createBrowser`/`guiCreateBrowser`; wait for `onClientBrowserCreated` and then load the URL.
- `onClientBrowserCreated` has no parameters and its source is the browser element.
- Local content is loaded through MTA local URLs such as `http://mta/local/...`; every local HTML/CSS/JS/image/font/audio file must be listed in `meta.xml` with `<file src="..." />`.
- `isLocal` controls whether the browser can load only local content or remote web content. Prefer local browsers for project UI.
- Remote pages can fail if the player disables remote pages or if domains are blocked. Use `requestBrowserDomains`, `isBrowserDomainBlocked`, and whitelist events only when external content is truly required.
- `isTransparent` enables transparent CEF rendering. Use it for overlay HUDs/panels; set transparent backgrounds in CSS when needed.
- Browser size must be at least 1x1. Use `guiGetScreenSize`, `resizeBrowser`, and responsive CSS when the UI must handle resolution changes.
- `executeBrowserJavascript` runs JS in the browser context. Escape and serialize data safely, preferably through JSON encoding patterns used by `fh-ui`, never by string-concatenating untrusted values.
- Use `focusBrowser`, `isBrowserFocused`, `showCursor`, and project input-mode helpers for interactive UI. Always restore cursor/input state when closing panels.
- For DX/browser rendering patterns, `dxDrawImage` can draw the browser surface returned by `createBrowser`; manual mouse input requires `injectBrowserMouseMove`, `injectBrowserMouseDown`, `injectBrowserMouseUp`, and `injectBrowserMouseWheel`.
- Browser lifecycle matters: check elements with `isElement`, remove event handlers/timers where needed, pause rendering with `setBrowserRenderingPaused` for hidden long-lived browsers, and destroy unused browser/GUI elements when a resource stops.
- Useful browser events include `onClientBrowserDocumentReady`, `onClientBrowserLoadingStart`, `onClientBrowserLoadingFailed`, `onClientBrowserNavigate`, `onClientBrowserResourceBlocked`, `onClientBrowserPopup`, `onClientBrowserInputFocusChanged`, `onClientBrowserCursorChange`, `onClientBrowserTooltip`, and `onClientBrowserWhitelistChange`.
- Supported browser media formats are limited on the Wiki browser page: WEBM video and OGG audio are supported; MP4 video and MP3 audio are marked unsupported. For MTA-side streamed music, prefer native sound functions when the project already does that.

## CEF Rules For ForzaHorizon UI

- In this project, do not create a new standalone CEF browser for ordinary views. Use the global `fh-ui` browser and register owner-resource components unless the task explicitly requires low-level browser work.
- Keep HTML/CSS/JS inside the owner resource, not inside `fh-ui`, unless changing the shared runtime itself.
- Register CEF components with `exports['fh-ui']:registerComponent(name, resourceName, htmlPath, cssPath, jsPath)` before showing them.
- Use `showComponent`, `hideComponent`, `setComponentData`, and `patchComponentData` instead of direct browser manipulation for normal UI.
- Use `setInputMode(true)` only for interactive CEF panels and restore it on close/resource stop.
- For simple UI, prefer HTML/CSS plus `data-ui-text` bindings; add JS only for generated DOM, click handlers, data transforms, or animation sequencing.
- Avoid CDNs/external assets in game UI. Package fonts, images, SVGs, scripts, CSS, and sounds locally and list them in the owner `meta.xml`.
- After UI file changes, mention required reload steps: restart the owner resource and run `/fhuireload` when the global CEF must refresh cached files.

## API Risk Levels

Classify MTA API usage before implementation:

- **Low risk**: local visual/client-only UI helpers, simple getters, formatting, static blips/markers with cleanup.
- **Medium risk**: element manipulation, controls, camera, vehicle handling, timers, browser input, resource lifecycle, streamed elements.
- **High risk**: remote events, admin actions, ACL, economy/rewards, database writes, bans/kicks, resource start/stop, account/session state, file/network/browser domain access.

For high-risk usage, verify the Wiki page and local project pattern before coding, then add explicit validation and cleanup. Never rely only on memory or example snippets.

## MTA Wiki Facts To Capture

When reading a Wiki page, note these items before coding:

- **Syntax**: exact parameter order, optional defaults, and expected Lua types.
- **Side**: client, server, or shared availability.
- **Returns**: false/nil cases and element handles that must be checked with `isElement`.
- **Events**: event source, available predefined variables such as `client`, cancelability, and whether `addEvent` is required for remote triggering.
- **Security**: ACL requirements, trust boundary, and whether the function can affect other players/resources.
- **Version**: minimum MTA version and deprecated aliases or changed behavior.
- **Examples**: useful official examples, but adapt them to local naming and safety patterns rather than copying blindly.

## Common Direct Pages

Use these as common entry points when relevant:

- Resource/meta: `https://wiki.multitheftauto.com/wiki/Meta.xml`, `https://wiki.multitheftauto.com/wiki/Resource`, `https://wiki.multitheftauto.com/wiki/Exports`
- Events: `https://wiki.multitheftauto.com/wiki/AddEvent`, `https://wiki.multitheftauto.com/wiki/AddEventHandler`, `https://wiki.multitheftauto.com/wiki/TriggerClientEvent`, `https://wiki.multitheftauto.com/wiki/TriggerServerEvent`
- Elements: `https://wiki.multitheftauto.com/wiki/Element`, `https://wiki.multitheftauto.com/wiki/IsElement`, `https://wiki.multitheftauto.com/wiki/Element_data`
- Vehicles: `https://wiki.multitheftauto.com/wiki/CreateVehicle`, `https://wiki.multitheftauto.com/wiki/SetVehicleHandling`, `https://wiki.multitheftauto.com/wiki/Vehicle_Handling_Settings`
- CEF/browser basics: `https://wiki.multitheftauto.com/wiki/Element/Browser`, `https://wiki.multitheftauto.com/wiki/CreateBrowser`, `https://wiki.multitheftauto.com/wiki/GuiCreateBrowser`, `https://wiki.multitheftauto.com/wiki/GuiGetBrowser`, `https://wiki.multitheftauto.com/wiki/LoadBrowserURL`, `https://wiki.multitheftauto.com/wiki/ExecuteBrowserJavascript`
- CEF/browser control: `https://wiki.multitheftauto.com/wiki/FocusBrowser`, `https://wiki.multitheftauto.com/wiki/IsBrowserFocused`, `https://wiki.multitheftauto.com/wiki/ResizeBrowser`, `https://wiki.multitheftauto.com/wiki/ReloadBrowserPage`, `https://wiki.multitheftauto.com/wiki/SetBrowserRenderingPaused`, `https://wiki.multitheftauto.com/wiki/IsBrowserRenderingPaused`, `https://wiki.multitheftauto.com/wiki/SetBrowserVolume`, `https://wiki.multitheftauto.com/wiki/ToggleBrowserDevTools`
- CEF/browser navigation and properties: `https://wiki.multitheftauto.com/wiki/GetBrowserURL`, `https://wiki.multitheftauto.com/wiki/GetBrowserTitle`, `https://wiki.multitheftauto.com/wiki/GetBrowserSource`, `https://wiki.multitheftauto.com/wiki/GetBrowserProperty`, `https://wiki.multitheftauto.com/wiki/SetBrowserProperty`, `https://wiki.multitheftauto.com/wiki/CanBrowserNavigateBack`, `https://wiki.multitheftauto.com/wiki/NavigateBrowserBack`, `https://wiki.multitheftauto.com/wiki/CanBrowserNavigateForward`, `https://wiki.multitheftauto.com/wiki/NavigateBrowserForward`
- CEF/browser input: `https://wiki.multitheftauto.com/wiki/InjectBrowserMouseMove`, `https://wiki.multitheftauto.com/wiki/InjectBrowserMouseDown`, `https://wiki.multitheftauto.com/wiki/InjectBrowserMouseUp`, `https://wiki.multitheftauto.com/wiki/InjectBrowserMouseWheel`
- CEF/browser domains and AJAX: `https://wiki.multitheftauto.com/wiki/RequestBrowserDomains`, `https://wiki.multitheftauto.com/wiki/IsBrowserDomainBlocked`, `https://wiki.multitheftauto.com/wiki/SetBrowserAjaxHandler`
- CEF/browser events: `https://wiki.multitheftauto.com/wiki/OnClientBrowserCreated`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserDocumentReady`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserLoadingStart`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserLoadingFailed`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserNavigate`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserResourceBlocked`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserPopup`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserInputFocusChanged`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserCursorChange`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserTooltip`, `https://wiki.multitheftauto.com/wiki/OnClientBrowserWhitelistChange`
- GUI/input: `https://wiki.multitheftauto.com/wiki/ShowCursor`, `https://wiki.multitheftauto.com/wiki/BindKey`, `https://wiki.multitheftauto.com/wiki/ToggleControl`
- Drawing/render: `https://wiki.multitheftauto.com/wiki/DxDrawImage`, `https://wiki.multitheftauto.com/wiki/DxCreateRenderTarget`, `https://wiki.multitheftauto.com/wiki/OnClientRender`, `https://wiki.multitheftauto.com/wiki/OnClientPreRender`
- Database: `https://wiki.multitheftauto.com/wiki/DbConnect`, `https://wiki.multitheftauto.com/wiki/DbQuery`, `https://wiki.multitheftauto.com/wiki/DbExec`, `https://wiki.multitheftauto.com/wiki/DbPoll`
- ACL/admin: `https://wiki.multitheftauto.com/wiki/HasObjectPermissionTo`, `https://wiki.multitheftauto.com/wiki/IsObjectInACLGroup`

## Verification

- Re-read changed Lua around every documented API call and check parameter order against the Wiki facts.
- Confirm event names, `addEvent(..., true)` usage, and `client` validation for remote events.
- Confirm client-only functions are not loaded in server scripts and server-only functions are not loaded in client scripts.
- Confirm new files are listed in `meta.xml` and script order matches dependencies.
- For CEF UI, confirm local URL/resource paths, browser-created timing, input mode restoration, and whether the view should go through `fh-ui` instead of a raw browser.
- Mention in the final response which MTA Wiki facts were used when they materially affected the implementation.

## Reporting

- Keep the final answer short: what was changed, where, and what Wiki-backed checks were applied.
- If a Wiki page was unavailable or ambiguous, state the safe assumption used and the exact part that still needs in-game validation.
- Remind the user to restart opencode after adding or changing this skill because skills are not hot-reloaded.
