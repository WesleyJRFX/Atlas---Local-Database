---
name: frontend-ui-quality
description: >
  Use for frontend components, UI fixes, styling, layout, responsive behavior,
  accessibility, forms, state, animations, visual polish, and UX consistency.
---

# Frontend UI Quality

## Purpose

Create frontend/UI changes that look good, behave consistently, remain accessible, and fit the existing design system.

## When To Use

- User asks for UI, layout, styling, component, page, animation, form, dashboard, modal, menu, or visual bug work.
- A feature needs frontend state, interactions, loading/empty/error states, or responsive behavior.
- Screenshot/design/reference must be translated into UI.

## UI Workflow

1. Inspect existing components and styling conventions.
2. Identify design system tokens/classes/patterns.
3. Define component states:
   - default;
   - hover/focus/active;
   - loading;
   - empty;
   - error;
   - disabled;
   - selected;
   - responsive variants.
4. Implement scoped, maintainable markup/styles/state.
5. Verify visually or describe exact manual check path.

## Layout Rules

- Preserve existing spacing rhythm, typography scale, color palette, border radius, shadows, and motion style.
- Use semantic structure where practical.
- Avoid global CSS leakage; scope selectors to component/page root.
- Handle overflow, long text, empty data, and small screens.
- Avoid magic absolute positioning unless the design requires it.
- Keep z-index intentional and local.

## Accessibility Rules

- Use real buttons/links/inputs where possible.
- Provide labels for inputs and icon-only controls.
- Preserve keyboard navigation and visible focus states.
- Ensure sufficient contrast for text and controls.
- Do not rely only on color to communicate status.
- Use ARIA only when semantic HTML is insufficient.
- Respect reduced motion if the project has a pattern for it.

## State Management

- Keep UI state local unless shared state is required.
- Avoid duplicating derived state that can become stale.
- Clean up timers, listeners, observers, and subscriptions.
- Prevent double-submit and race conditions in forms/actions.
- Show clear error and loading feedback for async operations.

## Visual Polish Checklist

- Alignment and spacing consistent.
- Text hierarchy clear.
- Buttons/inputs have all states.
- Icons match size/stroke/fill style.
- Animations are purposeful and not excessive.
- Empty/error/loading states are not broken layouts.
- Long labels, numbers, and lists do not overflow.

## Verification

- Run lint/typecheck/tests/build if available.
- Inspect component at common viewport sizes.
- Test keyboard and mouse interactions.
- Test empty/loading/error states with representative data.
- If visual verification is impossible, give precise manual steps.

## Final Response

Mention:

- UI/components changed;
- states handled;
- accessibility/responsiveness considerations;
- verification performed.
