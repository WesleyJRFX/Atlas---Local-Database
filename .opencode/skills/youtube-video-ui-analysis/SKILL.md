---
name: youtube-video-ui-analysis
description: YouTube, youtu.be, ffmpeg frame capture, preview clip, video reference, film, klip, urywek, gameplay UI, animation timing. Use when the user wants to inspect a YouTube video, sample frames, create a short preview video, read visual details, and recreate UI or animations from the clip.
---

# YouTube Video UI Analysis

## Activation Rule

Use this skill only when the current task matches this domain, project type, file type, reference material, or risk profile. Select it through skill-router or obvious task context; do not keep all skills active at once. Inspect relevant files and verify results before final response.

Use this skill when the user sends a YouTube link or asks to analyze a YouTube video/clip as a visual reference for UI, HUD, menus, transitions, effects, motion, or animation timing.

## Goal

Turn YouTube footage into concrete UI implementation guidance for this MTA project:

- inspect key frames and visible UI states instead of guessing from memory;
- capture representative screenshots/frames for layout, color, typography, and effects;
- read motion: entry/exit transitions, timing, easing, stagger, camera relation, glow/blur/fade behavior;
- translate the reference into CEF/fh-ui HTML/CSS/JS and Lua integration when the user asks for implementation.

## Tool Priority

- Load `web-link-research` too when the task starts from a YouTube URL.
- Prefer terminal extraction with `yt-dlp`, `ffprobe`, and `ffmpeg` for repeatable work; browser watching is a fallback for access issues or interactive pages.
- Load `browser-internet-research` too only when the video must be watched in a browser, paused, scrubbed, or screenshotted because extraction is unavailable.
- Load `detailed-image-recognition` too when analyzing captured frames/screenshots.
- Load `local-media-ui-analysis` too when working from a downloaded MP4, generated preview clip, audio waveform, or extracted local frames.
- If `ffmpeg`/`ffprobe` are missing, verify with a quick version command and then fall back to browser screenshots or ask for a local MP4; do not install large tools without explicit user request.
- Do not claim a video was watched or frame-inspected unless screenshots/frames were actually captured or a browser view was actually inspected.

## Efficiency Rules

