---
name: local-media-ui-analysis
description: MP4, WAV, local video/audio files, media reference, footage, clip, animation, SFX, waveform. Use when the user provides local media files and wants visual/audio details analyzed for UI, CEF animations, timing, and implementation.
---

# Local Media UI Analysis

## Activation Rule

Use this skill only when the current task matches this domain, project type, file type, reference material, or risk profile. Select it through skill-router or obvious task context; do not keep all skills active at once. Inspect relevant files and verify results before final response.

Use this skill when the user points to local `.mp4`, `.mov`, `.webm`, `.mkv`, `.wav`, `.mp3`, `.ogg`, or similar media files and asks to analyze them for UI recreation, animation, transitions, timing, sound sync, or visual detail.

## Goal

Extract useful design data from local media files:

- analyze video frames for layout, colors, typography, UI states, effects, and animation phases;
- analyze audio for duration, cues, peaks, rhythm, UI SFX timing, and synchronization points;
- turn findings into project-native CEF/fh-ui UI, CSS animations, JS sequencing, and Lua state triggers;
- avoid guesswork by capturing frames, reading metadata, and checking timing precisely.

## Tool Priority

- Load `detailed-image-recognition` too when frame screenshots or still images are inspected.
- Use file tools to locate/read referenced paths, but use terminal tools for media processing.
- Prefer `ffprobe` for metadata and `ffmpeg` for safe frame/audio extraction when available.
- Use a temporary directory under `C:\Users\jouwn\AppData\Local\Temp\opencode` for extracted frames, waveforms, or short working clips.
- Do not overwrite user media files. Only create derived files in temp or project asset folders when implementation requires them.
- Do not claim frame/audio analysis unless the file was opened, probed, or extracted.

## Recommended Workflow

1. Locate the media file and confirm its extension, duration, resolution/sample rate, and size.
2. For video, extract representative frames around important timestamps: initial state, mid-transition, final state, loop points, and exit.
3. For audio, inspect metadata and, when useful, generate a waveform/spectrogram or sample peak/cue timings.
4. Read extracted frames with visual-analysis discipline: layout, typography, color, effects, layering, scale, and compression limits.
5. Compare frames over time to infer animation: duration, easing, transform, opacity, masks, stagger, blur, glow, and loop behavior.
6. Map visual/audio cues to CEF CSS keyframes, JS timers/state machines, and Lua triggers.
7. If implementing, create local UI files and local assets only; do not leave temp files referenced by `meta.xml`.

## Useful Terminal Patterns

Run these only when the relevant tools are installed and paths are known:

```powershell
ffprobe -hide_banner -i "path\to\clip.mp4"
ffmpeg -ss 00:00:03.200 -i "path\to\clip.mp4" -frames:v 1 "C:\Users\jouwn\AppData\Local\Temp\opencode\frame-003200.png"
ffmpeg -i "path\to\clip.mp4" -vf "fps=10,scale=1280:-1" "C:\Users\jouwn\AppData\Local\Temp\opencode\frames\frame-%04d.png"
ffmpeg -i "path\to\sound.wav" -filter_complex "showwavespic=s=1600x360:colors=white" -frames:v 1 "C:\Users\jouwn\AppData\Local\Temp\opencode\waveform.png"
```

Use exact quoted paths on Windows. If a command creates directories, verify the parent path first.

## Video Inspection Checklist

- **Metadata**: duration, FPS, resolution, aspect ratio, codec, whether the clip is slowed, cropped, or letterboxed.
- **States**: first visible UI state, transition phases, idle state, active/selected state, exit/disappear state.
- **Layout**: anchor position, margins, proportions, safe area, grid, panel layering, z-index relationship to gameplay.
- **Typography**: text content, hierarchy, size, weight, casing, numeric style, outlines, shadows, glow.
- **Visual style**: gradients, glass/blur, noise, bloom, edge highlights, masks, strokes, progress indicators, particles.
- **Motion**: duration in ms, easing, direction, scale, opacity, blur, clip reveal, stagger, loop period, overshoot.
- **Implementation mapping**: CSS variables, keyframes, DOM states/classes, JS timers, `fh-ui` data fields.

## Audio/WAV Inspection Checklist

- **Metadata**: duration, sample rate, channels, loudness/peak clues, file format.
- **Cues**: starts, impacts, risers, whooshes, clicks, beat hits, quiet gaps, loop boundaries.
- **Timing**: cue timestamps and how they should align with UI state changes or animation keyframes.
- **Character**: soft/hard attack, decay length, low/high frequency feel, whether the UI should feel mechanical, cinematic, digital, or organic.
- **Implementation mapping**: JS/CSS animation delays, Lua trigger time, optional MTA sound playback, volume category, loop/fade behavior.

## ForzaHorizon Mapping

When local media is used as a reference, attach the implementation to the closest existing resource:

- HUD/radar/speedometer footage -> `fh-hud`;
- dashboard/admin/menu footage -> `fh-dashboard`, `fh-admin`, or `fh-luna`;
- race/countdown/checkpoint/finish footage -> `fh-races` or `fh-race-finish`;
- skill chain/reward/level media -> `fh-points` or `fh-progression`;
- radio/audio UI/SFX cues -> `fh-radio` or future `fh-audio` only if explicitly requested;
- photo/weather/discovery/wheelspin media -> their owner resources.

Do not reference extracted temp media in `meta.xml`; copy only intentional final assets into the owner resource.

## MTA CEF / fh-ui Adaptation

- Load `mta-resource-development` too when local media analysis results in resource code, Lua triggers, audio playback, or `meta.xml` changes.
- Implement visuals inside the owner resource UI folder, for example `fh-RESOURCE/ui/name.html`, `name.css`, `name.js`.
- Register with `fh-ui`; do not add resource includes to `meta.xml`.
- Use CSS animations for deterministic visual timing; use JS only to sequence states, replay animations, or sync to dynamic data.
- Keep Lua responsible for gameplay events and `fh-ui` data updates.
- Add implementation assets to `meta.xml`; never reference temp extraction paths.
- If audio playback is needed, keep files local to the resource and document trigger/volume behavior.

## Reporting Template

When only analyzing:

- File path and media metadata.
- Extracted frame/waveform method and timestamps used.
- Visual UI details and animation timing.
- Audio cues and sync recommendations, if relevant.
- Suggested `fh-ui` component/resource mapping.

When implementing:

- Files changed.
- Media timestamps/cues used.
- States, animations, and audio sync recreated.
- What was adapted or omitted.
- Verification performed and required in-game reload commands.

## Limits

- If the file is missing, corrupted, DRM-protected, or unsupported by available tools, ask for a playable file or screenshots/frames.
- If the media is very long, sample targeted segments first and ask for timestamps only when no reasonable target can be inferred.
- Respect licensing: recreate style and behavior; do not copy protected media assets into the resource unless the user owns or provides permission for them.
