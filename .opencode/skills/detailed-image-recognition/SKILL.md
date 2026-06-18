---
name: detailed-image-recognition
description: >
  ALWAYS use this skill whenever the user provides, references, uploads, attaches,
  links, or asks about a screenshot, photo, image, UI capture, document scan,
  diagram, chart, visual mockup, camera picture, screen recording frame, or any
  visual material. This skill performs professional, exhaustive, detail-oriented
  visual recognition including layout, objects, text, UI elements, spatial
  relations, colors, typography, states, metadata clues, inconsistencies, and
  uncertainty handling.
---

# Detailed Image Recognition Skill

## Core Rule

You MUST use this skill for every task involving any visual input, including but not limited to:

- screenshots,
- photos,
- scanned documents,
- UI captures,
- app screens,
- web pages shown as images,
- mobile screens,
- desktop screens,
- diagrams,
- charts,
- tables,
- product photos,
- error screenshots,
- images containing text,
- partially visible or cropped images,
- blurry or low-quality images,
- images referenced by the user indirectly.

If the user sends an image and asks even a simple question, first perform a visual recognition pass using this skill before answering.

Do not answer from assumptions. Inspect the visual content carefully.

---

# Primary Objective

Provide a professional, exhaustive, structured analysis of the provided image/screenshot/photo.

The analysis should identify and describe:

1. Every visible object, UI element, icon, label, button, menu, field, panel, text block, symbol, graphic, chart element, table cell, notification, cursor, pointer, watermark, overlay, badge, status indicator, border, separator, and background element.
2. Exact or near-exact text visible in the image, preserving casing, punctuation, numbers, special characters, line breaks, and reading order whenever possible.
3. Spatial layout: position, alignment, hierarchy, grouping, spacing, relative placement, columns, rows, sections, margins, and visual flow.
4. Visual styling: colors, contrast, typography, size differences, emphasis, icons, shapes, rounded corners, shadows, borders, highlights, disabled states, selection states, hover/focus-like states if visible.
5. Context clues: application/site/system, device type, operating system hints, browser/app chrome, language, locale, timestamps, usernames, file names, URLs, paths, errors, warnings, notifications.
6. Quality limitations: blur, compression artifacts, low resolution, glare, cropping, occlusion, small text, perspective distortion, reflections, motion blur, overexposure, underexposure.
7. Ambiguities and confidence level. Clearly separate what is certain from what is inferred.
8. Potentially important details that may be easy to miss.

---

# Analysis Principles

## Be exhaustive

Look at the image systematically:

1. Overall image type and context.
2. Global layout.
3. Top-to-bottom scan.
4. Left-to-right scan.
5. Foreground elements.
6. Background elements.
7. Text extraction.
8. UI/component extraction.
9. Visual anomalies.
10. Possible hidden meaning or user-relevant implications.

Do not skip small details.

## Do not hallucinate

If something is not readable or not clearly visible, say so explicitly.

Use phrases such as:

- `Nieczytelne`
- `Częściowo widoczne`
- `Prawdopodobnie`
- `Wygląda na`
- `Nie da się jednoznacznie potwierdzić z obrazu`
- `Niska pewność`
- `Średnia pewność`
- `Wysoka pewność`

Never invent text that is not visible.

## Preserve exact text

When extracting text:

- Preserve spelling.
- Preserve capitalization.
- Preserve punctuation.
- Preserve numbers.
- Preserve visible line breaks where relevant.
- Mention if text is truncated.
- Mention if text is partially hidden.
- Mention if OCR confidence is low.

If multiple text regions exist, group them by location.

Example:

```text
Góra/lewa część:
- "Dashboard"
- "Search..."

Środek:
- "No results found"

Dół/prawa część:
- "Save changes"
```

## Describe spatial relations

Use relative positioning:

- top-left,
- top-center,
- top-right,
- center-left,
- center,
- center-right,
- bottom-left,
- bottom-center,
- bottom-right,
- foreground,
- background,
- behind,
- above,
- below,
- to the left of,
- to the right of,
- aligned with,
- inside,
- overlapping,
- partially outside the frame.

If useful, describe the image as a grid:

```text
[Top-left] ...
[Top-center] ...
[Top-right] ...
[Middle-left] ...
[Middle] ...
[Middle-right] ...
[Bottom-left] ...
[Bottom-center] ...
[Bottom-right] ...
```

## UI-specific recognition

For screenshots of apps/websites/software, identify:

- app/page name if visible,
- navigation bars,
- sidebars,
- breadcrumbs,
- tabs,
- buttons,
- links,
- inputs,
- forms,
- dropdowns,
- checkboxes,
- radio buttons,
- toggles,
- modals,
- dialogs,
- toasts,
- tooltips,
- loaders,
- progress bars,
- tables,
- cards,
- charts,
- filters,
- badges,
- status labels,
- errors,
- warnings,
- empty states,
- disabled elements,
- selected/active elements,
- scrollbars,
- browser address bar if visible,
- OS/window controls if visible.

For each important UI element, describe:

```text
- Type:
- Location:
- Label/text:
- Visual state:
- Possible purpose:
- Confidence:
```

## Photo-specific recognition

For photos, identify:

- people, objects, animals, vehicles, buildings, documents, screens, products,
- visible environment,
- lighting,
- perspective,
- colors,
- materials,
- condition/damage,
- reflections,
- background context,
- signs, labels, logos, markings,
- orientation and camera angle.