- Work from a bounded clip, not the full video. Default to 8-20 seconds around the user timestamp; if no timestamp is provided, sample likely relevant segments first and choose one range.
- Create all temporary media under `C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\` so repeated attempts do not clutter the repo.
- Avoid downloading the whole source when possible. Use `yt-dlp --download-sections` or direct format URLs with `ffmpeg -ss/-t` to clip first.
- Use low-resolution preview assets for analysis first: 720p or less is usually enough for UI, unless text/icon detail requires higher resolution.
- Limit frame counts: extract 6-12 key frames for most UI analysis, or 1-2 fps only for short transition windows.
- Always add timeouts to long shell commands when the tool supports it. If a command stalls or produces no progress, stop and switch method instead of retrying blindly.
- Prefer one concise command batch per step: metadata, clip extraction, frame extraction, preview generation. Do not run open-ended playback commands.

## Anti-Stall Rules

This environment can appear to freeze when `yt-dlp` or `ffmpeg` waits on network/video data. Treat media commands as bounded operations, never as open-ended downloads.

- Set a shell timeout on every `yt-dlp`/`ffmpeg` command: 15-30 seconds for metadata/direct URLs, 45-90 seconds for clip extraction, and 30-60 seconds for frame extraction.
- Add `yt-dlp` network limits: `--socket-timeout 10 --retries 1 --fragment-retries 1 --no-playlist --no-warnings` unless there is a reason to keep warnings.
- Prefer direct URL + `ffmpeg` cutting when section downloads hang. First run `yt-dlp -g`, then run `ffmpeg -ss/-t` against the returned URL.
- If a command exceeds its timeout or prints no useful progress, do not rerun the same command more than once. Switch to browser screenshots, `webfetch` metadata, or ask for a local MP4/screenshots.
- Use `ffmpeg -nostdin -hide_banner -loglevel error -stats` so the process cannot wait for terminal input and the console stays readable.
- Never run full-video downloads (`yt-dlp <url>` without `--download-sections`, `-g`, or a strict bounded format/clip plan) for UI analysis.
- Avoid large/ambiguous format merges during first pass. Start with `best[height<=720]/b[height<=720]/best` or a direct video-only URL for silent visual analysis.
- Keep all generated assets small: short clips, scaled frames, and low fps. Analysis should continue from partial frames if enough visual evidence exists.

## Safe Download / Capture Stage

The download/capture stage is the most failure-prone part. Follow this exact escalation order so the console does not hang.

1. Metadata only, no media:
   - Run `yt-dlp --skip-download --print ...` with a 15-30 second shell timeout.
   - If metadata fails, do not try media download yet. Use browser/web fallback or ask for a local MP4.

2. Try direct URL discovery, not download:
   - Run `yt-dlp -g` with a 15-30 second shell timeout.
   - Prefer one simple progressive format: `best[height<=720]/b[height<=720]/best`.
   - Save/use only the returned URL needed by `ffmpeg`. Do not start a full `yt-dlp` download just to inspect UI.

3. Clip with `ffmpeg` from the direct URL:
   - Run `ffmpeg -nostdin -hide_banner -loglevel error -stats -ss <start> -t <duration> -i <url> ...` with a 45-90 second shell timeout.
   - Keep `<duration>` around 8-20 seconds. Never let `ffmpeg` process the full YouTube video.
   - Add `-an` for visual UI analysis unless audio timing is specifically needed.
   - Scale to 720p/1280px width on first pass to reduce transfer and processing time.

4. Only if direct URL clipping fails, try `yt-dlp --download-sections`:
   - Use the same low format and network limits.
   - Use a 45-90 second shell timeout.
   - This is a fallback, not the default, because section downloads and format merges often stall.

5. Extract frames from the short local preview:
   - Frame extraction should use local `preview.mp4`, not the YouTube URL.
   - Use a 30-60 second shell timeout.
   - Extract 6-12 frames first; only extract dense motion frames around a 2-4 second transition window.

6. Stop conditions:
   - If any media command times out twice, stop using terminal extraction for that video.
   - If only partial frames were created and they show the UI clearly, continue analysis from them.
   - If no visual evidence was captured, say so and switch to browser screenshots or ask for a local clip.

When using the shell tool, set its timeout parameter explicitly instead of relying only on command flags. Recommended timeouts: metadata/direct URL `30000`, clip download/cut `90000`, frame extraction `60000`.

## Recommended Workflow

1. Identify the reference: YouTube URL, requested timestamp range, target UI element, and whether the user wants analysis or implementation.
2. Probe the video quickly: title/duration/available formats if possible, then decide the smallest timestamp range to inspect.
3. Generate a short local preview clip with `ffmpeg` for your own review and future frame extraction. Keep it small and bounded.
4. Extract multiple frames: start state, mid-transition, peak/steady state, exit state, and any hover/focus/selection state if visible.
5. Inspect frames with `detailed-image-recognition` style detail: layout, typography, colors, effects, depth, opacity, scale, layering.
6. Inspect motion using the preview clip and frame sequence: duration, easing feel, movement direction, overshoot, stagger order, blur/glow changes, opacity curves.
7. Map findings to project-native CEF/fh-ui files and data contracts.
8. If implementing, reuse the closest existing resource/component pattern and keep the result framework-free.

## ffmpeg / yt-dlp Workflow

Use these patterns as guidance. Adjust paths, timestamp, and duration, and keep commands short enough to finish quickly.

Important: in actual tool calls, set the shell timeout parameter for each command. The examples show command shape; the timeout is configured on the shell call.

1. Create a temp folder outside the repo:

```powershell
Test-Path -LiteralPath "C:\Users\jouwn\AppData\Local\Temp\opencode"; if ($?) { New-Item -ItemType Directory -Force -Path "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>" }
```

2. Verify tools before relying on them:

```powershell
yt-dlp --version; ffmpeg -version; ffprobe -version
```

3. Get lightweight metadata first:

```powershell
yt-dlp --socket-timeout 10 --retries 1 --fragment-retries 1 --no-playlist --no-warnings --skip-download --print "%(title)s|%(duration_string)s|%(id)s" "<youtube-url>"
```

4. Preferred path: get a direct media URL, then cut a bounded preview with `ffmpeg`:

```powershell
yt-dlp --socket-timeout 10 --retries 1 --fragment-retries 1 --no-playlist --no-warnings -f "best[height<=720]/b[height<=720]/best" -g "<youtube-url>"
ffmpeg -nostdin -hide_banner -loglevel error -stats -y -ss 00:01:20 -t 15 -i "<direct-media-url>" -vf "scale='min(1280,iw)':-2" -an "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\preview.mp4"
```

5. Fallback only: download just the requested section with `yt-dlp`:

```powershell
yt-dlp --socket-timeout 10 --retries 1 --fragment-retries 1 --no-playlist --no-warnings -f "best[height<=720]/b[height<=720]/best" --download-sections "*00:01:20-00:01:35" --force-keyframes-at-cuts --merge-output-format mp4 -o "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\source.%(ext)s" "<youtube-url>"
```

6. If fallback produced `source.mp4`, normalize it into a small preview before extracting frames:

```powershell
ffmpeg -nostdin -hide_banner -loglevel error -stats -y -i "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\source.mp4" -ss 00:00:00 -t 15 -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset veryfast -crf 28 -an "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\preview.mp4"
```

7. Extract a compact frame set from the local preview:

```powershell
ffmpeg -nostdin -hide_banner -loglevel error -stats -y -i "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\preview.mp4" -vf "fps=1,scale='min(1280,iw)':-2" "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\frame_%03d.jpg"
```

8. For transition timing, extract denser frames only around the exact moment:

```powershell
ffmpeg -nostdin -hide_banner -loglevel error -stats -y -ss 00:00:04 -t 3 -i "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\preview.mp4" -vf "fps=8,scale='min(1280,iw)':-2" "C:\Users\jouwn\AppData\Local\Temp\opencode\youtube-ui\<short-id>\motion_%03d.jpg"
```

If a generated preview exists, use it for repeated inspection instead of re-opening YouTube or re-downloading source media.

## Frame Capture Checklist

- **Timestamps**: record exact timestamps or approximate `mm:ss` ranges for every important state.
- **Viewport/aspect**: note video resolution/aspect and whether black bars, compression, or UI scaling affect the observation.
- **Layout**: panel bounds, anchor point, safe area, margins, grid, alignment, layering over gameplay/background.
- **Typography**: text content, hierarchy, casing, number style, weights, letter spacing, line height, glow/shadow.
- **Color/effects**: fills, gradients, transparency, bloom, blur, vignette, scanline/noise, shadows, outlines, masks.
- **Icons/assets**: logos, pictograms, item thumbnails, map/radar elements, button prompts, progress rings/bars.
- **Animation**: trigger, duration, delay/stagger, transform, opacity, clip/mask, blur, scale, easing, exit behavior.
- **Sound sync**: if visible UI reacts to beats or SFX cues, mark the likely cue timing for later audio/UI synchronization.

## Deep UI Reading Checklist

When the user asks to recreate or understand the UI, do not stop at a general description. Build a detailed inventory from the captured frames and video.

- **Screen map**: identify every visible UI region: top bar, side panel, cards, modal, HUD, minimap, notifications, prompts, footer/keybar, cursor/focus, background overlays.
- **Element inventory**: list each component with visible text, icon, value, state, purpose, and parent container. Include small details such as separators, pills, badges, counters, ticks, arrows, shadows, and focus rings.
- **Hierarchy**: decide what is primary/secondary/tertiary by size, contrast, brightness, placement, motion, and z-index. Note which element draws attention first.
- **Bounds and spacing**: estimate x/y position, width/height, margins, gutters, border radius, stroke width, icon size, card padding, and safe-area offsets. Use approximate pixels relative to the captured frame resolution.
- **Alignment and grid**: detect columns/rows, repeated card rhythm, baseline alignment, center/edge anchoring, responsive breakpoints, and whether panels are fixed, floating, or attached to screen edges.
- **Typography system**: capture font feel, weight, case, text size tiers, numeric style, letter spacing, line height, truncation, text shadows, outlines, and label/value pair patterns.
- **Color system**: sample or estimate main colors, accent colors, text opacity levels, disabled states, gradients, glass/blur layers, outlines, drop shadows, glow/bloom, and danger/success/selected colors.
- **Depth/layers**: record layer order: gameplay/background, darkening/vignette, blur/glass, panels, highlights, text/icons, particles/flares, cursor, transition masks.
- **States**: capture normal, selected, hovered/focused, disabled, loading, active, completed, warning/error, expanded/collapsed, entering, steady, and exiting states if they appear.
- **Data model**: infer the dynamic values needed by code: title, subtitle, player stats, currency, XP, progress, car data, map data, countdown, list items, button labels, selected index, visibility flags.

## Video Motion Reading Checklist

Use frame sequences and the preview clip to describe how the UI moves, not just how it looks.

- **Timeline**: create a short event timeline with timestamps: trigger, first visible frame, main settle, secondary stagger, idle loop, exit start, fully hidden.
- **Transform**: note movement direction, distance, scale, rotation, perspective, clipping/masking, parallax, and whether motion is tied to camera/gameplay movement.
- **Opacity/effects**: track fade curves, blur amount changes, glow intensity, brightness pulses, color shifts, vignette changes, noise/grain, and shadow growth.
- **Stagger**: list which elements animate first/last: background layer, panel shell, headings, cards, icons, counters, keybar, particles.
- **Timing estimates**: estimate durations in milliseconds from frame count and FPS. For example, 6 frames at 30 FPS is about 200 ms.
- **Easing feel**: describe if motion feels linear, ease-out, spring/overshoot, snap, elastic, or cinematic slow fade. Translate this into CSS timing functions when implementing.
- **Idle behavior**: record loops such as shimmer, pulsing glow, rotating ring, scroll marquee, progress sweep, particle drift, or background pan.
- **Interaction cues**: identify selection changes, hover/focus response, button prompt changes, cursor movement, sound-synced flashes, and any input delay.

## Frame Comparison Method

For complex UI, compare frames systematically instead of inspecting one screenshot.

- Pick 3-5 key frames: empty/start, entering, steady, active/selected, exiting.
- Compare the same element across frames to separate static style from animation artifacts.
- Use dense frames only around the moving part; do not waste time extracting dense frames for static menus.
- If compression hides details, prefer repeated shapes and stable colors across frames over a single noisy frame.
- When text is unreadable, mark it as unreadable and infer only layout/role, not exact wording.
- If part of the UI is occluded by subtitles, watermarks, creator overlays, or motion blur, state the limitation and use a cleaner adjacent frame when possible.

## Implementation Translation Notes

After reading the UI, convert observations into buildable `fh-ui` decisions.

- **Component split**: decide whether this is one component, nested cards, a modal, a HUD overlay, a keybar, or several reusable pieces.
- **DOM structure**: map visual groups to semantic containers before writing CSS: root, backdrop, panel, header, content/list, item/card, footer/keybar, effects layer.
- **CSS variables**: extract colors, radii, spacing, font sizes, shadows, durations, easing, and z-index into variables when the component has repeated patterns.
- **Responsive behavior**: define how the UI scales from 1920x1080 to smaller screens: fixed anchor, clamp sizes, viewport units, safe-area margins, or scaled HUD group.
- **Animation plan**: create named enter/exit/idle states and CSS keyframes from the timeline. Keep JavaScript for sequencing/data, not for styling details.
- **Asset plan**: recreate icons with inline SVG/CSS where possible; avoid copying copyrighted video assets unless the user provides allowed assets.
- **Data contract**: write down the Lua-to-CEF payload shape needed before coding, including defaults for missing values.

## Analysis Output Requirements

When reporting analysis from screenshots/video, include enough detail for implementation without rewatching the reference.

- Inspected source: URL/file, timestamp range, frame paths, video resolution, and method used.
- Full UI inventory: all regions/components, their role, visible text/data, states, and hierarchy.
- Layout measurements: approximate bounds, spacing, anchoring, grid, safe area, and responsive assumptions.
- Visual style: typography, color palette, effects, depth/layers, icon style, and notable tiny details.
- Motion spec: timeline, durations, transforms, opacity/effects, easing, stagger, idle loops, and exit behavior.
- Implementation map: suggested resource/component files, DOM groups, CSS variables, data payload, and what should be omitted/adapted.

## YouTube-Specific Rules

- Prefer the user-provided timestamp or chapter. If none is given, inspect the most relevant segment and state the chosen range.
- For long videos, sample first; do not spend time watching the whole video unless the user explicitly asks.
- For ambiguous long videos, use metadata/chapters/comments only to choose candidate ranges; then verify visually with extracted frames or the preview clip.
- Avoid copying copyrighted assets directly from the video. Recreate the style with local CSS/SVG/HTML, or ask the user for allowed assets.
- Treat compression artifacts as unreliable; base final UI on stable shapes, proportions, colors, and repeated frames.
- If subtitles or overlaid creator UI interfere, note the obstruction and choose cleaner frames if possible.

## ForzaHorizon Mapping

When a video reference resembles an existing system, map it to the current resource instead of creating a detached demo:

- race intro/lobby/checkpoint/HUD -> `fh-races`; finish/results -> `fh-race-finish` unless explicitly wiring into races;
- wheelspin reference -> `wheelspin-test` for current test UI or future real `fh-wheelspin` only if requested;
- skill score/combo -> `fh-points`; level/reward popups -> `fh-progression` or future notifications/rewards resource;
- radio/music overlay -> `fh-radio`; photo overlay -> `fh-photo-mode`; weather transition -> `fh-weather`;
- dashboard/map/menu reference -> `fh-dashboard` or `fh-luna` depending on whether it is fullscreen dashboard or quick radar menu;
- vehicle showroom/garage reference -> future `fh-garage`/`fh-autoshow`, using `fh-vehicles` and `fh-progression`.

## MTA CEF / fh-ui Adaptation

- Load `mta-resource-development` too when turning the video reference into resource code, Lua events, keybinds, or `meta.xml` changes.
- Implement UI inside the owning resource, for example `fh-RESOURCE/ui/name.html`, `name.css`, and optionally `name.js`.
- Register through `exports['fh-ui']:registerComponent(name, resourceName, htmlPath, cssPath)`.
- Use CSS keyframes/transitions for visual animation and JavaScript only for state sequencing, timers, dynamic text, and repeated animation phases.
- Keep Lua responsible for game state, commands, keybinds, and `fh-ui` show/hide/update calls.
- Add every HTML/CSS/JS/asset file to the owner resource `meta.xml`.
- Do not add dependency `<include>` entries; check dependent resources at runtime in Lua.
- Keep overlays transparent unless the reference is a full-screen UI or menu.
- Match animation rhythm and hierarchy, not just static screenshots.

## Reporting Template

When only analyzing:

- YouTube URL and inspected timestamp range.
- Method used: `ffmpeg` preview clip, extracted frames, browser playback, screenshots, or source metadata.
- Preview/frame paths when useful, especially if the user may want to inspect them.
- Key UI layout/style findings.
- Key animation timing/motion findings.
- How to recreate it in `fh-ui`, including files/components that should own it.

When implementing:

- Files changed.
- Reference timestamp range used.
- Which states/animations were recreated.
- What was adapted or intentionally omitted.
- Verification performed and required in-game reload commands, usually restart the owner resource and `/fhuireload`.

## Limits

- If YouTube cannot be accessed from the environment, ask for a local MP4, screenshots, or a shorter clip file.
- If a video is private, age-gated, region-blocked, or requires login, do not bypass access; ask the user for accessible reference material.
- If `yt-dlp` works but `ffmpeg` fails, still inspect static downloaded screenshots if possible and clearly mark that motion timing is estimated.
- If audio details matter, use the local media analysis skill once a file is available or after a clip has been safely downloaded/extracted.