Avoid identifying private individuals by name unless the user provides identity context and the task is allowed. Describe visible characteristics only when relevant.

## Document-specific recognition

For scans/documents/forms:

- title,
- headers,
- sections,
- paragraphs,
- tables,
- fields,
- signatures,
- stamps,
- dates,
- numbers,
- IDs,
- checkboxes,
- handwritten content,
- logos,
- footnotes,
- page numbers,
- visible damage/cropping.

If sensitive personal data is visible, handle carefully and avoid unnecessary repetition unless the user explicitly needs extraction.

## Chart/diagram recognition

For charts and diagrams:

- chart type,
- axes,
- labels,
- legends,
- values,
- colors,
- trends,
- annotations,
- outliers,
- relative comparisons,
- title/source,
- uncertainty if values are approximate.

For diagrams:

- nodes,
- arrows,
- labels,
- flow direction,
- grouping,
- hierarchy,
- dependencies.

---

# Required Output Structure

Unless the user asks for a different format, answer in Polish using the following structure.

## 1. Krótki opis obrazu

Summarize what the image appears to show in 1–3 sentences.

## 2. Szczegółowa analiza układu

Describe the layout spatially.

Recommended format:

```text
- Górna część:
- Lewa część:
- Środek:
- Prawa część:
- Dolna część:
- Tło:
```

If the image is complex, use a grid.

## 3. Rozpoznany tekst/OCR

List all visible text grouped by region.

Use this format:

```text
Góra:
- "..."

Środek:
- "..."

Dół:
- "..."
```

If no text is visible, write:

```text
Nie widzę czytelnego tekstu na obrazie.
```

If text is partially visible:

```text
- "..." — częściowo ucięte / niska pewność
```

## 4. Elementy wizualne i obiekty

List every meaningful visible element.

For screenshots, include UI components.
For photos, include objects/environment.
For documents, include sections/fields.

Use bullets.

## 5. Kolory, styl i wygląd

Describe:

- dominant colors,
- contrast,
- typography if visible,
- UI style,
- visual hierarchy,
- icons,
- borders,
- shadows,
- spacing,
- image quality.

## 6. Ważne szczegóły, które łatwo przeoczyć

Mention subtle details:

- small icons,
- tiny text,
- indicators,
- selected states,
- warnings,
- badges,
- timestamps,
- cropped areas,
- reflections,
- hidden UI states,
- unusual inconsistencies.

## 7. Niepewności i ograniczenia

Clearly state:

- what is unreadable,
- what is ambiguous,
- what could be misinterpreted,
- whether image quality limits recognition.

## 8. Wnioski / odpowiedź na pytanie użytkownika

Only after the detailed recognition, answer the user's actual question or provide the requested conclusion.

If the user asked only to describe the image, provide a concise final summary.

---

# Optional Compact Mode

If the user explicitly asks for a short answer, still inspect the image carefully, but provide a shorter response:

```text
Widzę: ...
Tekst: ...
Najważniejsze szczegóły: ...
Niepewności: ...
Odpowiedź: ...
```

Do not omit critical warnings or uncertainties.

---

# Professional Quality Checklist

Before finalizing the answer, verify:

- Did I inspect all visible regions?
- Did I extract all readable text?
- Did I mention small details?
- Did I distinguish facts from guesses?
- Did I avoid inventing unreadable text?
- Did I answer the user's actual question?
- Did I mention image-quality limitations?
- Did I preserve exact visible text as much as possible?
- Did I describe layout and spatial relationships?
- Did I include confidence/uncertainty where needed?

---

# Behavior Examples

## Example 1: Error screenshot

If the user sends an error screenshot, do not only explain the error. First identify:

- app/window,
- error title,
- full message,
- code,
- buttons,
- file path,
- timestamp,
- surrounding UI,
- selected tab,
- terminal prompt if visible,
- command if visible,
- stack trace if visible.

Then explain likely cause and next steps.

## Example 2: Website screenshot

Identify:

- header,
- logo,
- navigation,
- hero section,
- CTA buttons,
- cards,
- images,
- text hierarchy,
- spacing,
- responsive layout hints,
- visual bugs,
- accessibility concerns,
- cropped elements.

## Example 3: Photo of a product

Identify:

- product type,
- visible branding,
- model numbers,
- labels,
- condition,
- scratches/damage,
- materials,
- packaging,
- accessories,
- background,
- lighting,
- scale clues.

## Example 4: Document scan

Identify:

- title,
- sections,
- all readable fields,
- signatures/stamps,
- dates,
- numbers,
- table structure,
- missing/cropped content,
- unreadable fields.

---

# Safety and Privacy

If the image contains sensitive data such as:

- passwords,
- tokens,
- API keys,
- private keys,
- personal IDs,
- addresses,
- phone numbers,
- email addresses,
- bank data,
- medical data,

do not unnecessarily repeat the full sensitive value unless the user explicitly requests extraction for a valid reason. Prefer masking:

```text
Widoczny jest adres e-mail: j***@example.com
```

For security-sensitive images, warn the user if secrets appear exposed.

---

## Verification

Before final response, confirm that visual observations, extracted text, uncertainties, and any sensitive-data masking are clearly separated from assumptions.

# Final Instruction

For every image-related user request:

1. Activate this skill.
2. Perform detailed recognition.
3. Extract visible text.
4. Describe layout and visual elements.
5. State uncertainties.
6. Then answer the user's actual question.

This skill has priority whenever visual input is involved.
